"""Universal Commerce Protocol (UCP) API implementation for Retail AI Virtual Try-On Studio.

Provides standard agent discovery profile at `/.well-known/ucp` and checkout capabilities
under `dev.ucp.shopping.checkout`.
"""

import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(tags=["Universal Commerce Protocol (UCP)"])

# In-memory storage for UCP checkout sessions
_checkout_sessions: Dict[str, Dict[str, Any]] = {}


class ItemDetail(BaseModel):
    id: str = Field(..., description="Unique product identifier (SKU)")
    title: str = Field(..., description="Product title or name")
    price: float = Field(..., description="Unit price")


class LineItem(BaseModel):
    item: ItemDetail
    quantity: int = Field(default=1, ge=1, description="Quantity to purchase")


class ShippingAddress(BaseModel):
    city: str = Field(default="Bengaluru")
    postal_code: str = Field(default="560001")
    country: str = Field(default="IN")


class BuyerInfo(BaseModel):
    buyer_id: str = Field(default="agent_shopper_001")
    shipping_address: Optional[ShippingAddress] = None


class CreateCheckoutSessionRequest(BaseModel):
    line_items: List[LineItem] = Field(..., description="Garment items in the cart")
    currency: str = Field(default="INR", description="Three-letter ISO currency code")
    buyer: Optional[BuyerInfo] = None


class TotalEntry(BaseModel):
    type: str = Field(..., description="Type of total: subtotal, tax, shipping, total")
    amount: float = Field(..., description="Amount calculated")


class LinkEntry(BaseModel):
    rel: str
    href: str


class PaymentHandlerEntry(BaseModel):
    id: str
    version: str = "2026-01-11"


class PaymentConfig(BaseModel):
    handlers: List[PaymentHandlerEntry]


class CheckoutSessionResponse(BaseModel):
    ucp: Dict[str, Any]
    id: str
    status: str
    currency: str
    line_items: List[LineItem]
    totals: List[TotalEntry]
    links: List[LinkEntry]
    payment: PaymentConfig


def get_ucp_discovery_profile(base_url: str = "http://127.0.0.1:8080") -> Dict[str, Any]:
    """Generates the official UCP discovery manifest for this business server."""
    return {
        "ucp": {
            "version": "2026-01-11",
            "services": {
                "dev.ucp.shopping": [
                    {
                        "version": "2026-01-11",
                        "spec": "https://ucp.dev/specification/overview",
                        "transport": "rest",
                        "endpoint": f"{base_url}/ucp/v1",
                        "schema": "https://ucp.dev/services/shopping/rest.openapi.json",
                    }
                ]
            },
            "capabilities": {
                "dev.ucp.shopping.checkout": [
                    {
                        "version": "2026-01-11",
                        "spec": "https://ucp.dev/specification/checkout",
                        "schema": "https://ucp.dev/schemas/shopping/checkout.json",
                    }
                ]
            },
            "payment_handlers": {
                "com.google.pay": [
                    {
                        "id": "merchant_gpay_retail_01",
                        "version": "2026-01-11",
                        "spec": "https://pay.google.com/ucp/2026-01-11",
                        "config": {
                            "allowed_payment_methods": ["CARD", "TOKENIZED_CARD"],
                            "environment": "TEST",
                        },
                    }
                ]
            },
        },
        "business": {
            "name": "Retail AI Virtual Try-On Studio",
            "store_id": "store_retail_tryon_main",
            "country": "IN",
            "currency": "INR",
        },
    }


@router.get("/.well-known/ucp")
def ucp_discovery_manifest():
    """Step 3: Enable agents to discover business capabilities via standard discovery profile."""
    return get_ucp_discovery_profile()


@router.post(
    "/ucp/v1/checkout-sessions",
    response_model=CheckoutSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ucp_checkout_session(request: CreateCheckoutSessionRequest):
    """Step 4: Invoke checkout capability with your agent."""
    if not request.line_items:
        raise HTTPException(status_code=400, detail="line_items cannot be empty")

    session_id = f"chk_sess_{uuid.uuid4().hex[:12]}"
    
    # Calculate totals
    subtotal = sum(item.item.price * item.quantity for item in request.line_items)
    tax = round(subtotal * 0.05, 2)  # 5% standard GST
    shipping = 0.0  # Free shipping
    total = round(subtotal + tax + shipping, 2)

    totals = [
        TotalEntry(type="subtotal", amount=round(subtotal, 2)),
        TotalEntry(type="tax", amount=tax),
        TotalEntry(type="shipping", amount=shipping),
        TotalEntry(type="total", amount=total),
    ]

    response_data = CheckoutSessionResponse(
        ucp={
            "version": "2026-01-11",
            "capabilities": [
                {
                    "name": "dev.ucp.shopping.checkout",
                    "version": "2026-01-11",
                }
            ],
        },
        id=session_id,
        status="ready_for_payment",
        currency=request.currency,
        line_items=request.line_items,
        totals=totals,
        links=[
            LinkEntry(
                rel="payment",
                href=f"https://pay.google.com/checkout?session={session_id}",
            ),
            LinkEntry(
                rel="session",
                href=f"http://127.0.0.1:8080/ucp/v1/checkout-sessions/{session_id}",
            ),
        ],
        payment=PaymentConfig(
            handlers=[
                PaymentHandlerEntry(
                    id="com.google.pay",
                    version="2026-01-11",
                )
            ]
        ),
    )

    _checkout_sessions[session_id] = response_data.model_dump()
    return response_data


@router.get("/ucp/v1/checkout-sessions/{session_id}", response_model=CheckoutSessionResponse)
def get_ucp_checkout_session(session_id: str):
    """Retrieve an existing UCP checkout session."""
    session = _checkout_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"UCP checkout session '{session_id}' not found",
        )
    return session
