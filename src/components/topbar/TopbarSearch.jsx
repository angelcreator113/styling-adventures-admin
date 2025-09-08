// src/components/topbar/TopbarSearch.jsx
import React, { forwardRef } from "react";

const TopbarSearch = forwardRef(function TopbarSearch(
  { value, onChange, onSubmit, pending = false },
  ref
) {
  return (
    <form
      className="topbar-search"
      role="search"
      aria-label="Site search"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(e);
      }}
    >
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search closet, voice, episodes…"
        aria-label="Search site"
        disabled={pending}
      />
      <button type="submit" disabled={pending}>
        {pending ? "…" : "Search"}
      </button>
    </form>
  );
});

export default TopbarSearch;

