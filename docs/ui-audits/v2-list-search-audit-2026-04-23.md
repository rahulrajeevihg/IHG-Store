# V2 Search Listing UI Audit

Date: 2026-04-23
Route: `/list?search_v2=1`
Audit basis: code inspection of the V2 listing implementation, plus live-route reachability check showing the deployed page redirects to `/login` when unauthenticated.

## Summary
- Scope covered: `SearchHero`, `ResultsToolbar`, desktop `FilterPanel`, mobile filter dialog, active-filter chips, results grid, `ProductCard`, pagination, and quick-view drawer.
- Primary owners:
  - `components/Search/v2/V2SearchPage.jsx`
  - `components/Search/v2/components/ProductCard.jsx`
  - `components/Search/v2/components/FilterPanel.jsx`
  - `components/Search/v2/components/SearchHero.jsx`
  - `components/Search/v2/components/ResultsToolbar.jsx`
  - `components/Search/v2/V2QuickViewDrawer.jsx`
- Constraints:
  - Screenshot capture for live `P0` and `P1` issues is blocked in this environment because the deployed route requires authentication and no browser session is available here.
  - Findings below are still fix-ready because each one is tied to a concrete implementation pattern and a deterministic repro path.

## Audit Method
- Breakpoints targeted: `375`, `768`, `1024`, `1440`, ultra-wide desktop.
- States considered: empty/default search, populated search, long labels, multiple chips, dense vs comfortable grid, suggestion dropdown open, mobile filters open, quick view open.
- Review focus:
  - horizontal alignment between sticky header, toolbar, filters, grid, and pagination
  - overflow/clipping in toolbar controls, chips, suggestions, and drawer content
  - card height drift and bottom-action inconsistency
  - hover-only interaction risks on touch and keyboard

## Findings

### Layout And Alignment

#### P1-01 Desktop filter rail collapses to 44px inside a 260px/280px sidebar
- Viewport: `1024+`
- Owner: `FilterPanel`, `V2SearchPage`
- Source:
  - `components/Search/v2/V2SearchPage.jsx:603-616`
  - `components/Search/v2/components/FilterPanel.jsx:52-63`
- Repro:
  1. Open `/list?search_v2=1` on desktop.
  2. Observe the left rail before hover.
  3. Compare sidebar column width to the filter rail's rendered width.
- Expected: the desktop sidebar should align with the results column as a stable full-width panel, or intentionally collapse without leaving a large dead gutter.
- Actual: the page reserves a `260px/280px` sidebar column, but the filter component itself renders at `44px` wide until hover.
- Impact: creates a large empty strip, makes the page feel misaligned, and causes the grid to appear visually detached from filters.
- Notes: this is the highest-confidence alignment issue in the current implementation.
- Screenshot: pending authenticated browser capture.

#### P1-02 Hover-expanding filter rail likely overlaps surrounding layout and produces horizontal jump
- Viewport: `1024+`
- Owner: `FilterPanel`
- Source:
  - `components/Search/v2/components/FilterPanel.jsx:54-63`
  - `components/Search/v2/components/FilterPanel.jsx:101-104`
- Repro:
  1. Hover into and out of the desktop filter rail repeatedly.
  2. Watch the left edge of the results area and the filter shadow boundary.
- Expected: expansion should feel anchored and not cause perceived overlap or gutter jitter.
- Actual: the panel is absolutely positioned, animates width from `44` to `268`, and sits in a relatively positioned `44px` wrapper, so the visual footprint expands over reserved empty space rather than participating in the grid naturally.
- Impact: desktop alignment feels unstable and can read as a partially broken sidebar.
- Screenshot: pending authenticated browser capture.

#### P1-03 Results grid uses `gap-[1px]` and a gray container background, which reads as broken separators
- Viewport: all, most visible at `1024+`
- Owner: `V2SearchPage`, `ResultsSkeleton`
- Source:
  - `components/Search/v2/V2SearchPage.jsx:575-578`
  - `components/Search/v2/components/ResultsSkeleton.jsx:3`
- Repro:
  1. Load search results in either density mode.
  2. Compare card spacing to toolbar and page gutters.
- Expected: cards should have intentional spacing that matches the rest of the layout system.
- Actual: cards are separated by `1px` gaps against `#eeeeee`, which makes the grid look like a table or rendering seam rather than a deliberate card layout.
- Impact: weak visual rhythm and perceived alignment defects even when cards technically line up.
- Screenshot: pending authenticated browser capture.

#### P2-04 Pagination top border and spacing do not visually lock to the results grid
- Viewport: all
- Owner: `Pagination`
- Source:
  - `components/Search/v2/components/Pagination.jsx:8-17`
- Repro:
  1. Navigate to a multi-page results set.
  2. Compare the pagination container width and separation rhythm against the card grid above it.
- Expected: pagination should feel like a clean continuation of the results section.
- Actual: it introduces a full-width border-top and detached spacing pattern that does not inherit the grid’s spacing language.
- Impact: mild but noticeable visual discontinuity.
- Screenshot: optional.

