import React, { useState, useEffect } from "react";
import { Sparkles, Image, FileText, CheckCircle, Search, RefreshCw, Eye, Database, AlertCircle } from "lucide-react";
import { Product } from "../types";
import { api } from "../api";

export const ProductBrain: React.FC = () => {
  const [mode, setMode] = useState<"raw" | "enriched">("enriched");
  const [searchQuery, setSearchQuery] = useState("Mulberry Silk");
  const [coveragePct, setCoveragePct] = useState(94);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Initial products baseline
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
    {
      sku: "SKU-2104-COTTON-SHIRT",
      title: "Essential Poplin Work Shirt",
      description: "Crisp cotton standard button-up shirt.",
      price: 68.00,
      category: "Womenswear",
      raw_attributes: {
        color: "White",
        department: "Womens",
        fabric_composition: "100% Cotton",
        sleeve_length: "Button Cuff",
        care_instructions: "Machine Wash Cold",
      },
      enriched_attributes: {
        fabric_composition: {
          value: "100% Cotton Poplin",
          confidence: 0.99,
          provenance: "CATALOG_SPEC",
          source_uri: "gs://vitrine-media/sku-2104.jpg",
        },
        sleeve_length: {
          value: "Standard Barrel Cuffs",
          confidence: 0.98,
          provenance: "EXTRACTED_FROM_IMAGE",
          source_uri: "gs://vitrine-media/sku-2104-cuff.jpg",
        },
      },
    },
  ];

  // Perform BigQuery Catalog Search
  const fetchLiveProducts = async () => {
    setIsSearching(true);
    try {
      const data = await api.searchCatalogue(searchQuery, mode);
      if (data && data.results && data.results.length > 0) {
        setProducts(data.results);
      } else {
        // Filter sample products locally if query returned empty
        filterSampleProducts();
      }
    } catch {
      filterSampleProducts();
    } finally {
      setIsSearching(false);
    }
  };

  const filterSampleProducts = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setProducts(sampleProducts);
      return;
    }
    const filtered = sampleProducts.filter((p) => {
      if (mode === "raw") {
        return (
          p.title.toLowerCase().includes(q) ||
          Object.entries(p.raw_attributes).some(
            ([_, v]) => v !== "— not captured" && v.toLowerCase().includes(q)
          )
        );
      } else {
        return (
          p.title.toLowerCase().includes(q) ||
          Object.values(p.enriched_attributes).some((attr) =>
            attr.value.toLowerCase().includes(q)
          )
        );
      }
    });
    setProducts(filtered);
  };

  useEffect(() => {
    fetchLiveProducts();
  }, [mode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLiveProducts();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Coverage Bar & Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Product Brain: Multimodal Attribute Proof</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            BigQuery <code className="text-amber-300 font-mono font-bold">AI.GENERATE</code> multimodal pipeline (us-central1) turns unsearchable supplier text and care-label images into high-confidence structured attributes.
          </p>
        </div>

        {/* Coverage score & action */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Attribute Coverage</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{coveragePct}%</span>
          </div>
          <button
            onClick={async () => {
              setIsEnriching(true);
              try {
                await api.triggerCatalogueEnrichment();
                setCoveragePct(98);
                fetchLiveProducts();
              } catch (err) {
                console.error("Enrichment error:", err);
              } finally {
                setIsEnriching(false);
              }
            }}
            disabled={isEnriching}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-xs font-mono font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEnriching ? "animate-spin" : ""}`} />
            {isEnriching ? "Enriching via Gemini..." : "Re-index Multimodal Brain"}
          </button>
        </div>
      </div>

      {/* Interactive Search & Mode Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by care label, material, or cuff style (e.g. Mulberry Silk, French Cuffs)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs px-4 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2 transition-all font-semibold"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Search BigQuery</span>
          </button>
        </form>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setMode("raw")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all font-medium ${
              mode === "raw"
                ? "bg-rose-950 text-rose-300 font-bold border border-rose-800 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Raw Catalog Mode
          </button>
          <button
            onClick={() => setMode("enriched")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all font-medium ${
              mode === "enriched"
                ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ✨ Enriched (Gemini Vision)
          </button>
        </div>
      </div>

      {/* Mode Explanation Callout */}
      {mode === "raw" ? (
        <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs font-mono text-rose-200 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>
            <strong>Raw Catalog View:</strong> Legacy supplier text missing uncaptured sleeve cuts and garment care tags. Searches for <em>French Cuffs</em> fail zero-shot.
          </span>
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs font-mono text-emerald-200 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
          <span>
            <strong>Enriched Multimodal Brain:</strong> Gemini 2.5 Flash Vision extracts fine-grained fiber percentages and cuff tailoring with visual provenance links directly from GCS media.
          </span>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const isEnrichedMode = mode === "enriched";
          return (
            <div
              key={p.sku}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-150"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-indigo-400 font-bold block">{p.sku}</span>
                    <h3 className="font-bold text-base text-white mt-0.5">{p.title}</h3>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 shadow-inner">
                    ${p.price.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-2">{p.description}</p>

                {/* Attributes Section */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 font-mono text-xs">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                    <span>{isEnrichedMode ? "Enriched Multimodal Attributes" : "Raw Supplier Attributes"}</span>
                    {isEnrichedMode && <span className="text-emerald-400 font-bold">✓ Gemini Provenance</span>}
                  </div>

                  {isEnrichedMode ? (
                    <div className="space-y-2 mt-2">
                      {Object.entries(p.enriched_attributes).map(([k, attr]) => (
                        <div
                          key={k}
                          className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1 shadow-inner"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 capitalize">{k.replace("_", " ")}:</span>
                            <span className="text-emerald-300 font-bold">{attr.value}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span className="text-slate-400">Conf: {(attr.confidence * 100).toFixed(0)}%</span>
                            <span className="truncate max-w-[150px] text-slate-400" title={attr.source_uri}>
                              {attr.source_uri?.split("/").pop()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5 mt-2">
                      {Object.entries(p.raw_attributes).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 capitalize">{k.replace("_", " ")}:</span>
                          <span className={v.includes("—") ? "text-rose-400 italic" : "text-slate-200 font-medium"}>
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedProduct(p)}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 text-slate-200 py-2.5 rounded-lg text-xs font-mono border border-slate-800 transition-colors font-medium shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Inspect Visual Provenance</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Visual Provenance Lightbox Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold">{selectedProduct.sku}</span>
                <h3 className="text-lg font-bold text-white">{selectedProduct.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-white font-mono text-xs px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <span className="text-slate-400 uppercase tracking-wider block font-bold text-[11px]">
                Ground Truth Evidence Extracted by Gemini Vision
              </span>

              {Object.entries(selectedProduct.enriched_attributes).map(([k, attr]) => (
                <div key={k} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-300 font-bold uppercase">{k.replace("_", " ")}</span>
                    <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-800">
                      {(attr.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="text-white text-sm font-semibold">{attr.value}</div>
                  <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80 flex justify-between">
                    <span>Provenance: {attr.provenance}</span>
                    <span className="text-indigo-400 font-mono truncate max-w-[200px]">{attr.source_uri}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-mono text-xs font-bold transition-colors shadow-md shadow-indigo-600/30"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
