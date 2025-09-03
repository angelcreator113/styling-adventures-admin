import React from "react";

function StatusBadge({ t }) {
  const now = Date.now();
  const rel = t.releaseAt?.toMillis?.() ?? null;
  const exp = t.expiresAt?.toMillis?.() ?? null;
  const del = t.deleteAt?.toMillis?.() ?? null;

  const isDraft = !t.visibility || t.visibility === "private";
  const isScheduled = (t.visibility === "public") && rel && rel > now;
  const isLive = (t.visibility === "public") && (!rel || rel <= now) && (!exp || exp > now) && (!del || del > now);
  const isExpired = (t.visibility === "public") && exp && exp <= now;

  const cfg = isDraft ? ["Draft", "#6b7280"]
    : isScheduled ? ["Scheduled", "#2563eb"]
    : isLive ? ["Live", "#16a34a"]
    : isExpired ? ["Expired", "#b45309"]
    : ["—", "#6b7280"];

  return <span className="tl-badge" style={{ color: cfg[1], background: `${cfg[1]}20` }}>{cfg[0]}</span>;
}

export default function ThemeGrid({ items, iconMap, onEdit }) {
  return (
    <div className="tl-grid">
      {items.length === 0 ? (
        <div className="muted">No themes match your filters.</div>
      ) : (
        <div className="tl-grid__wrap">
          {items.map(t => {
            const iconUrl = iconMap[t.id];
            return (
              <article key={t.id} className="card tl-card">
                <div
                  className="tl-thumb"
                  onClick={() => onEdit(t)}
                  role="button"
                  aria-label={`Edit ${t.name || t.id}`}
                >
                  {iconUrl ? (
                    <img src={iconUrl} alt={t.name || t.id} />
                  ) : (
                    <span className="muted">No icon mapped</span>
                  )}
                </div>
                <div className="tl-card__meta">
                  <strong className="tl-name">{t.name || t.id}</strong>
                  <StatusBadge t={t} />
                </div>
                {t.description && <div className="muted tl-desc">{t.description}</div>}
                <div className="tl-actions">
                  <button className="btn sm" onClick={() => onEdit(t)}>Edit</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
