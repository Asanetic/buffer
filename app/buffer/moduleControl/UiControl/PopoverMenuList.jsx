'use client';
import './PopoverMenu.css';

// Shared "More" dropdown content used by the sheet, the grid and the profile form:
// ACTIONS / FILTERS sections, a soft coloured icon tile per row, chevron on filters.
// Tones are picked from a stable hash of the row, so every row gets its own colour but it never flickers between renders.
const TONES = ['purple', 'rose', 'blue', 'green', 'orange', 'indigo', 'teal'];

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const isFilter = (it) => /^filter/i.test(String(it.key || '')) || /^filter/i.test(String(it.label || ''));
const isDanger = (it) => String(it.variant || '').includes('danger') || /btn-danger|danger/.test(String(it.cls || it.colorClass || ''));
const toneOf = (it) => (isDanger(it) ? 'rose' : TONES[hash(`${it.key || ''}${it.icon || ''}${it.label || ''}`) % TONES.length]);

// items: [{ key, label, icon, variant, cls, colorClass, disabled, onClick }]   onPick(item) runs after the menu closes
export default function PopoverMenuList({ items, onPick, disabled = false }) {
  const actions = items.filter((it) => !isFilter(it));
  const filters = items.filter(isFilter);
  const both = actions.length > 0 && filters.length > 0;

  const row = (it, chevron) => (
    <button
      key={it.key}
      type="button"
      className="sgm-item"
      disabled={disabled || it.disabled}
      onClick={() => onPick(it)}
    >
      <span className={`sgm-ic sgm-tone-${toneOf(it)}`}><i className={`fa fa-${it.icon || (chevron ? 'filter' : 'circle-o')}`}></i></span>
      <span className="sgm-label">{it.label}</span>
      {chevron && <i className="fa fa-angle-right sgm-chev"></i>}
    </button>
  );

  return (
    <>
      {actions.length > 0 && (
        <div className="sgm-section">
          {both && <div className="sgm-head">Actions</div>}
          {actions.map((it) => row(it, false))}
        </div>
      )}
      {both && <div className="sgm-sep"></div>}
      {filters.length > 0 && (
        <div className="sgm-section">
          {both && <div className="sgm-head">Filters</div>}
          {filters.map((it) => row(it, true))}
        </div>
      )}
    </>
  );
}
