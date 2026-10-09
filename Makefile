.PHONY: help bootstrap types dev test eval deploy-ae deploy-host deploy-all

REGION ?= us-central1
PROJECT ?= $(shell gcloud config get-value project 2>/dev/null)

help:
	@echo "VITRINE Build & Deployment Automation"
	@echo "--------------------------------------"
	@echo "make bootstrap    : Enable GCP APIs and provision foundation resources"
	@echo "make types        : Compile shared/schemas into Pydantic models & TypeScript types"
	@echo "make dev          : Run local FastAPI services and dev server"
	@echo "make test         : Run local pytest suite (calculators, schemas, gate)"
	@echo "make eval         : Run agent evaluation benchmark against golden set"
	@echo "make deploy-ae    : Deploy vitrine-transaction to Vertex AI Agent Engine"
	@echo "make deploy-host  : Deploy vitrine-agents-host to Cloud Run"
	@echo "make deploy-all   : Deploy all 7 Cloud Run services and Agent Engine"

bootstrap:
	@echo "Enabling GCP APIs in $(REGION)..."
	gcloud services enable \
		aiplatform.googleapis.com \
		run.googleapis.com \
		bigquery.googleapis.com \
		firestore.googleapis.com \
		routes.googleapis.com \
		secretmanager.googleapis.com \
		cloudtrace.googleapis.com \
		iam.googleapis.com

types:
	@echo "Compiling JSON schemas to Pydantic v2 models..."
	python -m datamodel_code_generator \
		--input shared/schemas \
		--input-file-type jsonschema \
		--output backend/app/core/schemas/ \
		--output-model-type pydantic_v2.BaseModel

dev:
	@echo "Starting local services..."
	uvicorn backend.app.main:app --host 0.0.0.0 --port 8080 --reload

test:
	@echo "Running unit tests (calculators, deterministic gate, schema validation)..."
	pytest tests/ -v

eval:
	@echo "Executing agent eval suite against golden dataset..."
	python agents/evals/runner.py --dataset agents/evals/golden_set.json

deploy-ae:
	@echo "Deploying vitrine-transaction to Vertex AI Agent Engine in $(REGION)..."
	python agents/deploy/agent_engine_transaction.py

deploy-host:
	@echo "Deploying vitrine-agents-host to Cloud Run in $(REGION)..."
	gcloud run deploy vitrine-agents-host \
		--source=agents \
		--dockerfile=agents/host/Dockerfile \
		--region=$(REGION) \
		--no-allow-unauthenticated \
		--timeout=3600

deploy-all: deploy-ae deploy-host
	@echo "Deploying BFF, Core API, UCP endpoint, and MCP servers to Cloud Run..."
	gcloud run deploy vitrine-bff --source=backend --dockerfile=backend/deploy/bff.Dockerfile --region=$(REGION) --allow-unauthenticated
	gcloud run deploy vitrine-ucp --source=backend --dockerfile=backend/deploy/ucp.Dockerfile --region=$(REGION) --allow-unauthenticated
	gcloud run deploy vitrine-core-api --source=backend --dockerfile=backend/deploy/core.Dockerfile --region=$(REGION) --no-allow-unauthenticated
	gcloud run deploy mcp-catalog --source=mcp-servers/catalog --region=$(REGION) --no-allow-unauthenticated
	gcloud run deploy mcp-promise --source=mcp-servers/promise --region=$(REGION) --no-allow-unauthenticated
	gcloud run deploy mcp-commerce --source=mcp-servers/commerce --region=$(REGION) --no-allow-unauthenticated