### Responsive And Overflow

#### P1-05 Search hero packs too many fixed controls into a single 52px row on mobile
- Viewport: `375`
- Owner: `SearchHero`
- Source:
  - `components/Search/v2/components/SearchHero.jsx:46-101`
- Repro:
  1. Open the page at `375px`.
  2. Enter text into search.
  3. Observe the input, clear button, AI action, divider, and Search CTA sharing one horizontal row.
- Expected: primary search controls should remain legible and comfortable without squeezing the input.
- Actual: the hero keeps AI and Search controls inline with the input at a fixed height, leaving little room once clear-state and loading affordances are present.
- Impact: cramped header, narrow input field, and likely text truncation under stress.
- Screenshot: pending authenticated browser capture.

#### P1-06 Suggestion dropdown can inherit the cramped hero width and truncate brand/content aggressively
- Viewport: `375`, `768`
- Owner: `SearchHero`
- Source:
  - `components/Search/v2/components/SearchHero.jsx:104-130`
- Repro:
  1. Type at least two characters to open suggestions.
  2. Use results with long product names or long brand names.
- Expected: suggestion rows should preserve readable item identity without collapsing key metadata.
- Actual: suggestion rows force code, name, and optional brand into a single line structure within the same bounded width as the mobile search shell.
- Impact: readable search assist degrades quickly on small screens.
- Screenshot: pending authenticated browser capture.

#### P1-07 Toolbar wraps unevenly because controls mix flexible rows with a fixed `min-w-[200px]` sort select
- Viewport: `768` to `1024`
- Owner: `ResultsToolbar`
- Source:
  - `components/Search/v2/components/ResultsToolbar.jsx:55-127`
- Repro:
  1. Resize through tablet and small desktop widths.
  2. Toggle system-manager-only controls if available.
  3. Watch how count, mobile filter button, density, show count, and sort wrap.
- Expected: toolbar groups should stack cleanly or reflow into stable rows.
- Actual: the sort control holds a `200px` minimum width while adjacent controls are wrap-based, creating awkward second-line grouping and inconsistent alignment.
- Impact: toolbar looks messy at intermediate widths.
- Screenshot: pending authenticated browser capture.

#### P1-08 Active filter chips have no width guardrails for long values
- Viewport: `375`, `768`
- Owner: `ActiveFiltersSummary`
- Source:
  - `components/Search/v2/components/ActiveFiltersSummary.jsx:42-65`
- Repro:
  1. Apply a long query and long facet values.
  2. Observe chip row wrapping and chip internal content.
- Expected: chip labels should truncate gracefully or constrain width so the row stays readable.
- Actual: chip content is inline with no truncation or max-width rules, so long values can produce oversized chips and unstable wrapping.
- Impact: filter summary becomes noisy and can push important content down unpredictably.
- Screenshot: pending authenticated browser capture.

#### P2-09 Quick-view drawer leaves a permanent `pl-6` outer offset even on small screens
- Viewport: `375`, `768`
- Owner: `V2QuickViewDrawer`
- Source:
  - `components/Search/v2/V2QuickViewDrawer.jsx:140-153`
- Repro:
  1. Open quick view on mobile or narrow tablet.
  2. Observe the drawer’s left-side breathing room and visible page backdrop.
- Expected: a mobile drawer should use available screen width cleanly.
- Actual: the drawer container applies `pl-6` while the panel is `w-screen`, leaving a visible forced inset.
- Impact: reduced usable width and slightly awkward edge alignment on smaller screens.
- Screenshot: optional.

### Component Consistency

#### P1-10 Product cards can drift vertically because content blocks are variable and the CTA is not pinned to the bottom
- Viewport: all
- Owner: `ProductCard`
- Source:
  - `components/Search/v2/components/ProductCard.jsx:87-175`
- Repro:
  1. Compare cards with and without brand/category, discount, stock units, or long item codes.
  2. Scan the Add button baseline across one results row.
- Expected: action buttons should align consistently across cards in a row.
- Actual: the body is flexible, but there is no spacer before the CTA, so variable content height changes button position.
- Impact: visible row-level misalignment and an uneven retail grid.
- Screenshot: pending authenticated browser capture.

#### P1-11 Card typography is too small for dense catalog scanning and amplifies alignment noise
- Viewport: all, especially `375` and `768`
- Owner: `ProductCard`
- Source:
  - `components/Search/v2/components/ProductCard.jsx:90-173`
- Repro:
  1. Review a populated grid at default zoom.
  2. Compare the brand/category, SKU, stock text, discount label, and CTA text sizes.
- Expected: key metadata should remain readable without relying on zoom.
- Actual: multiple critical surfaces use `8px`, `9px`, and `10px` type, making the cards feel visually compressed.
- Impact: the grid looks cramped and misaligned because text blocks do not establish clear hierarchy.
- Screenshot: pending authenticated browser capture.

