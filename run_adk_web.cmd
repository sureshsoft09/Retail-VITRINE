@echo off
set GOOGLE_CLOUD_PROJECT=gcp-aibuildercup-project
set GCP_PROJECT_ID=gcp-aibuildercup-project
set GOOGLE_CLOUD_LOCATION=us-central1
set GCP_REGION=us-central1
set GOOGLE_GENAI_USE_VERTEXAI=true

set MODEL_REASONING=gemini-2.5-pro
set MODEL_FAST=gemini-2.5-flash
set MODEL_PIN_PRIMARY=gemini-2.5-pro
set MODEL_PIN_FAST=gemini-2.5-flash

echo ==========================================================
echo Launching VITRINE ADK Web Dashboard
echo Project:   %GOOGLE_CLOUD_PROJECT%
echo Location:  %GOOGLE_CLOUD_LOCATION%
echo Reasoning: %MODEL_REASONING%
echo Fast:      %MODEL_FAST%
echo Port:      8000
echo ==========================================================

"%~dp0.venv\Scripts\adk.exe" web "%~dp0agents\src" --port 8000
