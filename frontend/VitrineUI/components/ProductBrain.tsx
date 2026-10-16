import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Search,
  FileText,
  ShieldCheck,
  Wand2,
  ArrowRight,
  Layers,
  Award,
  BookOpen,
  Check,
} from "lucide-react";
import { api } from "../api";
import { Product } from "../types";
import { useVitrineStore } from "../store";

const FALLBACK_CATALOG: Product[] = [
  {
    sku: "SKU-4829-SILK-BLOUSE",
    title: "100% Mulberry Silk Draped Blouse — Ivory",
    description:
      "Tailored Italian mulberry silk blouse with mother-of-pearl cuff closures and fluid French-seamed drape.",
    price: 128.0,
    category: "Womenswear / Tops & Blouses",
    raw_attributes: {
      title: "Silk Blouse Ivory",
      price: "$128.00",
      color: "Ivory",
      size_available: "S, M, L",
    },
    enriched_attributes: {
      fabric_composition: {
        value: "100% Grade-6A Mulberry Silk (19 Momme)",
        confidence: 0.99,
        provenance: "Garment Care Label Inspection",
        regulated: true,
      },
      size_m_chest_width: {
        value: "21.0 in (53.3 cm) — True to Size",
        confidence: 0.97,
        provenance: "Merchandising Size Spec Sheet",
        regulated: false,
      },
      care_instructions: {
        value: "Dry Clean Only (Perchloroethylene-Free)",
        confidence: 0.99,
        provenance: "Garment Care Label Inspection",
        regulated: true,
      },
      weave_and_finish: {
        value: "Lustrous Charmeuse Satin Weave · Breathable",
        confidence: 0.95,
        provenance: "Studio Garment Photography",
        regulated: false,
      },
      country_of_origin: {
        value: "Woven in Como, Italy · Certified Mill #14",
        confidence: 0.98,
        provenance: "Supplier Mill Certificate",
        regulated: true,
      },
      styling_occasion: {
        value: "Executive Business, Evening & Bridal Trousseau",
        confidence: 0.94,
        provenance: "Merchandising Style Guide",
        regulated: false,
      },
    },
  },
  {
    sku: "SKU-4830-SILK-SHIRT",
    title: "Relaxed French Linen-Silk Shirt — Ivory",
    description:
      "Breathable linen-silk blend button-down with relaxed shoulder line and natural mother-of-pearl buttons.",
    price: 134.0,
    category: "Womenswear / Shirts & Tailoring",
    raw_attributes: {
      title: "Linen Silk Shirt",
      price: "$134.00",
      color: "Ivory",
      size_available: "XS, S, M, L",
    },
    enriched_attributes: {
      fabric_composition: {
        value: "70% Normandy Flax Linen, 30% Mulberry Silk",
        confidence: 0.99,
        provenance: "Garment Care Label Inspection",
        regulated: true,
      },
      size_m_chest_width: {
        value: "21.5 in (54.6 cm) — Relaxed Tailored Fit",
        confidence: 0.97,
        provenance: "Merchandising Size Spec Sheet",
        regulated: false,
      },
      care_instructions: {
        value: "Gentle Cold Hand Wash or Dry Clean",
        confidence: 0.98,
        provenance: "Garment Care Label Inspection",
        regulated: true,
      },
      weave_and_finish: {
        value: "Lightweight Slub-Silk Poplin · High Breathability",
        confidence: 0.95,
        provenance: "Studio Garment Photography",
        regulated: false,
      },
      country_of_origin: {
        value: "Woven in Lyon, France · OEKO-TEX Standard 100",
        confidence: 0.99,
        provenance: "Supplier Mill Certificate",
        regulated: true,
      },
      substitution_compatibility: {
        value: "96% Match for SKU-4829 (Ivory · Size M · Natural Silk)",
        confidence: 0.96,
        provenance: "Merchandising Fit Verification",
        regulated: false,
      },
    },
  },
  {
    sku: "SKU-4831-SILK-CAMI",
    title: "Bias-Cut Mulberry Silk Camisole — Champagne Ivory",
    description:
      "Double-layered bias-cut silk camisole with adjustable French rouleau straps.",
    price: 96.0,
    category: "Womenswear / Layering Essentials",
    raw_attributes: {
      title: "Silk Camisole",
      price: "$96.00",
      color: "Champagne",
    },
    enriched_attributes: {
      fabric_composition: {
        value: "100% Mulberry Silk (22 Momme Double Georgette)",
        confidence: 0.99,
        provenance: "Garment Care Label Inspection",
        regulated: true,
      },
      size_m_chest_width: {
        value: "19.5 in (49.5 cm) — Bias Stretch Fit",
        confidence: 0.96,
        provenance: "Merchandising Size Spec Sheet",
        regulated: false,
      },
      care_instructions: {
        value: "Dry Clean or Cold Silk Detergent Wash",
        confidence: 0.98,
        provenance: "Garment Care Label Inspection",
        regulated: true,
      },
      weave_and_finish: {
        value: "Matte Crepe Back Satin · Non-Sheer Lined Bodice",
        confidence: 0.96,
        provenance: "Studio Garment Photography",
        regulated: false,
      },
    },
  },
];

