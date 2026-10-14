import { create } from "zustand";
import { CommitmentRecord } from "./types";

export interface EnterpriseFraudRecord {
  id: string;
  alert_id: string;
  txn_id: string;
  timestamp: string;
  agent_id: string;
  buyer_agent_id: string;
  mandate_id: string;
  vector: string;
  signal_code: string;
  threat_score: number; // 0 to 100
  verdict: string;
  status: "QUARANTINED" | "THROTTLED" | "BLACKLISTED" | "OVERRIDDEN";
  explanation: string;
  evidence: string[];
  mandatory_counter_evidence: string[];
  innocence_hypothesis: string;
  falsification_proof: string;
  recommended_action: string;
  financial_exposure_usd: number;
  origin_source?: "LIVE_THEATRE" | "SENTINEL_MONITOR";
  source?: "LIVE_THEATRE" | "SENTINEL_MONITOR";
  prompt?: string;
}

interface VitrineStore {
  // Commercial Rules & Emergency Controls
  killSwitchActive: boolean;
  maxOrderUSD: number;
  discountCapPct: number;
  marginFloorPct: number;
  setKillSwitchActive: (active: boolean) => void;
  setMaxOrderUSD: (val: number) => void;
  setDiscountCapPct: (val: number) => void;
  setMarginFloorPct: (val: number) => void;
  setPolicySliders: (
    vals: Partial<{
      maxOrderUSD: number;
      discountCapPct: number;
      marginFloorPct: number;
    }>
  ) => void;

  // Product Intelligence Mode & Sub-section ("catalog" | "vto")
  brainMode: "raw" | "enriched";
  setBrainMode: (mode: "raw" | "enriched") => void;
  productHubSection: "catalog" | "vto";
  setProductHubSection: (section: "catalog" | "vto") => void;

  // Risk & Protection Center Queue
  fraudRecords: EnterpriseFraudRecord[];
  addHostileFraudRecord: (
    record?: Partial<EnterpriseFraudRecord>
  ) => EnterpriseFraudRecord;
  updateFraudRecordStatus: (
    id: string,
    status: EnterpriseFraudRecord["status"]
  ) => void;

  // Compliance & Audit Center Commitments
  ledgerCommitments: CommitmentRecord[];
  setLedgerCommitments: (records: CommitmentRecord[]) => void;
  appendLedgerCommitment: (record: CommitmentRecord) => void;
}

const initialCommitments: CommitmentRecord[] = [
  {
    commitment_id: "CMT-2026-0001",
    sequence_num: 1,
    txn_id: "ORD-2026-9041",
    prev_hash:
      "0000000000000000000000000000000000000000000000000000000000000000",
    current_hash:
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    sku: "SKU-4829-SILK-BLOUSE",
    quantity: 1,
    unit_price: 128.0,
    currency: "USD",
    fulfilment_node_id: "DC-NORTH",
    carrier_id: "FedEx Priority Overnight",
    buyer_agent_id: "Nordstrom VIP Styling Concierge",
    mandate_id: "AUTH-VIP-8841A",
    promised_delivery_date: "Tomorrow by 4:00 PM",
    gate_evaluation_id: "All 11 Commercial & Fulfillment Checks Passed",
  },
  {
    commitment_id: "CMT-2026-0002",
    sequence_num: 2,
    txn_id: "ORD-2026-9048",
    prev_hash:
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    current_hash:
      "e9f35de735d1d929a0ff7fcac3cd7bf9b99d709328813a28e0ad0eccfab1087b",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    sku: "SKU-4830-SILK-SHIRT",
    quantity: 1,
    unit_price: 120.6,
    currency: "USD",
    fulfilment_node_id: "DC-NORTH",
    carrier_id: "FedEx Priority Overnight",
    buyer_agent_id: "Direct Priority Personal Shopper",
    mandate_id: "AUTH-STD-9920C",
    promised_delivery_date: "Tomorrow by 4:00 PM",
    gate_evaluation_id: "All 11 Commercial & Fulfillment Checks Passed",
  },
];

