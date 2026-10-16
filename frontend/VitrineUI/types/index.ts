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
  sequence_num?: number;
  txn_id: string;
  prev_hash?: string;
  previous_hash?: string;
  current_hash: string;
  timestamp: string;
  sku: string;
  quantity: number;
  unit_price: number;
  currency?: string;
  fulfilment_node_id: string;
  carrier_id: string;
  buyer_agent_id: string;
  mandate_id: string;
  promised_delivery_date?: string;
  gate_evaluation_id?: string;
  status?: string;
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
  trust_verdict?: {
    explanation?: string;
    threat_score?: number;
    vector?: string;
    [key: string]: any;
  };
  gate_passed: boolean;
  gate_result?: any;
  step_events: AgentStep[];
  evaluation_summary?: {
    candidate_sku?: string;
    candidate_node?: string;
    candidate_carrier?: string;
    candidate_cutoff?: string;
    candidate_transit_hours?: number;
    candidate_atp_units?: number;
    critic_verdict?: string;
    discrepancy_breakdown?: string;
    substitute_sku?: string;
    substitute_title?: string;
    matching_attributes?: string;
    full_text?: string;
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

// --- Virtual Try-On Types ---

export interface VtoProduct {
  product_id: string;
  product_name: string;
  category: string;
  size: string[];
  color: string;
  neck_type: string;
  sleeve_type: string;
  gender_category?: string;
  brand?: string;
  price: number;
  currency: string;
  stock_status: string;
  product_image_gcs_uri?: string;
  product_image_url?: string;
}

export interface VtoSession {
  session_id: string;
  state: string;
  message: string;
}

export interface VtoChatMessageResponse {
  session_id: string;
  state: string;
  message: string;
  matching_products: VtoProduct[];
  missing_attributes?: string[];
}

export interface VtoPhotoUploadResponse {
  session_id: string;
  state: string;
  message: string;
  is_valid: boolean;
  detected_person: boolean;
  preview_url?: string;
}

export interface VtoTryOnResult {
  session_id: string;
  status: string;
  try_on_image_url: string;
  product_id: string;
  disclaimer: string;
  message: string;
}

