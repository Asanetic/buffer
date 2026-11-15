'use client';
import { useEffect, useRef, useState } from 'react';
import { mosyGetData } from '../../MosyUtils/hiveUtils';

// KeywordsMessageSearch — a schema customBlock that sits above a pipe-separated
// `keywords` textarea. Type a phrase (eg "easy coach") to search the SMS inbox
// bodies, then either add what you typed, or open a message and highlight the
// exact words you want to add. Added words are appended to the keywords field
// as `a|b|c`.
//
// Schema usage:
//   customBlocks: [{ key: 'keywords_search', component: KeywordsMessageSearch,
//                    endpoint: apiRoutes.smsinbox.base, targetField: 'keywords' }],
//   and put 'keywords_search' before 'keywords' in the section's fields.

const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ');

function highlight(body, q) {
  if (!q) return body;
  const i = body.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return body;
  return (
    <>
      {body.slice(0, i)}
      <mark>{body.slice(i, i + q.length)}</mark>
      {body.slice(i + q.length)}
    </>
  );
}

export default function KeywordsMessageSearch({ values, setValue, field }) {
  const target = field.targetField || 'keywords';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [picked, setPicked] = useState('');
  const timer = useRef(null);

  const current = String(values?.[target] || '');

  const add = (word) => {
    const w = norm(word);
    if (!w) return;
    const list = current.split('|').map(norm).filter(Boolean);
    if (list.some((x) => x.toLowerCase() === w.toLowerCase())) return;
    setValue(target, [...list, w].join('|'));
    setPicked('');
  };

  useEffect(() => {
    clearTimeout(timer.current);
    const q = norm(query);
    if (q.length < 2) { setResults([]); return undefined; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await mosyGetData({
          endpoint: field.endpoint,
          params: { searchAny: btoa(q), pageSize: 10, orderBy: 'sms_date' },
        });
        const rows = res?.status === 'success' ? res.data || [] : [];
        setResults(rows.filter((r) => String(r.body || '').toLowerCase().includes(q.toLowerCase())));
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [query, field.endpoint]);

  const grabSelection = () => {
    const s = norm(window.getSelection()?.toString());
    if (s) setPicked(s);
  };

  return (
    <div className="mb-2">
      <label className="dyn-label">Find keywords from your transactions (eg easy coach)</label>
      <div className="d-flex gap-2">
        <input
          className="dyn-input form-control"
          value={query}
          placeholder="Type a name or phrase, then add it or pick a transaction"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(query); } }}
        />
        <button type="button" className="btn btn-outline-primary" disabled={!norm(query)} onClick={() => add(query)}>
          Add
        </button>
      </div>

      {loading && <div className="text-muted small mt-1">Searching...</div>}
      {!loading && norm(query).length >= 2 && results.length === 0 && (
        <div className="text-muted small mt-1">No transactions contain “{norm(query)}”. You can still add it.</div>
      )}

      {results.length > 0 && (
        <ul className="list-group mt-1" style={{ maxHeight: 260, overflowY: 'auto' }}>
          {results.map((r) => {
            const id = r.record_id || r.primkey;
            const open = openId === id;
            return (
              <li key={id} className="list-group-item small" style={{ cursor: 'pointer' }}
                  onClick={() => { setOpenId(open ? null : id); setPicked(''); }}>
                <div className="text-muted">{r.sender} · {r.sms_date}</div>
                <div onMouseUp={open ? grabSelection : undefined} style={{ userSelect: open ? 'text' : 'none' }}>
                  {highlight(String(r.body || ''), norm(query))}
                </div>
                {open && (
                  <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-muted">Highlight the words you want, then </span>
                    <button type="button" className="btn btn-sm btn-success" disabled={!picked} onClick={() => add(picked)}>
                      {picked ? `Add “${picked}”` : 'Add selection'}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-primary ms-1" onClick={() => add(query)}>
                      Add “{norm(query)}”
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
