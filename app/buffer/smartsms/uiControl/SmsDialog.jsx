"use client";

import React, { useEffect, useState } from "react";

/**
 * Friendly dialog bodies for MosyCard.
 *
 *  <SmsDialog tone icon title text note={{title, sub}} detail="technical text" actions={[{ label, icon, variant, onClick }]} />
 *  <SmsBusy title text />            -> spinner + elapsed seconds, no buttons (processing state)
 *
 *  MosyCard('', <SmsDialog .../>, true, 'smartmodaldefaultId', 'sms-dialog')
 */

const TONES = {
  danger: { tile: "#fde2e4", color: "#f43f5e" },
  primary: { tile: "#ede9fe", color: "#7c3aed" },
  success: { tile: "#d9f7e4", color: "#16a34a" },
  warning: { tile: "#fdecc8", color: "#d97706" },
};

const CSS = `
.smsd{text-align:center;padding:4px 8px 8px}
.smsd-tile{width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:30px}
.smsd-title{font-size:1.7rem;font-weight:800;color:#12122b;margin:0 0 10px;letter-spacing:-.01em}
.smsd-text{font-size:1.05rem;color:#23233b;margin:0 0 18px;white-space:pre-line}
.smsd-note{display:flex;gap:14px;align-items:flex-start;text-align:left;background:#f4effd;border-radius:16px;padding:16px 18px;margin-bottom:22px}
.smsd-note i{color:#9333ea;font-size:24px;margin-top:2px}
.smsd-note b{display:block;font-weight:500;color:#1f1f33;font-size:.98rem}
.smsd-note span{display:block;color:#7b7a92;font-size:.9rem;margin-top:2px}
.smsd-where{display:inline-block;font-size:.8rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:4px 12px;margin-bottom:12px;background:#f1f1f7;color:#4b4b66}
.smsd-detail{text-align:left;margin:-8px 0 20px}
.smsd-detail summary{cursor:pointer;color:#7b7a92;font-size:.9rem;text-align:center}
.smsd-detail pre{margin:10px 0 0;padding:12px 14px;background:#f7f7fb;border-radius:12px;font-size:.8rem;white-space:pre-wrap;word-break:break-word;color:#3b3b55;max-height:140px;overflow:auto}
.smsd-actions{display:flex;flex-wrap:wrap;gap:12px}
.smsd-btn{flex:1 1 140px;min-height:54px;border-radius:16px;border:2px solid transparent;font-weight:700;font-size:1.05rem;display:inline-flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;transition:transform .08s,filter .15s}
.smsd-btn:hover{filter:brightness(.96)}
.smsd-btn:active{transform:scale(.98)}
.smsd-ghost{background:#f7f7fb;border-color:#d9d9e8;color:#12122b}
.smsd-warn{background:#fde7c3;color:#7a3f00}
.smsd-danger{background:#dc1c1c;color:#fff}
.smsd-primary{background:#7c3aed;color:#fff}
.smsd-success{background:#16a34a;color:#fff}
.smsd-spin{width:68px;height:68px;border-radius:50%;border:6px solid #ede9fe;border-top-color:#7c3aed;margin:6px auto 18px;animation:smsd-rot .9s linear infinite}
.smsd-time{color:#7b7a92;font-size:.95rem;margin-top:6px}
@keyframes smsd-rot{to{transform:rotate(360deg)}}
`;

const WHERE = { ai: "AI service", server: "Our server", network: "Your connection" };

export default function SmsDialog({ tone = "danger", icon = "trash", title, text, note, where, detail, actions = [] }) {
  const t = TONES[tone] || TONES.danger;
  return (
    <div className="smsd">
      <style>{CSS}</style>
      <div className="smsd-tile" style={{ background: t.tile, color: t.color }}>
        <i className={`fa fa-${icon}`} />
      </div>
      {where && <div className="smsd-where">Problem with: {WHERE[where] || where}</div>}
      <h3 className="smsd-title">{title}</h3>
      {text && <p className="smsd-text">{text}</p>}
      {note && (
        <div className="smsd-note">
          <i className="fa fa-info-circle" />
          <div>
            <b>{note.title}</b>
            {note.sub && <span>{note.sub}</span>}
          </div>
        </div>
      )}
      {detail && (
        <details className="smsd-detail">
          <summary>Technical details</summary>
          <pre>{detail}</pre>
        </details>
      )}
      <div className="smsd-actions">
        {actions.map((a) => (
          <button key={a.label} type="button" className={`smsd-btn smsd-${a.variant || "ghost"}`} onClick={a.onClick}>
            {a.icon && <i className={`fa fa-${a.icon}`} />}
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Processing state: spinner + seconds elapsed, so a slow call never looks frozen.
export function SmsBusy({ title, text }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="smsd">
      <style>{CSS}</style>
      <div className="smsd-spin" />
      <h3 className="smsd-title">{title}</h3>
      {text && <p className="smsd-text">{text}</p>}
      <div className="smsd-time">Working… {secs}s{secs >= 20 ? " — still going, please keep this window open" : ""}</div>
    </div>
  );
}
