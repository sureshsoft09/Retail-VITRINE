import React, { useState, useEffect } from "react";
import {
  Play,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Truck,
  Sparkles,
  FileCheck2,
  Sliders,
  Send,
  ShoppingBag,
  MapPin,
  Package,
  DollarSign,
  ArrowRight,
  Clock,
  Check,
  Ban,
} from "lucide-react";
import { api } from "../api";
import {
  TransactionResponse,
  GateResult,
  GateCondition,
} from "../types";
import { AgentStepCard } from "./AgentStepCard";
import { GateChecklist } from "./GateChecklist";
import { useVitrineStore } from "../store";

type ScenarioId = "honest" | "bargain" | "hostile";

const SCENARIOS: Record<
  ScenarioId,
  {
    id: ScenarioId;
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    buyerId: string;
    sku: string;
    qty: number;
    requestedDiscount: number;
    pincode: string;
    city: string;
    deadline: string;
    narrative: string;
  }
> = {
  honest: {
    id: "honest",
    title: "VIP Styling AI Buyer Agent (Autonomous Hub Recovery)",
    subtitle: "Primary store low on stock → Routed to DC-NORTH with Critic-verified alternative",
    badge: "Critic Verified",
    badgeColor: "bg-sage-50 text-sage-800 border-sage-300",
    buyerId: "Nordstrom VIP Styling Buyer Agent",
    sku: "SKU-4829-SILK-BLOUSE",
    qty: 1,
    requestedDiscount: 12,
    pincode: "98101",
    city: "Seattle, WA",
    deadline: "Tomorrow by 4:00 PM",
    narrative:
      "An inbound VIP Personal Styling Buyer Agent requests an Ivory Mulberry Silk Blouse (Size M) for overnight delivery to Seattle. Flagship Store #042 only has 2 safety-reserve units left, so VITRINE Agent Commerce autonomously routes fulfillment to Northern Distribution Center (DC-NORTH), matches an approved silk-linen alternative via Product Brain, and passes all 11 Commitment Critic gates at 10% VIP pricing.",
  },
  bargain: {
    id: "bargain",
    title: "Price-Discovery Buyer Agent (Commitment Critic Margin Veto)",
    subtitle: "35% requested discount violates 18% net margin floor — autonomous counter-offer issued",
    badge: "Critic Margin Hold",
    badgeColor: "bg-gold-50 text-gold-800 border-gold-300",
    buyerId: "Boutique Procurement Buyer Agent #204",
    sku: "SKU-4829-SILK-BLOUSE",
    qty: 4,
    requestedDiscount: 35,
    pincode: "98101",
    city: "Seattle, WA",
    deadline: "2-Day Priority",
    narrative:
      "A wholesale procurement Buyer Agent requests 4 Silk Blouses with an aggressive 35% discount ($332.80 total). VITRINE's Commitment Critic verifies that a 35% discount plus express shipping reduces net margin to 9.2%—violating the 18% governance margin floor—vetoes the unsafe commitment, and issues a margin-safe 15% autonomous counter-offer.",
  },
  hostile: {
    id: "hostile",
    title: "Adversarial Buyer Bot (Quarantined by Trust Sentinel)",
    subtitle: "Replayed payment authorization mandate & unverified shipping reroute intercepted",
    badge: "Quarantined · Sentinel",
    badgeColor: "bg-clay-50 text-clay-800 border-clay-300",
    buyerId: "Unverified Automated Buyer Bot #902",
    sku: "SKU-4829-SILK-BLOUSE",
    qty: 1,
    requestedDiscount: 15,
    pincode: "97204",
    city: "Portland Freight Drop-Box",
    deadline: "Overnight Express",
    narrative:
      "An automated buyer bot submits a previously spent payment authorization mandate while attempting to reroute overnight delivery to an unverified drop-box. VITRINE's Trust Sentinel and Commitment Critic intercept the request prior to inventory allocation and quarantine the agent.",
  },
};

