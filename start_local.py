"""Local Development Orchestrator for VITRINE.

Spawns all microservices and MCP servers concurrently for local end-to-end testing:
- vitrine-bff       : http://localhost:8080
- vitrine-ucp       : http://localhost:8082
- mcp-catalog       : http://localhost:8090
- mcp-promise       : http://localhost:8091
- mcp-commerce      : http://localhost:8092
- React Frontend    : http://localhost:5173
"""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

root_dir = Path(__file__).resolve().parent

SERVICES = [
    {
        "name": "vitrine-bff",
        "cmd": [sys.executable, "-m", "uvicorn", "backend.app.bff.main:app", "--host", "127.0.0.1", "--port", "8080"],
        "cwd": root_dir,
    },
    {
        "name": "vitrine-ucp",
        "cmd": [sys.executable, "-m", "uvicorn", "backend.app.ucp.main:app", "--host", "127.0.0.1", "--port", "8082"],
        "cwd": root_dir,
    },
    {
        "name": "mcp-catalog",
        "cmd": [sys.executable, str(root_dir / "mcp-servers" / "catalog" / "main.py")],
        "cwd": root_dir / "mcp-servers" / "catalog",
    },
    {
        "name": "mcp-promise",
        "cmd": [sys.executable, str(root_dir / "mcp-servers" / "promise" / "main.py")],
        "cwd": root_dir / "mcp-servers" / "promise",
    },
    {
        "name": "mcp-commerce",
        "cmd": [sys.executable, str(root_dir / "mcp-servers" / "commerce" / "main.py")],
        "cwd": root_dir / "mcp-servers" / "commerce",
    },
]

def main():
    print("=" * 70)
    print("VITRINE Local Services Orchestrator (us-central1)")
    print("=" * 70)

    processes = []
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{root_dir}{os.pathsep}{root_dir / 'agents' / 'src'}{os.pathsep}{root_dir / 'agents'}"

    try:
        for svc in SERVICES:
            print(f"Starting {svc['name']}...")
            p = subprocess.Popen(svc["cmd"], cwd=svc["cwd"], env=env)
            processes.append((svc["name"], p))
            time.sleep(0.5)

        print("\nAll 5 backend and MCP services launched successfully!")
        print("  - vitrine-bff       : http://localhost:8080/healthz")
        print("  - vitrine-ucp       : http://localhost:8082/.well-known/ucp")
        print("  - mcp-catalog       : http://localhost:8090/healthz")
        print("  - mcp-promise       : http://localhost:8091/healthz")
        print("  - mcp-commerce      : http://localhost:8092/healthz")
        print("\nTo start the frontend UI, open a new terminal and run:")
        print("  cd frontend && npm run dev")
        print("\nPress Ctrl+C to terminate all services.")
        
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down all services...")
        for name, p in processes:
            p.terminate()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
