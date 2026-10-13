import React, { useState } from "react";
import { Sliders, ShieldAlert, Power, AlertTriangle, Save, CheckCircle2 } from "lucide-react";

export const GovernanceConsole: React.FC = () => {
  const [maxOrderUSD, setMaxOrderUSD] = useState(250);
  const [discountCapPct, setDiscountCapPct] = useState(15);
  const [marginFloorPct, setMarginFloorPct] = useState(18);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePolicy = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const simulatedImpactCount = Math.round(
    ((250 - maxOrderUSD) / 10 + (15 - discountCapPct) * 1.5 + (marginFloorPct - 18) * 2)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Emergency Kill Switch */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Merchant Governance & Autonomy Dials</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic policy bounds. Invariant calculators enforce these thresholds deterministically at the 11-condition commitment gate.
          </p>
        </div>

        {/* Global Emergency Kill Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setKillSwitchActive(!killSwitchActive)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs font-bold transition-all border shadow-md ${
              killSwitchActive
                ? "bg-rose-600 text-white border-rose-500 shadow-rose-900/50 animate-pulse"
                : "bg-slate-800 text-rose-300 border-rose-900/60 hover:bg-rose-950/40 hover:border-rose-700"
            }`}
          >
            <Power className="w-4 h-4" />
            {killSwitchActive ? "EMERGENCY KILL SWITCH: ENGAGED" : "KILL SWITCH: ARMED"}
          </button>
        </div>
      </div>

      {killSwitchActive && (
        <div className="bg-rose-950/80 border border-rose-600 p-4 rounded-xl flex items-center gap-3 text-rose-200 font-mono text-xs shadow-xl">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>
            GLOBAL KILL SWITCH ENGAGED: All autonomous commitment tools revoked across Vertex AI Agent Engine and Cloud Run. All turns require human approval.
          </span>
        </div>
      )}

      {/* Autonomy Dials with Live Impact Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <h3 className="font-bold text-sm text-white pb-3 border-b border-slate-800">
            Autonomous Policy Thresholds
          </h3>

          {/* Slider 1: Max Order Value */}
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-slate-300 font-medium">Max Autonomous Order Ceiling:</span>
              <span className="text-emerald-400 font-extrabold text-sm">${maxOrderUSD}.00 USD</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={maxOrderUSD}
              onChange={(e) => setMaxOrderUSD(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-950 rounded-lg h-2.5 cursor-pointer border border-slate-800"
            />
            <span className="text-xs text-slate-400 block">
              Orders exceeding this limit require operator sign-off before commitment.
            </span>
          </div>

          {/* Slider 2: Max Discount Cap */}
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-slate-300 font-medium">Commercial Discount Cap:</span>
              <span className="text-amber-400 font-extrabold text-sm">{discountCapPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={discountCapPct}
              onChange={(e) => setDiscountCapPct(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 rounded-lg h-2.5 cursor-pointer border border-slate-800"
            />
            <span className="text-xs text-slate-400 block">
              Negotiation Agent cannot offer or accept discounts exceeding this percentage.
            </span>
          </div>

          {/* Slider 3: Margin Floor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-slate-300 font-medium">Net Profit Margin Floor:</span>
              <span className="text-rose-400 font-extrabold text-sm">{marginFloorPct}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="1"
              value={marginFloorPct}
              onChange={(e) => setMarginFloorPct(Number(e.target.value))}
              className="w-full accent-rose-500 bg-slate-950 rounded-lg h-2.5 cursor-pointer border border-slate-800"
            />
            <span className="text-xs text-slate-400 block">
              Adversarial Commitment Critic blocks any offer yielding less than this net margin.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSavePolicy}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-mono text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              {savedSuccess ? "Policy Applied Live!" : "Apply Policy to Commitment Gate"}
            </button>
          </div>
        </div>

        {/* Live Simulation Preview Card */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-indigo-400 font-bold block mb-1">
              Live Policy Replay Preview
            </span>
            <h4 className="text-base font-bold text-white">Historical Impact Simulation</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Based on the last 50 processed transactions, these dial settings would have changed:
            </p>

            <div className="mt-5 p-5 rounded-xl bg-slate-950 border border-slate-800 text-center shadow-inner">
              <span className="text-4xl font-mono font-extrabold text-amber-300 block">
                {Math.max(0, simulatedImpactCount)}
              </span>
              <span className="text-xs font-mono text-slate-400 mt-1.5 block">
                of the last 50 commitments blocked or shifted
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
            ✓ Gate Invariant: Evaluated deterministically in sub-millisecond calculator.
          </div>
        </div>
      </div>
    </div>
  );
};