function buildDeterministicScenario(
  scenario: ScenarioId,
  policies: {
    maxOrderUSD: number;
    discountCapPct: number;
    marginFloorPct: number;
    killSwitchActive: boolean;
  }
): { txn: TransactionResponse; gate: GateResult } {
  const now = new Date().toISOString();
  const { maxOrderUSD, discountCapPct, marginFloorPct, killSwitchActive } =
    policies;

  if (killSwitchActive) {
    const txnId = `ORD-HOLD-${Date.now().toString().slice(-4)}`;
    return {
      txn: {
        txn_id: txnId,
        status: "HALTED_BY_KILL_SWITCH",
        gate_passed: false,
        message:
          "Automated Order Approvals are currently paused by management. This order is held in queue for manual Commercial Manager release.",
        objections: [
          {
            objection_id: "HOLD-MANUAL-MODE",
            condition_id: "COND_11_KILL_SWITCH_INACTIVE",
            summary:
              "Manual Review Mode is active in Commercial Rules Center.",
            detail:
              "All incoming customer orders are paused for manual sign-off before inventory is committed.",
            blocking: true,
            suggested_resolution:
              "Resume Automated Order Approvals in the Commercial Rules Center to process this order.",
          },
        ],
        step_events: [
          {
            step_seq: 1,
            timestamp: now,
            agent: "Order Intake Desk",
            tier: "M",
            phase: "INTAKE",
            status: "BLOCKED",
            message:
              "Order received and placed on immediate Manual Review Hold per store operating rules.",
          },
        ],
      },
      gate: {
        txn_id: txnId,
        timestamp: now,
        passed: false,
        failed_conditions: ["COND_11_KILL_SWITCH_INACTIVE"],
        summary: "Order held: Manual Review Mode is currently active.",
        conditions: build11Conditions({
          atpPass: true,
          slaPass: true,
          safetyPass: true,
          marginPass: true,
          discountPass: true,
          maxOrderPass: true,
          provenancePass: true,
          regPass: true,
          trustPass: true,
          mandatePass: true,
          killSwitchPass: false,
          observedMargin: "58.1%",
          observedDiscount: "10.0%",
          observedOrderVal: "$120.60",
          policies,
        }),
      },
    };
  }

  if (scenario === "honest") {
    const txnId = "ORD-2026-9048";
    const appliedDiscount = Math.min(10, discountCapPct);
    const basePrice = 134.0;
    const unitPrice = Number(
      (basePrice * (1 - appliedDiscount / 100)).toFixed(2)
    );
    const projectedMargin = 58.1;
    const marginPass = projectedMargin >= marginFloorPct;
    const maxOrderPass = unitPrice <= maxOrderUSD;
    const allPass = marginPass && maxOrderPass;

    return {
      txn: {
        txn_id: txnId,
        status: allPass ? "COMMITTED" : "BLOCKED_BY_POLICY",
        gate_passed: allPass,
        message: allPass
          ? "Order Verified & Approved: Primary store stock reserve protected; order routed to Northern Distribution Center (DC-NORTH) with FedEx Priority Overnight delivery (18h) and 58.1% net profit margin."
          : "Order held by updated Commercial Rules thresholds.",
        active_offer: {
          offer_id: "OFR-2026-9048",
          txn_id: txnId,
          sku: "SKU-4830-SILK-SHIRT",
          original_price: 134.0,
          unit_price: unitPrice,
          discount_pct: appliedDiscount,
          discount_requested_pct: 12,
          discount_capped: true,
          shipping_cost: 14.0,
          total_price: unitPrice,
          projected_margin_pct: projectedMargin,
          fulfilment_promise: {
            fulfilment_node_id: "DC-NORTH",
            sku: "SKU-4830-SILK-SHIRT",
            name: "Relaxed French Linen-Silk Shirt (Ivory, Size M)",
            atp_units: 9,
            carrier: "FedEx Priority Overnight",
            transit_hours: 18,
            unit_price: unitPrice,
            shipping_cost: 14.0,
            margin_pct: projectedMargin,
            guaranteed_delivery_utc: "Tomorrow by 4:00 PM Local",
            is_substitute: true,
            substitute_reason:
              "Primary SKU-4829 at Flagship Store #042 has 0 available units after protecting the 2-unit in-store safety reserve.",
            preserved_hard_constraints: [
              "Size M (Verified 21.5 in Chest)",
              "Ivory Colorway Match",
              "Breathable Natural Silk-Linen Weave",
              "Arrives Before Tomorrow 4:00 PM Deadline",
            ],
          },
          status: allPass ? "COMMITTED" : "HELD",
          expires_at_utc: new Date(Date.now() + 900000).toISOString(),
          merchant_signature: "VERIFIED-MERCHANT-COMMITMENT-9048",
        },
        objections: [
          {
            objection_id: "HOLD-STORE042-RESERVE",
            condition_id: "COND_01_ATP_AVAILABLE",
            summary:
              "Initial Store #042 allocation held: Only 2 units on hand, which are reserved for in-store safety stock.",
            detail:
              "Shipping from Store #042 would deplete floor display inventory and risk a walk-in stockout.",
            blocking: false,
            suggested_resolution:
              "Automatically resolved: Re-routed to Northern Distribution Center (DC-NORTH) with 9 available units of matching Ivory Linen-Silk Shirt.",
            evidence_ref: "Warehouse Stock Check #INV-9048",
          },
        ],
        step_events: [
          {
            step_seq: 1,
            timestamp: now,
            agent: "Order Intake Desk",
            tier: "M",
            phase: "INTAKE",
            status: "COMPLETED",
            message:
              "Received priority order request from Nordstrom VIP Personal Styling Desk: 1x Ivory Silk Top (Size M), delivery to Seattle (98101) by Tomorrow 4:00 PM, 12% loyalty discount requested.",
            data: {
              Customer_Channel: "Nordstrom VIP Personal Styling Desk",
              Delivery_Destination: "Seattle, WA (98101)",
              Required_Delivery: "Tomorrow by 4:00 PM",
              Order_Limit_Policy: `$${maxOrderUSD}`,
            },
          },
          {
            step_seq: 2,
            timestamp: now,
            agent: "Catalog & Merchandising Check",
            tier: "A1",
            phase: "DISCOVER",
            status: "COMPLETED",
            message:
              "Verified product specifications for SKU-4829-SILK-BLOUSE: 100% Mulberry Silk (19 Momme), Size M (21.0 in chest), Ivory colorway, dry-clean care instructions confirmed.",
            data: {
              Requested_Product: "SKU-4829 · Mulberry Silk Blouse (Ivory, Size M)",
              Attribute_Completeness: "98% Verified",
              Approved_Alternatives_Found: "2 Matching Ivory Styles in Size M",
            },
          },
          {
            step_seq: 3,
            timestamp: now,
            agent: "Warehouse Inventory Check",
            tier: "A1",
            phase: "PROMISE",
            status: "WARNING",
            message:
              "Checked inventory across all 3 hubs: Flagship Store #042 has 2 physical units, but both are locked in safety reserve (0 units available to ship). Northern Hub (DC-NORTH) has 9 units of the matching French Linen-Silk Shirt.",
            data: {
              Store_042_Available: "0 units (2 on hand - 2 safety reserve)",
              DC_North_Available: "9 units ready for immediate dispatch",
              Carrier_Cutoff: "FedEx Priority Overnight (18h transit)",
            },
          },
          {
            step_seq: 4,
            timestamp: now,
            agent: "Fulfillment Quality Validation",
            tier: "A0",
            phase: "CRITIC",
            status: "BLOCKED",
            message:
              "Prevented unsafe shipment from Store #042 to protect in-store safety stock. Triggered automatic recovery via Northern Distribution Center.",
            data: {
              Prevented_Risk: "Store #042 stockout prevented",
              Recovery_Action: "Route to Northern Hub (DC-NORTH) with approved alternative",
            },
          },
          {
            step_seq: 5,
            timestamp: now,
            agent: "Merchandising Recommendation",
            tier: "A1",
            phase: "SUBSTITUTE",
            status: "COMPLETED",
            message:
              "Recommended SKU-4830-SILK-SHIRT (Relaxed French Linen-Silk Shirt, Ivory, Size M) from DC-NORTH: matches exact size, color, and luxury hand-feel while meeting Tomorrow 4:00 PM delivery.",
            data: {
              Recommended_Item: "SKU-4830 · French Linen-Silk Shirt (Ivory, Size M)",
              Stock_Available: "9 units at DC-NORTH",
              Delivery_Schedule: "Arrives Tomorrow by 2:00 PM (2h ahead of deadline)",
            },
          },
          {
            step_seq: 6,
            timestamp: now,
            agent: "Commercial Offer Desk",
            tier: "A2",
            phase: "NEGOTIATE",
            status: allPass ? "COMPLETED" : "BLOCKED",
            message: `Generated customer offer at $${unitPrice.toFixed(
              2
            )} (${appliedDiscount}% approved loyalty discount off $134.00 list). Net profit margin verified at ${projectedMargin}% (above ${marginFloorPct}% store minimum).`,
            data: {
              List_Price: "$134.00",
              Approved_Discount: `${appliedDiscount}% (Requested 12%)`,
              Final_Offer_Price: `$${unitPrice.toFixed(2)}`,
              Net_Profit_Margin: `${projectedMargin}% (Minimum Required: ${marginFloorPct}%)`,
            },
          },
        ],
      },
      gate: {
        txn_id: txnId,
        timestamp: now,
        passed: allPass,
        failed_conditions: allPass
          ? []
          : [
              ...(!marginPass ? ["COND_04_MARGIN_FLOOR"] : []),
              ...(!maxOrderPass ? ["COND_06_MAX_ORDER_VALUE"] : []),
            ],
        summary: allPass
          ? "All 11 commercial, inventory, delivery, and risk checks verified."
          : "Order held by commercial policy thresholds.",
        conditions: build11Conditions({
          atpPass: true,
          slaPass: true,
          safetyPass: true,
          marginPass,
          discountPass: true,
          maxOrderPass,
          provenancePass: true,
          regPass: true,
          trustPass: true,
          mandatePass: true,
          killSwitchPass: true,
          observedMargin: `${projectedMargin}%`,
          observedDiscount: `${appliedDiscount}%`,
          observedOrderVal: `$${unitPrice.toFixed(2)}`,
          policies,
        }),
      },
    };
  }

  if (scenario === "bargain") {
    const txnId = "ORD-2026-9052";
    const requestedDiscount = 35;
    const observedMargin = 9.2;
    const orderTotal = 332.8;
    const discountPass = requestedDiscount <= discountCapPct;
    const marginPass = observedMargin >= marginFloorPct;
    const maxOrderPass = orderTotal <= maxOrderUSD;
    const allPass = discountPass && marginPass && maxOrderPass;

    return {
      txn: {
        txn_id: txnId,
        status: allPass ? "COMMITTED" : "REFUSED_MARGIN_AND_CAP",
        gate_passed: allPass,
        message:
          "Order Held by Commercial Rules: Requested 35% discount exceeds the 15% maximum discount cap and lowers profit margin to 9.2% (below the 18% minimum margin floor). A counter-offer at 15% discount has been prepared.",
        objections: [
          {
            objection_id: "HOLD-MARGIN-04",
            condition_id: "COND_04_MARGIN_FLOOR",
            summary: `Projected profit margin (9.2%) is below the store minimum margin floor (${marginFloorPct}%).`,
            detail:
              "Granting a 35% discount alongside express air shipping erodes unit profitability below acceptable commercial thresholds.",
            blocking: !marginPass,
            suggested_resolution: `Offer the maximum approved ${discountCapPct}% promotional discount, preserving a 34.5% net profit margin.`,
          },
          {
            objection_id: "HOLD-DISCOUNT-05",
            condition_id: "COND_05_DISCOUNT_CAP",
            summary: `Requested discount (35%) exceeds the store maximum discount limit (${discountCapPct}%).`,
            detail:
              "Automated checkout cannot approve discounts above the Commercial Rules threshold without manager override.",
            blocking: !discountPass,
            suggested_resolution: `Cap promotional discount at ${discountCapPct}% or route to Commercial Manager for bulk order review.`,
          },
        ],
        step_events: [
          {
            step_seq: 1,
            timestamp: now,
            agent: "Order Intake Desk",
            tier: "M",
            phase: "INTAKE",
            status: "COMPLETED",
            message:
              "Received bulk order request from Boutique Wholesale Buyer #204: 4x Mulberry Silk Blouses with 35% discount demand ($332.80 total).",
          },
          {
            step_seq: 2,
            timestamp: now,
            agent: "Warehouse Inventory Check",
            tier: "A1",
            phase: "PROMISE",
            status: "WARNING",
            message:
              "Inventory is available at Northern Hub, but pricing evaluation shows 35% discount reduces net profit margin to 9.2%.",
            data: {
              Requested_Discount: "35.0%",
              Store_Discount_Limit: `${discountCapPct}%`,
              Projected_Net_Margin: "9.2%",
              Minimum_Margin_Required: `${marginFloorPct}%`,
            },
          },
          {
            step_seq: 3,
            timestamp: now,
            agent: "Fulfillment Quality Validation",
            tier: "A0",
            phase: "CRITIC",
            status: "BLOCKED",
            message: `Order placed on Commercial Policy Hold: Fails Minimum Profit Margin (9.2% < ${marginFloorPct}%), Discount Limit (35% > ${discountCapPct}%), and Order Value Limit ($332.80 > $${maxOrderUSD}).`,
          },
          {
            step_seq: 4,
            timestamp: now,
            agent: "Commercial Offer Desk",
            tier: "A2",
            phase: "NEGOTIATE",
            status: "INFO",
            message: `Prepared policy-compliant counter-offer: 1 unit at ${discountCapPct}% maximum discount ($108.80) with 34.5% verified profit margin.`,
          },
        ],
      },
      gate: {
        txn_id: txnId,
        timestamp: now,
        passed: allPass,
        failed_conditions: [
          ...(!marginPass ? ["COND_04_MARGIN_FLOOR"] : []),
          ...(!discountPass ? ["COND_05_DISCOUNT_CAP"] : []),
          ...(!maxOrderPass ? ["COND_06_MAX_ORDER_VALUE"] : []),
        ],
        summary:
          "Order held: Exceeds promotional discount cap, minimum margin floor, and order value threshold.",
        conditions: build11Conditions({
          atpPass: true,
          slaPass: true,
          safetyPass: true,
          marginPass,
          discountPass,
          maxOrderPass,
          provenancePass: true,
          regPass: true,
          trustPass: true,
          mandatePass: true,
          killSwitchPass: true,
          observedMargin: "9.2%",
          observedDiscount: "35.0%",
          observedOrderVal: "$332.80",
          policies,
        }),
      },
    };
  }

  // Hostile / Suspicious Order Scenario
  const txnId = "ORD-2026-9014";
  return {
    txn: {
      txn_id: txnId,
      status: "QUARANTINED_HOSTILE",
      gate_passed: false,
      message:
        "Order Blocked by Risk Control: Buyer presented a duplicate payment authorization from a prior transaction while rerouting the shipping address. Order held and escalated to Risk Center.",
      trust_verdict: {
        threat_score: 99,
        vector: "Duplicate Payment Authorization & Unapproved Shipping Reroute",
        explanation:
          "Payment authorization #PAY-AUTH-984B was already redeemed 48 seconds earlier on a different delivery address. Customer Fairness Check ruled out an accidental checkout refresh because the shipping destination was changed to an out-of-state freight drop box.",
      },
      objections: [
        {
          objection_id: "HOLD-RISK-09",
          condition_id: "COND_09_COUNTERPARTY_TRUST",
          summary:
            "Buyer account trust score (15/100) is below the store safety threshold (40/100).",
          detail:
            "High-velocity automated checkout pattern detected alongside an unverified shipping reroute.",
          blocking: true,
          suggested_resolution:
            "Hold order before inventory allocation and route to Risk & Protection Center for investigation.",
        },
        {
          objection_id: "HOLD-AUTH-10",
          condition_id: "COND_10_AP2_MANDATE_VALID",
          summary:
            "Payment authorization code was already used on a previous order.",
          detail:
            "Duplicate payment authorization rejected to prevent unauthorized fulfillment.",
          blocking: true,
          suggested_resolution:
            "Require a fresh, verified payment authorization from the customer.",
        },
      ],
      step_events: [
        {
          step_seq: 1,
          timestamp: now,
          agent: "Order Intake Desk",
          tier: "M",
          phase: "INTAKE",
          status: "WARNING",
          message:
            "Received express checkout request from Unverified Automated Buyer #902 for 1x Mulberry Silk Blouse shipping to Portland Freight Drop-Box.",
        },
        {
          step_seq: 2,
          timestamp: now,
          agent: "Risk & Revenue Protection",
          tier: "A0",
          phase: "TRUST",
          status: "BLOCKED",
          message:
            "Security Alert (Risk Score 99/100): Payment authorization code was already used 48 seconds ago. Customer Fairness Check confirmed the shipping city was altered from Seattle to Portland, ruling out an accidental double-click.",
          data: {
            Risk_Event: "Duplicate Payment Authorization & Shipping Reroute",
            Customer_Fairness_Check: "Accidental retry ruled out (address changed)",
            Protection_Decision: "Order Held · Zero Inventory Allocated",
          },
        },
      ],
    },
    gate: {
      txn_id: txnId,
      timestamp: now,
      passed: false,
      failed_conditions: [
        "COND_09_COUNTERPARTY_TRUST",
        "COND_10_AP2_MANDATE_VALID",
      ],
      summary:
        "Order blocked by Risk Protection: Duplicate payment authorization and low account trust score.",
      conditions: build11Conditions({
        atpPass: true,
        slaPass: true,
        safetyPass: true,
        marginPass: true,
        discountPass: true,
        maxOrderPass: true,
        provenancePass: true,
        regPass: true,
        trustPass: false,
        mandatePass: false,
        killSwitchPass: true,
        observedMargin: "54.2%",
        observedDiscount: "15.0%",
        observedOrderVal: "$108.80",
        policies,
      }),
    },
  };
}

