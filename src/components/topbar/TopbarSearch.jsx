// src/components/topbar/TopbarSearch.jsx
import React from "react";

export default function TopbarSearch({
  q,
  onChange,
  onSubmit,
  inputRef,
  pending
}) {
  const id = "topbar-search-input";

  return (
    <form className="search-form" role="search" onSubmit={onSubmit} aria-label="Site">
      {/* Keep label for a11y, hide it visually */}
      <label htmlFor={id} className="sr-only">Search</label>
      <input
        id={id}
        ref={inputRef}
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Bestie, lets style you.."
        autoComplete="off"
        aria-label="Search"
        className="search-input"
      />
    </form>
  );
}

