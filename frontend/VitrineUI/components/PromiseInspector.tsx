import React, { useState } from "react";
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
  const [orderQty, setOrderQty] = useState<number>(1);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(10);
  const [deadlineHours, setDeadlineHours] = useState<number>(22);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                1. Inventory Status
              </span>
              <Boxes className="w-4 h-4 text-sage-700" />
            </div>
            <div className="text-xl font-serif font-bold text-ink-900 mt-2">
              {selectedHub.availableToShip} Units Ready
            </div>
            <div className="text-[11px] font-medium text-sage-700 mt-1">
              +{selectedHub.safetyReserve} Safety Stock Protected
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                2. Fulfillment Readiness
              </span>
              <PackageCheck className="w-4 h-4 text-sage-700" />
            </div>
            <div
              className={`text-xl font-serif font-bold mt-2 ${
                inventoryReady ? "text-sage-700" : "text-clay-700"
              }`}
            >
              {inventoryReady ? "Ready for Dispatch" : "Reserve Locked"}
            </div>
            <div className="text-[11px] text-ink-600 mt-1">
              {selectedHub.cutoffTime}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                3. Delivery Confidence
              </span>
              <Truck className="w-4 h-4 text-sage-700" />
            </div>
            <div
              className={`text-xl font-serif font-bold mt-2 ${
                deliveryReady ? "text-sage-700" : "text-gold-700"
              }`}
            >
              {selectedHub.deliveryConfidence} ({selectedHub.transitHours}h)
            </div>
            <div className="text-[11px] text-ink-600 mt-1">
              {selectedHub.carrier}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                4. Margin Health
              </span>
              <DollarSign className="w-4 h-4 text-sage-700" />
            </div>
            <div
              className={`text-xl font-serif font-bold mt-2 ${
                marginHealthy ? "text-sage-700" : "text-clay-700"
              }`}
            >
              {netMarginPct}% Net Margin
            </div>
            <div className="text-[11px] text-ink-600 mt-1">
              Store Floor: {marginFloorPct}% (${netProfitUsd.toFixed(2)} Profit)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                5. Supplier Reliability
              </span>
              <Award className="w-4 h-4 text-berry-700" />
            </div>
            <div className="text-xl font-serif font-bold text-ink-900 mt-2">
              99.2% On-Time
            </div>
            <div className="text-[11px] text-berry-700 font-medium mt-1">
              Certified Italian & French Mills
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MULTI-HUB INVENTORY & FULFILLMENT NETWORK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Distribution Hub Readiness Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-900">
                Distribution Hub & Store Inventory Network
              </h3>
              <p className="text-xs text-ink-600">
                Select a fulfillment location to inspect stock availability, safety reserves, and delivery schedules.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {FULFILLMENT_HUBS.map((hub) => {
              const isSelected = hub.id === selectedHubId;
              const isReady = hub.readinessStatus === "READY";
              const isProtected = hub.readinessStatus === "PROTECTED_HOLD";

              return (
                <div
                  key={hub.id}
                  onClick={() => setSelectedHubId(hub.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1C1917] text-white border-[#1C1917] shadow-md"
                      : "bg-white hover:bg-ivory-50 text-ink-900 border-ivory-300 shadow-enterprise"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Building2
                        className={`w-4 h-4 ${
                          isSelected ? "text-[#F6C867]" : "text-sage-700"
                        }`}
                      />
                      <span className="font-serif font-bold text-base">
                        {hub.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isSelected
                          ? "bg-white/15 text-white border-white/25"
                          : isReady
                          ? "bg-sage-50 text-sage-800 border-sage-200"
                          : isProtected
                          ? "bg-clay-50 text-clay-800 border-clay-200"
                          : "bg-gold-50 text-gold-800 border-gold-200"
                      }`}
                    >
                      {hub.statusLabel}
                    </span>
                  </div>

                  <p
                    className={`text-xs leading-relaxed ${
                      isSelected ? "text-ivory-200" : "text-ink-600"
                    }`}
                  >
                    {hub.summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-white/10">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isSelected
                          ? "bg-white/[0.06] border-white/10"
                          : "bg-ivory-50 border-ivory-200"
                      }`}
                    >
                      <div
                        className={`text-[10px] ${
                          isSelected ? "text-ivory-300" : "text-ink-500"
                        }`}
                      >
                        Available to Ship
                      </div>
                      <div
                        className={`text-sm font-bold mt-0.5 ${
                          hub.availableToShip > 0
                            ? isSelected
                              ? "text-[#95C9AA]"
                              : "text-sage-700"
                            : "text-clay-500"
                        }`}
                      >
                        {hub.availableToShip} Units
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border ${
                        isSelected
                          ? "bg-white/[0.06] border-white/10"
                          : "bg-ivory-50 border-ivory-200"
                      }`}
                    >
                      <div
                        className={`text-[10px] ${
                          isSelected ? "text-ivory-300" : "text-ink-500"
                        }`}
                      >
                        Safety Reserve
                      </div>
                      <div className="text-sm font-bold mt-0.5">
                        {hub.safetyReserve} Units Protected
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border ${
                        isSelected
                          ? "bg-white/[0.06] border-white/10"
                          : "bg-ivory-50 border-ivory-200"
                      }`}
                    >
                      <div
                        className={`text-[10px] ${
                          isSelected ? "text-ivory-300" : "text-ink-500"
                        }`}
                      >
                        Delivery Transit
                      </div>
                      <div className="text-sm font-bold mt-0.5">
                        {hub.transitHours} Hours
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border ${
                        isSelected
                          ? "bg-white/[0.06] border-white/10"
                          : "bg-ivory-50 border-ivory-200"
                      }`}
                    >
                      <div
                        className={`text-[10px] ${
                          isSelected ? "text-ivory-300" : "text-ink-500"
                        }`}
                      >
                        Shipping Cost
                      </div>
                      <div className="text-sm font-bold mt-0.5">
                        ${hub.shippingCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Interactive Fulfillment & Margin Readiness Check */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-ivory-300 p-6 shadow-enterprise space-y-5">
          <div className="border-b border-ivory-200 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sage-700">
              Interactive Readiness Check
            </span>
            <h3 className="font-serif font-bold text-lg text-ink-900 mt-0.5">
              Test Inventory, Delivery & Margin Impact
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Adjust order quantity, promotional discount, or customer delivery window to see if we can keep our promise.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-ink-800 mb-1">
                <span>Order Quantity Requested</span>
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
              <div className="flex justify-between text-[10px] text-ink-500 mt-0.5">
                <span>1 Unit</span>
                <span>Available at {selectedHub.id}: {selectedHub.availableToShip} Units</span>
                <span>12 Units</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-ink-800 mb-1">
                <span>Promotional Discount Offered</span>
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
              <div className="flex justify-between text-[10px] text-ink-500 mt-0.5">
                <span>0% (Full Price)</span>
                <span>Store Cap: {discountCapPct}%</span>
                <span>40%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-ink-800 mb-1">
                <span>Customer Delivery Window</span>
                <span className="font-bold text-ink-900">Within {deadlineHours} Hours</span>
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
              <div className="flex justify-between text-[10px] text-ink-500 mt-0.5">
                <span>12h Same-Day</span>
                <span>22h Overnight</span>
                <span>48h Two-Day</span>
              </div>
            </div>
          </div>

          {/* 4-Factor Readiness Summary */}
          <div className="space-y-2.5 pt-2 border-t border-ivory-200 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200">
              <span className="font-semibold text-ink-800">
                1. Inventory Coverage ({selectedHub.id})
              </span>
              <span
                className={`font-bold ${
                  inventoryReady ? "text-sage-700" : "text-clay-700"
                }`}
              >
                {inventoryReady
                  ? `✓ ${selectedHub.availableToShip} Ready (Needs ${orderQty})`
                  : `✕ Shortfall (${selectedHub.availableToShip} vs ${orderQty})`}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200">
              <span className="font-semibold text-ink-800">
                2. Delivery Schedule ({selectedHub.carrier})
              </span>
              <span
                className={`font-bold ${
                  deliveryReady ? "text-sage-700" : "text-clay-700"
                }`}
              >
                {deliveryReady
                  ? `✓ ${selectedHub.transitHours}h Transit (Deadline ${deadlineHours}h)`
                  : `✕ ${selectedHub.transitHours}h Exceeds ${deadlineHours}h Window`}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200">
              <span className="font-semibold text-ink-800">
                3. Profit Margin & Discount Rules
              </span>
              <span
                className={`font-bold ${
                  marginHealthy ? "text-sage-700" : "text-clay-700"
                }`}
              >
                {marginHealthy
                  ? `✓ ${netMarginPct}% Margin ($${netProfitUsd.toFixed(2)} Net)`
                  : `✕ Violates Margin/Discount Policy`}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200">
              <span className="font-semibold text-ink-800">
                4. Order Value Limit (Max ${maxOrderUSD})
              </span>
              <span
                className={`font-bold ${
                  orderValueCompliant ? "text-sage-700" : "text-clay-700"
                }`}
              >
                {orderValueCompliant
                  ? `✓ $${orderSubtotal.toFixed(2)} Approved`
                  : `✕ $${orderSubtotal.toFixed(2)} Needs Manager Sign-Off`}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedHubId("DC-NORTH");
              setOrderQty(1);
              setAppliedDiscount(10);
              setDeadlineHours(22);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-ink-800 border border-ivory-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Recommended Overnight Promise</span>
          </button>
        </div>
      </div>

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
