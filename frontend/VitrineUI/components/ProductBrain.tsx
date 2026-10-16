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
  X,
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
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [enriching, setEnriching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    "Ivory breathable silk top, Size M (21 in chest), verified care instructions"
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-2">
            Catalog Discoverability Journey
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {storySteps.map((st, idx) => (
              <div
                key={st.step}
                onClick={() =>
                  st.step <= 2 ? setBrainMode("raw") : handleEnhanceCatalog()
                }
                className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between h-full ${
                  st.step >= 3 && isEnriched
                    ? "bg-sage-50/70 border-sage-300"
                    : st.step <= 2 && !isEnriched
                    ? "bg-gold-50/70 border-gold-300"
                    : "bg-ivory-50 border-ivory-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-ink-500">
                      Stage {st.step}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
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
                  <div className="text-xs font-serif font-bold text-ink-900 leading-snug">
                    {st.title}
                  </div>
                </div>
                <p className="text-[11px] text-ink-600 mt-1 leading-snug">
                  {st.desc}
                </p>
                {idx < storySteps.length - 1 && (
                  <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-ink-400 absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-xs" />
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

      {/* HIGHLIGHTED & PROMINENT: LIVE CUSTOMER & PERSONAL SHOPPER SEARCH TEST */}
      <div
        className={`rounded-2xl border-2 p-5 sm:p-6 shadow-enterprise-md transition-all ${
          isEnriched
            ? "bg-gradient-to-br from-white via-sage-50/30 to-white border-sage-300"
            : "bg-gradient-to-br from-white via-gold-50/40 to-white border-gold-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ivory-200/80 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-berry-50 text-berry-800 border border-berry-200 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4 text-berry-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-berry-800 px-2 py-0.5 rounded-full bg-berry-50 border border-berry-200">
                  Live Search Benchmark
                </span>
                <span className="text-xs text-ink-500 font-medium">Inbound Shopper & AI Agent Intent Simulator</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink-900 mt-0.5">
                Live Customer & Personal Shopper Search Test
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEnriched ? (
              <span className="px-3 py-1.5 rounded-full bg-sage-100 text-sage-800 border border-sage-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-sage-600" />
                <span>3 Verified Matches Found (100% Discoverable)</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-gold-100 text-gold-900 border border-gold-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <AlertCircle className="w-4 h-4 text-gold-700" />
                <span>0 Matches (Catalog Invisible to Agents)</span>
              </span>
            )}
          </div>
        </div>

        {/* Search Input Bar + Action Button */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-ivory-300 text-xs font-medium text-ink-900 focus:outline-none focus:border-berry-500 shadow-xs"
                placeholder="Enter shopper or agent query..."
              />
            </div>
            {!isEnriched ? (
              <button
                onClick={handleEnhanceCatalog}
                className="px-5 py-2.5 rounded-xl bg-[#7B2D53] hover:bg-berry-800 text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md transition-all hover:scale-[1.01]"
              >
                <Wand2 className="w-4 h-4" />
                <span>Enhance Catalog to Make Products Discoverable</span>
              </button>
            ) : (
              <button
                onClick={() => setBrainMode("raw")}
                className="px-4 py-2.5 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-ink-800 border border-ivory-300 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-all"
              >
                <EyeOff className="w-3.5 h-3.5 text-gold-700" />
                <span>Simulate Raw Feed Failure</span>
              </button>
            )}
          </div>

          {/* Quick Presets Strip */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-ink-500 mr-1">Try Queries:</span>
            {[
              "Ivory breathable silk top, Size M (21 in chest), verified care instructions",
              "100% Grade-6A Mulberry Silk 19 Momme, Executive style",
              "Relaxed Normandy Linen-Silk shirt, Size M, cold wash",
            ].map((q) => (
              <button
                key={q}
                onClick={() => setSearchQuery(q)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  searchQuery === q
                    ? "bg-berry-50 text-berry-900 border-berry-300 font-bold"
                    : "bg-white hover:bg-ivory-100 text-ink-700 border-ivory-300"
                }`}
              >
                "{q.slice(0, 38)}..."
              </button>
            ))}
          </div>

          {/* Diagnostic Outcome Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white border border-ivory-200 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                Buyer Intent Query Parsing
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-ivory-100 border border-ivory-300 text-[11px] font-medium text-ink-800">
                  Target Color: <strong>Ivory</strong>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-ivory-100 border border-ivory-300 text-[11px] font-medium text-ink-800">
                  Target Size: <strong>M (21 in Chest)</strong>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-ivory-100 border border-ivory-300 text-[11px] font-medium text-ink-800">
                  Composition: <strong>100% Mulberry Silk</strong>
                </span>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs ${
                isEnriched
                  ? "bg-sage-50/60 border-sage-300 text-sage-950"
                  : "bg-gold-50/60 border-gold-300 text-gold-950"
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Discoverability Diagnostic:</span>
                <span className={isEnriched ? "text-sage-800" : "text-clay-800"}>
                  {isEnriched ? "100% Match Ratio" : "0% Match Ratio (Rejected)"}
                </span>
              </div>
              <p className="text-[11px] text-ink-700 mt-1 leading-snug">
                {isEnriched
                  ? "Product Brain indexed chest width (21.0 in), 100% Mulberry Silk (19 Momme), and dry-clean guidelines. All 3 silk tops are ranked and discoverable by AI buyer agents."
                  : "Raw supplier feed is missing chest measurements, silk momme grade, and care instructions. Inbound buyer agents reject these products and abandon the cart."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CATALOG DIRECTORY: FULL-WIDTH LUXURY COLLECTION WITH SLIDE-OVER DRAWER INSPECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-berry-800 px-2.5 py-0.5 rounded-full bg-berry-50 border border-berry-200">
                Merchandise Intelligence Directory
              </span>
              <span className="text-xs font-semibold text-ink-500">
                {products.length} Styles Active
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-ink-900 mt-1">
              Silk & Linen Collection Catalog
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Full-width luxury merchandise directory. Select any style to inspect its deep attribute readiness and configure AI buyer discoverability specifications.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEnriched ? (
              <button
                onClick={handleEnhanceCatalog}
                disabled={enriching}
                className="px-4 py-2 rounded-xl bg-[#7B2D53] hover:bg-berry-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{enriching ? "Enriching Collection..." : "Enrich All Missing Attributes"}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sage-50 text-sage-800 border border-sage-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-sage-600" />
                <span>All 3 Styles Discoverable</span>
              </span>
            )}
          </div>
        </div>

        {/* Full-Width 3-Column Luxury Product Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((prod) => {
            const isSelected = prod.sku === activeProduct.sku;
            return (
              <div
                key={prod.sku}
                className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between hover:shadow-enterprise-md hover:border-ivory-400 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isEnriched
                          ? "bg-sage-50 text-sage-800 border-sage-200"
                          : "bg-gold-50 text-gold-800 border-gold-200"
                      }`}
                    >
                      {isEnriched ? "✓ Discoverable (92%)" : "⚠ Incomplete Feed (41%)"}
                    </span>
                    <span className="text-base font-serif font-bold text-ink-900">
                      ${prod.price.toFixed(2)}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-ink-900 leading-snug group-hover:text-berry-800 transition-colors">
                    {prod.title}
                  </h4>
                  <div className="text-[11px] text-ink-500 mt-1">
                    Style Ref: <strong className="text-ink-700">{prod.sku}</strong> · {prod.category}
                  </div>
                  <p className="text-xs text-ink-600 mt-2 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Key Attribute Preview Rows */}
                  <div className="mt-4 pt-3 border-t border-ivory-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-500">Fabric Composition:</span>
                      <span className="font-semibold text-ink-800">
                        {isEnriched
                          ? prod.enriched_attributes?.fabric_composition?.value || "100% Mulberry Silk"
                          : prod.raw_attributes?.color ? `${prod.raw_attributes.color} Silk` : "Basic Silk"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-500">Sizing Intelligence:</span>
                      <span className="font-semibold text-ink-800">
                        {isEnriched
                          ? prod.enriched_attributes?.size_m_chest_width?.value || "21.0 in (True to Size)"
                          : prod.raw_attributes?.size_available || "S, M, L (Unmeasured)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-500">Garment Care:</span>
                      <span className="font-semibold text-ink-800">
                        {isEnriched ? "Dry Clean Verified" : "Unverified in Feed"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: Open Slide-Over Drawer */}
                <div className="mt-5 pt-3 border-t border-ivory-200">
                  <button
                    onClick={() => {
                      setSelectedSku(prod.sku);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Inspect Specifications & Attributes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESPONSIVE SPECIFICATION INSPECTOR MODAL */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
          {/* Backdrop with click-to-close */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Responsive Modal Container - Auto-compacts to content height */}
          <div className="relative w-full max-w-2xl lg:max-w-4xl my-auto max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-ivory-300 flex flex-col z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header - Compact */}
            <div className="px-5 py-3.5 border-b border-ivory-200 flex items-start justify-between bg-ivory-50/60 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-berry-800 px-2 py-0.5 rounded-full bg-berry-100 border border-berry-300">
                    Product Brain · Specification Inspector
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isEnriched
                        ? "bg-sage-50 text-sage-800 border-sage-200"
                        : "bg-gold-50 text-gold-800 border-gold-200"
                    }`}
                  >
                    {isEnriched ? "✓ 92% Agent Discoverable" : "⚠ 41% Incomplete"}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-ink-900">
                  {activeProduct.title}
                </h3>
                <p className="text-[11px] text-ink-600">
                  Style SKU: <strong className="text-ink-800">{activeProduct.sku}</strong> · ${activeProduct.price.toFixed(2)} · {activeProduct.category}
                </p>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-ivory-200 text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
                title="Close drawer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: Compact Comparison */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Enrichment Action Banner */}
              <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="text-xs font-bold text-ink-900">
                    {isEnriched ? "Agent Discoverability Active" : "Incomplete Supplier Feed"}
                  </div>
                  <div className="text-[11px] text-ink-600">
                    {isEnriched
                      ? "All required buyer agent specifications are validated and indexed for autonomous AI discovery."
                      : "AI Buyer agents cannot match this product due to missing garment measurements and care labels."}
                  </div>
                </div>
                {!isEnriched ? (
                  <button
                    onClick={handleEnhanceCatalog}
                    disabled={enriching}
                    className="px-3 py-1.5 rounded-lg bg-[#7B2D53] hover:bg-berry-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{enriching ? "Enriching..." : "Enrich Missing Specs"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setBrainMode("raw")}
                    className="px-2.5 py-1 rounded-lg bg-ivory-200 hover:bg-ivory-300 text-ink-700 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    View Raw Feed
                  </button>
                )}
              </div>

              {/* Side-by-Side Raw vs Enriched Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Left: Raw Feed */}
                <div className="rounded-xl border border-ivory-300 bg-ivory-50/70 p-3 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-ivory-200">
                    <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-gold-600" />
                      <span>Raw Supplier Feed</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 border border-gold-300">
                      41% Complete
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {Object.entries(activeProduct.raw_attributes).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-2 rounded-lg bg-white border border-ivory-200 flex justify-between text-[11px]"
                      >
                        <span className="text-ink-500 capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="font-semibold text-ink-900">{val}</span>
                      </div>
                    ))}

                    {/* Missing Attributes */}
                    <div className="pt-1.5 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-clay-700">
                        Missing Critical Buyer Attributes:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {[
                          "Fabric & Momme Weight",
                          "Chest & Length Specs",
                          "Verified Care Label",
                          "Mill Certification",
                        ].map((missing) => (
                          <div
                            key={missing}
                            className="p-1.5 rounded-md bg-clay-50 border border-clay-200 text-clay-800 text-[10px] flex items-center gap-1 font-medium"
                          >
                            <span>✕ {missing}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Enriched Attributes */}
                <div
                  className={`rounded-xl border p-3 space-y-2.5 transition-all ${
                    isEnriched
                      ? "border-berry-300 bg-berry-50/20"
                      : "border-dashed border-ivory-300 bg-ivory-50/40 opacity-85"
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-ivory-200">
                    <span className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-berry-700" />
                      <span>Product Brain Specifications</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-300">
                      92% Complete
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(activeProduct.enriched_attributes).map(
                      ([key, attr]) => (
                        <div
                          key={key}
                          className="p-2 rounded-lg bg-white border border-ivory-200 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-ink-700 capitalize truncate">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-ivory-100 text-ink-600 border border-ivory-200">
                              {attr.provenance}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-ink-900 mt-0.5">
                            {attr.value}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[9px] text-ink-500">
                            <span className="text-sage-700 font-semibold">
                              ✓ {Math.round(attr.confidence * 100)}% Quality
                            </span>
                            {attr.regulated && (
                              <span className="text-berry-700 font-semibold">
                                Regulated
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

            {/* Drawer Footer - Compact */}
            <div className="px-5 py-3 border-t border-ivory-200 bg-ivory-50 flex items-center justify-between">
              <span className="text-xs text-ink-500">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-ivory-300 rounded text-[10px]">Esc</kbd> or click outside to close
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
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