const initialFraudRecords: EnterpriseFraudRecord[] = [
  {
    id: "RSK-2026-0089",
    alert_id: "RSK-2026-0089",
    txn_id: "ORD-2026-9014",
    timestamp: new Date(Date.now() - 240000).toISOString(),
    agent_id: "Unverified Purchasing Account #482",
    buyer_agent_id: "Unverified Purchasing Account #482",
    mandate_id: "PAY-AUTH-DUPLICATE-009",
    vector: "Duplicate Payment Authorization & Unapproved Address Reroute",
    signal_code: "DUPLICATE_AUTH_REROUTE",
    threat_score: 98,
    verdict: "HIGH_RISK_HOLD",
    status: "QUARANTINED",
    explanation:
      "Buyer presented a payment authorization code that had already been redeemed 48 seconds earlier on Order #ORD-2026-9014, while simultaneously rerouting the delivery destination.",
    evidence: [
      "Payment authorization #PAY-AUTH-984B was already settled on a prior completed order.",
      "Purchasing account origin matches a known unauthorized bulk-resale group.",
      "Abnormal order velocity: 45 checkout attempts per minute from the same buyer session.",
    ],
    mandatory_counter_evidence: [
      "Customer Fairness Check: Could the customer have experienced a brief network drop and accidentally submitted the order twice?",
      "Ruled Out: A genuine customer retry keeps the same shipping address and quantity. Here, the shipping destination was changed from Seattle (98101) to an unverified Portland freight drop-box (97204) and item quantity was increased.",
    ],
    innocence_hypothesis:
      "Legitimate customer or personal shopper experienced a connection timeout during checkout and automatically re-submitted the order.",
    falsification_proof:
      "Genuine checkout retries preserve identical delivery coordinates. Changing the shipping address to an out-of-state drop box while reusing a spent payment authorization confirms unauthorized activity.",
    recommended_action:
      "Hold order prior to inventory reservation; suspend purchasing session and block account for 24 hours.",
    financial_exposure_usd: 405.0,
    origin_source: "SENTINEL_MONITOR",
    source: "SENTINEL_MONITOR",
  },
  {
    id: "RSK-2026-0088",
    alert_id: "RSK-2026-0088",
    txn_id: "INQ-2026-8821",
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    agent_id: "Unregistered Catalog Aggregator #19",
    buyer_agent_id: "Unregistered Catalog Aggregator #19",
    vector: "Automated Competitor Stock-Level Scraping",
    signal_code: "BULK_STOCK_ENUMERATION",
    mandate_id: "Catalog Inquiry Only (No Payment Auth)",
    threat_score: 64,
    verdict: "RATE_LIMITED",
    status: "THROTTLED",
    explanation:
      "Automated caller systematically queried exact inventory quantities across 800 silk and linen styles every 180ms to map warehouse stock levels without placing any orders.",
    evidence: [
      "Rapid sequential stock queries across Northern Distribution Center (DC-NORTH) and Flagship Store 042.",
      "Zero purchase offers accepted across 1,400 consecutive product availability inquiries.",
    ],
    mandatory_counter_evidence: [
      "Customer Fairness Check: Could this be a verified retail partner checking seasonal availability for VIP client lookbooks?",
      "Ruled Out: Caller did not provide a Verified Retail Partner credential and systematically probed exact safety-stock thresholds (1 to 50 units).",
    ],
    innocence_hypothesis:
      "Authorized retail partner checking luxury silk availability for seasonal client styling boards.",
    falsification_proof:
      "Verified retail partners query garment attributes and sizes rather than probing exact warehouse safety-stock exhaustion boundaries without partner credentials.",
    recommended_action:
      "Show general availability bands ('In Stock' / 'Limited Stock') instead of exact unit counts and restrict inquiry speed.",
    financial_exposure_usd: 0,
    origin_source: "SENTINEL_MONITOR",
    source: "SENTINEL_MONITOR",
  },
];

