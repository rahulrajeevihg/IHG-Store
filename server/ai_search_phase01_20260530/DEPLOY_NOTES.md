# AI Chat — performance + recall fix (2026-06-01)

`product_assistant.py` only. The `search_products` tool used to call the full
`ai_search_products_v2` pipeline on every turn — a **second nested intent LLM
call** + the **3-stage relaxation loop** + a **stock reconcile per search** — so a
single chat turn made ~3 OpenAI calls and up to 4 Typesense+reconcile passes
(11–16s). It also defaulted `in_stock_only=true`, hiding good out-of-stock matches
(→ 0 results on conceptual queries).

Fix: new `_lean_search()` — deterministic intent (no LLM) → one hybrid search →
tier-2 (demote hard specs) → tier-3 (pure semantic, no filters) fallbacks that
early-exit; `in_stock_only` is opt-in + prefer-don't-exclude. Verified on dev:
~3–7s (was 11–16s); conceptual queries that returned 0 now ground correctly.

**Deploy:** push `product_assistant.py` (no migration). **IMPORTANT:** the tier-3
conceptual-recall fallback only helps if hybrid is on in prod — set
`igh_search_hybrid_enabled: 1` in the prod `site_config.json` (Phase 3 go-live).
The speed fix and the in-stock fix work regardless.

---

# AI Assistant — server-side conversation history + feedback (2026-06-01)

Goal: move the assistant chat history out of the browser (localStorage) into
ERPNext, so the team gets a durable, per-user record of **every question reps
ask**, **what the AI returned**, **whether they found the data they needed**, and
**satisfaction** — i.e. a corpus for retraining / gap analysis. Verified on the
dev bench (save/list/get/feedback/delete round-trip + ownership scoping).

**New backend files (in `igh_search/igh_search/igh_search/`):**
- `assistant_history.py` — `save_assistant_conversation`, `list_assistant_conversations`, `get_assistant_conversation`, `delete_assistant_conversation`, `submit_assistant_feedback`. All scoped to `frappe.session.user`; a user can't read/overwrite another's conversation (uses `ignore_permissions` after an explicit ownership check). Conversation is stored once per settled turn; messages capped at 60, JSON capped at 800k chars.
- `doctype/ai_assistant_conversation/` — new DocType **AI Assistant Conversation** (`autoname: field:conversation_id`, module IGH Search). Queryable fields: `assistant_user`, `title`, `message_count`, `first_query`, `user_queries` (newline-joined), `product_codes` (surfaced SKUs), `satisfaction` (Satisfied/Partially/Not Satisfied), `found_required_data` (Yes/Partially/No), `feedback_comment`, `started_on`, `last_activity`, `route`, plus `messages_json` (full body for faithful UI reload; per-reply thumbs live inside it as `rating`). Permissions: System Manager.

**API wrappers** appended to the inner `api.py` (`igh_search.igh_search.api`) — 5 thin `@frappe.whitelist()` wrappers mirroring the existing pattern (see `api_assistant_history_wrappers.py`). The outer `igh_search.api` auto-proxies via `__getattr__`.

**Frontend (this repo):**
- `libs/api.js` — `save_assistant_conversation` / `list_assistant_conversations` / `get_assistant_conversation` / `delete_assistant_conversation` / `submit_assistant_feedback`.
- `components/Assistant/AssistantDrawer.jsx` — ERP is now the source of truth (localStorage kept as offline cache + instant paint). On open: list from ERP and merge; load a chat lazily fetches its body; debounced write-through save per settled turn; delete hits ERP too. Added per-reply 👍/👎 thumbs and a "Did you find what you needed?" satisfaction prompt → `submit_assistant_feedback`. History panel shows a satisfaction dot.

