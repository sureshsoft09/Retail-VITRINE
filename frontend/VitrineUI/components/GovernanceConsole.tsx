import React, { useState, useEffect } from "react";
import {
  Sliders,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  DollarSign,
  Percent,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Award,
  Lock,
  X,
  ArrowRight,
} from "lucide-react";
import { api } from "../api";
import { useVitrineStore } from "../store";

interface GovernanceConsoleProps {
  onSwitchToSentinel?: () => void;
}

export const GovernanceConsole: React.FC<GovernanceConsoleProps> = ({
  onSwitchToSentinel,
}) => {
  const {
    killSwitchActive,
    setKillSwitchActive,
    maxOrderUSD,
    discountCapPct,
    marginFloorPct,
    setMaxOrderUSD,
    setDiscountCapPct,
    setMarginFloorPct,
    setPolicySliders,
  } = useVitrineStore();

  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSaveCommercialRules = async () => {
    setSaving(true);
    try {
      await api.updatePolicies({
        max_order_usd: maxOrderUSD,
        max_discount_pct: discountCapPct,
        margin_floor_pct: marginFloorPct,
        kill_switch_active: killSwitchActive,
      });
    } catch {
      // local store already updated
    } finally {
      setTimeout(() => {
        setSaving(false);
        setSavedBanner(
          `Autonomy Governance Updated: Max Autonomous Order $${maxOrderUSD} · Discount Cap ${discountCapPct}% · Minimum Margin Floor ${marginFloorPct}%`
        );
      }, 250);
    }
  };

  const handleToggleEmergencyPause = async () => {
    const nextState = !killSwitchActive;
    setKillSwitchActive(nextState);
    try {
      await api.toggleKillSwitch(nextState);
    } catch {
      // local store updated
    }
    setSavedBanner(
      nextState
        ? "Autonomous Commerce Paused: All incoming AI Buyer Agent and customer orders now require manual executive sign-off."
        : "Autonomous Commerce Resumed: Orders passing all 11 Commitment Critic gates will be committed autonomously."
    );
  };

  const applyPreset = (
    name: string,
    vals: { maxOrderUSD: number; discountCapPct: number; marginFloorPct: number }
  ) => {
    setPolicySliders(vals);
    setSavedBanner(`Applied "${name}" Autonomy Governance Preset.`);
  };

  // Preview impact on a sample $134 order
  const sampleVipDiscount = Math.min(10, discountCapPct);
  const sampleVipPrice = Number(
    (134 * (1 - sampleVipDiscount / 100)).toFixed(2)
  );
  const sampleVipMargin = 58.1;
  const vipOrderPasses =
    !killSwitchActive &&
    sampleVipPrice <= maxOrderUSD &&
    sampleVipMargin >= marginFloorPct;

  const bulkOrderPasses =
    !killSwitchActive &&
    332.8 <= maxOrderUSD &&
    35 <= discountCapPct &&
    9.2 >= marginFloorPct;

  return (
    <div className="space-y-7">
      {/* TOP HEADER: TRUST & GOVERNANCE — AUTONOMOUS COMMERCE GOVERNANCE */}
      <div className="bg-white border border-ivory-300 rounded-2xl p-6 shadow-enterprise-md space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ivory-200 pb-5">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold-50 text-gold-800 border border-gold-200">
                Trust & Governance · Autonomy Policy Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sage-50 text-sage-800 border border-sage-200">
                Commitment Critic Guardrails
              </span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-ink-900 mt-1.5">
              Autonomous Commerce Governance: How Much Autonomy Should Commerce Have?
            </h2>
            <p className="text-xs text-ink-600 mt-1 max-w-3xl">
              Commercial directors define the exact guardrails for autonomous AI Buyer Agent negotiations and instant order commitments—controlling maximum discount authority, net profit margin floors, autonomous order value caps, and emergency circuit breakers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onSwitchToSentinel && (
              <button
                onClick={onSwitchToSentinel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-clay-50 hover:bg-clay-100 text-clay-800 border border-clay-200 text-xs font-bold transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Buyer Agent Trust Sentinel</span>
              </button>
            )}
            <button
              onClick={() =>
                applyPreset("Standard Luxury Retail", {
                  maxOrderUSD: 250,
                  discountCapPct: 15,
                  marginFloorPct: 18,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-ink-800 border border-ivory-300 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default Rules</span>
            </button>

            <button
              onClick={handleSaveCommercialRules}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4D38] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Rules..." : "Save Commercial Rules"}</span>
            </button>
          </div>
        </div>

        {/* THE 5 REQUIRED COMMERCIAL RULES PILLARS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              1. Discount Limits
            </div>
            <div className="text-lg font-serif font-bold text-ink-900 mt-1">
              Up to {discountCapPct}% Off
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Max promotional discount
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              2. Approval Thresholds
            </div>
            <div className="text-lg font-serif font-bold text-ink-900 mt-1">
              ${maxOrderUSD} Auto-Limit
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Larger orders go to manager
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              3. Margin Protection
            </div>
            <div className="text-lg font-serif font-bold text-sage-700 mt-1">
              {marginFloorPct}% Min Floor
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Net profit after shipping
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              4. Order Value Policies
            </div>
            <div className="text-lg font-serif font-bold text-ink-900 mt-1">
              Tiered Sign-Off
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Retail vs. wholesale rules
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              5. Emergency Controls
            </div>
            <div
              className={`text-lg font-serif font-bold mt-1 ${
                killSwitchActive ? "text-clay-700" : "text-sage-700"
              }`}
            >
              {killSwitchActive ? "Approvals Paused" : "Auto-Active"}
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Instant manual hold switch
            </div>
          </div>
        </div>

        {savedBanner && (
          <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
              <span>{savedBanner}</span>
            </div>
            <button
              onClick={() => setSavedBanner(null)}
              className="text-xs underline text-sage-700"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: COMMERCIAL POLICY MATRIX & EMERGENCY CONTROLS (FULL-WIDTH + SLIDE-OVER DRAWER) */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-800 px-2.5 py-0.5 rounded-full bg-gold-50 border border-gold-200">
                Live Guardrail Engine · Autonomy Bounds
              </span>
              <span className="text-xs font-semibold text-ink-500">
                3 Autonomous Policies Enforced
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-ink-900 mt-1">
              Commercial Guardrails & Policy Matrix
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Full-width commercial policy controls. Review real-time limits, emergency kill-switches, and open the slide-over console to adjust parameters.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4D38] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Guardrails & Test Simulation</span>
            </button>
          </div>
        </div>

        {/* Full-Width 3-Column Policy Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Promotional Discount Limit */}
          <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between hover:shadow-enterprise-md hover:border-ivory-400 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-berry-50 border border-berry-200 flex items-center justify-center text-berry-700">
                  <Percent className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-berry-50 text-berry-800 border border-berry-200">
                  Active Guardrail
                </span>
              </div>

              <div className="text-[10px] uppercase font-bold tracking-wider text-ink-500">
                1. Discount Ceiling
              </div>
              <h4 className="font-serif font-bold text-2xl text-ink-900 mt-0.5 group-hover:text-berry-800 transition-colors">
                {discountCapPct}% Max Markdown
              </h4>
              <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                Maximum promotional allowance AI buyer agents and cart coupons can receive without human commercial approval.
              </p>

              <div className="mt-4 pt-3 border-t border-ivory-200/80 flex items-center justify-between text-[11px] text-ink-500">
                <span>Range: 0% - 40%</span>
                <span className="font-semibold text-ink-700">Recommended: 15%</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-ivory-200">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Adjust Discount Limit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Profit Margin Floor */}
          <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between hover:shadow-enterprise-md hover:border-ivory-400 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-center text-sage-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-800 border border-sage-200">
                  Strict Margin Floor
                </span>
              </div>

              <div className="text-[10px] uppercase font-bold tracking-wider text-ink-500">
                2. Profit Protection
              </div>
              <h4 className="font-serif font-bold text-2xl text-sage-700 mt-0.5 group-hover:text-sage-800 transition-colors">
                {marginFloorPct}% Net Profit Floor
              </h4>
              <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                Guaranteed net margin floor after deducting production COGS, promotional discounts, and express fulfillment freight.
              </p>

              <div className="mt-4 pt-3 border-t border-ivory-200/80 flex items-center justify-between text-[11px] text-ink-500">
                <span>Range: 5% - 65%</span>
                <span className="font-semibold text-sage-700">Recommended: 18%</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-ivory-200">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Adjust Margin Floor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Automated Order Approval Threshold */}
          <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between hover:shadow-enterprise-md hover:border-ivory-400 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-800 border border-gold-200">
                  Value Governance
                </span>
              </div>

              <div className="text-[10px] uppercase font-bold tracking-wider text-ink-500">
                3. Order Value Cap
              </div>
              <h4 className="font-serif font-bold text-2xl text-ink-900 mt-0.5 group-hover:text-gold-800 transition-colors">
                ${maxOrderUSD} Auto-Approval Cap
              </h4>
              <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                Orders up to this subtotal auto-clear. Orders exceeding this amount are held for Category Manager review.
              </p>

              <div className="mt-4 pt-3 border-t border-ivory-200/80 flex items-center justify-between text-[11px] text-ink-500">
                <span>Range: $100 - $1,000</span>
                <span className="font-semibold text-ink-700">Recommended: $250</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-ivory-200">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Adjust Value Threshold</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Full-Width Emergency Kill-Switch & Active Policy Status Banner */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-enterprise ${
            killSwitchActive
              ? "bg-clay-50 border-clay-300"
              : "bg-sage-50/60 border-sage-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                killSwitchActive
                  ? "bg-clay-100 text-clay-700 border border-clay-300"
                  : "bg-sage-100 text-sage-700 border border-sage-300"
              }`}
            >
              {killSwitchActive ? (
                <PauseCircle className="w-5 h-5" />
              ) : (
                <PlayCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    killSwitchActive
                      ? "bg-clay-200 text-clay-900 border-clay-300"
                      : "bg-sage-200 text-sage-900 border-sage-300"
                  }`}
                >
                  {killSwitchActive ? "Emergency Mode Active" : "Autonomous Mode Running"}
                </span>
                <span className="text-xs font-semibold text-ink-700">
                  {killSwitchActive
                    ? "All automated orders paused"
                    : "Orders evaluated against active commercial bounds"}
                </span>
              </div>
              <p className="text-xs text-ink-600 mt-1">
                {killSwitchActive
                  ? "Every incoming customer order is held in quarantine for manual release."
                  : "Autonomous agent transactions proceed automatically when within discount, margin, and value limits."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleToggleEmergencyPause}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                killSwitchActive
                  ? "bg-sage-600 hover:bg-sage-700 text-white"
                  : "bg-clay-600 hover:bg-clay-700 text-white"
              }`}
            >
              {killSwitchActive ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume Approvals</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Pause All Approvals</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-ivory-100 text-ink-800 border border-ivory-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulate Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* RESPONSIVE GOVERNANCE CONSOLE & LIVE SIMULATOR MODAL */}
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-800 px-2 py-0.5 rounded-full bg-gold-100 border border-gold-300">
                    Governance Console · Parameter Tuning
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      killSwitchActive
                        ? "bg-clay-100 text-clay-800 border-clay-300"
                        : "bg-sage-100 text-sage-800 border-sage-300"
                    }`}
                  >
                    {killSwitchActive ? "Emergency Hold" : "Auto-Approvals Active"}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-ink-900">
                  Adjust Commercial Policy Rules
                </h3>
                <p className="text-[11px] text-ink-600">
                  Set markdown ceilings, net margin floors, and auto-approval caps. Test results live on orders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Presets in header */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() =>
                      applyPreset("Standard Luxury Retail", {
                        maxOrderUSD: 250,
                        discountCapPct: 15,
                        marginFloorPct: 18,
                      })
                    }
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-ivory-200 text-ink-800 border border-ivory-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Standard
                  </button>
                  <button
                    onClick={() =>
                      applyPreset("VIP Private Sale", {
                        maxOrderUSD: 500,
                        discountCapPct: 25,
                        marginFloorPct: 14,
                      })
                    }
                    className="px-2 py-0.5 rounded-md bg-berry-50 hover:bg-berry-100 text-berry-800 border border-berry-200 text-[10px] font-semibold cursor-pointer"
                  >
                    VIP Sale
                  </button>
                  <button
                    onClick={() =>
                      applyPreset("Strict Margin Protection", {
                        maxOrderUSD: 175,
                        discountCapPct: 5,
                        marginFloorPct: 28,
                      })
                    }
                    className="px-2 py-0.5 rounded-md bg-sage-50 hover:bg-sage-100 text-sage-800 border border-sage-200 text-[10px] font-semibold cursor-pointer"
                  >
                    Strict Margin
                  </button>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-ivory-200 text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
                  title="Close drawer (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body: Compact Sliders & Live Simulation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* 3 Sliders in a 3-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. Promotional Discount Limit Slider */}
                <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-berry-700" />
                      <span className="font-bold text-ink-900 text-[11px]">1. Discount Cap</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-ivory-300 font-bold text-xs text-ink-900">
                      {discountCapPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={1}
                    value={discountCapPct}
                    onChange={(e) => setDiscountCapPct(Number(e.target.value))}
                    className="w-full accent-[#2D6A4F]"
                  />
                  <div className="flex justify-between text-[9px] text-ink-500">
                    <span>0% (None)</span>
                    <span>Cap: 40%</span>
                  </div>
                </div>

                {/* 2. Minimum Profit Margin Floor Slider */}
                <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-sage-700" />
                      <span className="font-bold text-ink-900 text-[11px]">2. Margin Floor</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-ivory-300 font-bold text-xs text-sage-700">
                      {marginFloorPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={65}
                    step={1}
                    value={marginFloorPct}
                    onChange={(e) => setMarginFloorPct(Number(e.target.value))}
                    className="w-full accent-[#2D6A4F]"
                  />
                  <div className="flex justify-between text-[9px] text-ink-500">
                    <span>5% (Low)</span>
                    <span>Max: 65%</span>
                  </div>
                </div>

                {/* 3. Automated Order Approval Threshold Slider */}
                <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-gold-700" />
                      <span className="font-bold text-ink-900 text-[11px]">3. Auto Cap</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-ivory-300 font-bold text-xs text-ink-900">
                      ${maxOrderUSD}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={25}
                    value={maxOrderUSD}
                    onChange={(e) => setMaxOrderUSD(Number(e.target.value))}
                    className="w-full accent-[#2D6A4F]"
                  />
                  <div className="flex justify-between text-[9px] text-ink-500">
                    <span>$100</span>
                    <span>Cap: $1,000</span>
                  </div>
                </div>
              </div>

              {/* Live Order Simulation in 2-Column Grid */}
              <div className="p-3.5 rounded-xl bg-white border-2 border-sage-200 shadow-enterprise space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-ivory-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800">
                    Live Policy Outcome Simulation
                  </span>
                  <span className="text-[10px] text-ink-500">Auto-evaluates against sliders above</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-ink-900 text-[11px]">
                        Scenario A: VIP Single Item (${sampleVipPrice.toFixed(2)})
                      </div>
                      <div className="text-[10px] text-ink-600 mt-0.5">
                        1x Silk Shirt · {sampleVipDiscount}% Off · 58.1% Margin
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        vipOrderPasses
                          ? "bg-sage-100 text-sage-800 border-sage-300"
                          : "bg-clay-100 text-clay-800 border-clay-300"
                      }`}
                    >
                      {vipOrderPasses ? "✓ Auto-Approved" : "⛔ Review"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-ink-900 text-[11px]">
                        Scenario B: Bulk Order Request ($332.80)
                      </div>
                      <div className="text-[10px] text-ink-600 mt-0.5">
                        4x Silk Blouses · 35% Off · 9.2% Margin
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        bulkOrderPasses
                          ? "bg-sage-100 text-sage-800 border-sage-300"
                          : "bg-clay-100 text-clay-800 border-clay-300"
                      }`}
                    >
                      {bulkOrderPasses ? "✓ Auto-Approved" : "⛔ Floor Block"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer with Save and Done - Compact */}
            <div className="px-5 py-3 border-t border-ivory-200 bg-ivory-50 flex items-center justify-between">
              <span className="text-xs text-ink-500">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-ivory-300 rounded text-[10px]">Esc</kbd> or click outside to close
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCommercialRules}
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save Guardrails"}</span>
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ORDER VALUE & APPROVAL AUTHORITY POLICIES */}
      <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-enterprise">
        <div className="mb-4">
          <h3 className="font-serif font-bold text-lg text-ink-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gold-700" />
            <span>Order Value & Commercial Approval Policies</span>
          </h3>
          <p className="text-xs text-ink-600 mt-0.5">
            Clear accountability across automated approvals, category manager reviews, and executive sign-off.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ivory-300 text-ink-500 uppercase text-[10px] tracking-wider bg-ivory-50">
                <th className="py-3 px-4">Order Tier</th>
                <th className="py-3 px-4">Order Value Range</th>
                <th className="py-3 px-4">Allowed Discount</th>
                <th className="py-3 px-4">Required Profit Margin</th>
                <th className="py-3 px-4 text-right">Approval Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-ink-800">
              <tr className="hover:bg-ivory-50">
                <td className="py-3 px-4 font-bold text-ink-900">
                  Tier 1 · Standard & VIP Retail Orders
                </td>
                <td className="py-3 px-4">Up to ${maxOrderUSD}.00</td>
                <td className="py-3 px-4">Up to {discountCapPct}% Off</td>
                <td className="py-3 px-4 font-semibold text-sage-700">
                  At least {marginFloorPct}% Net Margin
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-800 border border-sage-200 font-semibold text-[11px]">
                    Automated Store Approval
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-ivory-50">
                <td className="py-3 px-4 font-bold text-ink-900">
                  Tier 2 · Multi-Item & Personal Stylist Orders
                </td>
                <td className="py-3 px-4">${maxOrderUSD + 1} – $1,000.00</td>
                <td className="py-3 px-4">Up to 20% Off</td>
                <td className="py-3 px-4 font-semibold text-gold-800">
                  At least 15% Net Margin
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-800 border border-gold-200 font-semibold text-[11px]">
                    Commercial Manager Sign-Off
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-ivory-50">
                <td className="py-3 px-4 font-bold text-ink-900">
                  Tier 3 · Wholesale & Trade Accounts
                </td>
                <td className="py-3 px-4">Over $1,000.00</td>
                <td className="py-3 px-4">Custom Contract Pricing</td>
                <td className="py-3 px-4 font-semibold text-berry-800">
                  Contracted Margin Floor
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-berry-50 text-berry-800 border border-berry-200 font-semibold text-[11px]">
                    Commerce Director Approval
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
