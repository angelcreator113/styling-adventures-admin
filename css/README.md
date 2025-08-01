# 🎨 CSS Module Structure for Styling Adventures Admin

This directory organizes all the CSS for modular styling and easier long-term maintenance.

---

## 🗂 File Overview

| File             | Purpose                                                   |
|------------------|-----------------------------------------------------------|
| `theme.css`      | Defines color variables, border radius, and transitions.  |
| `layout.css`     | Controls base layout: `body`, `.dashboard-container`, `.main-content`, `.panel`. |
| `sidebar.css`    | Handles sidebar styling: width, nav links, active states. |
| `forms.css`      | Styles file inputs, buttons, selects, and upload sections.|
| `grid.css`       | Defines closet item grid layout and card appearance.      |
| `responsive.css` | Adds mobile-first layout tweaks including bottom nav.     |
| `a11y.css`       | Utility classes for screen reader-only content (like `.visually-hidden`). |

---

## 📌 Usage

In your `index.html`, make sure all modules are linked like this:

```html
<link rel="stylesheet" href="css/theme.css" />
<link rel="stylesheet" href="css/layout.css" />
<link rel="stylesheet" href="css/sidebar.css" />
<link rel="stylesheet" href="css/forms.css" />
<link rel="stylesheet" href="css/grid.css" />
<link rel="stylesheet" href="css/responsive.css" />
<link rel="stylesheet" href="css/a11y.css" />
```

---

## ✅ Tip

Keep styles scoped to their component/panel type. If the CSS grows more, consider breaking out:

- `closet.css`
- `voice.css`
- `episodes.css`
- `components/buttons.css`