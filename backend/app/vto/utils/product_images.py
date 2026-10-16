"""Self-contained SVG data URI generator for product apparel thumbnails."""

import urllib.parse
from typing import Dict


def generate_svg_thumbnail(color_hex: str, category: str, neck_type: str, title: str) -> str:
    """Generates an SVG Data URI for an apparel product thumbnail."""
    # Determine icon / polygon geometry based on category
    if category.lower() == "hoodie":
        garment_svg = f"""
        <path d="M 60 40 L 80 15 L 120 15 L 140 40 L 180 70 L 160 90 L 155 190 L 45 190 L 40 90 L 20 70 Z" fill="{color_hex}" stroke="#1E293B" stroke-width="2"/>
        <path d="M 75 15 C 75 35 125 35 125 15" fill="none" stroke="#64748B" stroke-width="3"/>
        <rect x="70" y="140" width="60" height="40" fill="{color_hex}" stroke="#475569" stroke-width="1.5" rx="3"/>
        """
    elif category.lower() == "shirt":
        garment_svg = f"""
        <path d="M 65 30 L 85 30 L 100 45 L 115 30 L 135 30 L 185 85 L 160 100 L 150 190 L 50 190 L 40 100 L 15 85 Z" fill="{color_hex}" stroke="#1E293B" stroke-width="2"/>
        <polygon points="75,30 100,55 100,45" fill="#F8FAFC" stroke="#334155" stroke-width="1"/>
        <polygon points="125,30 100,55 100,45" fill="#F8FAFC" stroke="#334155" stroke-width="1"/>
        <line x1="100" y1="55" x2="100" y2="190" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3,3"/>
        <circle cx="100" cy="80" r="2" fill="#334155"/>
        <circle cx="100" cy="110" r="2" fill="#334155"/>
        <circle cx="100" cy="140" r="2" fill="#334155"/>
        """
    else:  # t-shirt
        neck_cutout = ""
        if neck_type and "v-neck" in neck_type.lower():
            neck_cutout = '<polygon points="85,30 100,60 115,30" fill="#0F172A"/>'
        elif neck_type and "polo" in neck_type.lower():
            neck_cutout = """
            <polygon points="85,30 100,50 115,30" fill="{color_hex}" stroke="#F8FAFC" stroke-width="1.5"/>
            <line x1="100" y1="50" x2="100" y2="80" stroke="#1E293B" stroke-width="1.5"/>
            <circle cx="100" cy="60" r="1.5" fill="#F8FAFC"/>
            <circle cx="100" cy="72" r="1.5" fill="#F8FAFC"/>
            """.replace("{color_hex}", color_hex)
        else:
            neck_cutout = '<path d="M 80 30 Q 100 50 120 30" fill="none" stroke="#F8FAFC" stroke-width="3"/>'

        garment_svg = f"""
        <path d="M 55 30 L 75 30 L 100 45 L 125 30 L 145 30 L 180 65 L 155 80 L 150 190 L 50 190 L 45 80 L 20 65 Z" fill="{color_hex}" stroke="#1E293B" stroke-width="2"/>
        {neck_cutout}
        """

    svg_content = f"""
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="100%" height="100%">
      <rect width="200" height="220" fill="#0F172A" rx="8"/>
      <ellipse cx="100" cy="195" rx="60" ry="10" fill="#1E293B"/>
      {garment_svg}
      <rect x="10" y="198" width="180" height="18" fill="#1E293B" rx="4"/>
      <text x="100" y="211" font-family="sans-serif" font-size="9" font-weight="bold" fill="#F8FAFC" text-anchor="middle">{title[:28]}</text>
    </svg>
    """.strip()

    encoded_svg = urllib.parse.quote(svg_content)
    return f"data:image/svg+xml;utf8,{encoded_svg}"


PRODUCT_THUMBNAIL_MAP: Dict[str, str] = {
    "TSHIRT-1001": generate_svg_thumbnail("#EAB308", "t-shirt", "round neck", "Yellow Crew Neck T-Shirt"),
    "TSHIRT-1002": generate_svg_thumbnail("#1E40AF", "t-shirt", "v-neck", "Navy Blue V-Neck T-Shirt"),
    "TSHIRT-1003": generate_svg_thumbnail("#CA8A04", "t-shirt", "polo", "Mustard Yellow Polo T-Shirt"),
    "TSHIRT-1004": generate_svg_thumbnail("#DC2626", "t-shirt", "round neck", "Crimson Red Graphic T-Shirt"),
    "TSHIRT-1005": generate_svg_thumbnail("#1E293B", "t-shirt", "round neck", "Charcoal Black T-Shirt"),
    "TSHIRT-1006": generate_svg_thumbnail("#16A34A", "t-shirt", "round neck", "Emerald Green T-Shirt"),
    "SHIRT-2001": generate_svg_thumbnail("#F8FAFC", "shirt", "collar", "Crisp White Formal Shirt"),
    "SHIRT-2002": generate_svg_thumbnail("#65A30D", "shirt", "collar", "Olive Green Linen Shirt"),
    "HOODIE-3001": generate_svg_thumbnail("#0F172A", "hoodie", "hooded", "Pitch Black Pullover Hoodie"),
    "HOODIE-3002": generate_svg_thumbnail("#64748B", "hoodie", "hooded", "Heather Grey Zip Hoodie"),
}


def get_product_thumbnail(product_id: str, color: str = "yellow", category: str = "t-shirt", name: str = "Apparel Item") -> str:
    """Returns guaranteed SVG thumbnail data URI for any product."""
    if product_id in PRODUCT_THUMBNAIL_MAP:
        return PRODUCT_THUMBNAIL_MAP[product_id]

    color_map = {
        "yellow": "#EAB308",
        "blue": "#1E40AF",
        "red": "#DC2626",
        "black": "#1E293B",
        "green": "#16A34A",
        "white": "#F8FAFC",
        "grey": "#64748B",
    }
    hex_color = color_map.get(color.lower(), "#6366F1")
    return generate_svg_thumbnail(hex_color, category, "round neck", name)
