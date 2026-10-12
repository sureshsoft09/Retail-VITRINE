"""VITRINE Agent System Root Package.

Built on the Google Agent Development Kit (ADK) framework.
"""

import sys
from pathlib import Path

# Ensure 'agents/src' and repo root are always on sys.path regardless of
# working directory or how ADK CLI discovers the package.
_pkg_root = Path(__file__).resolve().parent.parent
_repo_root = _pkg_root.parent.parent

for _p in [str(_pkg_root), str(_repo_root)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from vitrine_agents.base import load_passport, load_prompt, AgentPassport

__all__ = ["load_passport", "load_prompt", "AgentPassport"]
