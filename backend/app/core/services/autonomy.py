"""Autonomy Policy Service.

Controls autonomous commercial authority parameters and the emergency kill switch.
"""

from typing import Dict, Any
from pydantic import BaseModel

class AutonomyPolicy(BaseModel):
    max_discount_pct: float = 15.0
    margin_floor_pct: float = 18.0
    max_order_usd: float = 250.0
    buyer_reputation_floor: float = 0.40
    kill_switch_active: bool = False
    replay_mode_active: bool = False

class AutonomyManager:
    """In-memory and Firestore backed commercial policy manager."""

    def __init__(self):
        self._policy = AutonomyPolicy()

    def get_policy(self) -> AutonomyPolicy:
        return self._policy

    def update_policy(self, updates: Dict[str, Any]) -> AutonomyPolicy:
        current_dict = self._policy.model_dump()
        for k, v in updates.items():
            if k in current_dict:
                current_dict[k] = v
        self._policy = AutonomyPolicy(**current_dict)
        return self._policy

    def toggle_kill_switch(self, active: bool) -> bool:
        self._policy.kill_switch_active = active
        return self._policy.kill_switch_active

# Singleton instance
autonomy_manager = AutonomyManager()
