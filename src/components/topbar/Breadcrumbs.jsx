// src/components/topbar/Breadcrumbs.jsx
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTE_MANIFEST } from "@/routes/manifest";

/**
 * Build a quick index of path -> label from the manifest.
 * We include all groups (admin/creator/fan/global).
 */
function buildIndex(manifest) {
  const map = new Map();
  for (const key of Object.keys(manifest)) {
    for (const item of manifest[key] || []) {
      if (item?.path && item?.label) {
        map.set(item.path, item.label);
      }
      // also index parent paths if you’ve added them in the manifest
      // (e.g., "/admin/themes" -> "Themes")
      const parts = (item.path || "").split("/").filter(Boolean);
      for (let i = 1; i < parts.length; i++) {
        const parent = "/" + parts.slice(0, i).join("/");
        if (!map.has(parent) && i <= 2) {
          // only add shallow parents if not present (keeps things tidy)
          // you can remove i<=2 if you want deep parents too
          // map.set(parent, titleCase(parts[i-1]));
        }
      }
    }
  }
  // Friendly defaults for roots if you want them to appear
  map.set("/home", "Home");
  map.set("/admin", "Admin");
  map.set("/creator", "Creator");
  return map;
}
const INDEX = buildIndex(ROUTE_MANIFEST);

const titleCase = (s) =>
  (s || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

/**
 * Try to prettify unknown URL segments:
 * - strip obvious ids/uuids
 * - title-case remaining text
 */
function prettifySegment(seg) {
  if (!seg) return "";
  // remove common id-like tokens
  if (/^[0-9a-f]{8,}$/i.test(seg)) return "Detail";
  if (/^\d+$/.test(seg)) return `#${seg}`;
  return titleCase(seg);
}

/**
 * Optionally compress repeated consecutive segments,
 * so "/admin/home/home/invites" becomes "Admin / Home / Invites"
 */
function compressConsecutive(segs) {
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    if (i === 0 || segs[i] !== segs[i - 1]) out.push(segs[i]);
  }
  return out;
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  const crumbs = useMemo(() => {
    if (!pathname) return [];
    const rawSegs = pathname.split("/").filter(Boolean);
    const segs = compressConsecutive(rawSegs);

    // build cumulative paths
    const paths = segs.map((_, i) => "/" + segs.slice(0, i + 1).join("/"));

    return paths.map((p, i) => {
      // prefer a manifest label, otherwise prettify the segment
      const label = INDEX.get(p) || prettifySegment(segs[i]);
      return { path: p, label, isLast: i === paths.length - 1 };
    });
  }, [pathname]);

  // don’t render if we have nothing meaningful
  if (crumbs.length <= 1) return null;

  return (
    <ol className="tb-breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((c) =>
        c.isLast ? (
          <li key={c.path} className="is-current" aria-current="page">
            {c.label}
          </li>
        ) : (
          <li key={c.path}>
            <Link to={c.path}>{c.label}</Link>
          </li>
        )
      )}
    </ol>
  );
}