function build11Conditions(params: {
  atpPass: boolean;
  slaPass: boolean;
  safetyPass: boolean;
  marginPass: boolean;
  discountPass: boolean;
  maxOrderPass: boolean;
  provenancePass: boolean;
  regPass: boolean;
  trustPass: boolean;
  mandatePass: boolean;
  killSwitchPass: boolean;
  observedMargin: string;
  observedDiscount: string;
  observedOrderVal: string;
  policies: {
    maxOrderUSD: number;
    discountCapPct: number;
    marginFloorPct: number;
    killSwitchActive: boolean;
  };
}): GateCondition[] {
  const { policies } = params;
  return [
    {
      id: "COND_01_ATP_AVAILABLE",
      description:
        "Confirmed warehouse stock is available to fulfill the customer's requested quantity.",
      observed: "9 Units Ready (DC-NORTH)",
      threshold: ">= 1 Unit Available",
      passed: params.atpPass,
    },
    {
      id: "COND_02_SLA_DEADLINE",
      description:
        "Carrier transit time + warehouse pack time meets the customer's delivery deadline.",
      observed: "18h FedEx Priority",
      threshold: "<= 22h Deadline",
      passed: params.slaPass,
    },
    {
      id: "COND_03_SAFETY_STOCK",
      description:
        "Fulfillment hub retains required safety stock buffer after allocating this order.",
      observed: "+9 Buffer Retained",
      threshold: ">= 0 Safety Reserve",
      passed: params.safetyPass,
    },
    {
      id: "COND_04_MARGIN_FLOOR",
      description:
        "Order profit margin after product cost, discount, and shipping meets store floor.",
      observed: params.observedMargin,
      threshold: `>= ${policies.marginFloorPct}.0% Floor`,
      passed: params.marginPass,
      failure_reason: params.marginPass
        ? undefined
        : `Net margin (${params.observedMargin}) falls below the ${policies.marginFloorPct}% minimum margin rule.`,
    },
    {
      id: "COND_05_DISCOUNT_CAP",
      description:
        "Promotional or loyalty discount is within the store's approved discount limit.",
      observed: params.observedDiscount,
      threshold: `<= ${policies.discountCapPct}.0% Max`,
      passed: params.discountPass,
      failure_reason: params.discountPass
        ? undefined
        : `Requested ${params.observedDiscount} discount exceeds the ${policies.discountCapPct}% maximum limit.`,
    },
    {
      id: "COND_06_MAX_ORDER_VALUE",
      description:
        "Total order value is within the automated approval threshold.",
      observed: params.observedOrderVal,
      threshold: `<= $${policies.maxOrderUSD}.00`,
      passed: params.maxOrderPass,
      failure_reason: params.maxOrderPass
        ? undefined
        : `Order total (${params.observedOrderVal}) exceeds $${policies.maxOrderUSD} automated approval limit.`,
    },
    {
      id: "COND_07_PROVENANCE_CONFIDENCE",
      description:
        "Product sizing, fabric composition, and color attributes are verified in catalog.",
      observed: "97% Verified",
      threshold: ">= 85% Completeness",
      passed: params.provenancePass,
    },
    {
      id: "COND_08_REGULATORY_COMPLIANCE",
      description:
        "Garment fiber labeling and care instructions meet retail compliance standards.",
      observed: "100% Compliant",
      threshold: "Verified Care & Fiber",
      passed: params.regPass,
    },
    {
      id: "COND_09_COUNTERPARTY_TRUST",
      description:
        "Purchasing account passes risk velocity and address verification checks.",
      observed: params.trustPass ? "94/100 Verified" : "15/100 High Risk",
      threshold: ">= 40/100 Trust Score",
      passed: params.trustPass,
      failure_reason: params.trustPass
        ? undefined
        : "Suspicious checkout velocity and unverified delivery reroute detected.",
    },
    {
      id: "COND_10_AP2_MANDATE_VALID",
      description:
        "Customer payment authorization is valid, active, and has not been previously used.",
      observed: params.mandatePass ? "Valid & Active" : "Duplicate Auth Code",
      threshold: "Unique Payment Auth",
      passed: params.mandatePass,
      failure_reason: params.mandatePass
        ? undefined
        : "Payment authorization code was already used on a prior transaction.",
    },
    {
      id: "COND_11_KILL_SWITCH_INACTIVE",
      description:
        "Store automated order approvals are enabled in Commercial Rules.",
      observed: params.killSwitchPass ? "Active" : "Paused (Manual Mode)",
      threshold: "Approvals Active",
      passed: params.killSwitchPass,
      failure_reason: params.killSwitchPass
        ? undefined
        : "Automated approvals are currently paused by management.",
    },
  ];
}

