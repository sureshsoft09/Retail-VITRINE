"""ATP (Available To Promise) deterministic calculator.

Pure Python function: on_hand - reserved - safety_stock.
No external network dependencies.
"""

from typing import Dict, Any

def calculate_atp(on_hand: int, reserved: int, safety_stock: int, requested_quantity: int) -> Dict[str, Any]:
    """Calculates available units and returns binary availability."""
    available = max(0, on_hand - reserved - safety_stock)
    is_satisfiable = available >= requested_quantity
    
    return {
        "on_hand": on_hand,
        "reserved": reserved,
        "safety_stock": safety_stock,
        "available_units": available,
        "requested_quantity": requested_quantity,
        "is_satisfiable": is_satisfiable,
    }
