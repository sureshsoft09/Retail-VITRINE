import React, { useState, useEffect } from "react";
import {
  Truck,
  PackageCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  Award,
  RefreshCw,
  MapPin,
  Boxes,
  TrendingUp,
  X,
  ArrowRight,
} from "lucide-react";
import { useVitrineStore } from "../store";

interface HubRecord {
  id: string;
  name: string;
  location: string;
  onHand: number;
  allocated: number;
  safetyReserve: number;
  availableToShip: number;
  carrier: string;
  transitHours: number;
  cutoffTime: string;
  deliveryConfidence: string;
  shippingCost: number;
  readinessStatus: "READY" | "PROTECTED_HOLD" | "STANDARD_ONLY";
  statusLabel: string;
  summary: string;
}

const FULFILLMENT_HUBS: HubRecord[] = [
  {
    id: "DC-NORTH",
    name: "Northern Distribution Center (DC-NORTH)",
    location: "Portland / Pacific Northwest Logistics Hub",
    onHand: 14,
    allocated: 2,
    safetyReserve: 3,
    availableToShip: 9,
    carrier: "FedEx Priority Overnight",
    transitHours: 18,
    cutoffTime: "6:00 PM Local Dispatch",
    deliveryConfidence: "99.6%",
    shippingCost: 14.0,
    readinessStatus: "READY",
    statusLabel: "Primary Overnight Hub · Ready to Ship",
    summary:
      "9 units available for immediate dispatch after protecting the 3-unit warehouse safety reserve. Meets Tomorrow 4:00 PM delivery with 4 hours to spare.",
  },
  {
    id: "STORE-042",
    name: "Flagship Retail Boutique (STORE-042)",
    location: "Downtown Seattle Flagship Store",
    onHand: 4,
    allocated: 2,
    safetyReserve: 2,
    availableToShip: 0,
    carrier: "Same-Day Local Courier",
    transitHours: 6,
    cutoffTime: "3:00 PM Store Pickup",
    deliveryConfidence: "Hold",
    shippingCost: 18.0,
    readinessStatus: "PROTECTED_HOLD",
    statusLabel: "Safety Reserve Protected · Do Not Ship",
    summary:
      "All 2 remaining unallocated units are locked in the boutique's walk-in safety stock reserve. Online orders are automatically routed to DC-NORTH to prevent an in-store stockout.",
  },
  {
    id: "DC-SOUTH",
    name: "Southern Regional Hub (DC-SOUTH)",
    location: "Dallas / Central Distribution Center",
    onHand: 22,
    allocated: 3,
    safetyReserve: 5,
    availableToShip: 14,
    carrier: "UPS 2-Day Air Saver",
    transitHours: 26,
    cutoffTime: "7:00 PM Central Dispatch",
    deliveryConfidence: "98.9%",
    shippingCost: 11.5,
    readinessStatus: "STANDARD_ONLY",
    statusLabel: "2-Day Delivery Ready (26h Transit)",
    summary:
      "14 units available to ship with strong inventory depth. Ideal for 2-day standard orders, but 26-hour transit exceeds overnight 22-hour customer deadlines.",
  },
];

const SUPPLIER_SCORECARD = [
  {
    supplier: "Tessitura Serica Como (#14)",
    region: "Como, Italy",
    category: "100% Grade-6A Mulberry Silk",
    reliability: "99.2%",
    qualityPassRate: "99.8%",
    nextReplenishment: "+45 Units Arriving Thursday",
    status: "Preferred Mill",
  },
  {
    supplier: "Normandy Flax & Silk Ateliers",
    region: "Lyon, France",
    category: "French Linen-Silk Blends",
    reliability: "98.7%",
    qualityPassRate: "99.5%",
    nextReplenishment: "+60 Units In Transit (Cleared Customs)",
    status: "On Schedule",
  },
  {
    supplier: "Pacific Luxury Garment Finishing",
    region: "Seattle, WA",
    category: "Quality Inspection & Steam Pressing",
    reliability: "99.5%",
    qualityPassRate: "100.0%",
    nextReplenishment: "Daily Hub Transfer Active",
    status: "Verified Partner",
  },
];

