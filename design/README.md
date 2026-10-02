# GD4 Medical — Design prototypes for development

Open either `.dc.html` file in a browser (keep `support.js` in the same folder). Internet is needed for Google Fonts.

## Files
- `GD4 Medical Website v3.dc.html`: public website, 5 pages + 404, section library and design tokens page. The top review bar switches page, item count (2/4/8), TH/EN, light/dark, device and special states.
- `GD4 Admin.dc.html`: admin / CMS. It covers login, dashboard, products, content editor with live preview, theme and typography, inbox, users and permissions, and settings.
- `support.js`: runtime that renders the prototypes (not production code).

## What to rebuild in production
- Each file keeps its markup (HTML with inline styles) and a logic class in a `<script data-dc-script>` block. The sample data and data model live at the top of that script.
- Admin data model: `SITE0` (pages → sections → items), `TY` (section types and their fields), `FD` (field definitions, TH/EN), `DESIGN0` (fonts, sizes per device, colors light/dark, radius, spacing), `PERMS0` (role permissions).
- Website design tokens are listed on the "Design tokens" page as CSS variables (`--c-*`, `--fs-*`, `--f-head`, `--f-body`, `--r`, `--sec-py`, `--sec-px`).
- Data is sample only. There is no backend, database, auth or email sending, and images are placeholders.
