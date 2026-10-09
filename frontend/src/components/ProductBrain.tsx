import React, { useState } from "react";
import { Sparkles, Image, FileText, CheckCircle, Search, RefreshCw, Eye } from "lucide-react";
import { Product } from "../types";

export const ProductBrain: React.FC = () => {
  const [mode, setMode] = useState<"raw" | "enriched">("enriched");
  const [searchQuery, setSearchQuery] = useState("French Cuffs");
  const [coveragePct, setCoveragePct] = useState(41);
  const [isEnriching, setIsEnriching] = useState(false);

  // Demo product dataset
  const sampleProducts: Product[] = [
    {
      sku: "SKU-4829-SILK-BLOUSE",
      title: "Ladies Evening Top - Cream",
      description: "Elegant formal shirt for special occasions. See label for care details.",
      price: 128.00,
      category: "Womenswear",
      raw_attributes: {
        color: "Cream",
        department: "Womens",
        fabric_composition: "— not captured",
        sleeve_length: "— not captured",
        care_instructions: "— not captured",
      },
      enriched_attributes: {
        fabric_composition: {
          value: "100% Mulberry Silk",
          confidence: 0.96,
          provenance: "EXTRACTED_FROM_IMAGE",
          source_uri: "gs://vitrine-media/sku-4829-care-label.jpg",
        },
        sleeve_length: {
          value: "French Cuffs",
          confidence: 0.92,
          provenance: "EXTRACTED_FROM_IMAGE",
          source_uri: "gs://vitrine-media/sku-4829-front.jpg",
        },
        care_instructions: {
          value: "Dry Clean Only",
          confidence: 0.95,
          provenance: "EXTRACTED_FROM_IMAGE",
          source_uri: "gs://vitrine-media/sku-4829-care-label.jpg",
        },
      },
    },
    {
      sku: "SKU-4830-SILK-SHIRT",
      title: "Tailored Button-Down Blouse",
      description: "Pure silk women's classic long sleeve shirt.",
      price: 135.00,
      category: "Womenswear",
      raw_attributes: {
        color: "Ivory",
        department: "Womens",
        fabric_composition: "Silk",
        sleeve_length: "— not captured",
        fit: "— not captured",
      },
      enriched_attributes: {
        fabric_composition: {
          value: "100% Mulberry Silk",
          confidence: 0.98,
          provenance: "DOCAI_SPEC_SHEET",
          source_uri: "gs://vitrine-docs/spec-sheet-4830.pdf",
        },
        sleeve_length: {
          value: "French Cuffs",
          confidence: 0.94,
          provenance: "EXTRACTED_FROM_IMAGE",
          source_uri: "gs://vitrine-media/sku-4830-cuff.jpg",
        },
        fit: {
          value: "Tailored Regular",
          confidence: 0.89,
          provenance: "INFERRED_FROM_ANALOGUES",
          source_uri: "analogues:silhouette_cluster_9",
        },
      },
    },
  ];

  // Filter based on search query and mode
  const filteredProducts = sampleProducts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (mode === "raw") {
      // Raw mode matches ONLY title or basic raw values
      return (
        p.title.toLowerCase().includes(q) ||
        Object.entries(p.raw_attributes).some(
          ([k, v]) => v !== "— not captured" && v.toLowerCase().includes(q)
        )
      );
    } else {
      // Enriched mode matches title OR enriched multimodal attributes
      return (
        p.title.toLowerCase().includes(q) ||
        Object.values(p.enriched_attributes).some((attr) =>
          attr.value.toLowerCase().includes(q)
        )
      );
    }
  });

  const runBatchEnrichment = () => {
    setIsEnriching(true);
    let progress = coveragePct;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 92) {
        progress = 92;
        clearInterval(interval);
        setIsEnriching(false);
      }
      setCoveragePct(progress);
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Coverage Bar & Mode Switcher */}
      <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-[#fbf7f7]">Product Brain: Multimodal Attribute Proof</h2>
          </div>
          <p className="text-sm text-[#d1b8c0] mt-1">
            BigQuery <code className="text-amber-300">AI.GENERATE</code> multimodal pipeline (us-central1) turns unsearchable supplier text into high-confidence structured attributes.
          </p>
        </div>

        {/* Coverage score & action */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-[#a26769] block">Attribute Coverage</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{coveragePct}%</span>
          </div>
          <button
            onClick={runBatchEnrichment}
            disabled={isEnriching || coveragePct >= 92}
            className="flex items-center gap-2 bg-[#4a2433] hover:bg-[#6d2e46] text-[#fbf7f7] px-4 py-2 rounded-lg font-mono text-xs border border-[#6d2e46] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEnriching ? "animate-spin" : ""}`} />
            {isEnriching ? "Enriching Chunk..." : "Run Batch Enrichment (20 SKUs)"}
          </button>
        </div>
      </div>

      {/* Query Bar with Raw vs Enriched Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#140b10] border border-[#2e1a21] p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#a26769] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Try searching 'French Cuffs', 'Mulberry Silk', or 'Dry Clean'..."
            className="w-full bg-[#1e0f16] border border-[#3f222d] rounded-lg pl-9 pr-4 py-2 text-sm text-[#fbf7f7] placeholder-[#7d5665] focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#200e16] p-1.5 rounded-lg border border-[#3f222d] shrink-0">
          <button
            onClick={() => setMode("raw")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
              mode === "raw"
                ? "bg-rose-950 text-rose-300 font-bold border border-rose-800"
                : "text-[#a26769] hover:text-[#fbf7f7]"
            }`}
          >
            Raw Supplier Text
          </button>
          <button
            onClick={() => setMode("enriched")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
              mode === "enriched"
                ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-800"
                : "text-[#a26769] hover:text-[#fbf7f7]"
            }`}
          >
            Enriched Multimodal (AI.GENERATE)
          </button>
        </div>
      </div>

      {/* Result Counter Proof */}
      <div className="flex items-center justify-between px-2 text-xs font-mono text-[#a26769]">
        <span>
          Showing <strong className="text-[#fbf7f7]">{filteredProducts.length}</strong> matching products for "
          <span className="text-amber-300">{searchQuery}</span>" in <strong className="uppercase">{mode}</strong> mode.
        </span>
        {mode === "raw" && filteredProducts.length === 0 && (
          <span className="text-rose-400 font-semibold">
            ⚡ Notice: Raw supplier text fails fine-grained queries! Switch to "Enriched" to see the proof.
          </span>
        )}
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProducts.map((p) => (
          <div
            key={p.sku}
            className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">{p.sku}</span>
                  <h3 className="text-lg font-bold text-[#fbf7f7] mt-0.5">{p.title}</h3>
                </div>
                <span className="text-base font-bold font-mono text-[#fbf7f7] bg-[#2e1a21] px-2.5 py-1 rounded border border-[#4a2433]">
                  ${p.price.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-[#a26769] mt-2 italic">{p.description}</p>

              {/* Attribute Table */}
              <div className="mt-4 border-t border-[#3f222d]/60 pt-3">
                <span className="text-xs font-mono text-[#d1b8c0] font-semibold block mb-2 uppercase tracking-wider">
                  {mode === "raw" ? "Raw Supplier Fields (Unenriched)" : "Extracted Multimodal Attributes"}
                </span>

                {mode === "raw" ? (
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.entries(p.raw_attributes).map(([key, val]) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-2 rounded ${
                          val === "— not captured"
                            ? "bg-[#251017]/60 text-[#a26769] border border-dashed border-rose-950"
                            : "bg-[#201017] text-[#e8d5da]"
                        }`}
                      >
                        <span className="text-[#a26769] capitalize">{key.replace("_", " ")}</span>
                        <span className={val === "— not captured" ? "text-rose-400/80 font-italic" : "font-medium"}>
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {Object.entries(p.enriched_attributes).map(([key, attr]) => (
                      <div
                        key={key}
                        className="bg-[#122017]/80 border border-emerald-900/60 p-2.5 rounded-lg flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[#a26769] capitalize font-medium">{key.replace("_", " ")}</span>
                          <div className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="font-bold text-[11px]">{Math.round(attr.confidence * 100)}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#fbf7f7]">{attr.value}</span>
                          <span className="text-[10px] bg-[#1a3828] text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
                            {attr.provenance === "EXTRACTED_FROM_IMAGE" && <Image className="w-3 h-3" />}
                            {attr.provenance === "DOCAI_SPEC_SHEET" && <FileText className="w-3 h-3" />}
                            {attr.provenance.replace("_", " ")}
                          </span>
                        </div>
                        {attr.source_uri && (
                          <div className="text-[10px] text-[#7d9c8c] flex items-center gap-1 truncate pt-1 border-t border-emerald-950">
                            <Eye className="w-3 h-3 shrink-0" />
                            <span className="truncate">{attr.source_uri}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
