export type AgentTier = "A0" | "A1" | "A2" | "M";

export interface AgentStep {
  step_seq: number;
  timestamp: string;
  agent: string;
  tier: AgentTier;
  phase: string;
  message: string;
  status: "COMPLETED" | "BLOCKED" | "WARNING" | "INFO";
  tools_called?: string[];
  computation_ids?: string[];
  evidence_chain?: string[];
  data?: any;
}

export interface GateCondition {
  id: string;
  description: string;
  observed: any;
  threshold: any;
  passed: boolean;
  computation_id?: string;
  failure_reason?: string;
}

export interface GateResult {
  txn_id: string;
  timestamp: string;
  passed: boolean;
  failed_conditions: string[];
  conditions: GateCondition[];
  summary: string;
}

export interface ProductAttribute {
  value: string;
  confidence: number;
  provenance: string;
  source_uri?: string;
  regulated?: boolean;
}

export interface Product {
  sku: string;
  title: string;
  description: string;
  price: number;
  category: string;
  raw_attributes: Record<string, string>;
  enriched_attributes: Record<string, ProductAttribute>;
}

export interface CommitmentRecord {
  commitment_id: string;
  sequence_num: number;
  txn_id: string;
  prev_hash: string;
  current_hash: string;
  timestamp: string;
  sku: string;
  quantity: number;
  unit_price: number;
  currency: string;
  fulfilment_node_id: string;
  carrier_id: string;
  buyer_agent_id: string;
  mandate_id: string;
  promised_delivery_date?: string;
  gate_evaluation_id?: string;
}

export interface UCPOffer {
  offer_id: string;
  txn_id: string;
  sku: string;
  unit_price: number;
  original_price?: number;
  discount_pct?: number;
  discount_requested_pct?: number;
  discount_capped?: boolean;
  shipping_cost?: number;
  total_price: number;
  projected_margin_pct?: number;
  fulfilment_promise?: {
    fulfilment_node_id: string;
    sku: string;
    name?: string;
    atp_units: number;
    carrier: string;
    transit_hours: number;
    unit_price: number;
    shipping_cost: number;
    margin_pct: number;
    guaranteed_delivery_utc: string;
    is_substitute?: boolean;
    substitute_reason?: string;
    preserved_hard_constraints?: string[];
  };
  status: string;
  expires_at_utc: string;
  merchant_signature: string;
}

export interface TransactionResponse {
  txn_id: string;
  status: string;
  active_offer?: UCPOffer;
  objections?: Array<{
    objection_id: string;
    condition_id: string;
    summary: string;
    detail: string;
    blocking: boolean;
    suggested_resolution?: string;
    evidence_ref?: string;
  }>;
  gate_passed?: boolean;
  step_events?: AgentStep[];
  trust_verdict?: {
    verdict?: string;
    threat_score?: number;
    explanation?: string;
    [key: string]: any;
  };
  message: string;
}

export interface AutonomyPolicy {
  max_discount_pct: number;
  margin_floor_pct: number;
  max_order_usd: number;
  buyer_reputation_floor: number;
  kill_switch_active: boolean;
  replay_mode_active: boolean;
}

export interface FraudIncident {
  incident_id: string;
  txn_id: string;
  buyer_agent_id: string;
  mandate_id: string;
  threat_score: number;
  reason: string;
  status: "QUARANTINED" | "APPROVED" | "REJECTED";
  created_at: string;
  details?: Record<string, any>;
}

export interface ServiceHealth {
  status: string;
  service: string;
  version: string;
  region: string;
  latency_ms?: number;
}
