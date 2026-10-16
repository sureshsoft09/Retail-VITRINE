"""FastAPI request payload Pydantic models."""

from typing import Union, Optional
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    """Customer chat message request payload."""

    message: str = Field(..., example="I want to try a medium-size yellow round-neck T-shirt.")


class SelectProductRequest(BaseModel):
    """Customer product selection request payload."""

    selection_index: Optional[Union[int, str]] = None
    product_id: Optional[str] = None

    def model_post_init(self, __context):
        if not self.selection_index and self.product_id:
            self.selection_index = self.product_id
        elif not self.product_id and self.selection_index:
            self.product_id = str(self.selection_index)


# Alias for backward compatibility
ProductSelectionRequest = SelectProductRequest


class GenerateTryOnRequest(BaseModel):
    """Try-On generation confirmation request payload."""

    confirm: bool = Field(True, description="Customer explicit consent to generate AI visualization")
    confirmed: bool = Field(True, description="Customer explicit consent to generate AI visualization")

    def model_post_init(self, __context):
        if self.confirm is False and self.confirmed:
            self.confirmed = False
        elif self.confirmed is False and self.confirm:
            self.confirm = False