export const ProductBrain: React.FC = () => {
  const { brainMode, setBrainMode } = useVitrineStore();

  const [products, setProducts] = useState<Product[]>(FALLBACK_CATALOG);
  const [selectedSku, setSelectedSku] = useState<string>(
    "SKU-4829-SILK-BLOUSE"
  );
  const [enriching, setEnriching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    "Ivory breathable silk top, Size M (21 in chest), verified care instructions"
  );

  useEffect(() => {
    let mounted = true;
    api
      .getProducts()
      .then((res) => {
        if (mounted && Array.isArray(res) && res.length > 0) {
          setProducts(res);
        }
      })
      .catch(() => {
        // use fallback
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeProduct =
    products.find((p) => p.sku === selectedSku) || FALLBACK_CATALOG[0];

  const handleEnhanceCatalog = async () => {
    setEnriching(true);
    try {
      await Promise.allSettled([
        api.triggerCatalogueEnrichment([activeProduct.sku]),
        api.enrichProduct(activeProduct.sku),
      ]);
    } catch {
      // fallback deterministic
    } finally {
      setTimeout(() => {
        setBrainMode("enriched");
        setEnriching(false);
      }, 450);
    }
  };

  const isEnriched = brainMode === "enriched";

  const storySteps = [
    {
      step: 1,
      title: "Before Enhancement",
      metric: "41% Completeness",
      desc: "Raw supplier feed only has title, price, and generic color.",
      active: !isEnriched,
      done: isEnriched,
    },
    {
      step: 2,
      title: "Missing Attributes",
      metric: "0 Agent Matches",
      desc: "Invisible to AI Buyer Agents due to missing fabric weight, chest specs & care rules.",
      active: !isEnriched,
      done: isEnriched,
    },
    {
      step: 3,
      title: "Product Brain Enriched",
      metric: "92% Agent-Ready",
      desc: "Verified from garment care labels, studio imagery & supplier mill certificates.",
      active: isEnriched,
      done: isEnriched,
    },
    {
      step: 4,
      title: "Products Become Discoverable",
      metric: "3 of 3 Ranked by Agents",
      desc: "AI Buyer Agents and shoppers match exact specifications with 99% confidence.",
      active: isEnriched,
      done: isEnriched,
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOP HEADER & VISUAL STORY STEPPER */}
      <div className="bg-white border border-ivory-300 rounded-2xl p-6 shadow-enterprise-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ivory-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-berry-50 text-berry-800 border border-berry-200">
                Product Brain · Discoverability Engine
              </span>
              <span className="text-xs text-ink-500 font-medium">
                Agentic Catalog Readiness, Attribute Enrichment & Virtual Try-On Studio
              </span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-ink-900 mt-1.5">
              Can AI Buyer Agents and Customers Discover Our Products?
            </h2>
            <p className="text-xs text-ink-600 mt-1 max-w-3xl">
              <strong className="text-ink-900">AI Buyer Agents</strong> filter out products that lack verified fabric composition, exact garment measurements, or care instructions. <strong className="text-ink-900">Product Brain</strong> enriches incomplete supplier feeds into structured, agent-discoverable catalog intelligence.
            </p>
          </div>

          {/* Toggle Between Raw Catalog & Product Brain Enriched */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="inline-flex rounded-xl bg-ivory-100 p-1 border border-ivory-300">
              <button
                onClick={() => setBrainMode("raw")}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isEnriched
                    ? "bg-white text-ink-900 shadow-xs border border-ivory-300"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                <EyeOff className="w-3.5 h-3.5 text-gold-600" />
                <span>Raw Supplier Feed (41%)</span>
              </button>
              <button
                onClick={handleEnhanceCatalog}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isEnriched
                    ? "bg-[#7B2D53] text-white shadow-xs"
                    : "text-berry-800 hover:bg-berry-50"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {enriching
                    ? "Enriching Product Brain..."
                    : "Product Brain Enriched (92%)"}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* 4-STAGE VISUAL STORY: Before Enhancement -> Missing Attributes -> Enhanced Catalog -> Products Become Discoverable */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-3">
            Catalog Discoverability Journey
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {storySteps.map((st, idx) => (
              <div
                key={st.step}
                onClick={() =>
                  st.step <= 2 ? setBrainMode("raw") : handleEnhanceCatalog()
                }
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  st.step >= 3 && isEnriched
                    ? "bg-sage-50/70 border-sage-300"
                    : st.step <= 2 && !isEnriched
                    ? "bg-gold-50/70 border-gold-300"
                    : "bg-ivory-50 border-ivory-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Stage {st.step}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      st.step >= 3 && isEnriched
                        ? "bg-sage-100 text-sage-800 border-sage-300"
                        : st.step <= 2 && !isEnriched
                        ? "bg-gold-100 text-gold-800 border-gold-300"
                        : "bg-white text-ink-600 border-ivory-300"
                    }`}
                  >
                    {st.metric}
                  </span>
                </div>
                <div className="text-sm font-serif font-bold text-ink-900">
                  {st.title}
                </div>
                <p className="text-xs text-ink-600 mt-1 leading-relaxed">
                  {st.desc}
                </p>
                {idx < storySteps.length - 1 && (
                  <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-ink-400 absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 5 MERCHANDISING OUTCOME PILLARS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase text-ink-500">
              1. Product Catalog
            </div>
            <div className="text-lg font-serif font-bold text-ink-900 mt-0.5">
              1,240 SKUs
            </div>
            <div className="text-[11px] text-ink-600">
              Luxury Silk & Linen Collection
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase text-ink-500">
              2. Product Completeness
            </div>
            <div
              className={`text-lg font-serif font-bold mt-0.5 ${
                isEnriched ? "text-sage-700" : "text-gold-700"
              }`}
            >
              {isEnriched ? "92% Complete" : "41% Complete"}
            </div>
            <div className="text-[11px] text-ink-600">
              {isEnriched
                ? "+51% attribute coverage gain"
                : "59% of buyer attributes missing"}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase text-ink-500">
              3. Catalog Readiness
            </div>
            <div
              className={`text-lg font-serif font-bold mt-0.5 ${
                isEnriched ? "text-sage-700" : "text-clay-700"
              }`}
            >
              {isEnriched ? "Agent & Buyer Ready" : "Not Ready"}
            </div>
            <div className="text-[11px] text-ink-600">
              {isEnriched
                ? "Verified sizing, fiber & care"
                : "Unverified sizing & care"}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase text-ink-500">
              4. Discoverability
            </div>
            <div
              className={`text-lg font-serif font-bold mt-0.5 ${
                isEnriched ? "text-sage-700" : "text-clay-700"
              }`}
            >
              {isEnriched ? "3 of 3 Styles Found" : "0 of 3 Styles Found"}
            </div>
            <div className="text-[11px] text-ink-600">
              For specific buyer queries
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase text-ink-500">
              5. Product Enrichment
            </div>
            <div className="text-lg font-serif font-bold text-berry-800 mt-0.5">
              18 Attributes / SKU
            </div>
            <div className="text-[11px] text-ink-600">
              From labels, photos & mill certs
            </div>
          </div>
        </div>
      </div>

      {/* BUYER SEARCH SIMULATION BAR: Shows 0 Results Before Enhancement vs 3 Discoverable Products After */}
      <div
        className={`rounded-2xl border p-5 shadow-enterprise transition-all ${
          isEnriched
            ? "bg-sage-50/40 border-sage-300"
            : "bg-gold-50/50 border-gold-300"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600 mb-2">
              <Search className="w-3.5 h-3.5 text-berry-700" />
              <span>Live Customer & Personal Shopper Search Test</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-ivory-300 text-xs font-medium text-ink-900"
              />
              {!isEnriched ? (
                <button
                  onClick={handleEnhanceCatalog}
                  className="px-4 py-2 rounded-xl bg-[#7B2D53] hover:bg-berry-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Enhance Catalog to Make Products Discoverable</span>
                </button>
              ) : (
                <span className="px-4 py-2 rounded-xl bg-sage-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3 Matching Products Discoverable</span>
                </span>
              )}
            </div>
          </div>

          <div className="lg:w-80 p-3.5 rounded-xl bg-white border border-ivory-300">
            <div className="text-[11px] font-bold text-ink-900">
              Search Outcome:{" "}
              {isEnriched ? (
                <span className="text-sage-700">
                  3 Verified Matches Returned
                </span>
              ) : (
                <span className="text-clay-700">
                  0 Matches (Products Invisible)
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-600 mt-1 leading-snug">
              {isEnriched
                ? "Because chest width (21.0 in), 100% Mulberry Silk weight, and dry-clean instructions are enriched, all 3 silk tops appear in buyer results."
                : "Before enhancement, the catalog lacks chest measurements, silk grade, and care instructions—so high-intent buyers cannot find these products."}
            </p>
          </div>
        </div>
      </div>

      {/* CATALOG EXPLORER: BEFORE ENHANCEMENT vs ENHANCED CATALOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Product Catalog List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-ink-900">
              Silk & Linen Collection
            </h3>
            <span className="text-xs text-ink-500 font-medium">
              Select style to inspect
            </span>
          </div>

          {products.map((prod) => {
            const isSelected = prod.sku === activeProduct.sku;
            return (
              <div
                key={prod.sku}
                onClick={() => setSelectedSku(prod.sku)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-md"
                    : "bg-white hover:bg-ivory-50 text-ink-900 border-ivory-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? "bg-white/15 text-white border-white/20"
                        : isEnriched
                        ? "bg-sage-50 text-sage-800 border-sage-200"
                        : "bg-gold-50 text-gold-800 border-gold-200"
                    }`}
                  >
                    {isEnriched ? "✓ Discoverable (92%)" : "⚠ Incomplete (41%)"}
                  </span>
                  <span
                    className={`text-sm font-serif font-bold ${
                      isSelected ? "text-[#F6C867]" : "text-ink-900"
                    }`}
                  >
                    ${prod.price.toFixed(2)}
                  </span>
                </div>
                <div className="font-serif font-bold text-sm leading-snug">
                  {prod.title}
                </div>
                <div
                  className={`text-[11px] mt-1 ${
                    isSelected ? "text-ivory-300" : "text-ink-500"
                  }`}
                >
                  Style Ref: {prod.sku} · {prod.category}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 8 Cols: Side-by-Side Before vs After Attribute Readiness */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-ivory-300 p-6 shadow-enterprise space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ivory-200 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-berry-700">
                Style Attribute Inspection · {activeProduct.sku}
              </span>
              <h3 className="font-serif font-bold text-xl text-ink-900 mt-0.5">
                {activeProduct.title}
              </h3>
              <p className="text-xs text-ink-600 mt-0.5">
                {activeProduct.description}
              </p>
            </div>
            <div className="shrink-0">
              {!isEnriched ? (
                <button
                  onClick={handleEnhanceCatalog}
                  className="px-4 py-2 rounded-xl bg-[#7B2D53] hover:bg-berry-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enrich Missing Attributes</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-50 text-sage-800 border border-sage-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-sage-600" />
                  <span>Ready for Customer & Agent Discovery</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Before Enhancement (Raw Supplier Feed) */}
            <div className="rounded-xl border border-ivory-300 bg-ivory-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-gold-600" />
                  <span>Before Enhancement (Basic Feed)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 border border-gold-300">
                  41% Complete
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(activeProduct.raw_attributes).map(
                  ([key, val]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-lg bg-white border border-ivory-200 flex justify-between"
                    >
                      <span className="text-ink-500 capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="font-semibold text-ink-900">{val}</span>
                    </div>
                  )
                )}

                {/* Highlight Missing Attributes */}
                <div className="pt-2 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-clay-700">
                    Missing Critical Buyer Attributes:
                  </div>
                  {[
                    "Exact Fabric Composition & Silk Momme Weight",
                    "Size M Chest & Garment Measurements",
                    "Verified Care & Cleaning Instructions",
                    "Mill Origin & Sustainability Certification",
                  ].map((missing) => (
                    <div
                      key={missing}
                      className="p-2 rounded-lg bg-clay-50/70 border border-clay-200 text-clay-800 text-[11px] flex items-center gap-1.5 font-medium"
                    >
                      <span>✕ Missing: {missing}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Enhanced Catalog Attributes */}
            <div
              className={`rounded-xl border p-4 space-y-3 transition-all ${
                isEnriched
                  ? "border-berry-300 bg-berry-50/25"
                  : "border-dashed border-ivory-300 bg-ivory-50/40 opacity-85"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-berry-700" />
                  <span>Enhanced Catalog Specifications</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-300">
                  92% Complete
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {Object.entries(activeProduct.enriched_attributes).map(
                  ([key, attr]) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-white border border-ivory-200 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-ink-700 capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ivory-100 text-ink-700 border border-ivory-300">
                          Source: {attr.provenance}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-ink-900 mt-1">
                        {attr.value}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-ink-500">
                        <span className="text-sage-700 font-semibold">
                          ✓ Verified ({Math.round(attr.confidence * 100)}% Quality Score)
                        </span>
                        {attr.regulated && (
                          <span className="text-berry-700 font-semibold">
                            Compliance Verified
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
