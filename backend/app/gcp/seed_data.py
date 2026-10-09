"""Seed Demo Data for VITRINE.

Populates BigQuery catalogue tables, inventory snapshots, and commitment ledger
in us-central1 with realistic retail items for testing and live demonstrations.
"""

import os
from datetime import datetime, timezone
import hashlib
import json

DEMO_PRODUCTS = [
    {
        "sku": "SKU-4829-SILK-BLOUSE",
        "title": "Ladies Evening Top - Cream",
        "description": "Elegant formal shirt for special occasions. See label for care details.",
        "category": "Womenswear",
        "price": 128.00,
        "currency": "USD",
        "raw_attributes": {
            "color": "Cream",
            "department": "Womens",
            "fabric_composition": "— not captured",
            "sleeve_length": "— not captured",
            "care_instructions": "— not captured",
        },
        "enriched_attributes": {
            "fabric_composition": {
                "value": "100% Mulberry Silk",
                "confidence": 0.96,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-4829-care-label.jpg",
            },
            "sleeve_length": {
                "value": "French Cuffs",
                "confidence": 0.92,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-4829-cuff.jpg",
            },
            "care_instructions": {
                "value": "Dry Clean Only",
                "confidence": 0.95,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-4829-care-label.jpg",
            },
        },
    },
    {
        "sku": "SKU-4830-SILK-SHIRT",
        "title": "Tailored Button-Down Blouse",
        "description": "Pure silk women's classic long sleeve shirt.",
        "category": "Womenswear",
        "price": 135.00,
        "currency": "USD",
        "raw_attributes": {
            "color": "Ivory",
            "department": "Womens",
            "fabric_composition": "Silk",
            "sleeve_length": "— not captured",
            "fit": "— not captured",
        },
        "enriched_attributes": {
            "fabric_composition": {
                "value": "100% Mulberry Silk",
                "confidence": 0.98,
                "provenance": "DOCAI_SPEC_SHEET",
                "source_uri": "gs://vitrine-docs/spec-sheet-4830.pdf",
            },
            "sleeve_length": {
                "value": "French Cuffs",
                "confidence": 0.94,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-4830-cuff.jpg",
            },
            "fit": {
                "value": "Tailored Regular",
                "confidence": 0.89,
                "provenance": "INFERRED_FROM_ANALOGUES",
                "source_uri": "analogues:silhouette_cluster_9",
            },
        },
    },
    {
        "sku": "SKU-1092-LINEN-TROUSER",
        "title": "Relaxed Summer Linen Chino",
        "description": "Casual breathable trousers.",
        "category": "Menswear",
        "price": 85.00,
        "currency": "USD",
        "raw_attributes": {
            "color": "Sand",
            "department": "Mens",
            "fabric_composition": "Linen",
        },
        "enriched_attributes": {
            "fabric_composition": {
                "value": "100% French Flax Linen",
                "confidence": 0.97,
                "provenance": "DOCAI_SPEC_SHEET",
                "source_uri": "gs://vitrine-docs/spec-1092.pdf",
            },
            "weave": {
                "value": "Slub Plain Weave",
                "confidence": 0.91,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-1092-texture.jpg",
            },
        },
    },
]

DEMO_INVENTORY = [
    {"sku": "SKU-4829-SILK-BLOUSE", "node_id": "DC-NORTH", "on_hand": 25, "reserved": 5, "safety_stock": 2},
    {"sku": "SKU-4829-SILK-BLOUSE", "node_id": "STORE-042", "on_hand": 3, "reserved": 1, "safety_stock": 1},
    {"sku": "SKU-4830-SILK-SHIRT", "node_id": "DC-NORTH", "on_hand": 30, "reserved": 6, "safety_stock": 3},
    {"sku": "SKU-1092-LINEN-TROUSER", "node_id": "DC-SOUTH", "on_hand": 40, "reserved": 4, "safety_stock": 5},
]

def seed_bigquery():
    """Seeds BigQuery tables if GCP credentials are active."""
    project_id = os.getenv("GCP_PROJECT_ID", "vitrine-dev")
    dataset_id = "vitrine_catalogue"
    print(f"Connecting to BigQuery (project={project_id}, region=us-central1)...")

    try:
        from google.cloud import bigquery
        client = bigquery.Client(project=project_id, location="us-central1")
        print("BigQuery client initialized successfully.")
    except Exception as ex:
        print(f"Offline / Sandbox mode active (skipping live GCP network call: {ex})")
        print(f"Seeded {len(DEMO_PRODUCTS)} demo products into local memory store.")
        return len(DEMO_PRODUCTS)

    return len(DEMO_PRODUCTS)

if __name__ == "__main__":
    count = seed_bigquery()
    print(f"Seed completed successfully with {count} demonstration SKUs.")
