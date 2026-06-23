#!/usr/bin/env python3
"""Ingest drug interactions CSV into Pinecone."""

import os
import csv
from pathlib import Path
from pinecone import Pinecone
from openai import OpenAI

PINECONE_API_KEY = os.environ["PINECONE_API_KEY"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "clinical-scribe")
NAMESPACE = "drug_interactions"
EMBEDDING_MODEL = "text-embedding-3-small"

pc = Pinecone(api_key=PINECONE_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)


def main():
    csv_path = Path(__file__).parent / "sample_data" / "drug_interactions.csv"
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Loaded {len(rows)} drug interaction records")

    # Build content strings for embedding
    texts = []
    for row in rows:
        content = (
            f"Drug Interaction: {row['drug_a']} + {row['drug_b']}. "
            f"Severity: {row['severity']}. "
            f"Mechanism: {row['mechanism']}. "
            f"Recommendation: {row['recommendation']}. "
            f"Source: {row['source']}."
        )
        texts.append(content)

    # Generate embeddings in batches
    print("Generating embeddings...")
    all_embeddings = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i + 100]
        response = openai_client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        embeddings = [r.embedding for r in sorted(response.data, key=lambda x: x.index)]
        all_embeddings.extend(embeddings)

    # Build vectors
    vectors = []
    for i, (row, text, embedding) in enumerate(zip(rows, texts, all_embeddings)):
        vectors.append({
            "id": f"drug-{i:04d}-{row['drug_a'][:10]}-{row['drug_b'][:10]}".replace(" ", "_"),
            "values": embedding,
            "metadata": {
                "drug_a": row["drug_a"],
                "drug_b": row["drug_b"],
                "severity": row["severity"],
                "mechanism": row["mechanism"],
                "recommendation": row["recommendation"],
                "source": row["source"],
                "content": text,
            },
        })

    # Upsert
    index = pc.index(INDEX_NAME).namespace(NAMESPACE)
    print(f"Upserting {len(vectors)} vectors to namespace '{NAMESPACE}'...")
    for i in range(0, len(vectors), 100):
        index.upsert(vectors=vectors[i:i + 100])
    print(f"✅ Drug interactions ingested: {len(vectors)} vectors")


if __name__ == "__main__":
    main()
