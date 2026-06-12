# Cashendar UX Analysis & Market-Trend Modernization

_June 2026 — written as part of the catalog/OCR/dashboard overhaul._

## 1. Where Cashendar stood

Cashendar's core loop was solid (calendar-first budgeting + inventory
depletion tracking + per-item price history), but three friction points
worked against it:

| Friction | Consequence |
|---|---|
| **Everything entered by hand** — every article on every bill typed into a 4-step wizard | Data entry cost grows linearly with grocery volume; this is the #1 abandonment driver in this app category |
| **Exact-string item grouping** — "PST BARILLA 500G" ≠ "Pasta Barilla" | Price history, depletion and annual-cost analytics silently fragment as soon as names vary (and supermarket receipts always vary) |
| **Insights buried in modals** — price trends lived behind item-chart → sparkline → fullscreen chart | The "when should I buy" value proposition was invisible day-to-day |

## 2. Market trends researched (2026)

Survey of current grocery-tracking / budgeting app landscape
(GroceryTracker, Yomio, SpendScan, GroceryTrack et al., 2026 comparisons):

1. **Scan-first capture is the differentiator.** Receipt scanning with
   item-level extraction is now table stakes; apps that require manual
   entry see users abandon within ~2 weeks.
2. **Item-level insight, not store-level totals.** "Groceries are over
   budget" is replaced by *which article* got more expensive, and where.
3. **Per-unit price history & shrinkflation detection.** Tracking price
   per gram over time catches packs silently getting smaller — a
   headline feature of specialized trackers this year.
4. **At-a-glance insight dashboards.** Deal timing, spending changes and
   personal metrics surfaced on one screen instead of buried in charts.
5. **Household sharing & sync.** Multi-user capture into one dashboard.
6. **Natural-language Q&A over purchase data** (premium tier trend).

Sources: groceriestracker.com 2026 comparisons, yomio.app receipt-scanner
roundup, savingsgrove.com price-tracking guide, grocerytrack.food 2026
review.

## 3. What we applied (trend → change)

| Trend | What shipped in this overhaul |
|---|---|
| Scan-first capture | Multi-provider server-side OCR (`/api/ocr/scan`: Tesseract zero-config, EasyOCR optional sidecar, Mistral Document AI with structured line-item extraction) + prominent lime **scan button** in the sidebar header + drag-&-drop upload modal |
| Item-level extraction | OCR **review grid**: every parsed line lands as an editable row (qty / unit price / total / type), discounts pre-excluded, sum-vs-total sanity check against the printed total |
| Receipt names are messy | **Alias system**: fuzzy matcher (token overlap + Levenshtein + consonant-skeleton for receipt abbreviations) suggests "PST BARILLA → Pasta Barilla (87%)"; accepting stores the alias so every future scan and all historical groupings heal retroactively. Bulk bar + merge tool rectify many rows in one action |
| Per-unit price & shrinkflation | Price-per-100g is a built-in derived stat, chartable over time; the dashboard's **Shrinkflation watch** flags items whose per-100g price rose while the pack price stayed flat |
| Insight dashboard | New top-level **Dashboard** view (Month \| Week \| Dashboard segmented control): "Cheap again soon" forecasts (seasonality + sale-interval detection with confidence), GitHub-diff-style **purchase diff** (newly bought / more / less / stopped vs your usual), starred-stats overview |
| Personal metrics | **Starred stats**: users star exactly the stats they care about (price/portion, water content, carbs, custom ones); starred stats drive the comparison columns, the comparison matrix and the dashboard overview |

## 4. Deliberately deferred

- **Household sharing / multi-user sync** — the backend already has JWT
  auth and global models; per-user scoping is a structural change best
  done as its own project.
- **Natural-language Q&A** — needs an LLM dependency and product thinking
  about cost; the structured stats/diff data added now is the
  prerequisite for it.
- **Mobile capture (camera) flow** — the upload endpoint accepts photos
  already; a dedicated mobile camera UX (and PWA packaging) is a
  follow-up.
- **Store-level price comparison** — receipts carry the store name (we
  parse and keep it); per-store price history needs a `store` field on
  payments and UI affordances. The parser already extracts it.

## 5. Design-language notes

All new surfaces reuse the existing system: dark theme with lime
(`--lime-primary`) accents, scoped CSS with `oklch(from …)` color
derivation, `CustomDropdown` / `CustomsCheckbox` / `CustomScrollbar` /
`SectionHeader` primitives, the modal-stack pattern (Escape unwinds), and
custom SVG charts (no chart library added). The GitHub-diff widget uses
monospace rows with `+`/`−` gutters and green/red row tints to make
"what changed" legible at a glance — the same mental model developers
already have for diffs.
