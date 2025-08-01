# ✨ Styling Adventures with Lala – Admin Portal

Welcome to the content management dashboard for *Styling Adventures with Lala*. This tool powers all uploads, category management, and dashboard control for episodes, voiceovers, and closet items.

---

## 🧭 Project Overview

This is a custom-built admin dashboard for managing content in Lala’s world. It features:

- 📂 Episode, Closet, and Voice upload sections
- 📊 Dynamic dashboards for reviewing uploads
- 📁 Smart category system with nested subcategories
- 🌈 Glow-Up Mode™ UI styling (clean, soft, mobile-friendly)
- 🔄 LocalStorage-based persistence
- 🛠️ Modular file structure for future-proof scalability

---

## 🧱 Folder & Component Map

### `/css/`
| File | Purpose |
|------|---------|
| `styles.css` | Global base styles |
| `uploads.css` | Styles specific to the upload sections |
| `dashboard.css` | Styles for the upload dashboard grid |
| `bulk-actions.css` | Styling for batch tools like delete mode |

### `/js/`
| Folder/File | Purpose |
|-------------|---------|
| `main.js` | Initializes UI + injects upload sections |
| `renderer.js` | Handles UI rendering logic |
| `shared-ui.js` | Reusable UI builders (e.g., buttons, inputs) |
| `dropdown-utils.js` | Smart dropdown creation and syncing |
| `/uploads/episodes/index.js` | Handles episode uploads |
| `/uploads/closet/index.js` | Handles closet uploads with dynamic categories |
| `/uploads/voice/index.js` | Handles voice uploads |

---

## 🛠 Dev Setup

1. Clone this repo.
2. Run locally with Live Server or open `index.html` in your browser.
3. Edit content in `/js` and `/css` as needed.
4. Categories are saved to `localStorage` per upload type.

---

## 💡 Contribution Notes

- Prefer modular file structure (one purpose per file).
- Keep upload UIs consistent (episode, closet, voice).
- Use `setupSmartDropdown()` for category syncing.
- Keep Glow-Up Mode™ consistent with spacing, buttons, and mobile layout.

---

## 🧠 Future Ideas (in progress)

- 🔌 Firebase integration for uploads
- 🧼 Reset/Delete all local categories
- 📤 Auto-upload previews
- 🌐 Versioned dashboard save/load
- 👗 Closet item preview rendering

---

## 🙌 Built with love by Evoni & Amber

This dashboard is part of the *Lala AI Studio* ecosystem. Powered by style, softness, and automation.
