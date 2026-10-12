"""Runner script for launching all 3 VITRINE MCP servers concurrently."""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

root_dir = Path(__file__).resolve().parent

MCP_SERVERS = [
    {
        "name": "mcp-catalog (Port 8090)",
        "cmd": [sys.executable, str(root_dir / "mcp-servers" / "catalog" / "main.py")],
        "port": 8090,
    },
    {
        "name": "mcp-promise (Port 8091)",
        "cmd": [sys.executable, str(root_dir / "mcp-servers" / "promise" / "main.py")],
        "port": 8091,
    },
    {
        "name": "mcp-commerce (Port 8092)",
        "cmd": [sys.executable, str(root_dir / "mcp-servers" / "commerce" / "main.py")],
        "port": 8092,
    },
]

def main():
    print("=" * 60)
    print("Launching VITRINE MCP Servers (Catalog, Promise, Commerce)")
    print("=" * 60)

    processes = []
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{root_dir}{os.pathsep}{root_dir / 'agents' / 'src'}"

    try:
        for s in MCP_SERVERS:
            print(f"[STARTING] {s['name']}...")
            p = subprocess.Popen(s["cmd"], env=env)
            processes.append((s["name"], p))
            time.sleep(0.5)

        print("\nAll 3 MCP Servers are running! Press Ctrl+C to stop.\n")
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down all MCP servers...")
        for name, p in processes:
            p.terminate()
        for name, p in processes:
            p.wait()
        print("All MCP servers stopped.")

if __name__ == "__main__":
    main()
