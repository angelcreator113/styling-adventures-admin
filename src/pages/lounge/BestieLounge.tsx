// src/pages/lounge/BestieLounge.tsx
import React, { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/utils/init-firebase";
import useVip from "@/hooks/useVip";
import useFanTheme from "@/hooks/useFanTheme";
import { castCampaignVote } from "@/features/themes/castCampaignVote";
import ThemePicker from "@/features/themes/ThemePicker";
import "@/css/bestie-lounge.css";

type Campaign = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "ended";
  vipOnly?: boolean;
  themeIds?: string[];
  startAt?: any;
  endAt?: any;
};

type ThemeRow = { id: string; name?: string; iconUrl?: string; bgUrl?: string };

export default function BestieLounge({ campaignId }: { campaignId: string }) {
  const vip = useVip();
  const { themeId, chooseTheme } = useFanTheme();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [selectedForVote, setSelectedForVote] = useState<string | null>(null);

  // load campaign
  useEffect(() => {
    const ref = doc(db, "themeCampaigns", campaignId);
    return onSnapshot(ref, (snap) => {
      setCampaign(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Campaign) : null);
    });
  }, [campaignId]);

  // load themes in campaign
  useEffect(() => {
    if (!campaign?.themeIds?.length) { setThemes([]); return; }
    const qy = query(collection(db, "themes"), orderBy("name", "asc"));
    return onSnapshot(qy, (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((t) => campaign.themeIds!.includes(t.id));
      setThemes(rows);
    });
  }, [campaign?.themeIds]);

  const votingOpen = campaign?.status === "active";

  async function vote() {
    if (!selectedForVote) { alert("Pick a theme to vote for."); return; }
    if (!vip && campaign?.vipOnly) { alert("VIPs only. Join the Bestie Lounge to vote."); return; }
    try {
      await castCampaignVote(campaignId, selectedForVote);
      alert("Vote counted! ✨");
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  return (
    <section className="bl container">
      <div className="bl__card bl__header">
        <h1 className="bl__title">💖 Bestie Lounge</h1>
        <p className="muted">
          {campaign ? campaign.name : "Loading campaign…"}
          {campaign?.vipOnly && <strong className="bl__vip">(VIP-only)</strong>}
        </p>
      </div>

      {/* Fan theme picker (apply closet background) */}
      <div className="bl__card">
        <ThemePicker value={themeId || undefined} onChange={chooseTheme} />
      </div>

      {/* Voting */}
      <div className="bl__card">
        <header className="bl__sectionHeader">
          <h3 className="bl__h3">Vote your vibe</h3>
          {!vip && campaign?.vipOnly && <span className="chip" aria-live="polite">VIPs only</span>}
        </header>

        <div className="bl__grid">
          {themes.map((t) => {
            const active = selectedForVote === t.id;
            const preview = t.bgUrl || t.iconUrl || "";
            return (
              <button
                key={t.id}
                type="button"
                className={`bl__cardBtn ${active ? "is-active" : ""}`}
                onClick={() => setSelectedForVote(t.id)}
                aria-pressed={active}
                aria-label={`Select theme ${t.name || t.id}`}
              >
                <div className="bl__thumb" aria-hidden={preview ? undefined : true}>
                  {preview ? (
                    <img className="bl__img" src={preview} alt={t.name || t.id} />
                  ) : (
                    <span className="muted">No art</span>
                  )}
                </div>
                <div className="bl__body">
                  <span className="bl__name">{t.name || t.id}</span>
                  <span className="muted bl__hint">{active ? "Selected" : "Tap to select"}</span>
                </div>
              </button>
            );
          })}
          {!themes.length && <div className="muted">No themes in this campaign.</div>}
        </div>

        <div className="bl__actions">
          <button
            className="btn primary"
            onClick={vote}
            disabled={!votingOpen || !selectedForVote || (campaign?.vipOnly && !vip)}
            title={
              !votingOpen ? "Campaign not active" :
              (campaign?.vipOnly && !vip) ? "VIPs only" : "Cast your vote"
            }
          >
            Cast Vote
          </button>
        </div>
      </div>
    </section>
  );
}
