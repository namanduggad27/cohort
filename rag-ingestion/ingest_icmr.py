#!/usr/bin/env python3
"""
Ingest ICMR Guidelines into Pinecone.

Usage:
  python ingest_icmr.py                        # Use sample JSON data
  python ingest_icmr.py --pdf path/to/dir      # Ingest from PDF directory
"""

import os
import json
import argparse
import hashlib
from pathlib import Path
from typing import List, Dict, Any

from pinecone import Pinecone
from openai import OpenAI

# ─── Config ──────────────────────────────────────────────────
PINECONE_API_KEY = os.environ["PINECONE_API_KEY"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "clinical-scribe")
NAMESPACE = "icmr_guidelines"
EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

pc = Pinecone(api_key=PINECONE_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks."""
    if len(text) <= chunk_size:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        # Try to end at sentence boundary
        if end < len(text):
            for sep in ['. ', '.\n', '? ', '! ']:
                boundary = text.rfind(sep, start, end)
                if boundary > start + chunk_size // 2:
                    end = boundary + len(sep)
                    break
        chunks.append(text[start:end].strip())
        start = end - overlap
    return [c for c in chunks if len(c) > 50]


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings in batches of 100."""
    all_embeddings = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i + 100]
        response = openai_client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        embeddings = [r.embedding for r in sorted(response.data, key=lambda x: x.index)]
        all_embeddings.extend(embeddings)
        print(f"  Embedded batch {i // 100 + 1}: {len(batch)} texts")
    return all_embeddings


def load_sample_data() -> List[Dict[str, Any]]:
    data_path = Path(__file__).parent / "sample_data" / "icmr_guidelines.json"
    with open(data_path) as f:
        return json.load(f)


def load_pdf_data(pdf_dir: str) -> List[Dict[str, Any]]:
    """Load from PDFs (requires: pip install pypdf)"""
    try:
        from pypdf import PdfReader
    except ImportError:
        raise ImportError("Install pypdf: pip install pypdf")

    records = []
    for pdf_path in Path(pdf_dir).glob("*.pdf"):
        print(f"  Reading: {pdf_path.name}")
        reader = PdfReader(pdf_path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        records.append({
            "id": f"pdf-{pdf_path.stem}",
            "title": pdf_path.stem.replace("_", " ").title(),
            "category": "icmr_guideline",
            "source": f"ICMR PDF: {pdf_path.name}",
            "content": text,
        })
    return records


def ingest_guidelines(records: List[Dict[str, Any]]) -> None:
    index = pc.index(INDEX_NAME).namespace(NAMESPACE)
    vectors = []

    for record in records:
        chunks = chunk_text(record["content"])
        print(f"  {record['title']}: {len(chunks)} chunks")

        texts_to_embed = chunks
        embeddings = generate_embeddings(texts_to_embed)

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = hashlib.md5(f"{record['id']}-{i}".encode()).hexdigest()[:16]
            vectors.append({
                "id": f"{record['id']}-{i}",
                "values": embedding,
                "metadata": {
                    "title": record["title"],
                    "category": record["category"],
                    "source": record["source"],
                    "content": chunk,  # Store chunk for retrieval
                    "chunk_index": i,
                    "parent_id": record["id"],
                },
            })

    # Upsert in batches of 100
    print(f"\nUpserting {len(vectors)} vectors to Pinecone namespace '{NAMESPACE}'...")
    for i in range(0, len(vectors), 100):
        batch = vectors[i:i + 100]
        index.upsert(vectors=batch)
        print(f"  Upserted batch {i // 100 + 1}: {len(batch)} vectors")

    print(f"\n✅ ICMR guidelines ingested: {len(vectors)} total vectors")


def main():
    parser = argparse.ArgumentParser(description="Ingest ICMR guidelines into Pinecone")
    parser.add_argument("--pdf", help="Path to directory containing ICMR PDFs")
    args = parser.parse_args()

    print(f"Pinecone index: {INDEX_NAME}, namespace: {NAMESPACE}")

    if args.pdf:
        print(f"Loading PDFs from: {args.pdf}")
        records = load_pdf_data(args.pdf)
    else:
        print("Loading sample ICMR guidelines JSON...")
        records = load_sample_data()

    print(f"Loaded {len(records)} documents")
    ingest_guidelines(records)


if __name__ == "__main__":
    main()
