// src/utils/upload-factory.js
// tiny helper
function prettyBytes(n = 0) {
  const u = ["B","KB","MB","GB","TB"];
  const i = n ? Math.floor(Math.log(n)/Math.log(1024)) : 0;
  return `${(n/Math.pow(1024,i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

// this map lets you register different upload implementations per slug
const uploaders = new Map();

/**
 * Wire up the page by prefix (closet-, voice-, episode-)
 * - shows selected file under the drop area
 * - simulates upload with a progress bar (replace with real uploader)
 * Returns a cleanup function.
 */
export function createUploadUI({ slug, uiPrefix }) {
  const dropEl   = document.getElementById(`${uiPrefix}drop-area`);
  const inputEl  = document.getElementById(`${uiPrefix}file-input`);
  const formEl   = document.getElementById(`${uiPrefix}upload-form`);
  const btnEl    = document.getElementById(`${uiPrefix}upload-btn`);

  if (!dropEl || !inputEl || !formEl || !btnEl) {
    console.warn("[upload-factory] Missing elements for", uiPrefix);
    return () => {};
  }

  // ------- selected file preview -------
  let fileLabel = formEl.querySelector(".selected-file");
  if (!fileLabel) {
    fileLabel = document.createElement("div");
    fileLabel.className = "selected-file";
    fileLabel.setAttribute("aria-live", "polite");
    fileLabel.style.margin = ".5rem 0 0";
    formEl.insertBefore(fileLabel, formEl.firstChild.nextSibling); // under drop
  }

  function showSelected(files) {
    if (!files || !files.length) {
      fileLabel.textContent = "";
      fileLabel.hidden = true;
      return;
    }
    fileLabel.hidden = false;
    const f = files[0];
    fileLabel.textContent = `Selected: ${f.name} • ${prettyBytes(f.size)}`;
  }

  inputEl.addEventListener("change", () => showSelected(inputEl.files));

  // ------- progress bar -------
  let prog = formEl.querySelector(".upload-progress");
  if (!prog) {
    prog = document.createElement("div");
    prog.className = "upload-progress";
    prog.innerHTML = `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>`;
    prog.style.marginTop = ".5rem";
    prog.hidden = true;
    btnEl.insertAdjacentElement("afterend", prog);
  }
  const bar = prog.querySelector(".bar");

  function setProgress(pct) {
    bar.style.width = `${pct}%`;
    bar.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function showProgress(show) {
    prog.hidden = !show;
    if (!show) setProgress(0);
  }

  // ------- upload handler (pluggable) -------
  async function startUpload(file) {
    const uploader = uploaders.get(slug) || simulateUpload;
    showProgress(true);
    btnEl.disabled = true;

    try {
      await uploader({
        file,
        onProgress: setProgress,
        getMeta: () => ({
          isPublic: !!document.getElementById(`${uiPrefix}is-public`)?.checked,
          title:    document.getElementById(`${uiPrefix}title`)?.value || "",
          notes:    document.getElementById(`${uiPrefix}notes`)?.value || "",
          cat:      document.getElementById(`${uiPrefix}category`)?.value || "",
          sub:      document.getElementById(`${uiPrefix}subcategory`)?.value || "",
          subsub:   document.getElementById(`${uiPrefix}subsubcategory`)?.value || "",
        })
      });

      setProgress(100);
      fileLabel.textContent = "Upload complete 🎉";
      // optional: reset input after a short delay
      setTimeout(() => {
        inputEl.value = "";
        showSelected(null);
        showProgress(false);
      }, 600);
    } catch (e) {
      console.error(`[${slug}] upload failed`, e);
      fileLabel.textContent = "Upload failed. Check console.";
      showProgress(false);
    } finally {
      btnEl.disabled = false;
    }
  }

  // drop-zone click to open input (if you haven’t already wired it elsewhere)
  dropEl.addEventListener("click", () => inputEl.click());

  // submit button
  btnEl.addEventListener("click", (e) => {
    e.preventDefault();
    const f = inputEl.files?.[0];
    if (!f) {
      fileLabel.hidden = false;
      fileLabel.textContent = "Please choose a file first.";
      return;
    }
    startUpload(f);
  });

  // cleanup
  return () => {
    btnEl.replaceWith(btnEl.cloneNode(true));
    inputEl.replaceWith(inputEl.cloneNode(true));
    // dropEl has no special listeners here besides click; safe to leave
  };
}

/**
 * Register a real uploader for a slug (closet, voice, episodes)
 * uploader signature: async ({ file, onProgress(0..100), getMeta() }) => void
 */
export function registerUploader(slug, fn) {
  uploaders.set(slug, fn);
}

// Fallback simulated upload so you can see the progress bar
async function simulateUpload({ file, onProgress }) {
  const total = Math.max(file.size, 2_000_000);
  let sent = 0;
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      sent += total * 0.06; // ~6% steps
      const pct = Math.min(100, (sent / total) * 100);
      onProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(resolve, 250);
      }
    }, 180);
  });
}
