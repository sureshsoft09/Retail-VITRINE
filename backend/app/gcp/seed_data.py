"""Seed Demo Data for VITRINE.

Populates BigQuery catalogue tables, inventory snapshots, and carrier cutoffs,
as well as Firestore initial governance policies for testing and live demonstrations.
Standardized Region: us-central1
"""

import os
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

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

DEMO_CUTOFFS = [
    {"node_id": "STORE-042", "carrier_id": "FedEx-Express", "cutoff_time_utc": "14:00", "transit_hours_standard": 48, "transit_hours_express": 24},
    {"node_id": "DC-NORTH", "carrier_id": "FedEx-Express", "cutoff_time_utc": "20:00", "transit_hours_standard": 24, "transit_hours_express": 12},
    {"node_id": "DC-SOUTH", "carrier_id": "UPS-Ground", "cutoff_time_utc": "18:00", "transit_hours_standard": 36, "transit_hours_express": 18},
]

def seed_bigquery(project_id: str, dataset_id: str):
    """Inserts demo records into BigQuery tables."""
    print(f"\n--- BigQuery Seeding: {project_id}.{dataset_id} ---")
    try:
        from google.cloud import bigquery
        client = bigquery.Client(project=project_id, location="us-central1")

        # 1. Seed Products
        products_table = f"{project_id}.{dataset_id}.products"
        formatted_products = []
        for p in DEMO_PRODUCTS:
            row = dict(p)
            row["raw_attributes"] = json.dumps(p["raw_attributes"])
            row["enriched_attributes"] = json.dumps(p["enriched_attributes"])
            row["created_at"] = datetime.now(timezone.utc).isoformat()
            row["updated_at"] = datetime.now(timezone.utc).isoformat()
            formatted_products.append(row)

        errors = client.insert_rows_json(products_table, formatted_products)
        if errors:
            print(f"[Warning] BigQuery products insert errors: {errors}")
        else:
            print(f"[OK] Successfully inserted {len(formatted_products)} products into {products_table}")

        # 2. Seed Inventory
        inv_table = f"{project_id}.{dataset_id}.inventory"
        formatted_inv = []
        for inv in DEMO_INVENTORY:
            row = dict(inv)
            row["last_updated"] = datetime.now(timezone.utc).isoformat()
            formatted_inv.append(row)

        errors = client.insert_rows_json(inv_table, formatted_inv)
        if errors:
            print(f"[Warning] BigQuery inventory insert errors: {errors}")
        else:
            print(f"[OK] Successfully inserted {len(formatted_inv)} inventory snapshots into {inv_table}")

        # 3. Seed Carrier Cutoffs
        cutoff_table = f"{project_id}.{dataset_id}.carrier_cutoffs"
        try:
            errors = client.insert_rows_json(cutoff_table, DEMO_CUTOFFS)
            if errors:
                print(f"[Warning] BigQuery carrier_cutoffs insert errors: {errors}")
            else:
                print(f"[OK] Successfully inserted {len(DEMO_CUTOFFS)} cutoff rules into {cutoff_table}")
        except Exception as e:
            print(f"[Notice] carrier_cutoffs insert skipped: {e}")

    except Exception as ex:
        print(f"[BigQuery notice] Live insert skipped or failed: {ex}")
        print("Fallback: Local memory stores will be used during local execution.")

def seed_firestore(project_id: str, database_id: str):
    """Seeds initial policies and governance rules into Firestore."""
    print(f"\n--- Firestore Seeding: {project_id} (database: {database_id}) ---")
    try:
        from google.cloud import firestore
        client = firestore.Client(project=project_id, database=database_id)

        policy_doc = {
            "discount_cap_pct": float(os.getenv("AUTONOMY_DISCOUNT_CAP_PCT", 15.0)),
            "margin_floor_pct": float(os.getenv("AUTONOMY_MARGIN_FLOOR_PCT", 18.0)),
            "max_order_value_usd": float(os.getenv("AUTONOMY_MAX_ORDER_VALUE_USD", 250.0)),
            "global_kill_switch": os.getenv("GLOBAL_KILL_SWITCH", "false").lower() == "true",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        client.collection("governance").document("policies").set(policy_doc)
        print(f"[OK] Successfully seeded governance policies into Firestore (database: {database_id})")

    except Exception as ex:
        print(f"[Firestore notice] Live insert skipped or failed: {ex}")
        print("Fallback: Default local policies will be used during local execution.")

def main():
    project_id = os.getenv("GCP_PROJECT_ID", "gcp-aibuildercup-project")
    dataset_id = os.getenv("BQ_DATASET", os.getenv("BQ_DATASET_CATALOG", "vitrine_commerce"))
    firestore_db = os.getenv("FIRESTORE_DATABASE", "vitrine-db")

    print("=" * 65)
    print("VITRINE Demo Data Seeder (GCP & Local)")
    print(f"Project ID:         {project_id}")
    print(f"BigQuery Dataset:   {dataset_id}")
    print(f"Firestore Database: {firestore_db}")
    print("=" * 65)

    seed_bigquery(project_id, dataset_id)
    seed_firestore(project_id, firestore_db)

    print("\nData seeding routine completed!")

if __name__ == "__main__":
    main()
