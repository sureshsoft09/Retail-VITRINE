"""Transaction agent package.

Automatically loads transaction-specific environment variables from .env.
"""

from pathlib import Path
from dotenv import load_dotenv

_env_file = Path(__file__).resolve().parent / ".env"
if _env_file.exists():
    load_dotenv(dotenv_path=_env_file, override=True)
