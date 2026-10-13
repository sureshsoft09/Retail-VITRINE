import React, { useState } from "react";
import { Header, NavTab } from "./components/Header";
import { TransactionTheatre } from "./components/TransactionTheatre";
import { ProductBrain } from "./components/ProductBrain";
import { PromiseInspector } from "./components/PromiseInspector";
import { LedgerExplorer } from "./components/LedgerExplorer";
import { ControlTower } from "./components/ControlTower";
import { FraudQueue } from "./components/FraudQueue";
import { GovernanceConsole } from "./components/GovernanceConsole";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("theatre");

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Sticky Header with Navigation & Cloud Badges */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "theatre" && <TransactionTheatre />}
        {activeTab === "brain" && <ProductBrain />}
        {activeTab === "promise" && <PromiseInspector />}
        {activeTab === "ledger" && <LedgerExplorer />}
        {activeTab === "tower" && <ControlTower />}
        {activeTab === "fraud" && <FraudQueue />}
        {activeTab === "governance" && <GovernanceConsole />}
      </main>

      {/* Persistent Global Footer */}
      <footer className="border-t border-slate-800 bg-[#0c101a] py-5 text-xs font-mono text-slate-400 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span className="text-slate-300">
            VITRINE Architecture: 1 Vertex AI Agent Engine (multi-turn transaction) + 1 Cloud Run ADK Host (us-central1)
          </span>
          <span className="text-indigo-400 font-semibold">
            Universal Commerce Protocol (UCP) · Agent Payment Protocol (AP2) · Agent-to-Agent (A2A)
          </span>
        </div>
      </footer>
    </div>
  );
}