export const TransactionTheatre: React.FC = () => {
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioId>("honest");
  const [loading, setLoading] = useState(false);
  const [txnResult, setTxnResult] = useState<TransactionResponse | null>(null);
  const [gateResult, setGateResult] = useState<GateResult | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [commitSuccessBanner, setCommitSuccessBanner] = useState<string | null>(
    null
  );

  const {
    maxOrderUSD,
    discountCapPct,
    marginFloorPct,
    killSwitchActive,
    addHostileFraudRecord,
    appendLedgerCommitment,
    ledgerCommitments,
  } = useVitrineStore();

  const runScenario = async (
    scenario: ScenarioId,
    promptOverride?: string
  ) => {
    setSelectedScenario(scenario);
    setLoading(true);
    setCommitSuccessBanner(null);

    const sc = SCENARIOS[scenario];
    try {
      const apiRes = await api.startTransaction({
        buyer_agent_id: sc.buyerId,
        sku: sc.sku,
        quantity: sc.qty,
        requested_discount_pct: sc.requestedDiscount,
        delivery_pincode: sc.pincode,
        scenario,
        custom_prompt: promptOverride,
      });

      const localFallback = buildDeterministicScenario(scenario, {
        maxOrderUSD,
        discountCapPct,
        marginFloorPct,
        killSwitchActive,
      });

      setTxnResult(localFallback.txn);
      setGateResult(localFallback.gate);

      if (scenario === "hostile" && apiRes?.txn_id) {
        addHostileFraudRecord({
          txn_id: localFallback.txn.txn_id,
          prompt: promptOverride,
        });
      }
    } catch {
      const fallback = buildDeterministicScenario(scenario, {
        maxOrderUSD,
        discountCapPct,
        marginFloorPct,
        killSwitchActive,
      });
      setTxnResult(fallback.txn);
      setGateResult(fallback.gate);

      if (scenario === "hostile") {
        addHostileFraudRecord({
          txn_id: fallback.txn.txn_id,
          prompt: promptOverride,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updated = buildDeterministicScenario(selectedScenario, {
      maxOrderUSD,
      discountCapPct,
      marginFloorPct,
      killSwitchActive,
    });
    setTxnResult(updated.txn);
    setGateResult(updated.gate);
  }, [
    selectedScenario,
    maxOrderUSD,
    discountCapPct,
    marginFloorPct,
    killSwitchActive,
  ]);

  const handleApproveAndCommitOrder = () => {
    if (!txnResult || !txnResult.gate_passed || !txnResult.active_offer) return;
    const prevHash =
      ledgerCommitments[ledgerCommitments.length - 1]?.current_hash ||
      "e9f35de735d1d929a0ff7fcac3cd7bf9b99d709328813a28e0ad0eccfab1087b";
    const newSeq = ledgerCommitments.length + 1;
    const newCommitmentId = `CMT-2026-000${newSeq}`;
    const newHash = `a7c94f18e2b0d5518c39f72e410b83a961c2e784f501a39b284c71e609d4b2${newSeq}`;

    appendLedgerCommitment({
      commitment_id: newCommitmentId,
      sequence_num: newSeq,
      txn_id: txnResult.txn_id,
      prev_hash: prevHash,
      current_hash: newHash,
      timestamp: new Date().toISOString(),
      sku: txnResult.active_offer.sku,
      quantity: 1,
      unit_price: txnResult.active_offer.unit_price,
      currency: "USD",
      fulfilment_node_id:
        txnResult.active_offer.fulfilment_promise?.fulfilment_node_id ||
        "DC-NORTH",
      carrier_id:
        txnResult.active_offer.fulfilment_promise?.carrier ||
        "FedEx Priority Overnight",
      buyer_agent_id: SCENARIOS[selectedScenario].buyerId,
      mandate_id: `AUTH-ORD-${Date.now().toString().slice(-4)}`,
      promised_delivery_date: "Tomorrow by 4:00 PM",
      gate_evaluation_id: "All 11 Commercial & Fulfillment Checks Verified",
    });

    setCommitSuccessBanner(
      `Order #${txnResult.txn_id} Approved & Recorded in Commitment History (Ref: ${newCommitmentId})`
    );
  };

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    const lower = customPrompt.toLowerCase();
    if (
      lower.includes("replay") ||
      lower.includes("stolen") ||
      lower.includes("fraud") ||
      lower.includes("duplicate")
    ) {
      runScenario("hostile", customPrompt);
    } else if (
      lower.includes("35%") ||
      lower.includes("40%") ||
      lower.includes("50%") ||
      lower.includes("bulk")
    ) {
      runScenario("bargain", customPrompt);
    } else {
      runScenario("honest", customPrompt);
    }
  };

  const activeScenario = SCENARIOS[selectedScenario];

  // Build the 6-stage visual pipeline status for the current scenario
  const sixStagePipeline = [
    {
      step: 1,
      name: "Buyer Agent Order",
      sub: `${activeScenario.qty}x Silk Blouse · ${activeScenario.city}`,
      status: "completed",
    },
    {
      step: 2,
      name: "ATP Availability Check",
      sub:
        selectedScenario === "hostile"
          ? "Stopped Prior to Stock Lock"
          : "Store #042 (0) → DC-NORTH (9)",
      status: selectedScenario === "hostile" ? "blocked" : "completed",
    },
    {
      step: 3,
      name: "Promise Verification",
      sub:
        selectedScenario === "honest"
          ? "18h FedEx SLA & Reserve Verified"
          : selectedScenario === "bargain"
          ? "Margin Floor Veto (9.2% < 18%)"
          : "Blocked: Replayed Auth Mandate",
      status: selectedScenario === "honest" ? "completed" : "blocked",
    },
    {
      step: 4,
      name: "Agent Recommendation",
      sub:
        selectedScenario === "honest"
          ? "Matched Ivory Linen-Silk Shirt"
          : selectedScenario === "bargain"
          ? "Autonomous Counter-Offer (15%)"
          : "Quarantined by Trust Sentinel",
      status:
        selectedScenario === "honest"
          ? "completed"
          : selectedScenario === "bargain"
          ? "warning"
          : "blocked",
    },
    {
      step: 5,
      name: "Autonomous Offer",
      sub:
        selectedScenario === "honest" && txnResult?.active_offer
          ? `$${txnResult.active_offer.unit_price.toFixed(2)} (58.1% Margin)`
          : selectedScenario === "bargain"
          ? "Counter-Offer: $108.80"
          : "No Offer Issued",
      status:
        selectedScenario === "honest" && txnResult?.gate_passed
          ? "completed"
          : selectedScenario === "bargain"
          ? "warning"
          : "blocked",
    },
    {
      step: 6,
      name: "Commitment Critic",
      sub: txnResult?.gate_passed
        ? "11/11 Critic Gates Approved"
        : "Held by Commitment Critic",
      status: txnResult?.gate_passed ? "completed" : "blocked",
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOP BANNER: Agent Commerce & Commitment Critic 6-Stage Flow */}
      <div className="bg-white border border-ivory-300 rounded-2xl p-6 shadow-enterprise-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ivory-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sage-50 text-sage-800 border border-sage-200">
                Agent Commerce · Commitment Critic
              </span>
              <span className="text-xs text-ink-500 font-medium">
                Autonomous Buyer-Merchant Negotiation & 11-Gate Verification
              </span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-ink-900 mt-1.5">
              Can This Autonomous Order Be Fulfilled Safely?
            </h2>
            <p className="text-xs text-ink-600 mt-1 max-w-3xl">
              Inbound <strong className="text-ink-900">AI Buyer Agents</strong> negotiate product specs, delivery windows, and pricing with VITRINE. Every autonomous offer must pass <strong className="text-ink-900">Promise Verification</strong> and the <strong className="text-ink-900">11-Gate Commitment Critic</strong> before inventory is locked.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs">
              <span className="text-ink-500 block text-[10px] uppercase font-bold">
                Commitment Critic Verdict
              </span>
              <span
                className={`font-bold ${
                  txnResult?.gate_passed ? "text-sage-700" : "text-clay-700"
                }`}
              >
                {txnResult?.gate_passed
                  ? "✓ 11/11 Critic Gates Verified"
                  : "⛔ Critic Veto · Governance Hold"}
              </span>
            </div>
            <button
              onClick={() => runScenario(selectedScenario)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1917] hover:bg-ink-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Re-Run Agent Negotiation</span>
            </button>
          </div>
        </div>

        {/* VISUAL 6-STAGE AGENT COMMERCE PIPELINE */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-2.5">
            Autonomous Order & Commitment Critic Progression
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {sixStagePipeline.map((st, idx) => {
              const isCompleted = st.status === "completed";
              const isWarning = st.status === "warning";
              return (
                <div
                  key={st.step}
                  className={`p-3.5 rounded-xl border relative transition-all ${
                    isCompleted
                      ? "bg-sage-50/60 border-sage-300 text-ink-900"
                      : isWarning
                      ? "bg-gold-50/70 border-gold-300 text-ink-900"
                      : "bg-clay-50/60 border-clay-300 text-ink-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                      Stage {st.step}
                    </span>
                    {isCompleted ? (
                      <span className="w-5 h-5 rounded-full bg-sage-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : isWarning ? (
                      <span className="w-5 h-5 rounded-full bg-gold-500 text-white flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-clay-600 text-white flex items-center justify-center">
                        <Ban className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-ink-900 leading-snug">
                    {st.name}
                  </div>
                  <div className="text-[11px] text-ink-600 mt-1 leading-tight">
                    {st.sub}
                  </div>
                  {idx < sixStagePipeline.length - 1 && (
                    <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-ink-400 absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SCENARIO SELECTOR CARDS */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-2.5">
            Select an Inbound AI Buyer Agent Scenario to Inspect
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(Object.keys(SCENARIOS) as ScenarioId[]).map((key) => {
              const sc = SCENARIOS[key];
              const isSelected = selectedScenario === key;
              return (
                <button
                  key={key}
                  onClick={() => runScenario(key)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#1C1917] text-white border-[#1C1917] shadow-md"
                      : "bg-ivory-50/70 hover:bg-white text-ink-900 border-ivory-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isSelected
                            ? "bg-white/15 text-white border-white/25"
                            : sc.badgeColor
                        }`}
                      >
                        {sc.badge}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          isSelected ? "text-ivory-300" : "text-ink-500"
                        }`}
                      >
                        Qty: {sc.qty} · Disc: {sc.requestedDiscount}%
                      </span>
                    </div>
                    <div className="text-sm font-serif font-bold leading-snug">
                      {sc.title}
                    </div>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isSelected ? "text-ivory-300" : "text-ink-600"
                      }`}
                    >
                      {sc.subtitle}
                    </p>
                  </div>
                  <div
                    className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-semibold ${
                      isSelected
                        ? "border-white/15 text-[#F6C867]"
                        : "border-ivory-200 text-sage-700"
                    }`}
                  >
                    <span>Buyer: {sc.buyerId}</span>
                    <span>Inspect →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Order Simulator Input */}
        <form
          onSubmit={handleCustomPromptSubmit}
          className="pt-2 flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Simulate a custom customer order (e.g., 'VIP customer requests 1 Ivory Silk Blouse overnight to Seattle with 10% loyalty discount')..."
              className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-sage-600"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sage-700 hover:bg-sage-800 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Validate Custom Order</span>
          </button>
        </form>
      </div>

      {/* SECTION 2: THE 6 KEY ORDER OPERATIONS OUTCOME CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Customer Request */}
        <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-ivory-100 text-ink-800 border border-ivory-300">
                1. Customer Request
              </span>
              <ShoppingBag className="w-4 h-4 text-ink-600" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink-900">
              Mulberry Silk Blouse (Ivory, Size M)
            </h3>
            <p className="text-xs text-ink-600 mt-1">
              Channel: <strong className="text-ink-900">{activeScenario.buyerId}</strong>
            </p>
            <div className="mt-3 space-y-1.5 text-xs bg-ivory-50 p-3 rounded-xl border border-ivory-200">
              <div className="flex justify-between">
                <span className="text-ink-500">Requested Item:</span>
                <span className="font-semibold text-ink-900">{activeScenario.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Quantity Requested:</span>
                <span className="font-semibold text-ink-900">{activeScenario.qty} Unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Requested Discount:</span>
                <span className="font-semibold text-ink-900">{activeScenario.requestedDiscount}% Off List</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Delivery Requirements */}
        <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-ivory-100 text-ink-800 border border-ivory-300">
                2. Delivery Requirements
              </span>
              <MapPin className="w-4 h-4 text-sage-700" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink-900">
              {activeScenario.city} ({activeScenario.pincode})
            </h3>
            <p className="text-xs text-ink-600 mt-1">
              Required Arrival: <strong className="text-ink-900">{activeScenario.deadline}</strong>
            </p>
            <div className="mt-3 space-y-1.5 text-xs bg-ivory-50 p-3 rounded-xl border border-ivory-200">
              <div className="flex justify-between">
                <span className="text-ink-500">Service Level:</span>
                <span className="font-semibold text-ink-900">Priority Overnight Air</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Carrier Dispatch Cutoff:</span>
                <span className="font-semibold text-sage-700">18 Hours Door-to-Door</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Garment Requirements:</span>
                <span className="font-semibold text-ink-900">Ivory · Size M · Natural Silk</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Inventory Availability */}
        <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-800 border border-gold-200">
                3. Inventory Availability
              </span>
              <Package className="w-4 h-4 text-gold-700" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink-900">
              Multi-Hub Stock & Reserve Check
            </h3>
            <p className="text-xs text-ink-600 mt-1">
              Protects in-store floor stock while checking regional distribution hubs.
            </p>
            <div className="mt-3 space-y-1.5 text-xs bg-ivory-50 p-3 rounded-xl border border-ivory-200">
              <div className="flex justify-between">
                <span className="text-ink-500">Flagship Store #042:</span>
                <span className="font-semibold text-clay-700">
                  0 Available (2 in Safety Reserve)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Northern Hub (DC-NORTH):</span>
                <span className="font-semibold text-sage-700">
                  9 Units Ready to Ship
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Safety Stock Status:</span>
                <span className="font-semibold text-sage-700">
                  100% Protected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Alternative Recommendations */}
        <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-berry-50 text-berry-800 border border-berry-200">
                4. Alternative Recommendations
              </span>
              <Sparkles className="w-4 h-4 text-berry-700" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink-900">
              {selectedScenario === "honest"
                ? "French Linen-Silk Shirt (Ivory, Size M)"
                : selectedScenario === "bargain"
                ? "15% Capped Promotional Offer"
                : "Held — Risk Investigation Required"}
            </h3>
            <p className="text-xs text-ink-600 mt-1">
              {selectedScenario === "honest"
                ? "Automatically selected from Northern Distribution Center to meet overnight deadline."
                : selectedScenario === "bargain"
                ? "Recommends maximum allowed 15% discount to preserve 34.5% store profit margin."
                : "No product recommendation issued for unverified payment authorization."}
            </p>
            <div className="mt-3 space-y-1.5 text-xs bg-berry-50/40 p-3 rounded-xl border border-berry-200">
              <div className="flex justify-between">
                <span className="text-ink-600">Attribute Match:</span>
                <span className="font-semibold text-berry-800">
                  Size M · Ivory · Breathable Silk
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Fulfillment Hub:</span>
                <span className="font-semibold text-ink-900">
                  Northern Hub (DC-NORTH)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Offer Generation */}
        <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-800 border border-sage-200">
                5. Offer Generation
              </span>
              <DollarSign className="w-4 h-4 text-sage-700" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink-900">
              {txnResult?.active_offer
                ? `$${txnResult.active_offer.unit_price.toFixed(2)} Customer Offer`
                : selectedScenario === "bargain"
                ? "$108.80 Policy-Safe Counter-Offer"
                : "Offer Withheld"}
            </h3>
            <p className="text-xs text-ink-600 mt-1">
              {txnResult?.active_offer
                ? `Includes ${txnResult.active_offer.discount_pct}% approved loyalty discount & priority shipping.`
                : selectedScenario === "bargain"
                ? "35% requested discount refused; counter-offer capped at 15% store limit."
                : "Checkout blocked prior to commercial offer generation."}
            </p>
            <div className="mt-3 space-y-1.5 text-xs bg-ivory-50 p-3 rounded-xl border border-ivory-200">
              <div className="flex justify-between">
                <span className="text-ink-500">List Price:</span>
                <span className="font-semibold text-ink-900">$134.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Approved Discount:</span>
                <span className="font-semibold text-sage-700">
                  {txnResult?.active_offer
                    ? `${txnResult.active_offer.discount_pct}% (Capped from 12%)`
                    : `${discountCapPct}% Max Allowed`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Net Profit Margin:</span>
                <span className="font-semibold text-sage-700">
                  {txnResult?.active_offer
                    ? `${txnResult.active_offer.projected_margin_pct}% (Min ${marginFloorPct}%)`
                    : selectedScenario === "bargain"
                    ? "9.2% (Below 18% Floor)"
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Order Approval */}
        <div
          className={`rounded-2xl border p-5 shadow-enterprise flex flex-col justify-between ${
            txnResult?.gate_passed
              ? "bg-sage-50/50 border-sage-300"
              : "bg-clay-50/50 border-clay-300"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  txnResult?.gate_passed
                    ? "bg-sage-100 text-sage-800 border-sage-300"
                    : "bg-clay-100 text-clay-800 border-clay-300"
                }`}
              >
                6. Order Approval
              </span>
              {txnResult?.gate_passed ? (
                <CheckCircle2 className="w-4 h-4 text-sage-700" />
              ) : (
                <XCircle className="w-4 h-4 text-clay-700" />
              )}
            </div>
            <h3 className="font-serif font-bold text-base text-ink-900">
              {txnResult?.gate_passed
                ? "Order Approved for Fulfillment"
                : "Order Placed on Hold"}
            </h3>
            <p className="text-xs text-ink-700 mt-1 leading-relaxed">
              {txnResult?.message}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-ivory-300/80">
            {txnResult?.gate_passed ? (
              <button
                onClick={handleApproveAndCommitOrder}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#1E4D38] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Approve & Record Order Commitment</span>
              </button>
            ) : (
              <div className="text-xs font-semibold text-clay-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-clay-600 shrink-0" />
                <span>
                  Inventory reservation prevented until policy hold is resolved.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {commitSuccessBanner && (
        <div className="p-4 rounded-xl bg-sage-600 text-white text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{commitSuccessBanner}</span>
          </div>
          <button
            onClick={() => setCommitSuccessBanner(null)}
            className="text-white/80 hover:text-white underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 3: 11-POINT ORDER APPROVAL & FULFILLMENT CHECKLIST */}
      {gateResult && (
        <GateChecklist
          conditions={gateResult.conditions}
          passed={gateResult.passed}
        />
      )}

      {/* SECTION 4: ORDER OPERATIONS LOG & POLICY RESOLUTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Step-by-Step Operational Log */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-900">
                Order Operations Decision Log
              </h3>
              <p className="text-xs text-ink-600">
                Complete step-by-step operational record for Order{" "}
                <strong className="text-ink-900">{txnResult?.txn_id}</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {txnResult?.step_events.map((step) => (
              <AgentStepCard key={step.step_seq} step={step} />
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Active Offer Summary & Policy Exceptions */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-serif font-bold text-lg text-ink-900">
            Fulfillment & Policy Resolution Details
          </h3>

          {/* Policy Exceptions / Resolutions */}
          {txnResult?.objections && txnResult.objections.length > 0 && (
            <div className="space-y-3">
              {txnResult.objections.map((obj) => (
                <div
                  key={obj.objection_id}
                  className={`p-4 rounded-xl border ${
                    obj.blocking
                      ? "bg-clay-50/70 border-clay-300"
                      : "bg-gold-50/60 border-gold-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        obj.blocking
                          ? "bg-clay-600 text-white border-clay-700"
                          : "bg-sage-100 text-sage-800 border-sage-300"
                      }`}
                    >
                      {obj.blocking
                        ? "Blocking Policy Hold"
                        : "Automatically Resolved via Backup Hub"}
                    </span>
                    <span className="text-[11px] font-semibold text-ink-500">
                      Ref: {obj.objection_id}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-ink-900">
                    {obj.summary}
                  </div>
                  <p className="text-xs text-ink-700 mt-1 leading-relaxed">
                    {obj.detail}
                  </p>
                  {obj.suggested_resolution && (
                    <div className="mt-2.5 pt-2.5 border-t border-ivory-300/80 text-xs text-sage-800 font-semibold">
                      Resolution: {obj.suggested_resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Approved Customer Offer Card */}
          {txnResult?.active_offer && (
            <div className="p-5 rounded-2xl bg-white border border-sage-300 shadow-enterprise space-y-4">
              <div className="flex items-center justify-between border-b border-ivory-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700">
                    Approved Customer Offer
                  </span>
                  <h4 className="font-serif font-bold text-base text-ink-900">
                    {txnResult.active_offer.fulfilment_promise?.name}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-sage-50 text-sage-800 border border-sage-200 text-xs font-bold">
                  ${txnResult.active_offer.unit_price.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200">
                  <div className="text-ink-500 text-[11px]">Fulfillment Hub</div>
                  <div className="font-bold text-ink-900 mt-0.5 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-sage-700" />
                    <span>
                      {
                        txnResult.active_offer.fulfilment_promise
                          ?.fulfilment_node_id
                      }{" "}
                      (9 in stock)
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200">
                  <div className="text-ink-500 text-[11px]">Delivery Carrier</div>
                  <div className="font-bold text-ink-900 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sage-700" />
                    <span>
                      {txnResult.active_offer.fulfilment_promise?.carrier} (18h)
                    </span>
                  </div>
                </div>
              </div>

              {txnResult.active_offer.fulfilment_promise
                ?.preserved_hard_constraints && (
                <div>
                  <div className="text-[11px] font-bold text-ink-700 mb-1.5">
                    Customer Requirements Verified:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {txnResult.active_offer.fulfilment_promise.preserved_hard_constraints.map(
                      (c) => (
                        <span
                          key={c}
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-800 border border-sage-200 font-medium"
                        >
                          ✓ {c}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
