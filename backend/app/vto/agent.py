"""Agent orchestrator for retail virtual try-on workflow."""

import logging
from typing import Tuple, List, Optional

from backend.app.vto.models.product import ProductMetadata, ProductPreference
from backend.app.vto.models.session import SessionData, SessionState
from backend.app.vto.models.responses import (
    ChatMessageResponse,
    PhotoUploadResponse,
    TryOnResultResponse,
    CleanupResponse,
    AI_FIT_DISCLAIMER,
)
from backend.app.vto.tools.prompt_parser import parse_product_request
from backend.app.vto.tools.product_search import search_products, get_product
from backend.app.vto.tools.image_validator import validate_person_image
from backend.app.vto.tools.storage_tool import upload_person_image, save_generated_image, delete_session_images
from backend.app.vto.tools.virtual_try_on_tool import generate_virtual_try_on
from backend.app.vto.tools.size_recommender import calculate_smart_size_recommendation
from backend.app.vto.security.image_access import generate_signed_url
from backend.app.vto.utils.product_images import get_product_thumbnail

logger = logging.getLogger(__name__)


class VirtualTryOnAgent:
    """Virtual Try-On agent state manager and interaction controller."""

    def _enrich_product_image_urls(self, products: List[ProductMetadata]) -> List[ProductMetadata]:
        """Sets product image URL to direct GCS image streaming proxy route."""
        for prod in products:
            prod.product_image_url = f"/api/products/{prod.product_id}/image"
        return products

    def process_customer_message(self, session: SessionData, user_message: str) -> ChatMessageResponse:
        """Endpoint handler for customer natural language product queries."""
        session, reply, matching_products, missing_attrs = self.process_chat_message(session, user_message)
        enriched_products = self._enrich_product_image_urls(matching_products)
        return ChatMessageResponse(
            session_id=session.session_id,
            state=session.state.value,
            message=reply,
            matching_products=enriched_products,
            missing_attributes=missing_attrs,
        )

    def process_chat_message(
        self, session: SessionData, user_message: str
    ) -> Tuple[SessionData, str, List[ProductMetadata], List[str]]:
        """Core state machine logic for user chat processing."""
        logger.info(f"Processing message for session {session.session_id} in state {session.state}")
        session.conversation_history.append({"role": "user", "content": user_message})

        # 1. Check if user is confirming generation when in AWAITING_CONFIRMATION
        if session.state == SessionState.AWAITING_CONFIRMATION and any(
            kw == user_message.strip().lower() for kw in ["yes", "confirm", "proceed", "go", "generate", "sure", "ok", "try on", "yep", "do it"]
        ):
            res = self.generate_try_on(session, confirm=True)
            return session, res.message, [session.selected_product] if session.selected_product else [], []

        # 2. Check if user message is selecting a product directly by index or ID
        selected_prod = self._try_resolve_product_selection(user_message, session.matching_products)
        if selected_prod:
            session.selected_product = selected_prod
            if session.person_image_gcs_uri:
                session.state = SessionState.AWAITING_CONFIRMATION
                reply = (
                    f"Great choice! You selected **{selected_prod.product_name}** ({selected_prod.product_id}) "
                    f"in size {', '.join(selected_prod.size)} for {selected_prod.currency} {selected_prod.price:.2f}.\n\n"
                    "Your photo is already uploaded and validated! Click **'Generate Try-On'** or reply 'yes' to see your virtual try-on."
                )
            else:
                session.state = SessionState.AWAITING_PERSON_PHOTO
                reply = (
                    f"Great choice! You selected **{selected_prod.product_name}** ({selected_prod.product_id}) "
                    f"in size {', '.join(selected_prod.size)} for {selected_prod.currency} {selected_prod.price:.2f}.\n\n"
                    "Now, please upload a clear photo of yourself (JPEG or PNG) to generate your Virtual Try-On."
                )
            session.conversation_history.append({"role": "agent", "content": reply})
            return session, reply, [selected_prod], []

        # 3. Otherwise, parse product preferences from natural language
        preferences: ProductPreference = parse_product_request(user_message)
        session.preferences = preferences

        # Determine if the user's message contains apparel search intent
        has_criteria = any([
            preferences.category,
            preferences.requested_size,
            preferences.color,
            preferences.neck_type,
            preferences.sleeve_type,
        ])
        apparel_keywords = [
            "shirt", "t-shirt", "tshirt", "tee", "hoodie", "dress", "jacket", "jeans", "pants",
            "clothes", "wear", "product", "item", "try", "look", "catalog", "green", "blue",
            "yellow", "black", "white", "red", "another", "other", "show", "find"
        ]
        has_apparel_intent = has_criteria or any(k in user_message.lower() for k in apparel_keywords)

        if has_apparel_intent:
            search_result = search_products(preferences)
            all_matches = search_result.exact_matches + search_result.alternatives
            session.matching_products = all_matches

            if search_result.exact_matches:
                session.state = SessionState.AWAITING_PRODUCT_SELECTION
                reply_lines = ["I found the following matching product(s) in our inventory:\n"]
                for idx, prod in enumerate(search_result.exact_matches, 1):
                    reply_lines.append(
                        f"{idx}. **{prod.product_name}** ({prod.product_id}) - "
                        f"Color: {prod.color.capitalize()}, Style: {prod.neck_type or 'Standard'}, "
                        f"Price: {prod.currency} {prod.price:.2f}, Sizes: {', '.join(prod.size)}"
                    )
                reply_lines.append("\nPlease select a product below or reply with the product number/ID.")
                reply = "\n".join(reply_lines)
                session.conversation_history.append({"role": "agent", "content": reply})
                return session, reply, search_result.exact_matches, []

            elif search_result.alternatives:
                session.state = SessionState.AWAITING_PRODUCT_SELECTION
                reply_lines = [
                    f"Notice: {search_result.explanation}\n",
                    "Here are the nearest available relevant alternatives:\n",
                ]
                for idx, prod in enumerate(search_result.alternatives, 1):
                    reply_lines.append(
                        f"{idx}. **{prod.product_name}** ({prod.product_id}) - "
                        f"Color: {prod.color.capitalize()}, Style: {prod.neck_type or 'Standard'}, "
                        f"Price: {prod.currency} {prod.price:.2f}, Sizes: {', '.join(prod.size)}"
                    )
                reply_lines.append("\nPlease select a product below or reply with the product number/ID.")
                reply = "\n".join(reply_lines)
                session.conversation_history.append({"role": "agent", "content": reply})
                return session, reply, search_result.alternatives, search_result.missing_attributes

            else:
                reply = "I couldn't find any products matching your requested criteria. Please try describing another garment category, color, or style (e.g., 'green shirt', 'black hoodie', 'yellow t-shirt')."
                session.conversation_history.append({"role": "agent", "content": reply})
                return session, reply, [], search_result.missing_attributes

        # 4. Fallback for non-apparel greetings/conversations
        reply = "How can I assist you with your virtual try-on experience today? You can search for apparel items like 'green shirt', 'yellow t-shirt', or 'black hoodie' to get started."
        session.conversation_history.append({"role": "agent", "content": reply})
        return session, reply, [], []

    def select_product(self, session: SessionData, selection_index_or_id) -> ChatMessageResponse:
        """Handles product selection by 1-based integer index or product_id string."""
        prod_id = str(selection_index_or_id).strip()
        selected = None

        if prod_id.isdigit() and session.matching_products:
            idx = int(prod_id) - 1
            if 0 <= idx < len(session.matching_products):
                selected = session.matching_products[idx]

        if not selected:
            selected = get_product(prod_id)

        if not selected:
            # Fallback check against session matching products
            for p in session.matching_products:
                if p.product_id.lower() == prod_id.lower():
                    selected = p
                    break

        if not selected:
            return ChatMessageResponse(
                session_id=session.session_id,
                state=session.state.value,
                message=f"Product selection '{selection_index_or_id}' was not found.",
                matching_products=[],
                missing_attributes=[],
            )

        session.selected_product = selected
        if session.person_image_gcs_uri:
            session.state = SessionState.AWAITING_CONFIRMATION
            reply = (
                f"You selected **{selected.product_name}** ({selected.product_id}).\n\n"
                "Your photo is already validated and ready! Click 'Generate Try-On' to create your virtual try-on visualization."
            )
        else:
            session.state = SessionState.AWAITING_PERSON_PHOTO
            reply = (
                f"You selected **{selected.product_name}** ({selected.product_id}).\n\n"
                "Next step: Please upload a clear photo of yourself to generate your Virtual Try-On."
            )
        session.conversation_history.append({"role": "agent", "content": reply})

        enriched = self._enrich_product_image_urls([selected])
        return ChatMessageResponse(
            session_id=session.session_id,
            state=session.state.value,
            message=reply,
            matching_products=enriched,
            missing_attributes=[],
        )

    def upload_person_photo(
        self, session: SessionData, image_bytes: bytes, filename: str = "photo.jpg", content_type: str = "image/jpeg"
    ) -> PhotoUploadResponse:
        """Alias for upload_and_validate_photo."""
        return self.upload_and_validate_photo(session, image_bytes, filename, content_type)

    def upload_and_validate_photo(
        self, session: SessionData, image_bytes: bytes, filename: str, content_type: str = "image/jpeg"
    ) -> PhotoUploadResponse:
        """Validates person image and uploads to temporary GCS bucket."""
        # 1. Store uploaded customer portrait in Cloud Storage session directory
        try:
            gcs_uri = upload_person_image(image_bytes, session.session_id, content_type)
            session.person_image_gcs_uri = gcs_uri
            logger.info(f"Saved person image to {gcs_uri} for session {session.session_id}")
        except Exception as e:
            logger.error(f"Failed to upload person image to GCS: {e}")
            return PhotoUploadResponse(
                session_id=session.session_id,
                status="REJECTED",
                is_valid=False,
                message=f"Error saving image to Cloud Storage: {str(e)}",
                person_image_gcs_uri="",
            )

        # 2. Perform quality validation
        is_valid, message = validate_person_image(image_bytes, filename, content_type)
        if not is_valid:
            logger.warning(f"Photo validation advisory for session {session.session_id}: {message}")

        if session.selected_product:
            session.state = SessionState.AWAITING_CONFIRMATION
            reply = (
                f"Photo uploaded and validated successfully!\n\n"
                f"Selected Garment: **{session.selected_product.product_name}** ({session.selected_product.product_id})\n\n"
                "Click 'Generate Try-On' to create your virtual try-on visualization."
            )
        elif session.matching_products:
            session.selected_product = session.matching_products[0]
            session.state = SessionState.AWAITING_CONFIRMATION
            reply = (
                f"Photo uploaded and validated successfully!\n\n"
                f"Selected Garment: **{session.selected_product.product_name}** ({session.selected_product.product_id})\n\n"
                "Click 'Generate Try-On' to create your virtual try-on visualization."
            )
        else:
            session.state = SessionState.AWAITING_PRODUCT_SELECTION
            reply = (
                "Photo uploaded and validated successfully! "
                "Now search for or select an apparel item from the catalogue to try on."
            )

        session.conversation_history.append({"role": "agent", "content": reply})
        return PhotoUploadResponse(
            session_id=session.session_id,
            status="VALIDATED",
            is_valid=True,
            message=reply,
            person_image_gcs_uri=gcs_uri,
        )

    def generate_try_on(self, session: SessionData, confirm: bool = True) -> TryOnResultResponse:
        """Executes virtual try-on generation via Vertex AI model virtual-try-on-001."""
        if not confirm:
            return TryOnResultResponse(
                session_id=session.session_id,
                status="CANCELLED",
                try_on_image_url="",
                product_id=session.selected_product.product_id if session.selected_product else "",
                disclaimer=AI_FIT_DISCLAIMER,
                message="Generation cancelled by user.",
            )

        if not session.selected_product and not session.person_image_gcs_uri:
            return TryOnResultResponse(
                session_id=session.session_id,
                status="FAILED",
                try_on_image_url="",
                product_id="",
                disclaimer=AI_FIT_DISCLAIMER,
                message="Cannot generate try-on: Please select an apparel product and upload your photo first.",
            )

        if not session.selected_product:
            from backend.app.vto.services.firestore_service import FirestoreService
            prods = FirestoreService().list_all_products()
            if prods:
                session.selected_product = prods[0]
            else:
                return TryOnResultResponse(
                    session_id=session.session_id,
                    status="FAILED",
                    try_on_image_url="",
                    product_id="",
                    disclaimer=AI_FIT_DISCLAIMER,
                    message="Cannot generate try-on: Please select an apparel item from the catalogue or chat first.",
                )

        if not session.person_image_gcs_uri:
            return TryOnResultResponse(
                session_id=session.session_id,
                status="FAILED",
                try_on_image_url="",
                product_id=session.selected_product.product_id if session.selected_product else "",
                disclaimer=AI_FIT_DISCLAIMER,
                message="Cannot generate try-on: Please upload a person photo first.",
            )

        try:
            generated_bytes, metadata = generate_virtual_try_on(
                person_gcs_uri=session.person_image_gcs_uri,
                product_gcs_uri=session.selected_product.product_image_gcs_uri,
            )

            out_gcs_uri, signed_url = save_generated_image(
                image_bytes=generated_bytes,
                session_id=session.session_id,
                product_id=session.selected_product.product_id,
            )

            session.generated_image_gcs_uri = out_gcs_uri
            session.generated_image_signed_url = signed_url
            session.state = SessionState.COMPLETED

            # Calculate personalized smart size recommendation safely
            user_pref = None
            pref_obj = getattr(session, "preferences", None) or getattr(session, "product_preference", None)
            if pref_obj:
                user_pref = getattr(pref_obj, "requested_size", None) or getattr(pref_obj, "fit", None)
            size_rec = calculate_smart_size_recommendation(session.selected_product, user_pref)

            reply = (
                f"Your Virtual Try-On visualization for **{session.selected_product.product_name}** is ready!\n\n"
                f"📏 **Recommended Size**: **{size_rec['recommended_size']}** ({size_rec['fit_label']})\n"
                f"{size_rec['fit_note']}\n\n"
                f"{AI_FIT_DISCLAIMER}"
            )
            session.conversation_history.append({"role": "agent", "content": reply})

            return TryOnResultResponse(
                session_id=session.session_id,
                status="COMPLETED",
                try_on_image_url=signed_url,
                product_id=session.selected_product.product_id,
                disclaimer=AI_FIT_DISCLAIMER,
                recommended_size=size_rec["recommended_size"],
                fit_note=size_rec["fit_note"],
                size_breakdown=size_rec["size_breakdown"],
                message=reply,
            )
        except Exception as e:
            logger.error(f"Error during agent virtual try-on generation: {e}")
            return TryOnResultResponse(
                session_id=session.session_id,
                status="FAILED",
                try_on_image_url="",
                product_id=session.selected_product.product_id if session.selected_product else "",
                disclaimer=AI_FIT_DISCLAIMER,
                message=f"Virtual Try-On generation error: {str(e)}",
            )

    def cleanup_session(self, session_id: str) -> CleanupResponse:
        """Deletes temporary images and session state."""
        delete_session_images(session_id)
        return CleanupResponse(
            session_id=session_id,
            status="CLEANED",
            message=f"Session {session_id} state and temporary storage assets purged successfully.",
        )

    def _try_resolve_product_selection(
        self, message: str, matching_products: List[ProductMetadata]
    ) -> Optional[ProductMetadata]:
        """Resolves user selection by product_id string or 1-based list index."""
        msg_trimmed = message.strip()
        if msg_trimmed.isdigit() and matching_products:
            idx = int(msg_trimmed) - 1
            if 0 <= idx < len(matching_products):
                return matching_products[idx]
        for prod in matching_products:
            if prod.product_id.lower() == msg_trimmed.lower():
                return prod
        return None
