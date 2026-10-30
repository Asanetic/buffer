"use client";

import { useEffect, useState } from "react";
import TransactionForm from "./TransactionForm";

/**
 * Props
 * - accounts, wallets, categories, currency, onSubmit  → passed straight to <TransactionForm />
 * - brand?: { name, tagline }   (default: Buffer / Quick Access)
 * - defaultCollapsed?: boolean  (desktop only)
 *
 * Desktop (md+): floating pill, bottom-centre, collapsible. Mobile: full-width bottom dock.
 * The × button hides the bar (it slides down) and leaves a floating button bottom-right; tapping that slides it back.
 * The hidden/shown choice is remembered per browser.
 * Bootstrap utilities for layout; the few rules Bootstrap lacks (fixed pill) live in the <style> below.
 */

const ACTIONS = [
  { type: "in", title: "Money In", desc: "Record money received", short: "Receive", icon: "fa-arrow-down", color: "#059669", tint: "#ecfdf5" },
  { type: "out", title: "Money Out", desc: "Record money spent", short: "Spend", icon: "fa-arrow-up", color: "#e11d48", tint: "#fff1f2" },
  { type: "transfer", title: "Transfer", desc: "Move between accounts", short: "Move money", icon: "fa-exchange", color: "#7c3aed", tint: "#f5f3ff" },
];

