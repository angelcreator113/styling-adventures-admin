// src/pages/UploadClosetPage.jsx
import React, { useEffect } from "react";
import styles from "@/css/UploadClosetPage.module.css";

export default function UploadClosetPage() {
  useEffect(() => {
    import("./closet-upload.js")
      .then((m) => m.setupClosetUploadUI?.())
      .catch((e) => console.warn("[closet] init skipped:", e));
  }, []);

  return (
    <section
      className={`container ${styles.card}`}
      aria-labelledby="closet-upload-title"
      role="region"
      style={{ padding: 16 }}
    >
      <header className={styles.header}>
        <h1 id="closet-upload-title" className={`page-title ${styles.title}`}>
          Upload / Closet
        </h1>
      </header>

      {/* These IDs are used by closet-upload.js */}
      <section id="upload-sections" className={styles.uploadSections} />
      <section id="dashboard-sections" className={styles.dashboardSections} />
    </section>
  );
}
