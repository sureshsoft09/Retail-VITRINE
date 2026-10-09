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
    <div className="min-h-screen bg-[#0d070a] text-[#fbf7f7] flex flex-col selection:bg-[#6d2e46] selection:text-amber-200">
      {/* Sticky Header with Navigation & Cloud Badges */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "theatre" && <TransactionTheatre />}
        {activeTab === "brain" && <ProductBrain />}
        {activeTab === "promise" && <PromiseInspector />}
        {activeTab === "ledger" && <LedgerExplorer />}
        {activeTab === "tower" && <ControlTower />}
        {activeTab === "fraud" && <FraudQueue />}
        {activeTab === "governance" && <GovernanceConsole />}
      </main>

      {/* Persistent Global Footer */}
      <footer className="border-t border-[#2e1a21] bg-[#12070c] py-4 text-xs font-mono text-[#a26769] text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            VITRINE Architecture: 1 Vertex AI Agent Engine (multi-turn transaction) + 1 Cloud Run ADK Host (us-central1)
          </span>
          <span className="text-[#c9a227]">
            Standards: Universal Commerce Protocol (UCP) · Agent Payment Protocol (AP2) · Agent-to-Agent (A2A)
          </span>
        </div>
      </footer>
    </div>
  );
}