export default function QuickAccessBar({
  accounts,
  wallets,
  categories,
  currency = "KES",
  onSubmit,
  brand = { name: "Buffer", tagline: "Quick Access" },
  defaultCollapsed = false,
}) {
  const [active, setActive] = useState(null); // "in" | "out" | "transfer" | null
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hidden, setHidden] = useState(false);

  // Remembered per viewer; storage can be unavailable (private mode), so it's only a convenience.
  useEffect(() => {
    try { setHidden(localStorage.getItem("qab-hidden") === "1"); } catch (e) { /* ignore */ }
  }, []);
  const setHiddenPersist = (v) => {
    setHidden(v);
    try { localStorage.setItem("qab-hidden", v ? "1" : "0"); } catch (e) { /* ignore */ }
  };

  return (
    <>
      <nav aria-label="Quick access" className={`qab ${hidden ? "qab-hidden" : ""}`} aria-hidden={hidden}>
        <div className="qab-inner d-flex align-items-center">
          <div className="qab-brand align-items-center">
            <span className="qab-logo">{brand.name.charAt(0)}</span>
            <div className="ml-2 ms-2" style={{ lineHeight: 1.1 }}>
              <div className="font-weight-bold fw-bold small">{brand.name}</div>
              <small className="text-muted">{brand.tagline}</small>
            </div>
          </div>

          <div className="qab-actions d-flex align-items-center">
            {ACTIONS.map((a) => (
              <button
                key={a.type}
                type="button"
                onClick={() => setActive(a.type)}
                aria-label={a.title}
                title={a.title}
                className={`qab-btn ${collapsed ? "qab-btn-collapsed" : ""}`}
                style={{ background: a.tint }}
              >
                <span className="qab-badge" style={{ background: a.color }}>
                  <i className={`fa ${a.icon}`} aria-hidden="true" />
                </span>
                <span className="qab-text">
                  <span className="d-block font-weight-bold fw-bold small">{a.title}</span>
                  <small className="text-muted qab-desc">{a.desc}</small>
                  <small className="text-muted qab-short">{a.short}</small>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="qab-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand quick access" : "Collapse quick access"}
            aria-expanded={!collapsed}
          >
            <i className={`fa ${collapsed ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="qab-close"
            onClick={() => setHiddenPersist(true)}
            aria-label="Hide quick access"
            title="Hide"
            tabIndex={hidden ? -1 : 0}
          >
            <i className="fa fa-times" aria-hidden="true" />
          </button>
        </div>
      </nav>

      <button
        type="button"
        className={`qab-fab ${hidden ? "qab-fab-show" : ""}`}
        onClick={() => setHiddenPersist(false)}
        aria-label="Show quick access"
        title="Quick access"
        tabIndex={hidden ? 0 : -1}
      >
        <i className="fa fa-plus" aria-hidden="true" />
      </button>

      {active && (
        <TransactionForm
          type={active}
          accounts={accounts}
          wallets={wallets}
          categories={categories}
          currency={currency}
          onClose={() => setActive(null)}
          onSubmit={onSubmit}
        />
      )}

      <style jsx global>{`
        .qab { position: fixed; left: 0; right: 0; bottom: 20px; z-index: 1040; display: flex; justify-content: center; padding: 0 16px; pointer-events: none; transition: transform .3s cubic-bezier(.4,0,.2,1), opacity .25s ease, visibility 0s; }
        .qab-hidden { transform: translateY(140%); opacity: 0; visibility: hidden; transition: transform .3s cubic-bezier(.4,0,.2,1), opacity .25s ease, visibility 0s .3s; }
        .qab-hidden .qab-inner { pointer-events: none; }
        .qab-close { width: 32px; height: 32px; border: 0; border-radius: 50%; background: #f1f5f9; color: #475569; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .qab-close:hover { background: #e2e8f0; color: #0f172a; }
        .qab-fab { position: fixed; right: 20px; bottom: 20px; z-index: 1040; width: 52px; height: 52px; border: 0; border-radius: 50%; color: #fff; font-size: 18px; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #d946ef, #6d28d9); box-shadow: 0 10px 28px -6px rgba(76,29,149,.5); transform: scale(0); opacity: 0; pointer-events: none; transition: transform .3s cubic-bezier(.34,1.56,.64,1), opacity .2s ease; }
        .qab-fab-show { transform: scale(1); opacity: 1; pointer-events: auto; }
        .qab-fab:active { transform: scale(.92); }
        .qab-inner { pointer-events: auto; gap: 12px; padding: 8px 8px 8px 16px; border-radius: 999px; background: rgba(255,255,255,.88); border: 1px solid rgba(255,255,255,.7); box-shadow: 0 12px 40px -8px rgba(76,29,149,.25); backdrop-filter: blur(12px); }
        .qab-brand { display: none; padding-right: 12px; border-right: 1px solid #e2e8f0; }
        .qab-logo { width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 18px; background: linear-gradient(135deg, #d946ef, #6d28d9); }
        .qab-actions { gap: 8px; }
        .qab-btn { display: flex; align-items: center; gap: 10px; padding: 6px 18px 6px 6px; border: 0; border-radius: 999px; text-align: left; transition: transform .12s; }
        .qab-btn:active { transform: scale(.97); }
        .qab-badge { width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; box-shadow: 0 6px 14px -4px rgba(0,0,0,.35); }
        .qab-text { line-height: 1.15; }
        .qab-short { display: none; }
        .qab-toggle { width: 40px; height: 40px; border: 0; border-radius: 50%; background: #0f172a; color: #fff; display: none; align-items: center; justify-content: center; }
        @media (min-width: 768px) {
          .qab-brand { display: flex; }
          .qab-toggle { display: inline-flex; }
          .qab-btn-collapsed { padding-right: 6px; }
          .qab-btn-collapsed .qab-text { display: none; }
        }
        @media (max-width: 767.98px) {
          .qab { bottom: 0; padding: 0 8px calc(8px + env(safe-area-inset-bottom)); }
          .qab-fab { right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); }
          .qab-inner { position: relative; }
          .qab-close { position: absolute; top: -10px; right: 6px; width: 26px; height: 26px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.18); }
          .qab-inner { width: 100%; border-radius: 28px; padding: 10px 8px; }
          .qab-actions { width: 100%; justify-content: space-around; }
          .qab-btn { flex-direction: column; background: transparent !important; padding: 0; gap: 4px; }
          .qab-badge { width: 52px; height: 52px; }
          .qab-text { text-align: center; }
          .qab-desc { display: none; }
          .qab-short { display: block; font-size: 10px; margin-top: -2px; }
        }
      `}</style>
    </>
  );
}