export const PromiseInspector: React.FC = () => {
  const { discountCapPct, marginFloorPct, maxOrderUSD } = useVitrineStore();

  const [selectedHubId, setSelectedHubId] = useState<string>("DC-NORTH");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [orderQty, setOrderQty] = useState<number>(1);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(10);
  const [deadlineHours, setDeadlineHours] = useState<number>(22);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedHub =
    FULFILLMENT_HUBS.find((h) => h.id === selectedHubId) || FULFILLMENT_HUBS[0];

  const listPrice = 134.0;
  const unitCogs = 36.0;
  const discountedUnitPrice = Number(
    (listPrice * (1 - appliedDiscount / 100)).toFixed(2)
  );
  const orderSubtotal = Number((discountedUnitPrice * orderQty).toFixed(2));
  const totalCogs = unitCogs * orderQty;
  const shippingCost = selectedHub.shippingCost;
  const netProfitUsd = Number(
    (orderSubtotal - totalCogs - shippingCost).toFixed(2)
  );
  const netMarginPct =
    orderSubtotal > 0
      ? Number(((netProfitUsd / orderSubtotal) * 100).toFixed(1))
      : 0;

  const inventoryReady = selectedHub.availableToShip >= orderQty;
  const deliveryReady = selectedHub.transitHours <= deadlineHours;
  const marginHealthy =
    netMarginPct >= marginFloorPct && appliedDiscount <= discountCapPct;
  const orderValueCompliant = orderSubtotal <= maxOrderUSD;
  const canKeepPromise =
    inventoryReady && deliveryReady && marginHealthy && orderValueCompliant;

  return (
    <div className="space-y-7">
      {/* TOP BANNER: PROMISE INTELLIGENCE */}
      <div className="bg-white border border-ivory-300 rounded-2xl p-6 shadow-enterprise-md space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ivory-200 pb-5">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sage-50 text-sage-800 border border-sage-200">
                Promise Intelligence · Verification Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold-50 text-gold-800 border border-gold-200">
                Commitment Critic Active
              </span>
              <span className="text-xs text-ink-500 font-medium">
                Live ATP Stock, Carrier SLA Confidence, Net Margin & Supplier Reliability
              </span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-ink-900 mt-1.5">
              Promise Verification: Can We Keep Our Autonomous Commitment?
            </h2>
            <p className="text-xs text-ink-600 mt-1 max-w-3xl">
              Before any AI Buyer Agent or customer order receives a binding delivery promise, VITRINE’s Promise Intelligence engine and 11-gate Commitment Critic verify real-time warehouse ATP stock, safety buffers, carrier SLA windows, and net product margin.
            </p>
          </div>

          <div
            className={`px-4 py-3 rounded-xl border flex items-center gap-3 shrink-0 ${
              canKeepPromise
                ? "bg-sage-50 border-sage-300 text-sage-900"
                : "bg-clay-50 border-clay-300 text-clay-900"
            }`}
          >
            {canKeepPromise ? (
              <CheckCircle2 className="w-6 h-6 text-sage-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-clay-600 shrink-0" />
            )}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider">
                Promise Verification Verdict
              </div>
              <div className="text-sm font-serif font-bold">
                {canKeepPromise
                  ? "Yes — Promise Verified & Safe to Commit"
                  : "Hold — Reroute Hub or Adjust Offer"}
              </div>
            </div>
          </div>
        </div>

        {/* THE 5 REQUIRED FULFILLMENT & COMMITMENT PILLARS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                1. Inventory Status
              </span>
              <Boxes className="w-3.5 h-3.5 text-sage-700" />
            </div>
            <div className="text-lg font-serif font-bold text-ink-900 mt-1">
              {selectedHub.availableToShip} Units Ready
            </div>
            <div className="text-[11px] font-medium text-sage-700 mt-0.5 leading-snug">
              +{selectedHub.safetyReserve} Safety Stock Protected
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                2. Fulfillment Readiness
              </span>
              <PackageCheck className="w-3.5 h-3.5 text-sage-700" />
            </div>
            <div
              className={`text-lg font-serif font-bold mt-1 ${
                inventoryReady ? "text-sage-700" : "text-clay-700"
              }`}
            >
              {inventoryReady ? "Ready for Dispatch" : "Reserve Locked"}
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              {selectedHub.cutoffTime}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                3. Delivery Confidence
              </span>
              <Truck className="w-3.5 h-3.5 text-sage-700" />
            </div>
            <div
              className={`text-lg font-serif font-bold mt-1 ${
                deliveryReady ? "text-sage-700" : "text-gold-700"
              }`}
            >
              {selectedHub.deliveryConfidence} ({selectedHub.transitHours}h)
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              {selectedHub.carrier}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                4. Margin Health
              </span>
              <DollarSign className="w-3.5 h-3.5 text-sage-700" />
            </div>
            <div
              className={`text-lg font-serif font-bold mt-1 ${
                marginHealthy ? "text-sage-700" : "text-clay-700"
              }`}
            >
              {netMarginPct}% Net Margin
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Store Floor: {marginFloorPct}% (${netProfitUsd.toFixed(2)} Profit)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                5. Supplier Reliability
              </span>
              <Award className="w-3.5 h-3.5 text-berry-700" />
            </div>
            <div className="text-lg font-serif font-bold text-ink-900 mt-1">
              99.2% On-Time
            </div>
            <div className="text-[11px] text-berry-700 font-medium mt-0.5 leading-snug">
              Certified Italian & French Mills
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MULTI-HUB INVENTORY & FULFILLMENT NETWORK (FULL-WIDTH DIRECTORY + SLIDE-OVER DRAWER) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800 px-2.5 py-0.5 rounded-full bg-sage-50 border border-sage-200">
                Fulfillment Architecture · Multi-Hub Network
              </span>
              <span className="text-xs font-semibold text-ink-500">
                {FULFILLMENT_HUBS.length} Fulfillment Hubs Active
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-ink-900 mt-1">
              Distribution Hub & Store Inventory Network
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Full-width fulfillment network directory. Inspect stock ATP, safety buffers, transit SLAs, and launch the real-time promise simulator.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4D38] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Launch Promise Simulator</span>
            </button>
          </div>
        </div>

        {/* Full-Width 3-Column Hub Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FULFILLMENT_HUBS.map((hub) => {
            const isReady = hub.readinessStatus === "READY";
            const isProtected = hub.readinessStatus === "PROTECTED_HOLD";

            return (
              <div
                key={hub.id}
                className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between hover:shadow-enterprise-md hover:border-ivory-400 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sage-50 border border-sage-200 flex items-center justify-center text-sage-700">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-base text-ink-900 leading-snug group-hover:text-sage-800 transition-colors">
                          {hub.name}
                        </h4>
                        <div className="text-[10px] text-ink-500">
                          {hub.location} · {hub.id}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isReady
                          ? "bg-sage-50 text-sage-800 border-sage-200"
                          : isProtected
                          ? "bg-clay-50 text-clay-800 border-clay-200"
                          : "bg-gold-50 text-gold-800 border-gold-200"
                      }`}
                    >
                      {hub.statusLabel}
                    </span>
                  </div>

                  <p className="text-xs text-ink-600 mt-2 line-clamp-2 leading-relaxed">
                    {hub.summary}
                  </p>

                  {/* 4 Key Inventory Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-ivory-200/80">
                    <div className="p-2.5 rounded-xl bg-ivory-50 border border-ivory-200">
                      <div className="text-[10px] text-ink-500 uppercase font-semibold">
                        Available to Ship
                      </div>
                      <div className="text-sm font-bold text-sage-700 mt-0.5">
                        {hub.availableToShip} Units
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-ivory-50 border border-ivory-200">
                      <div className="text-[10px] text-ink-500 uppercase font-semibold">
                        Safety Reserve
                      </div>
                      <div className="text-sm font-bold text-ink-900 mt-0.5">
                        {hub.safetyReserve} Protected
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-ivory-50 border border-ivory-200">
                      <div className="text-[10px] text-ink-500 uppercase font-semibold">
                        Transit SLA
                      </div>
                      <div className="text-sm font-bold text-ink-900 mt-0.5">
                        {hub.transitHours} Hours
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-ivory-50 border border-ivory-200">
                      <div className="text-[10px] text-ink-500 uppercase font-semibold">
                        Freight Cost
                      </div>
                      <div className="text-sm font-bold text-ink-900 mt-0.5">
                        ${hub.shippingCost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Cutoff SLA indicator */}
                  <div className="mt-3.5 p-2 rounded-lg bg-sage-50/50 border border-sage-200 text-sage-900 text-[11px] flex items-center justify-between">
                    <span className="font-medium">Order Cutoff: {hub.cutoffTime}</span>
                    <span className="font-semibold text-sage-800">{hub.carrier}</span>
                  </div>
                </div>

                {/* Action Button: Open Slide-Over Drawer */}
                <div className="mt-5 pt-3 border-t border-ivory-200">
                  <button
                    onClick={() => {
                      setSelectedHubId(hub.id);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Configure & Test Hub Fulfillment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESPONSIVE HUB INSPECTION & PROMISE SIMULATOR MODAL */}
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800 px-2 py-0.5 rounded-full bg-sage-100 border border-sage-300">
                    Promise Intelligence · Hub Inspector & Simulator
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      canKeepPromise
                        ? "bg-sage-100 text-sage-800 border-sage-300"
                        : "bg-clay-100 text-clay-800 border-clay-300"
                    }`}
                  >
                    {canKeepPromise ? "✓ Promise Pass" : "✕ Promise Blocked"}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-ink-900">
                  {selectedHub.name} ({selectedHub.id})
                </h3>
                <p className="text-[11px] text-ink-600">
                  {selectedHub.location} · ATP: <strong className="text-sage-700">{selectedHub.availableToShip} Units</strong> · Carrier: {selectedHub.carrier} · Cutoff: {selectedHub.cutoffTime}
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

            {/* Drawer Body: Compact Simulation & Hub Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Highlighted Interactive Simulation Container */}
              <div className="bg-gradient-to-br from-white via-sage-50/30 to-white rounded-xl border-2 border-sage-300 p-3.5 shadow-enterprise space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-ivory-200/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800">
                      Live Customer Order Simulation · {selectedHub.id}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-ink-900 mt-0.5">
                      Simulate Quantity, Promotional Discount & Deadlines
                    </h4>
                  </div>

                  {/* Quick Scenario Preset Chips */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {[
                      { label: "Overnight Express", qty: 1, discount: 10, hours: 22, hub: "DC-NORTH" },
                      { label: "Wholesale (4 Units)", qty: 4, discount: 15, hours: 26, hub: "DC-SOUTH" },
                      { label: "Stress Test", qty: 8, discount: 25, hours: 16, hub: "DC-NORTH" },
                    ].map((sc) => (
                      <button
                        key={sc.label}
                        onClick={() => {
                          setSelectedHubId(sc.hub);
                          setOrderQty(sc.qty);
                          setAppliedDiscount(sc.discount);
                          setDeadlineHours(sc.hours);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          orderQty === sc.qty && appliedDiscount === sc.discount
                            ? "bg-sage-100 text-sage-900 border-sage-300 font-bold"
                            : "bg-white hover:bg-ivory-100 text-ink-700 border-ivory-300"
                        }`}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulator Sliders in 3-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-ivory-200">
                    <div className="flex justify-between font-semibold text-ink-800 mb-1">
                      <span className="text-[11px]">Quantity</span>
                      <span className="font-bold text-ink-900">{orderQty} Unit(s)</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={orderQty}
                      onChange={(e) => setOrderQty(Number(e.target.value))}
                      className="w-full accent-[#2D6A4F]"
                    />
                    <div className="flex justify-between text-[9px] text-ink-500 mt-0.5">
                      <span>1</span>
                      <span>ATP: {selectedHub.availableToShip}</span>
                      <span>12</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-ivory-200">
                    <div className="flex justify-between font-semibold text-ink-800 mb-1">
                      <span className="text-[11px]">Discount</span>
                      <span className="font-bold text-ink-900">{appliedDiscount}% Off</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={appliedDiscount}
                      onChange={(e) => setAppliedDiscount(Number(e.target.value))}
                      className="w-full accent-[#2D6A4F]"
                    />
                    <div className="flex justify-between text-[9px] text-ink-500 mt-0.5">
                      <span>0%</span>
                      <span>Cap: {discountCapPct}%</span>
                      <span>40%</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-ivory-200">
                    <div className="flex justify-between font-semibold text-ink-800 mb-1">
                      <span className="text-[11px]">Window</span>
                      <span className="font-bold text-ink-900">{deadlineHours} Hours</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={48}
                      step={2}
                      value={deadlineHours}
                      onChange={(e) => setDeadlineHours(Number(e.target.value))}
                      className="w-full accent-[#2D6A4F]"
                    />
                    <div className="flex justify-between text-[9px] text-ink-500 mt-0.5">
                      <span>12h</span>
                      <span>Transit: {selectedHub.transitHours}h</span>
                      <span>48h</span>
                    </div>
                  </div>
                </div>

                {/* 4 Real-Time Gate Checks in 2x2 Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-ivory-200">
                    <span className="font-semibold text-ink-800 text-[11px]">
                      1. Stock Coverage ({selectedHub.id})
                    </span>
                    <span
                      className={`font-bold text-[11px] ${
                        inventoryReady ? "text-sage-700" : "text-clay-700"
                      }`}
                    >
                      {inventoryReady
                        ? `✓ Ready (${selectedHub.availableToShip} vs ${orderQty})`
                        : `✕ Shortfall`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-ivory-200">
                    <span className="font-semibold text-ink-800 text-[11px]">
                      2. Carrier Schedule ({selectedHub.carrier})
                    </span>
                    <span
                      className={`font-bold text-[11px] ${
                        deliveryReady ? "text-sage-700" : "text-clay-700"
                      }`}
                    >
                      {deliveryReady
                        ? `✓ ${selectedHub.transitHours}h ≤ ${deadlineHours}h`
                        : `✕ ${selectedHub.transitHours}h > ${deadlineHours}h`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-ivory-200">
                    <span className="font-semibold text-ink-800 text-[11px]">
                      3. Margin & Discount Floor
                    </span>
                    <span
                      className={`font-bold text-[11px] ${
                        marginHealthy ? "text-sage-700" : "text-clay-700"
                      }`}
                    >
                      {marginHealthy
                        ? `✓ ${netMarginPct}% Net ($${netProfitUsd.toFixed(2)})`
                        : `✕ Below Floor`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-ivory-200">
                    <span className="font-semibold text-ink-800 text-[11px]">
                      4. Order Value Limit (${maxOrderUSD})
                    </span>
                    <span
                      className={`font-bold text-[11px] ${
                        orderValueCompliant ? "text-sage-700" : "text-clay-700"
                      }`}
                    >
                      {orderValueCompliant
                        ? `✓ $${orderSubtotal.toFixed(2)} Approved`
                        : `✕ Needs Manager Sign-Off`}
                    </span>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => {
                    setSelectedHubId("DC-NORTH");
                    setOrderQty(1);
                    setAppliedDiscount(10);
                    setDeadlineHours(22);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-ivory-100 hover:bg-ivory-200 text-ink-800 border border-ivory-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to Overnight Promise</span>
                </button>
              </div>

              {/* Hub Physical Warehouse Breakdown - Compact */}
              <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink-900 flex items-center gap-1.5 text-[11px]">
                    <Boxes className="w-3.5 h-3.5 text-sage-700" />
                    <span>Physical Warehouse Inventory Breakdown</span>
                  </span>
                  <span className="text-[10px] text-ink-500">
                    Total In Building: {selectedHub.onHand} Units
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="p-2 bg-white rounded-lg border border-ivory-200">
                    <div className="text-[9px] text-ink-500 uppercase">On Hand Total</div>
                    <div className="text-sm font-bold text-ink-900 mt-0.5">{selectedHub.onHand}</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-ivory-200">
                    <div className="text-[9px] text-ink-500 uppercase">Committed / Picking</div>
                    <div className="text-sm font-bold text-ink-900 mt-0.5">{selectedHub.allocated}</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-ivory-200">
                    <div className="text-[9px] text-ink-500 uppercase">Walk-in Buffer</div>
                    <div className="text-sm font-bold text-ink-900 mt-0.5">{selectedHub.safetyReserve}</div>
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

      {/* SECTION 3: SUPPLIER & MILL RELIABILITY SCORECARD */}
      <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-enterprise">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-ink-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sage-700" />
              <span>Supplier & Mill Reliability Scorecard</span>
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Inbound replenishment reliability and quality inspection pass rates backing our inventory commitments.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sage-50 text-sage-800 border border-sage-200">
            99.1% Network Supplier Reliability
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ivory-300 text-ink-500 uppercase text-[10px] tracking-wider bg-ivory-50">
                <th className="py-3 px-4">Supplier / Mill Partner</th>
                <th className="py-3 px-4">Origin</th>
                <th className="py-3 px-4">Merchandise Category</th>
                <th className="py-3 px-4">On-Time Reliability</th>
                <th className="py-3 px-4">Quality Pass Rate</th>
                <th className="py-3 px-4">Inbound Replenishment</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-ink-800">
              {SUPPLIER_SCORECARD.map((s) => (
                <tr key={s.supplier} className="hover:bg-ivory-50">
                  <td className="py-3 px-4 font-semibold text-ink-900">
                    {s.supplier}
                  </td>
                  <td className="py-3 px-4">{s.region}</td>
                  <td className="py-3 px-4">{s.category}</td>
                  <td className="py-3 px-4 font-bold text-sage-700">
                    {s.reliability}
                  </td>
                  <td className="py-3 px-4 font-semibold">{s.qualityPassRate}</td>
                  <td className="py-3 px-4 text-ink-600">
                    {s.nextReplenishment}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-800 border border-sage-200 font-semibold text-[11px]">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
