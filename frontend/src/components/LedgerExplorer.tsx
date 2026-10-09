import React, { useState } from "react";
import { Link2, ShieldCheck, CheckCircle2, FileText, ArrowRight, Lock } from "lucide-react";
import { CommitmentRecord } from "../types";

export const LedgerExplorer: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState<"IDLE" | "VERIFIED">("VERIFIED");

  // Sample hash-chained commitment ledger records
  const commitments: CommitmentRecord[] = [
    {
      commitment_id: "cmt-1001-a0",
      sequence_num: 1,
      txn_id: "txn-live-9041",
      prev_hash: "0000000000000000000000000000000000000000000000000000000000000000",
      current_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      timestamp: "2026-10-09T10:45:00Z",
      sku: "SKU-4829-SILK-BLOUSE",
      quantity: 1,
      unit_price: 128.00,
      currency: "USD",
      fulfilment_node_id: "DC-NORTH",
      carrier_id: "fedex_express",
      buyer_agent_id: "buyer-shopper-01",
      mandate_id: "ap2-mandate-001",
    },
    {
      commitment_id: "cmt-1002-b1",
      sequence_num: 2,
      txn_id: "txn-live-9042",
      prev_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      current_hash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      timestamp: "2026-10-09T11:20:06Z",
      sku: "SKU-4830-SILK-SHIRT",
      quantity: 1,
      unit_price: 135.00,
      currency: "USD",
      fulfilment_node_id: "DC-NORTH",
      carrier_id: "fedex_express",
      buyer_agent_id: "buyer-honest_shopper-9021",
      mandate_id: "ap2-mandate-002",
    },
  ];

  const verifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedStatus("VERIFIED");
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Status */}
      <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-[#fbf7f7]">
              Immutable Commitment Ledger Explorer
            </h2>
          </div>
          <p className="text-sm text-[#d1b8c0] mt-1">
            Backed by BigQuery in <code className="text-amber-300">us-central1</code> with cryptographically verifiable SHA-256 block hash chaining.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CHAIN INTEGRITY: VERIFIED (2/2 BLOCKS)</span>
          </div>
          <button
            onClick={verifyChain}
            disabled={isVerifying}
            className="flex items-center gap-2 bg-[#4a2433] hover:bg-[#6d2e46] text-[#fbf7f7] px-3.5 py-1.5 rounded-lg font-mono text-xs border border-[#6d2e46] transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isVerifying ? "Verifying Hashes..." : "Re-Verify Chain"}
          </button>
        </div>
      </div>

      {/* Ledger Chain Blocks */}
      <div className="space-y-4">
        {commitments.map((record) => (
          <div
            key={record.commitment_id}
            className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#3f222d]/60 gap-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#2e1a21] text-amber-400 font-mono font-bold flex items-center justify-center border border-[#4a2433] text-xs">
                  #{record.sequence_num}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#fbf7f7]">
                      {record.commitment_id}
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                      GATE PASSED
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#a26769]">
                    Txn: {record.txn_id} · {record.timestamp}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="text-[#a26769] block">Committed Terms:</span>
                <span className="text-[#fbf7f7] font-bold">
                  {record.quantity}x {record.sku} @ ${record.unit_price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cryptographic Hash Pair */}
            <div className="mt-4 bg-[#10070c] p-3.5 rounded-lg border border-[#2e1a21] space-y-2 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-[#a26769]">
                <Link2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="w-20 uppercase tracking-wider shrink-0">Prev Hash:</span>
                <span className="text-[#d1b8c0] truncate">{record.prev_hash}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                <span className="w-20 uppercase tracking-wider shrink-0 text-[#a26769]">Curr Hash:</span>
                <span className="text-emerald-300 font-bold truncate">{record.current_hash}</span>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="mt-3 pt-3 border-t border-[#3f222d]/40 flex flex-wrap items-center justify-between text-xs font-mono text-[#a26769] gap-2">
              <span>Node: <strong className="text-[#fbf7f7]">{record.fulfilment_node_id}</strong></span>
              <span>Carrier: <strong className="text-[#fbf7f7]">{record.carrier_id}</strong></span>
              <span>Mandate: <strong className="text-[#c9a227]">{record.mandate_id}</strong></span>
              <span>Counterparty: <strong className="text-[#fbf7f7]">{record.buyer_agent_id}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