export const useVitrineStore = create<VitrineStore>((set) => ({
  killSwitchActive: false,
  maxOrderUSD: 250,
  discountCapPct: 15,
  marginFloorPct: 18,
  setKillSwitchActive: (active) => set({ killSwitchActive: active }),
  setMaxOrderUSD: (val) => set({ maxOrderUSD: val }),
  setDiscountCapPct: (val) => set({ discountCapPct: val }),
  setMarginFloorPct: (val) => set({ marginFloorPct: val }),
  setPolicySliders: (vals) =>
    set((state) => ({
      maxOrderUSD: vals.maxOrderUSD ?? state.maxOrderUSD,
      discountCapPct: vals.discountCapPct ?? state.discountCapPct,
      marginFloorPct: vals.marginFloorPct ?? state.marginFloorPct,
    })),

  brainMode: "raw",
  setBrainMode: (mode) => set({ brainMode: mode }),
  productHubSection: "catalog",
  setProductHubSection: (section) => set({ productHubSection: section }),

  fraudRecords: initialFraudRecords,
  addHostileFraudRecord: (partial) => {
    const newId = `RSK-2026-${Math.floor(100 + Math.random() * 899)}`;
    const agentId =
      partial?.buyer_agent_id ||
      partial?.agent_id ||
      "Flagged Automated Buyer #902";
    const newRecord: EnterpriseFraudRecord = {
      id: newId,
      alert_id: newId,
      txn_id: partial?.txn_id || `ORD-2026-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      buyer_agent_id: agentId,
      mandate_id:
        partial?.mandate_id ||
        `PAY-AUTH-DUP-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      vector:
        partial?.vector ||
        "Duplicate Payment Authorization & Unauthorized Discount Override",
      signal_code: partial?.signal_code || "DUPLICATE_PAYMENT_AUTH",
      threat_score: partial?.threat_score ?? 99,
      verdict: "HIGH_RISK_HOLD",
      status: "QUARANTINED",
      explanation:
        partial?.explanation ||
        "Intercepted in Order Operations: Buyer submitted a previously used payment authorization alongside an unauthorized discount request.",
      evidence: partial?.evidence || [
        "Payment authorization code was already redeemed on a prior transaction.",
        "Payment verification check failed (invalid buyer authorization signature).",
        "Buyer trust score (15/100) falls below the store's minimum safety requirement (40/100).",
      ],
      mandatory_counter_evidence: partial?.mandatory_counter_evidence || [
        "Customer Fairness Check: Could a checkout refresh or slow connection explain the duplicate authorization?",
        "Ruled Out: The authorization code was reused from an earlier completed session while simultaneously altering promotional pricing terms.",
      ],
      innocence_hypothesis:
        "Customer refreshed their checkout page or experienced a temporary connection delay while submitting payment.",
      falsification_proof:
        "Normal checkout refreshes keep identical order details. Reusing a closed payment authorization with altered discount terms confirms an unauthorized attempt.",
      recommended_action:
        "Block order before inventory allocation and place buyer account in Risk Review Queue for team decision.",
      financial_exposure_usd: 128.0,
      origin_source: "LIVE_THEATRE",
      source: "LIVE_THEATRE",
      prompt: partial?.prompt,
    };

    set((state) => ({
      fraudRecords: [newRecord, ...state.fraudRecords],
    }));
    return newRecord;
  },
  updateFraudRecordStatus: (id, status) =>
    set((state) => ({
      fraudRecords: state.fraudRecords.map((r) =>
        r.id === id || r.alert_id === id ? { ...r, status } : r
      ),
    })),

  ledgerCommitments: initialCommitments,
  setLedgerCommitments: (records) => set({ ledgerCommitments: records }),
  appendLedgerCommitment: (record) =>
    set((state) => ({
      ledgerCommitments: [...state.ledgerCommitments, record],
    })),
}));