**Deploy:**
1. Backend: ship `assistant_history.py`, the `ai_assistant_conversation` doctype dir, and the 5 api wrappers (in the big inner `api.py`) to prod via GitHub → Frappe Cloud.
2. **Run a migration on prod** (`bench --site <prodsite> migrate`, or Frappe Cloud's auto-migrate) — this creates the `tabAI Assistant Conversation` table. On the dev bench it was created with `bench --site site1.local reload-doc igh_search doctype ai_assistant_conversation`.
3. `bench restart` (so the api workers pick up the new wrappers).
4. Frontend: Vercel deploy. Degrades gracefully — if the ERP calls fail, the chat still works off localStorage.
5. Smoke test as a logged-in rep: send a couple of messages → reopen chat (history persists across browsers) → thumbs + "found it?" prompt write to the DocType. Check the **AI Assistant Conversation** list in Desk to see queries + satisfaction.

**Retraining/analytics:** export the DocType (or report on `satisfaction` / `found_required_data` / `user_queries`). Complements the existing **AI Product Search Event** table (per-search telemetry).

---

# AI Search Rebuild — Phase 0 + 1 + 2 + 3 (2026-05-30)

> Updated for **Phase 3** (hybrid keyword + semantic vector search). The unified
> diff for all phases is `phase0_1_2_3.diff`; the two full updated files are
> alongside it.

## Phase 3 — hybrid semantic search (behind a flag, OFF by default)

Goal: conceptual / use-case queries that keyword+filters can't handle —
"light for a bathroom mirror", "elegant hanging light for a dining table",
"warm cosy restaurant lighting". Proven in a prototype: keyword returned garbage
for "light for a bathroom mirror"; **hybrid returned LUMIBRIGHT ESPEJO (=mirror)
lights with zero shared keywords.**

**Decisions:** Typesense **built-in** embeddings (`ts/all-MiniLM-L12-v2`, 384-dim —
no external API, auto-embeds docs at index time AND the query server-side) into a
**new parallel `product_v2_hybrid` collection** (the live `product_v2` / `/list`
are untouched).

**Code (in the two files):**
- `get_v2_config()` gains `igh_search_hybrid_enabled` (default 0), `igh_search_hybrid_collection` (default `product_v2_hybrid`), `igh_search_hybrid_alpha` (0.7), plus `is_hybrid_enabled()` / `get_hybrid_collection()`.
- `search_products_v2(..., use_hybrid=None)`: when the flag is on, the caller opts in, and there's real free-text (not `*`/SKU), it targets the hybrid collection and prepends the `embedding` vector field to `query_by` (Typesense auto-embeds `q` and rank-fuses keyword+semantic). All filters / facets / soft-boosts / sort are unchanged.
- AI search (`execute_intent_search`) passes `use_hybrid=1`; `/list` does not, so /list is never affected.

**Infra facts measured on the live Typesense (search.ihgind.com, v27.1):**
- Memory: the model added ~0.55 GB; Typesense at ~2.1 GB active of 7.75 GB — plenty of headroom.
- Throughput: built-in MiniLM embeds ~**7 docs/sec** on this box → the one-time full embed of 185,917 active docs takes ~**7 hours** (CPU on the Typesense box, ~⅓ of a core; live search stayed responsive during it).

**Rollout state (2026-05-30):**
1. `product_v2_hybrid` created (schema cloned from product_v2 + auto-embed field). ✅
2. Full embed running as a **detached server-side job** (`/tmp/p3_full_embed.py` → `/tmp/p3_embed.log`, checkpoint `/tmp/p3_embed.ckpt`, resumable). ETA ~7h. ⏳
3. Code wired + deployed, **flag OFF**. End-to-end verified on the partial collection: a query that returns 0 by keyword returns 100 semantically-ranked hits via hybrid. ✅

**To go live (after the embed completes):**
- Dev bench: set `igh_search_hybrid_enabled: 1` in `site_config.json`, `bench restart`.
- Prod (`erp.ihgind.com`): deploy the 2 files, build `product_v2_hybrid` there the same way (it shares the same Typesense, so the dev-built collection is already visible to prod — just flip the flag on prod once you've confirmed the embed is complete), `clear-cache`, flush `ai_product_search|intent`, `bench restart`.
- Rollback = set the flag back to 0 (instant; product_v2 untouched).
- Keep the hybrid collection in sync: extend the existing product→Typesense sync to also upsert into `product_v2_hybrid` (new/edited products auto-embed on upsert). Until then the hybrid index is a point-in-time snapshot.

**Tuning:** `igh_search_hybrid_alpha` (0–1) trades keyword vs. semantic weight; start ~0.7.

---

# AI Search Rebuild — Phase 0 + 1 + 2 (2026-05-30)

> Earlier phases. The two full updated files alongside this note already include
> Phases 0–3.

## Phase 2 — natural-language & customer-enquiry matching

Goal: a sales user can paste a raw customer enquiry line verbatim and get the
matching product — e.g. `Lumibright Spot light 15 Watts 2700K with Off white
colour 700mA 20.75 VDC IP20` or `LED Driver LCA 60W 900-1750mA`.

| Change | Why |
|--------|-----|
| `needs_model_reasoning` now **fires the LLM on spec-dense / enquiry-like messages** (≥2 spec-unit tokens, or ≥1 + 4 words, or ≥6 words). Short single-concept browse queries and clean SKU lookups stay on the fast deterministic path. | The old gate suppressed the LLM exactly when an enquiry was spec-rich (`signals≥3` / `in_stock`), so the model almost never ran and the regex parser mis-read enquiries ("15 Watts" → beam 15°, dropped "20.75 VDC"/"LCA", collapsed "900-1750mA"). |
| Prompt: added a **"Customer enquiry mode"** section + the two enquiry examples as few-shot. Rules: a wattage is power not beam; V/VDC→voltage, mA→current; keep range tokens & series/model codes (LCA, LBE…) in the query; map brand to a known value; strip mapped specs from the query; "light **for** a mirror/desk/garden" is a LIGHT (don't map the surface to a category). | Makes extraction complete and correct, and reduces product-vs-context confusion. |
| Merge: **trust the LLM's clean query** (don't fall back to the spec-polluted deterministic query) and **clear a spurious SKU hint** when the model recognised a real product+spec enquiry. | The additive merge otherwise kept the noisy deterministic query and SKU mode. |
| `_canonicalize_filter_values` — remap every spec value to the **exact indexed casing** from the Typesense facet vocabulary ("WHITE"→"White", "700MA"→"700mA"). | Typesense `:=` is case-sensitive; the deterministic parser upper-cases, so boosts/filters silently failed to match. |
| `_derive_numeric_boost_ranges` — derive `power_value`/`color_temp_kelvin`/`ip_rating_numeric` tolerance ranges from the string specs when missing (power ±10%, CCT ±300K, IP exact). | Numeric range conditions are the reliable, case-free boost signals; without them a string-only "15W" was out-ranked by a broad CCT band. |
| **Rewrote `build_soft_boost_clause`**: Typesense `_eval([...])` is **first-match-wins, not additive**. Conditions are now emitted in priority order with **strictly-descending weights** (numeric specs > string specs > sellability **last**), plus a combined top tier when several numeric specs are present. | The old version listed sellability first at a flat weight, so every sellable item scored on sellability alone and the spec boosts were never reached (7W items out-ranked exact 15W matches). |

### Phase 2 results (warm, dev bench, live data)
- `Lumibright Spot light 15 Watts 2700K … 700mA 20.75 VDC IP20` → top 5 are all **15W 3000K IP20 White Lumibright spots, in stock** (no 2700K exists; 3000K is the correct nearest), ~2.6 s.
- `LED Driver LCA 60W 900-1750mA` → exact **TRIDONIC LCA 60W 900-1750mA** (top 2).
- `warm white 12w cob spotlight for retail` → all **12W 3000K spotlights in stock**.
- `downlights` (browse) → deterministic, no LLM, ~0.6 s.
- Known refinement: `bright warm light for hotel bathroom mirror` still leans toward MIRRORS/BULBS — inherently ambiguous; the prompt rule helps but doesn't fully resolve it.

### Cost/latency note
Enquiry queries now make one OpenAI `gpt-4o-mini` call (~1.5–3 s warm, falls back to Groq). Browse/SKU queries stay LLM-free. The resolved-intent cache means a repeated identical enquiry skips the LLM.

---

# AI Search Rebuild — Phase 0 + Phase 1 (2026-05-30)

Status: **implemented + verified on the dev bench (167.71.204.41 / site1.local)**, against
the live shared Typesense index (`search.ihgind.com`, ~186k active docs). **Pending deploy to
prod** (`erp.ihgind.com`, Frappe Cloud) — the Next.js frontend's AI search calls prod
(`domain = erp.ihgind.com` in `libs/config/siteConfig.js`), so these changes do not reach
end users until the two files are deployed there.

## Files changed (in `igh_search/igh_search/igh_search/`)
- `ai_product_search.py`
- `product_search_v2.py`

Full updated files + a unified diff (`phase01.diff`) are in this folder. On the dev bench the
originals were backed up as `*.bak_phase01_20260530_105650`.

## What changed and why

| # | Change | Root cause it fixes |
|---|--------|---------------------|
| 0 | **Sellability down-rank** — `_eval([(rate:>0 \|\| stock:>0):2 …])` boost. Zero-price & zero-stock project/custom/signage items sink; nothing is hidden. | 72k "Unapproved Items" (signage/joinery/custom, rate=0/stock=0) polluting results. User chose down-rank over exclude. |
| 1a | **Removed `in_stock=True` default** in `build_default_filters()`. in_stock now only applies when the user asks. | Every search silently hid out-of-stock products AND the default kept the LLM gate (`needs_model_reasoning`) closed. |
| 1b | **Specs are soft boosts, not hard filters.** `power, color_temp, ip_rate, beam_angle, mounting, body_finish, material, input_voltage, output_current, output_voltage, lamp_type, lumen_output` and the spec ranges move from `filter_by` into the `_eval` ranking. Only `category_list / product_type / brand / variant_of` + explicit stock/price intent stay hard. | Hard `field:=[v]` excluded every item with an empty spec (lighting fill: power 72%, lumen 58%, lamp_type 27%) and every near-miss (10W hid 9/11W). `10w 3000k ip65 downlight` → 1 result. |
| 1c | **Dropped default-range bloat** (`{0,1e9}` clauses no longer sent) and **relax only on true zero** (was `found<3`), cutting redundant Typesense round-trips. | ~13 redundant range clauses per query + extra serial searches → 4–5s latency. |
| 1d | **Strip preference/sort words from the query** (`cheapest`, `latest`, `in stock`, …) + **empty-query fallback** when a category is locked and free-text zeroes the set. | Leftover token (e.g. `cheapest`) was searched literally inside the category → 0 results. |

## Before / after (same 4 queries, warm latency, dev bench, live data)

| Query | Before | After |
|-------|--------|-------|
| `10w 3000k ip65 downlight` | found **1**, 5040 ms | found **3176**, ~880 ms |
| `dimmable led driver 24v in stock` | found **0**, 3680 ms | found **9**, ~330 ms |
| `cheapest outdoor wall light` | found **0**, 4287 ms | found **7611**, ~370 ms |
| `bright warm light for hotel bathroom mirror` | 4 mirrors, 4029 ms | 4 mirrors, ~470 ms *(needs Phase 2 — LLM separating product from context)* |

## Deploy to prod
1. Copy the two updated files to the prod bench's `igh_search/igh_search/igh_search/`
   (back up prod's current versions first — **prod may be behind dev**, so prefer deploying the
   full files over applying `phase01.diff`).
2. `bench --site <prodsite> clear-cache` and flush the AI intent cache:
   `frappe.cache().delete_keys("ai_product_search|intent")` (stale cached intents otherwise mask the change).
3. `bench restart`.
4. Smoke test: `ai_search_products_v2(message="10w 3000k ip65 downlight")` should return thousands, not 1.

## Not included (later phases)
- Phase 2: route natural-language/multi-concept queries through the LLM (it currently almost never fires) so "bright warm light for a bathroom mirror" stops resolving to category MIRRORS.
- Phase 3: hybrid semantic/vector search. Phase 4: knowledgeable chatbot. Phase 5: spec backfill.
