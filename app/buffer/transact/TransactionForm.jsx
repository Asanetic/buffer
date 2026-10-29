"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Config – one place that drives all three variants                          */
/* -------------------------------------------------------------------------- */

const VARIANTS = {
  in: {
    title: "Money In",
    subtitle: "Record money received into your account",
    shortSubtitle: "Record money received",
    cta: "Record Money In",
    icon: "arrowDown",
    accountLabel: "Account",
    partyLabel: "Received From",
    partyPlaceholder: "Client Payment",
    notePlaceholder: "e.g. Payment for project",
    vars: { "--tf-accent": "#16a34a", "--tf-accent-dark": "#15803d", "--tf-tint": "#ecfdf3", "--tf-ring": "rgba(22,163,74,.18)" },
  },
  out: {
    title: "Money Out",
    subtitle: "Record money spent from your account",
    shortSubtitle: "Record money spent",
    cta: "Record Money Out",
    icon: "arrowUp",
    accountLabel: "Account",
    partyLabel: "Paid To",
    partyPlaceholder: "Supermarket",
    notePlaceholder: "e.g. Groceries and household items",
    vars: { "--tf-accent": "#f43f5e", "--tf-accent-dark": "#e11d48", "--tf-tint": "#fff1f3", "--tf-ring": "rgba(244,63,94,.18)" },
  },
  transfer: {
    title: "Transfer",
    subtitle: "Move money between your accounts",
    shortSubtitle: "Move money between accounts",
    cta: "Transfer Money",
    icon: "swap",
    accountLabel: "From Account",
    partyLabel: "",
    partyPlaceholder: "",
    notePlaceholder: "e.g. Monthly savings",
    vars: { "--tf-accent": "#7c3aed", "--tf-accent-dark": "#6d28d9", "--tf-tint": "#f5f0ff", "--tf-ring": "rgba(124,58,237,.18)" },
  },
};

