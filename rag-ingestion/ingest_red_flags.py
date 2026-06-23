#!/usr/bin/env python3
"""Ingest red flag clinical rules into Pinecone."""

import os
import json
from pathlib import Path
from pinecone import Pinecone
from openai import OpenAI

PINECONE_API_KEY = os.environ["PINECONE_API_KEY"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "clinical-scribe")
NAMESPACE = "clinical_rules"
EMBEDDING_MODEL = "text-embedding-3-small"

pc = Pinecone(api_key=PINECONE_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)


def main():
    data_path = Path(__file__).parent / "sample_data" / "red_flag_rules.json"
    with open(data_path) as f:
        rules = json.load(f)

    print(f"Loaded {len(rules)} red flag rules")

    texts = [
        f"{rule['symptom_pattern']}. {rule['content']} Escalation: {rule['escalation_message']}"
        for rule in rules
    ]

    print("Generating embeddings...")
    response = openai_client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    embeddings = [r.embedding for r in sorted(response.data, key=lambda x: x.index)]

    vectors = []
    for rule, text, embedding in zip(rules, texts, embeddings):
        vectors.append({
            "id": rule["id"],
            "values": embedding,
            "metadata": {
                "symptom_pattern": rule["symptom_pattern"],
                "risk_level": rule["risk_level"],
                "category": rule["category"],
                "escalation_message": rule["escalation_message"],
                "content": rule["content"],
            },
        })

    index = pc.index(INDEX_NAME).namespace(NAMESPACE)
    print(f"Upserting {len(vectors)} vectors to namespace '{NAMESPACE}'...")
    index.upsert(vectors=vectors)
    print(f"✅ Red flag rules ingested: {len(vectors)} vectors")


if __name__ == "__main__":
    main()
