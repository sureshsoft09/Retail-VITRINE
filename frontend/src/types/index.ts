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
}

export interface AutonomyPolicy {
  max_discount_pct: number;
  margin_floor_pct: number;
  max_order_usd: number;
  buyer_reputation_floor: number;
  kill_switch_active: boolean;
  replay_mode_active: boolean;
}