const DEFAULT_CATEGORIES = {
  in: [
    { id: "business", name: "Business Income", icon: "briefcase" },
    { id: "salary", name: "Salary", icon: "cash" },
    { id: "other-in", name: "Other Income", icon: "tag" },
  ],
  out: [
    { id: "shopping", name: "Shopping", icon: "cart" },
    { id: "bills", name: "Bills & Utilities", icon: "tag" },
    { id: "transport", name: "Transport", icon: "tag" },
    { id: "other-out", name: "Other Expense", icon: "tag" },
  ],
  transfer: [
    { id: "savings", name: "Savings", icon: "swap" },
    { id: "bills-fund", name: "Bills Fund", icon: "swap" },
    { id: "other-tr", name: "Other", icon: "swap" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Scoped styles (Bootstrap handles the rest)                                 */
/* -------------------------------------------------------------------------- */

const CSS = `
.tf-overlay{position:fixed;inset:0;z-index:1055;display:flex;align-items:stretch;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(4px)}
.tf-card{display:flex;flex-direction:column;width:100%;height:100%;background:#fff}
.tf-inline{height:auto;border-radius:1rem;box-shadow:0 10px 30px rgba(0,0,0,.12);overflow:hidden;max-width:480px}
@media(min-width:768px){
  .tf-overlay{align-items:center;padding:1rem}
  .tf-card{height:auto;max-width:480px;max-height:calc(100vh - 2rem);border-radius:1rem;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.25)}
}
.tf-header{background:linear-gradient(to bottom,var(--tf-tint),#fff)}
.tf-badge{width:44px;height:44px;flex-shrink:0;border-radius:50%;background:var(--tf-accent);color:#fff;display:flex;align-items:center;justify-content:center}
.tf-body{flex:1;overflow-y:auto}
.tf-control{display:flex;align-items:center;height:48px;border:1px solid #dee2e6;border-radius:.75rem;background:#fff;transition:border-color .15s,box-shadow .15s}
.tf-control:focus-within,.tf-control.tf-open{border-color:var(--tf-accent);box-shadow:0 0 0 .25rem var(--tf-ring)}
.tf-control.tf-invalid{border-color:#dc3545}
.tf-control input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;padding:0 .75rem;font-size:.95rem;color:#212529}
.tf-control input::placeholder{color:#adb5bd}
.tf-prefix{display:flex;align-items:center;height:100%;padding:0 .75rem;border-right:1px solid #dee2e6;background:#f8f9fa;border-radius:.75rem 0 0 .75rem;font-weight:600;font-size:.85rem;color:#6c757d}
.tf-amount input{font-weight:600;font-size:1.05rem}
.tf-select{position:relative}
.tf-select-btn{width:100%;border:0;background:transparent;height:100%;padding:0 .75rem;display:flex;align-items:center;gap:.65rem;text-align:left;border-radius:.75rem}
.tf-ico{width:28px;height:28px;flex-shrink:0;border-radius:.5rem;background:#f1f3f5;color:#343a40;display:flex;align-items:center;justify-content:center}
.tf-menu{position:absolute;z-index:20;top:calc(100% + 4px);left:0;right:0;max-height:230px;overflow:auto;background:#fff;border:1px solid #dee2e6;border-radius:.75rem;padding:.25rem;box-shadow:0 8px 24px rgba(0,0,0,.12);list-style:none;margin:0}
.tf-opt{width:100%;border:0;background:transparent;display:flex;align-items:center;gap:.65rem;padding:.5rem .6rem;border-radius:.5rem;text-align:left}
.tf-opt:hover,.tf-opt.active{background:#f8f9fa}
.tf-cta{height:48px;border:0;border-radius:.75rem;background:var(--tf-accent);color:#fff;font-weight:600;font-size:1rem;display:flex;align-items:center;justify-content:center;gap:.5rem;width:100%;transition:background .15s}
.tf-cta:hover:not(:disabled){background:var(--tf-accent-dark)}
.tf-cta:focus-visible{outline:0;box-shadow:0 0 0 .25rem var(--tf-ring)}
.tf-cta:disabled{opacity:.6}
.tf-footer{padding:.75rem 1rem max(1rem,env(safe-area-inset-bottom));border-top:1px solid #f1f3f5;background:#fff}
@media(min-width:768px){.tf-footer{border-top:0;padding:0 1.5rem 1.5rem}}
.tf-toggle{display:flex;padding:3px;border-radius:.75rem;background:#f1f3f5}
.tf-toggle-btn{flex:1;border:0;background:transparent;border-radius:.6rem;padding:.4rem .5rem;font-weight:600;font-size:.85rem;color:#6c757d}
.tf-toggle-btn.active{background:#fff;color:var(--tf-accent);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.tf-icon-btn{border:0;background:transparent;border-radius:50%;padding:.4rem;color:#495057;line-height:0}
.tf-icon-btn:hover{background:rgba(0,0,0,.06)}
`;

/* -------------------------------------------------------------------------- */
/*  Tiny icon set (no dependencies)                                            */
/* -------------------------------------------------------------------------- */

const PATHS = {
  arrowDown: <path d="M12 5v14m0 0l-6-6m6 6l6-6" />,
  arrowUp: <path d="M12 19V5m0 0l-6 6m6-6l6 6" />,
  swap: <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4m4 4H7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M15 18l-6-6 6-6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  note: (
    <>
      <path d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />,
  bank: <path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />,
  cash: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
      <path d="M2 3h3l2.6 12.2a1 1 0 001 .8h9.2a1 1 0 001-.8L20.5 8H6" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9z" />
      <circle cx="8" cy="8" r="1.2" />
    </>
  ),
};

function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

function Field({ label, required, error, children }) {
  return (
    <div className="row g-1 g-md-2 align-items-center mb-3">
      <label className="col-12 col-md-3 fw-medium small text-body-secondary mb-0">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      <div className="col-12 col-md-9">
        {children}
        {error && <div className="text-danger small mt-1">{error}</div>}
      </div>
    </div>
  );
}

function Select({ value, options, onChange, placeholder, invalid, creatable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  // A typed-in value has no matching option, so show the value itself as the label.
  const selected = options.find((o) => o.id === value) ?? (creatable && value ? { id: value, label: value } : undefined);
  const q = query.trim();
  const shown = creatable && q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const canCreate = creatable && q && !options.some((o) => o.label.toLowerCase() === q.toLowerCase());

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="tf-select">
      <div className={`tf-control ${open ? "tf-open" : ""} ${invalid ? "tf-invalid" : ""}`}>
        <button
          type="button"
          className="tf-select-btn"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {selected?.icon && (
            <span className="tf-ico">
              <Icon name={selected.icon} size={16} />
            </span>
          )}
          <span className={`flex-grow-1 text-truncate fw-medium ${selected ? "text-body" : "text-secondary"}`}>
            {selected ? selected.label : placeholder}
          </span>
          {selected?.meta && <span className="small text-secondary d-none d-sm-inline">{selected.meta}</span>}
          <Icon name="chevron" size={16} className="text-secondary flex-shrink-0" />
        </button>
      </div>

      {open && (
        <ul className="tf-menu" role="listbox">
          {creatable && (
            <li className="p-1">
              <input
                autoFocus
                className="form-control form-control-sm"
                placeholder="Search or type a new one…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault(); // don't submit the form
                  if (canCreate) { onChange(q); setOpen(false); setQuery(""); }
                  else if (shown.length === 1) { onChange(shown[0].id); setOpen(false); setQuery(""); }
                }}
              />
            </li>
          )}
          {canCreate && (
            <li>
              <button type="button" className="tf-opt fw-medium" onClick={() => { onChange(q); setOpen(false); setQuery(""); }}>
                <span className="tf-ico"><Icon name="tag" size={16} /></span>
                <span className="flex-grow-1 text-truncate">Add “{q}”</span>
              </button>
            </li>
          )}
          {shown.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                className={`tf-opt ${o.id === value ? "active" : ""}`}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {o.icon && (
                  <span className="tf-ico">
                    <Icon name={o.icon} size={16} />
                  </span>
                )}
                <span className="flex-grow-1 text-truncate fw-medium">{o.label}</span>
                {o.meta && <span className="small text-secondary">{o.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Props:
 *  type        "in" | "out" | "transfer"
 *  accounts    [{ id, name, balance, icon? }]
 *  wallets     [{ id, name, balance, icon? }]  (optional — shows an Account / Wallet toggle when given)
 *  categories  { in?: [...], out?: [...], transfer?: [...] }  (optional override)
 *  currency    default "KES"
 *  asModal     default true  (modal on desktop, full-screen sheet on mobile)
 *  open        default true
 *  onClose     () => void
 *  onSubmit    (payload) => void | Promise<void>
 */
export default function TransactionForm({
  type,
  accounts = [],
  wallets = [],
  categories,
  currency = "KES",
  asModal = true,
  open = true,
  onClose,
  onSubmit,
}) {
  const [kind, setKind] = useState("account"); // "account" | "wallet"
  const v = VARIANTS[type];
  const hasWallets = wallets.length > 0;
  const isWallet = kind === "wallet" && hasWallets;
  const list = isWallet ? wallets : accounts;
  const noun = isWallet ? "Wallet" : "Account";
  const cats = categories?.[type] ?? DEFAULT_CATEGORIES[type];
  const fmt = (n) => `${currency} ${Number(n).toLocaleString("en-KE")}`;

  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [party, setParty] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Reset whenever the variant changes or the form is (re)opened
  useEffect(() => {
    setKind("account");
    setAccountId(accounts[0]?.id ?? "");
    setToAccountId("");
    setAmount("");
    setCategoryId("");
    setParty("");
    setDate(today());
    setNote("");
    setErrors({});
    setSubmitError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, open]);

  // Esc to close + lock body scroll while the modal is open
  useEffect(() => {
    if (!asModal || !open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [asModal, open, onClose]);

  const switchKind = (k) => {
    if (k === kind) return;
    setKind(k);
    setAccountId((k === "wallet" ? wallets : accounts)[0]?.id ?? "");
    setToAccountId("");
    setErrors({});
  };

  const accountOptions = useMemo(
    () =>
      list.map((a) => ({
        id: a.id,
        label: a.name,
        meta: `Balance: ${fmt(a.balance)}`,
        icon: a.icon || "bank",
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, currency]
  );

  const categoryOptions = cats.map((c) => ({ id: c.id, label: c.name, icon: c.icon || "tag" }));

  const validate = () => {
    const e = {};
    const amt = Number(String(amount).replace(/,/g, ""));
    const from = list.find((a) => a.id === accountId);

    if (!accountId) e.account = `Select ${noun.toLowerCase() === "wallet" ? "a wallet" : "an account"}`;
    if (!amt || amt <= 0) e.amount = "Enter an amount greater than 0";
    else if (type !== "in" && from && amt > from.balance) e.amount = "Amount exceeds available balance";
    if (!categoryId) e.category = "Select a category";
    if (type === "transfer") {
      if (!toAccountId) e.toAccount = `Select a destination ${noun.toLowerCase()}`;
      else if (toAccountId === accountId) e.toAccount = `Choose a different ${noun.toLowerCase()}`;
    }
    if (!date) e.date = "Pick a date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit?.({
        type,
        kind: isWallet ? "wallet" : "account",
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        amount: Number(String(amount).replace(/,/g, "")),
        categoryId,
        party: type === "transfer" ? undefined : party.trim() || undefined,
        date,
        note: note.trim() || undefined,
      });
      onClose?.();
    } catch (err) {
      setSubmitError(err?.message || "Could not save the transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const card = (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`tf-card ${asModal ? "" : "tf-inline"}`}
      style={v.vars}
    >
      {/* Header */}
      <header className="tf-header d-flex align-items-center gap-3 px-3 px-md-4 pt-3 pt-md-4 pb-3">
        {onClose && (
          <button type="button" className="tf-icon-btn d-md-none ms-n1" onClick={onClose} aria-label="Back">
            <Icon name="back" />
          </button>
        )}
        <span className="tf-badge">
          <Icon name={v.icon} size={22} />
        </span>
        <div className="flex-grow-1 min-w-0">
          <h2 className="h5 fw-bold mb-0">{v.title}</h2>
          <p className="small text-secondary mb-0 text-truncate">
            <span className="d-md-none">{v.shortSubtitle}</span>
            <span className="d-none d-md-inline">{v.subtitle}</span>
          </p>
        </div>
        {onClose && (
          <button type="button" className="tf-icon-btn d-none d-md-block" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        )}
      </header>

      {/* Body */}
      <div className="tf-body px-3 px-md-4 pt-2 pb-2">
        {hasWallets && (
          <div className="tf-toggle mb-3" role="tablist" aria-label="Ledger">
            {["account", "wallet"].map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                className={`tf-toggle-btn ${kind === k ? "active" : ""}`}
                onClick={() => switchKind(k)}
              >
                {k === "account" ? "Account" : "Wallet"}
              </button>
            ))}
          </div>
        )}
        <Field label={type === "transfer" ? `From ${noun}` : noun} required error={errors.account}>
          <Select
            value={accountId}
            options={accountOptions}
            onChange={setAccountId}
            placeholder={`Select ${noun.toLowerCase()}`}
            invalid={!!errors.account}
          />
        </Field>

        {type === "transfer" && (
          <Field label={`To ${noun}`} required error={errors.toAccount}>
            <Select
              value={toAccountId}
              options={accountOptions.filter((o) => o.id !== accountId)}
              onChange={setToAccountId}
              placeholder="Select destination"
              invalid={!!errors.toAccount}
            />
          </Field>
        )}

        <Field label="Amount" required error={errors.amount}>
          <div className={`tf-control tf-amount ${errors.amount ? "tf-invalid" : ""}`}>
            <span className="tf-prefix">{currency}</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="0"
            />
          </div>
        </Field>

        <Field label="Category" required error={errors.category}>
          <Select
            value={categoryId}
            options={categoryOptions}
            onChange={setCategoryId}
            placeholder="Select or type a category"
            invalid={!!errors.category}
            creatable
          />
        </Field>

        {type !== "transfer" && (
          <Field label={v.partyLabel}>
            <div className="tf-control">
              <Icon name="user" className="ms-3 flex-shrink-0" />
              <input value={party} onChange={(e) => setParty(e.target.value)} placeholder={v.partyPlaceholder} />
            </div>
          </Field>
        )}

        <Field label="Date" error={errors.date}>
          <div className={`tf-control ${errors.date ? "tf-invalid" : ""}`}>
            <Icon name="calendar" className="ms-3 flex-shrink-0" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </Field>

        <Field label="Note (optional)">
          <div className="tf-control">
            <Icon name="note" className="ms-3 flex-shrink-0 text-secondary" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={v.notePlaceholder} />
          </div>
        </Field>
        {submitError && <div className="alert alert-danger py-2 small mb-2">{submitError}</div>}
      </div>

      {/* Footer – pinned to the bottom on mobile */}
      <footer className="tf-footer">
        <button type="submit" className="tf-cta" disabled={submitting}>
          <Icon name={v.icon} size={20} />
          {submitting ? "Saving…" : v.cta}
        </button>
      </footer>
    </form>
  );

  if (!asModal) {
    return (
      <>
        <style>{CSS}</style>
        {card}
      </>
    );
  }
  if (!open) return null;

  return (
    <>
      <style>{CSS}</style>
      <div
        className="tf-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={v.title}
        onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      >
        {card}
      </div>
    </>
  );
}
