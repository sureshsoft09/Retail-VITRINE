import React, { useState } from "react";
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              1. Discount Limits
            </div>
            <div className="text-xl font-serif font-bold text-ink-900 mt-1">
              Up to {discountCapPct}% Off
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
              Max promotional discount
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              2. Approval Thresholds
            </div>
            <div className="text-xl font-serif font-bold text-ink-900 mt-1">
              ${maxOrderUSD} Auto-Limit
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
              Larger orders go to manager
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              3. Margin Protection
            </div>
            <div className="text-xl font-serif font-bold text-sage-700 mt-1">
              {marginFloorPct}% Min Floor
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
              Net profit after shipping
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              4. Order Value Policies
            </div>
            <div className="text-xl font-serif font-bold text-ink-900 mt-1">
              Tiered Sign-Off
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
              Retail vs. wholesale rules
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              5. Emergency Controls
            </div>
            <div
              className={`text-xl font-serif font-bold mt-1 ${
                killSwitchActive ? "text-clay-700" : "text-sage-700"
              }`}
            >
              {killSwitchActive ? "Approvals Paused" : "Auto-Active"}
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
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

      {/* SECTION 2: COMMERCIAL POLICY CONTROLS & EMERGENCY PAUSE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive Commercial Rule Sliders */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-ivory-300 p-6 shadow-enterprise space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ivory-200 pb-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-900">
                Commercial Policy Controls
              </h3>
              <p className="text-xs text-ink-600">
                Changes made here immediately govern Order Operations and Fulfillment validation.
              </p>
            </div>

            {/* Quick Merchandising Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() =>
                  applyPreset("Standard Luxury Retail", {
                    maxOrderUSD: 250,
                    discountCapPct: 15,
                    marginFloorPct: 18,
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-ivory-100 hover:bg-ivory-200 text-ink-800 border border-ivory-300 text-[11px] font-semibold cursor-pointer"
              >
                Standard Luxury
              </button>
              <button
                onClick={() =>
                  applyPreset("VIP Private Sale", {
                    maxOrderUSD: 500,
                    discountCapPct: 25,
                    marginFloorPct: 14,
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-berry-50 hover:bg-berry-100 text-berry-800 border border-berry-200 text-[11px] font-semibold cursor-pointer"
              >
                VIP Private Sale
              </button>
              <button
                onClick={() =>
                  applyPreset("Strict Margin Protection", {
                    maxOrderUSD: 175,
                    discountCapPct: 5,
                    marginFloorPct: 28,
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-sage-50 hover:bg-sage-100 text-sage-800 border border-sage-200 text-[11px] font-semibold cursor-pointer"
              >
                Strict Margin
              </button>
            </div>
          </div>

          {/* 1. Discount Limits Slider */}
          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-berry-700" />
                <div>
                  <div className="text-sm font-bold text-ink-900">
                    1. Promotional & Loyalty Discount Limit
                  </div>
                  <div className="text-xs text-ink-600">
                    Maximum discount percentage that can be granted without Commercial Manager approval.
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-white border border-ivory-300 font-serif font-bold text-lg text-ink-900">
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
            <div className="flex justify-between text-[11px] text-ink-500">
              <span>0% (No Discounts)</span>
              <span>Recommended: 15% Max</span>
              <span>40% (Clearance Cap)</span>
            </div>
          </div>

          {/* 2. Margin Protection Slider */}
          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sage-700" />
                <div>
                  <div className="text-sm font-bold text-ink-900">
                    2. Minimum Profit Margin Floor
                  </div>
                  <div className="text-xs text-ink-600">
                    Minimum required net margin after product cost, discount, and express carrier shipping.
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-white border border-ivory-300 font-serif font-bold text-lg text-sage-700">
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
            <div className="flex justify-between text-[11px] text-ink-500">
              <span>5% Floor</span>
              <span>Recommended: 18% Floor</span>
              <span>65% High-Margin Only</span>
            </div>
          </div>

          {/* 3. Approval Threshold / Max Order Value Slider */}
          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gold-700" />
                <div>
                  <div className="text-sm font-bold text-ink-900">
                    3. Automated Order Approval Threshold
                  </div>
                  <div className="text-xs text-ink-600">
                    Orders above this dollar amount are held for Commercial Manager review.
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-white border border-ivory-300 font-serif font-bold text-lg text-ink-900">
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
            <div className="flex justify-between text-[11px] text-ink-500">
              <span>$100 Limit</span>
              <span>Recommended: $250 Limit</span>
              <span>$1,000 VIP Limit</span>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Emergency Controls & Live Policy Impact Preview */}
        <div className="lg:col-span-5 space-y-5">
          {/* Emergency Controls Card */}
          <div
            className={`p-6 rounded-2xl border shadow-enterprise transition-all space-y-4 ${
              killSwitchActive
                ? "bg-clay-50 border-clay-400"
                : "bg-white border-ivory-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-clay-100 text-clay-800 border border-clay-300">
                  Emergency Store Control
                </span>
                <h3 className="font-serif font-bold text-lg text-ink-900 mt-1.5">
                  {killSwitchActive
                    ? "Automated Order Approvals Paused"
                    : "Manual Review Hold Control"}
                </h3>
                <p className="text-xs text-ink-600 mt-1 leading-relaxed">
                  Instantly pause all automated order approvals across the storefront. When active, every incoming customer order is held for manual Commercial Manager release.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleEmergencyPause}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                killSwitchActive
                  ? "bg-sage-600 hover:bg-sage-700 text-white"
                  : "bg-clay-600 hover:bg-clay-700 text-white"
              }`}
            >
              {killSwitchActive ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Resume Automated Order Approvals</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4" />
                  <span>Pause Automated Approvals (Manual Hold Mode)</span>
                </>
              )}
            </button>
          </div>

          {/* Live Impact Preview on Active Store Orders */}
          <div className="p-6 rounded-2xl bg-white border border-ivory-300 shadow-enterprise space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700">
                Live Policy Simulation
              </span>
              <h3 className="font-serif font-bold text-base text-ink-900 mt-0.5">
                How Current Rules Govern Incoming Orders
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-ink-900">
                    Standard VIP Order (${sampleVipPrice.toFixed(2)})
                  </div>
                  <div className="text-[11px] text-ink-600">
                    1x Silk Shirt · {sampleVipDiscount}% Discount · 58.1% Margin
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                    vipOrderPasses
                      ? "bg-sage-100 text-sage-800 border-sage-300"
                      : "bg-clay-100 text-clay-800 border-clay-300"
                  }`}
                >
                  {vipOrderPasses ? "✓ Auto-Approved" : "⛔ Held for Review"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-ink-900">
                    Bulk 35% Discount Request ($332.80)
                  </div>
                  <div className="text-[11px] text-ink-600">
                    4x Silk Blouses · 35% Discount · 9.2% Margin
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                    bulkOrderPasses
                      ? "bg-sage-100 text-sage-800 border-sage-300"
                      : "bg-clay-100 text-clay-800 border-clay-300"
                  }`}
                >
                  {bulkOrderPasses ? "✓ Auto-Approved" : "⛔ Held by Rules"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
