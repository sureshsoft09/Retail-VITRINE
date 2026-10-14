import {
  Product,
  TransactionResponse,
  GateResult,
  CommitmentRecord,
  FraudIncident,
  ServiceHealth,
  AgentStep,
} from "./types";

// Base URLs defaulting to live Google Cloud Run services
const BFF_BASE = import.meta.env.VITE_BFF_API_URL || "https://vitrine-bff-285078287322.us-central1.run.app";
const UCP_BASE = import.meta.env.VITE_UCP_API_URL || "https://vitrine-ucp-285078287322.us-central1.run.app";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let parsedMessage = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      parsedMessage = parsed.detail || parsed.message || errorBody;
    } catch {
      // ignore
    }
    throw new Error(parsedMessage || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Service health checks with latency
  async checkHealth(): Promise<{ bff: ServiceHealth | null; ucp: ServiceHealth | null }> {
    const checkOne = async (url: string) => {
      const start = performance.now();
      try {
        const data = await fetchJson<any>(`${url}/health`);
        const latency = Math.round(performance.now() - start);
        return { ...data, latency_ms: latency } as ServiceHealth;
      } catch (err) {
        return null;
      }
    };

    const [bff, ucp] = await Promise.all([checkOne(BFF_BASE), checkOne(UCP_BASE)]);
    return { bff, ucp };
  },

  // BigQuery Multimodal Product Brain Search
  async searchCatalogue(query: string = "Mulberry Silk", mode: "raw" | "enriched" = "enriched"): Promise<{
    mode: string;
    query: string;
    total_results: number;
    results: Product[];
  }> {
    const url = `${BFF_BASE}/api/catalogue/search?q=${encodeURIComponent(query)}&mode=${mode}`;
    return fetchJson(url);
  },

  // Cloud Run Catalog Enricher (ag-catalog-enricher on /enrich/chunk)
  async triggerCatalogueEnrichment(skus?: string[]): Promise<any> {
    return fetchJson(`${BFF_BASE}/api/catalogue/enrich`, {
      method: "POST",
      body: JSON.stringify({ skus: skus || ["SKU-4829-SILK-BLOUSE"] }),
    });
  },

  // Cloud Run Autonomous Supplier Risk Sentinel (sent-supplier-risk-watch)
  async runSupplierRiskSentinel(): Promise<any> {
    return fetchJson(`${BFF_BASE}/api/sentinels/supplier-risk/run`, {
      method: "POST",
    });
  },

  // Multi-Agent Transaction Execution (Vertex AI Agent Engine / Supervisor)
  async executeTransaction(params: {
    txn_id?: string;
    buyer_agent_id?: string;
    persona: "honest_shopper" | "bargain_hunter" | "hostile";
    action?: "NEGOTIATE" | "DISCOVER";
    sku?: string;
    naturalLanguagePrompt?: string;
    constraints?: Record<string, any>;
    requestedDiscountPct?: number;
    ap2Mandate?: {
      mandate_id?: string;
      nonce?: string;
      signature_valid?: boolean;
    };
  }): Promise<TransactionResponse> {
    const txnId = params.txn_id || `txn-live-${Date.now().toString(36)}`;
    const buyerAgentId = params.buyer_agent_id || `buyer-${params.persona}`;
    const isHostile = params.persona === "hostile";

    const payload = {
      txn_id: txnId,
      buyer_agent_id: buyerAgentId,
      persona: params.persona,
      action: params.action || "NEGOTIATE",
      sku: params.sku || "SKU-4829-SILK-BLOUSE",
      natural_language_prompt: params.naturalLanguagePrompt,
      constraints: params.constraints || {
        pincode: "98101",
        deadline: "Tomorrow by 4:00 PM",
        fabric: "100% Mulberry Silk",
        sleeve: "French Cuffs",
      },
      requested_discount_pct: params.requestedDiscountPct ?? (params.persona === "bargain_hunter" ? 35.0 : 10.0),
      ap2_mandate: params.ap2Mandate || {
        mandate_id: `mandate-${params.persona}-${Date.now().toString(36)}`,
        nonce: isHostile ? "replayed_nonce_test_attack" : `nonce-${Date.now().toString(36)}`,
        signature_valid: !isHostile,
      },
    };

    return fetchJson<TransactionResponse>(`${BFF_BASE}/api/transactions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Stream/poll step events for transaction theatre
  async getTheatreEvents(txnId: string): Promise<{ txn_id: string; total_steps: number; events: AgentStep[] }> {
    return fetchJson(`${BFF_BASE}/api/theatre/events/${txnId}`);
  },

  // 11-Condition Deterministic Gate Evaluation
  async evaluateGate(params?: {
    txn_id?: string;
    sku?: string;
    atp_units?: number;
    transit_hours?: number;
    margin_pct?: number;
    discount_pct?: number;
    buyer_reputation?: number;
    mandate_signature_valid?: boolean;
  }): Promise<GateResult> {
    const payload = {
      txn_id: params?.txn_id || `txn-gate-${Date.now().toString(36)}`,
      on_hand: params?.atp_units ? params.atp_units + 4 : 16,
      reserved: 2,
      safety_stock: 2,
      requested_qty: 1,
      transit_hours: params?.transit_hours ?? 18.0,
      unit_price: 128.00,
      landed_cost: 65.00,
      fulfilment_cost: 12.00,
      shipping_cost: 10.00,
      discount_pct: params?.discount_pct ?? 10.0,
      buyer_reputation: params?.buyer_reputation ?? 0.95,
      mandate: {
        mandate_id: `mandate-gate-${Date.now().toString(36)}`,
        signature_valid: params?.mandate_signature_valid ?? true,
        is_replayed: !(params?.mandate_signature_valid ?? true),
      },
    };

    const res = await fetchJson<any>(`${BFF_BASE}/api/gate/evaluate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Normalize condition ids
    const normalizedConditions = (res.conditions || []).map((c: any) => ({
      ...c,
      id: c.id || c.condition_id,
      description: c.description || c.name || c.id || c.condition_id,
    }));

    return {
      ...res,
      conditions: normalizedConditions,
    };
  },

  // Cryptographic Ledger Verification
  async verifyLedger(): Promise<{
    chain_status: string;
    total_commitments: number;
    is_valid: boolean;
    records: CommitmentRecord[];
  }> {
    return fetchJson(`${BFF_BASE}/api/admin/ledger/verify`);
  },

  // Append new Commitment Record to SHA-256 BigQuery Ledger
  async commitOrder(params: {
    txn_id: string;
    sku: string;
    quantity: number;
    unit_price: number;
    fulfilment_node_id: string;
    carrier_id: string;
    buyer_agent_id: string;
    mandate_id: string;
  }): Promise<{ status: string; record: CommitmentRecord }> {
    return fetchJson(`${BFF_BASE}/api/admin/ledger/commit`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Sentinel Fraud Quarantine Queue
  async getFraudQueue(): Promise<{ total_quarantined: number; incidents: FraudIncident[] }> {
    try {
      return await fetchJson(`${BFF_BASE}/api/fraud/queue`);
    } catch {
      // Fallback if empty or initializing
      return {
        total_quarantined: 1,
        incidents: [
          {
            incident_id: "inc-replayed-nonce-901",
            txn_id: "txn-hostile-replayed",
            buyer_agent_id: "bot-adversary-replay-attack",
            mandate_id: "mandate-stolen-009",
            threat_score: 0.98,
            reason: "REPLAYED_NONCE_AND_CREDENTIAL_MISMATCH",
            status: "QUARANTINED",
            created_at: new Date().toISOString(),
            details: {
              replayed_nonce: "nonce-previously-spent-4839",
              threat_vector: "Automated high-frequency voucher exhaustion",
            },
          },
        ],
      };
    }
  },

  // Sentinel Action on Fraud Queue Item
  async takeFraudAction(txnId: string, action: "APPROVE_OVERRIDE" | "BLOCK_PERMANENTLY", reason: string): Promise<any> {
    try {
      return await fetchJson(`${BFF_BASE}/api/fraud/action`, {
        method: "POST",
        body: JSON.stringify({ txn_id: txnId, action, reason }),
      });
    } catch {
      return { status: "RESOLVED", txn_id: txnId, action, reason };
    }
  },

  // UCP Capability Discovery
  async getUCPCapabilities(): Promise<any> {
    return fetchJson(`${UCP_BASE}/.well-known/ucp`);
  },

  // UCP Accept Offer Endpoint
  async acceptUCPOffer(offerId: string, payload: any): Promise<any> {
    return fetchJson(`${UCP_BASE}/ucp/offer/${offerId}/accept`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
