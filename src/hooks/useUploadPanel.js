import { useEffect } from "react";
import { waitForFirebase } from "../utils/waitForFirebase";
import { attachDropArea } from "@/components/dragdrop.js";

/**
 * Initialize one upload panel (closet | voice | episodes).
 * Expects page markup to use the `uiPrefix` for element IDs:
 *   ${uiPrefix}drop-area, ${uiPrefix}file-input, ${uiPrefix}upload-btn
 *   ${uiPrefix}file-list, ${uiPrefix}progress, ${uiPrefix}progress-label
 */
export function useUploadPanel(slug, uiPrefix, timeoutMs = 6000) {
  useEffect(() => {
    let detachDrop = null;
    const unsubs = [];

    const $ = (id) => document.getElementById(`${uiPrefix}${id}`);
    const dropEl   = $("drop-area");
    const inputEl  = $("file-input");
    const uploadEl = $("upload-btn");
    const listEl   = $("file-list");
    const progEl   = $("progress");
    const progLbl  = $("progress-label");

    const prettyBytes = (n = 0) => {
      if (!Number.isFinite(n)) return "0 B";
      const units = ["B","KB","MB","GB","TB"];
      const i = Math.min(units.length - 1, Math.floor(Math.log10(n) / 3));
      return `${(n / 1000 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
    };

    const renderList = (files) => {
      if (!listEl) return;
      listEl.innerHTML = "";
      if (!files?.length) {
        listEl.setAttribute("data-empty", "true");
        return;
      }
      listEl.removeAttribute("data-empty");
      [...files].forEach((f) => {
        const row = document.createElement("div");
        row.className = "file-pill";
        row.title = f.name;
        row.textContent = `${f.name} • ${prettyBytes(f.size)}`;
        listEl.appendChild(row);
      });
    };

    // Drag & drop wiring — drop zone is drag-only (no click -> picker)
    if (dropEl && inputEl) {
      detachDrop = attachDropArea(dropEl, {
        preventClickDuringDrop: true, // drag only; stops second dialog
        inputEl,
        onFiles: (files) => {
          const dt = new DataTransfer();
          for (const f of files) dt.items.add(f);
          inputEl.files = dt.files;
          inputEl.dispatchEvent(new Event("change", { bubbles: true }));
          renderList(files);
        }
      });

      const onChange = (e) => renderList(e.target.files);
      inputEl.addEventListener("change", onChange);
      unsubs.push(() => inputEl.removeEventListener("change", onChange));
    }

    // Initialize helpers after Firebase is ready
    waitForFirebase(timeoutMs).then(async () => {
      // upload-factory may export named or default; normalize both
      const modUF = await import("../utils/upload-factory.js");
      const createUploadUI =
        modUF.createUploadUI ??
        (typeof modUF.default === "function"
          ? modUF.default
          : modUF.default?.createUploadUI);

      if (createUploadUI) {
        try {
          await createUploadUI({ slug, uiPrefix });
        } catch (e) {
          console.warn("[useUploadPanel] createUploadUI failed:", e);
        }
      }

      // Upload button with progress bar
      if (uploadEl && inputEl) {
        const { uploadFileWithProgress } = await import("../utils/firebase-helpers.js");

        const onClick = async (ev) => {
          ev.preventDefault();
          const file = inputEl.files?.[0];
          if (!file) {
            dropEl?.classList.add("ring-pulse");
            setTimeout(() => dropEl?.classList.remove("ring-pulse"), 600);
            return;
          }

          if (progEl) {
            progEl.hidden = false;
            progEl.value = 0;
          }
          if (progLbl) progLbl.textContent = "Preparing…";

          try {
            await uploadFileWithProgress(file, {
              slug,
              public: document.getElementById(`${uiPrefix}is-public`)?.checked ?? true,
              onProgress: (pct, sent, total) => {
                if (progEl) progEl.value = pct;
                if (progLbl) progLbl.textContent =
                  `${Math.round(pct)}% — ${prettyBytes(sent)} / ${prettyBytes(total)}`;
              }
            });

            if (progLbl) progLbl.textContent = "Done ✔";
          } catch (err) {
            console.error(`[${slug}-panel] Upload failed`, err);
            if (progLbl) progLbl.textContent = "Upload failed";
          }
        };

        uploadEl.addEventListener("click", onClick);
        unsubs.push(() => uploadEl.removeEventListener("click", onClick));
      }
    });

    return () => {
      try { detachDrop && detachDrop(); } catch {}
      unsubs.forEach((fn) => { try { fn(); } catch {} });
    };
  }, [slug, uiPrefix, timeoutMs]);
}