#### P2-12 Skeleton aspect ratio does not match the real card media ratio
- Viewport: all
- Owner: `ResultsSkeleton`
- Source:
  - `components/Search/v2/components/ResultsSkeleton.jsx:3-13`
  - `components/Search/v2/components/ProductCard.jsx:51`
- Repro:
  1. Load the results page on a slower connection or throttle network.
  2. Compare the loading skeleton image area to the loaded product card image area.
- Expected: skeleton cards should closely match final card proportions to avoid layout shift.
- Actual: skeleton uses `aspect-square` while the real card uses `paddingBottom: "78%"`.
- Impact: subtle but visible layout jump during loading.
- Screenshot: optional.

### Interaction And Accessibility-Adjacent UI Defects

#### P1-13 Card secondary actions are effectively hover-only in the grid
- Viewport: touch devices and keyboard navigation across all widths
- Owner: `ProductCard`
- Source:
  - `components/Search/v2/components/ProductCard.jsx:70-83`
- Repro:
  1. Use a touch device or keyboard-only navigation.
  2. Try to discover wishlist and quick-view actions without hovering.
- Expected: secondary card actions should remain discoverable on touch and accessible via focus.
- Actual: actions start at `opacity-0` and appear on `group-hover` or `group-focus-within`; on touch, discoverability is poor because there is no persistent affordance.
- Impact: quick view and save actions are easy to miss outside mouse usage.
- Screenshot: pending authenticated browser capture.

#### P1-14 Desktop filter panel depends on pointer hover rather than explicit open/closed interaction
- Viewport: `1024+`
- Owner: `FilterPanel`
- Source:
  - `components/Search/v2/components/FilterPanel.jsx:55-63`
  - `components/Search/v2/components/FilterPanel.jsx:76-79`
- Repro:
  1. Tab into the page using keyboard navigation.
  2. Try to access the desktop filter controls without hovering first.
- Expected: desktop filters should expose a stable interactive surface or an explicit toggle.
- Actual: the panel opens and closes on mouse enter/leave and hides label/content visibility when closed.
- Impact: desktop filter usability is coupled to pointer behavior and feels brittle.
- Screenshot: pending authenticated browser capture.

#### P2-15 Quick-view close affordance uses a literal `x`, which is visually weaker than the rest of the UI system
- Viewport: all
- Owner: `V2QuickViewDrawer`
- Source:
  - `components/Search/v2/V2QuickViewDrawer.jsx:167-173`
- Repro:
  1. Open quick view.
  2. Compare the close button styling and iconography to the rest of the drawer.
- Expected: close control should use a consistent icon treatment and stronger affordance.
- Actual: the drawer uses a plain text `x` inside a decorative circular button.
- Impact: small polish issue, but it lowers perceived finish on an otherwise styled drawer.
- Screenshot: optional.

## Priority Backlog

### P0
- No confirmed `P0` issues from code inspection alone.
- First live authenticated pass should specifically verify whether the hover-expanding desktop filter overlaps or blocks content badly enough to promote `P1-01` or `P1-02` to `P0`.

### P1
- `P1-01` filter rail collapsed inside full desktop sidebar column
- `P1-02` hover-expanding filter creates unstable desktop alignment
- `P1-03` results grid spacing reads as broken separators
- `P1-05` mobile search hero is too crowded
- `P1-06` suggestion dropdown truncation risk on narrow widths
- `P1-07` toolbar wraps awkwardly at tablet widths
- `P1-08` active filter chips lack truncation controls
- `P1-10` product CTA baseline drifts across a row
- `P1-11` card typography is too compressed
- `P1-13` card secondary actions are hover-dependent
- `P1-14` desktop filter interaction depends on hover

### P2
- `P2-04` pagination rhythm mismatch
- `P2-09` quick-view drawer forced inset on small screens
- `P2-12` skeleton ratio mismatch
- `P2-15` weak quick-view close affordance

## Suggested Fix Sequence
1. Stabilize desktop structure first:
   - convert the desktop filter rail from hover-expanding `44px` shell to a full-width panel
   - rebalance sidebar/grid spacing and replace `gap-[1px]` with intentional card gutters
2. Normalize the card system:
   - pin CTA placement
   - increase type sizes and spacing
   - make secondary actions visible or explicitly accessible on non-hover devices
3. Clean up responsive chrome:
   - split or restack the mobile search hero
   - make toolbar groups wrap predictably
   - constrain chip widths and suggestion row content
4. Finish polish:
   - align skeleton proportions to final cards
   - tighten pagination and drawer affordances

## Validation Checklist For Follow-Up Live Pass
- Capture screenshots for all `P1` items at `375`, `768`, `1024`, and `1440`.
- Confirm whether authenticated data with long brand/category strings worsens chip and card overflow.
- Verify quick-view drawer layout with products that have many info fields and long names.
- Re-test keyboard navigation through hero search, filter panel, cards, and pagination after fixes.
