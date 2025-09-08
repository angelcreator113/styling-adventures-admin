// src/components/topbar/CommandPalette.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isPinned as checkPinned } from "@/utils/nav-store";

export default function CommandPalette({
  open, onClose, items = [], recents = [], pinned = [],
  onSelect, onTogglePin
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery(""); setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); onClose?.(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flat.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const item = flat[activeIndex];
        if (item && !item.header) { onSelect?.(item); onClose?.(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIndex]); // eslint-disable-line

  // Filter + group: Pinned, Recents, All
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = (list) =>
      !q ? list :
      list.filter(i => (i.label || "").toLowerCase().includes(q) || (i.group || "").toLowerCase().includes(q));

    return [
      pinned.length ? { title: "Pinned",  items: f(pinned) } : null,
      recents.length ? { title: "Recent", items: f(recents) } : null,
      { title: "All", items: f(items) },
    ].filter(Boolean);
  }, [items, recents, pinned, query]);

  const flat = useMemo(() => {
    const arr = [];
    groups.forEach(g => {
      arr.push({ header: true, label: g.title });
      g.items.forEach(i => arr.push(i));
    });
    return arr;
  }, [groups]);

  if (!open) return null;

  return createPortal(
    <div className="cmdk-overlay" aria-hidden onClick={onClose}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-header">
          <input
            ref={inputRef}
            className="cmdk-input"
            type="search"
            placeholder="Type a command or page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-autocomplete="list"
          />
        </div>

        <ul className="cmdk-list" role="listbox">
          {flat.map((item, idx) =>
            item.header ? (
              <li key={`h-${item.label}-${idx}`} className="cmdk-empty" aria-disabled>{item.label}</li>
            ) : (
              <li
                key={`${item.group || "items"}-${item.path}-${idx}`}
                id={`cmdk-item-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                className={`cmdk-item ${idx === activeIndex ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => onSelect?.(item)}
              >
                <span className="cmdk-label">{item.label}</span>
                <span className="cmdk-kicker">{item.group}</span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={checkPinned(item.path) ? "Unpin" : "Pin"}
                  onClick={(e) => { e.stopPropagation(); onTogglePin?.(item); }}
                  title={checkPinned(item.path) ? "Unpin" : "Pin"}
                >★</button>
              </li>
            )
          )}

          {!flat.length && (
            <li className="cmdk-empty" role="option" aria-disabled>
              No results — try “themes” or “spaces”
            </li>
          )}
        </ul>

        <div className="cmdk-footer" aria-hidden>
          <span>↑↓ navigate</span><span>Enter open</span><span>Esc close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
