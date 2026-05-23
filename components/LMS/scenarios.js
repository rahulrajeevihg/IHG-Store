// ─────────────────────────────────────────────────────────────────────────────
// LMS Scenarios
//
// Each scenario is graded against live Redux state. A "task" has a check(state)
// function that returns true once the user has performed the required action
// somewhere in the app. The TaskPanel runs every task's check on each render
// and ticks them off as they pass.
//
// Scenario shape:
//   id              — string, matches lmsSlice scenario list
//   title           — short heading
//   icon            — emoji shown on the dashboard card
//   estimatedMinutes
//   type            — 'tasks' | 'quiz'
//   brief           — { headline, body[], successCriteria }
//   tasks           — [{ id, label, check(state), hint? }]   (when type === 'tasks')
//   quiz            — { passMark, questions: [...] }         (when type === 'quiz')
//   passThreshold   — % of tasks needed to pass (0–100). Default 80.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Selectors used by check functions ───────────────────────────────────────
// Cart is genuinely Redux-backed, so we read it directly. Search/filters/detail
// in the V2 UI live in component state, so those checks read from the LMS
// event log (state.lms.events) populated by `recordLmsEvent` dispatches in
// V2SearchPage. Each event has shape: { type, at, ...payload }.
const getCart   = (state) => state?.cartSettings || {};
const getEvents = (state) => state?.lms?.events || [];

const eventsOfType = (state, type) => getEvents(state).filter((e) => e.type === type);

const hasSearchQuery = (state) => {
  const evts = eventsOfType(state, 'search');
  return evts.some((e) => typeof e.query === 'string' && e.query.trim().length >= 2);
};

const hasOpenedAnyProductDetail = (state) => {
  return eventsOfType(state, 'detail_opened').length > 0;
};

const lastFilterEvent = (state) => {
  const evts = eventsOfType(state, 'filters_changed');
  return evts.length ? evts[evts.length - 1] : null;
};

const lastSearchResultCodes = (state) => {
  const evts = eventsOfType(state, 'search_results');
  return evts.length ? (evts[evts.length - 1].item_codes || []) : [];
};

const norm = (s) => String(s || '').trim().toLowerCase();

const arrayIncludesLoose = (arr, needle) => {
  if (!Array.isArray(arr)) return false;
  const n = norm(needle);
  return arr.some((v) => norm(v).includes(n) || n.includes(norm(v)));
};

const hasItemInCart = (state) => {
  const c = getCart(state);
  return Array.isArray(c.cartItems) && c.cartItems.length > 0;
};

const hasMultipleItemsInCart = (state, min = 2) => {
  const c = getCart(state);
  return Array.isArray(c.cartItems) && c.cartItems.length >= min;
};

const hasCartItemWithQtyAtLeast = (state, minQty = 2) => {
  const c = getCart(state);
  if (!Array.isArray(c.cartItems)) return false;
  return c.cartItems.some((i) => Number(i.quantity || i.count || 0) >= minQty);
};

const SCENARIOS = {

  // ── 1. Find a specific product ─────────────────────────────────────────────
  'find-product': {
    id: 'find-product',
    title: 'Find a Specific Product',
    icon: '🔍',
    estimatedMinutes: 3,
    type: 'tasks',
    passThreshold: 80,
    brief: {
      headline: 'A customer asked for a specific product. Find it.',
      body: [
        'Customer brief: "I need a 24V dimmable LED driver for my office ceiling. Can you check if you have something suitable?"',
        'You need to search the catalogue and open the product\'s full detail sheet so you can quote them with confidence.',
      ],
      successCriteria: 'Search for the product, then open the detail sheet of any matching result.',
    },
    tasks: [
      {
        id: 'perform-search',
        label: 'Search the catalogue for the product',
        hint: 'Use the search bar at the top — try plain English ("24V dimmable LED driver") or a known item code.',
        check: hasSearchQuery,
      },
      {
        id: 'open-detail',
        label: 'Open the full detail sheet of any result',
        hint: 'Click a product card, or hover over one and click the eye (👁) icon.',
        check: hasOpenedAnyProductDetail,
      },
    ],
  },

  // ── 2. Narrow results with filters ─────────────────────────────────────────
  'narrow-with-filters': {
    id: 'narrow-with-filters',
    title: 'Narrow Results with Filters',
    icon: '🎯',
    estimatedMinutes: 3,
    type: 'tasks',
    passThreshold: 80,
    brief: {
      headline: 'Customer needs in-stock items in a specific price range.',
      body: [
        'Customer brief: "I want to see only what you have in stock right now, somewhere in the mid-price range. I don\'t want to scroll through 10,000 SKUs."',
        'Use the filter panel to narrow the catalogue.',
      ],
      successCriteria: 'Turn on "In Stock Only" AND apply at least one other filter (price range, brand, or category).',
    },
    tasks: [
      {
        id: 'apply-instock',
        label: 'Turn on the "In Stock Only" filter',
        hint: 'Filter panel on the left — toggle near the top.',
        check: (state) => {
          const evt = lastFilterEvent(state);
          return evt?.filters?.in_stock === true;
        },
      },
      {
        id: 'apply-second-filter',
        label: 'Apply one more filter (price, brand, or category)',
        hint: 'Use the price range slider, pick a brand, or select a category in the filter panel.',
        check: (state) => {
          const evt = lastFilterEvent(state);
          const f = evt?.filters || {};
          const priceTouched =
            (f.price_range?.min ?? 0) > 0 || (f.price_range?.max ?? 100000) < 100000;
          const rateTouched =
            (f.rate_range?.min ?? 0) > 0 || (f.rate_range?.max ?? 100000) < 100000;
          const brandPicked = Array.isArray(f.brand) && f.brand.length > 0;
          const categoryPicked =
            (Array.isArray(f.category_list) && f.category_list.length > 0) ||
            (Array.isArray(f.item_group) && f.item_group.length > 0);
          return priceTouched || rateTouched || brandPicked || categoryPicked;
        },
      },
    ],
  },

  // ── 3. Precise filter + identify product ───────────────────────────────────
  'precise-filter-and-find': {
    id: 'precise-filter-and-find',
    title: 'Find a Product by Strict Filters',
    icon: '🧩',
    estimatedMinutes: 5,
    type: 'tasks',
    passThreshold: 100, // every step must be done — this scenario is strict by design
    brief: {
      headline: 'Customer has a very specific requirement — find it using filters only.',
      body: [
        'Customer brief: "I need a Lumibright spotlight, around 3000K colour temperature, priced between AED 10 and 100, and it must be in stock right now."',
        'Apply the exact filters required. Then read the SKU off one of the matching product cards and paste it into the verification box at the bottom of the task panel.',
        'No searching allowed — this is a pure filter exercise. You cannot guess the SKU; it must come from the filtered results.',
      ],
      successCriteria: 'Apply all 5 required filters AND submit a valid item code from the resulting product cards.',
    },
    tasks: [
      {
        id: 'pf-instock',
        label: 'Turn on "In Stock Only"',
        hint: 'Top of the filter sidebar — the first toggle.',
        check: (state) => lastFilterEvent(state)?.filters?.in_stock === true,
      },
      {
        id: 'pf-price',
        label: 'Set price range to AED 10 – 100',
        hint: 'Use the Price range slider or min/max boxes. Min ≥ 10 and Max ≤ 100.',
        check: (state) => {
          const f = lastFilterEvent(state)?.filters || {};
          const r = f.rate_range || f.price_range || {};
          const min = Number(r.min);
          const max = Number(r.max);
          if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
          return min >= 10 && max <= 100 && max > min;
        },
      },
      {
        id: 'pf-color-temp',
        label: 'Filter colour temperature to 3000K',
        hint: 'Use the Color Temperature slider/chips. Set the range to include 3000K.',
        check: (state) => {
          const f = lastFilterEvent(state)?.filters || {};
          const rng = f.color_temp_kelvin_range || {};
          const min = Number(rng.min);
          const max = Number(rng.max);
          const inRange = Number.isFinite(min) && Number.isFinite(max) && min <= 3000 && max >= 3000 && (max - min) <= 1000;
          const chipMatch = arrayIncludesLoose(f.color_temp_, '3000');
          return inRange || chipMatch;
        },
      },
      {
        id: 'pf-category',
        label: 'Set category to "Spotlight"',
        hint: 'Open the Category facet and tick "Spotlight".',
        check: (state) => {
          const f = lastFilterEvent(state)?.filters || {};
          return arrayIncludesLoose(f.category_list, 'spotlight') || arrayIncludesLoose(f.item_group, 'spotlight');
        },
      },
      {
        id: 'pf-brand',
        label: 'Set brand to "Lumibright"',
        hint: 'Open the Brand facet and tick "Lumibright".',
        check: (state) => arrayIncludesLoose(lastFilterEvent(state)?.filters?.brand, 'lumibright'),
      },
      {
        id: 'pf-verify-sku',
        label: 'Paste the item code from any matching product card',
        hint: 'Click the SKU on a result card to copy it, then paste into the box and Verify.',
        inputType: 'sku',
        inputPlaceholder: 'e.g. LUM-SPOT-3K-7W',
        wrongMessage: "That code isn't in your filtered results. Re-check the filters and copy the SKU from a visible product card.",
        check: (state) => {
          const entered = norm(state?.lms?.inputAnswers?.['pf-verify-sku']);
          if (!entered) return false;
          const codes = lastSearchResultCodes(state).map(norm);
          if (codes.length === 0) return false;
          return codes.some((c) => c === entered);
        },
      },
    ],
  },

  // ── 4. Build a cart ────────────────────────────────────────────────────────
  'build-cart': {
    id: 'build-cart',
    title: 'Build a Cart for an Order',
    icon: '🛒',
    estimatedMinutes: 4,
    type: 'tasks',
    passThreshold: 80,
    brief: {
      headline: 'Customer placed an order — assemble it in the cart.',
      body: [
        'Customer brief: "I want to order two different products. Make sure one of them has a quantity of at least 2."',
        'Add real items to the cart with the right quantities. The system will tick off each step as you complete it.',
      ],
      successCriteria: 'Cart must contain at least 2 different products, with at least one of them at quantity ≥ 2.',
    },
    tasks: [
      {
        id: 'first-cart-item',
        label: 'Add any product to the cart',
        hint: 'Open a product, click "Add to Cart" — or use the quick-add button on a card.',
        check: hasItemInCart,
      },
      {
        id: 'second-cart-item',
        label: 'Add a second, different product to the cart',
        hint: 'Search again or pick from your existing results, then add.',
        check: (state) => hasMultipleItemsInCart(state, 2),
      },
      {
        id: 'increase-qty',
        label: 'Set one product\'s quantity to 2 or more',
        hint: 'Use the qty stepper in the cart sidebar or on the product card.',
        check: (state) => hasCartItemWithQtyAtLeast(state, 2),
      },
    ],
  },

  // ── 4. Read a product card (quiz) ──────────────────────────────────────────
  'read-card': {
    id: 'read-card',
    title: 'Reading Product Cards',
    icon: '🏷️',
    estimatedMinutes: 3,
    type: 'quiz',
    passThreshold: 70,
    brief: {
      headline: 'Show that you can read information off a product card.',
      body: [
        'A product card packs item code, stock indicator, price, customer signals, and quick actions into a small space.',
        'This knowledge check verifies you can extract the right information at a glance.',
      ],
      successCriteria: 'Score 70% or higher on the 4-question quiz.',
    },
    quiz: {
      passMark: 70,
      questions: [
        {
          id: 'rc_q1',
          question: 'You need to paste an item code into an order form. What is the fastest way to get it from a product card?',
          options: [
            'Open the product detail sheet, then manually type the code',
            'Screenshot the card and type it later',
            'Click the SKU code on the card — it copies to clipboard instantly',
            'Use the search bar to look up the item again',
          ],
          correctIndex: 2,
          explanation: 'Clicking the monospace SKU code on a product card copies it to the clipboard in one click.',
        },
        {
          id: 'rc_q2',
          question: 'A product card shows an orange dot next to the stock level. What does this mean?',
          options: [
            'Out of stock — do not order',
            'Low stock (≤5 units) — confirm quantity before promising the customer',
            'Product is discontinued',
            'Price has changed recently',
          ],
          correctIndex: 1,
          explanation: 'Orange means low stock (5 or fewer units). Verify the exact count in the detail sheet first.',
        },
        {
          id: 'rc_q3',
          question: 'What does the "customer signals" section on a product card tell you?',
          options: [
            'Individual customer review ratings',
            'How many customers bought it and are satisfied — useful for recommending proven products',
            'The date of the last customer complaint',
            'The product return rate',
          ],
          correctIndex: 1,
          explanation: 'Customer signals show happy-customer count and units sold — quick social proof.',
        },
        {
          id: 'rc_q4',
          question: 'You want to save a product to review later, without adding it to the cart. What do you do?',
          options: [
            'Add it to cart immediately',
            'Take a screenshot',
            'Click the heart icon to add it to your wishlist',
            'Copy the URL and email it to yourself',
          ],
          correctIndex: 2,
          explanation: 'The heart icon saves to your wishlist — no cart commitment.',
        },
      ],
    },
  },

  // ── 5. Use the AI assistant ────────────────────────────────────────────────
  'ai-assistant': {
    id: 'ai-assistant',
    title: 'Get Help from the AI Assistant',
    icon: '🤖',
    estimatedMinutes: 3,
    type: 'tasks',
    passThreshold: 100,
    brief: {
      headline: 'Use AI Search to interpret a vague customer brief.',
      body: [
        'Customer brief: "I want something bright but soft-looking for a living room — I don\'t know exact specs."',
        'Use AI Search (natural-language search) to find suitable products, then open one.',
      ],
      successCriteria: 'Run an AI / natural-language search and open at least one of the returned products.',
    },
    tasks: [
      {
        id: 'ai-search',
        label: 'Run an AI / natural-language search',
        hint: 'Click AI Search in the header, or type a full English sentence (3+ words) into the search bar and press Enter.',
        check: (state) => {
          // Either an explicit AI search, or a search whose query reads like a sentence
          if (eventsOfType(state, 'ai_search').length > 0) return true;
          return eventsOfType(state, 'search').some((e) => {
            const words = (e.query || '').trim().split(/\s+/).filter(Boolean);
            return words.length >= 3;
          });
        },
      },
      {
        id: 'ai-open-result',
        label: 'Open one of the products the AI suggested',
        hint: 'Click any product card in the results.',
        check: hasOpenedAnyProductDetail,
      },
    ],
  },

  // ── 6. Full capstone workflow ──────────────────────────────────────────────
  'full-workflow': {
    id: 'full-workflow',
    title: 'Full Workflow Capstone',
    icon: '🏁',
    estimatedMinutes: 6,
    type: 'tasks',
    passThreshold: 80,
    brief: {
      headline: 'Handle a complete customer order from search to cart.',
      body: [
        'Customer brief: "I need to place a small order. Find me a couple of in-stock items, show me the details, and put together a cart I can confirm."',
        'Combine everything you\'ve learnt: search → filter → read detail → build cart.',
      ],
      successCriteria: 'Complete every step in the checklist.',
    },
    tasks: [
      {
        id: 'fw-search',
        label: 'Search for a product',
        check: hasSearchQuery,
      },
      {
        id: 'fw-instock',
        label: 'Apply the "In Stock Only" filter',
        check: (state) => {
          const evt = lastFilterEvent(state);
          return evt?.filters?.in_stock === true;
        },
      },
      {
        id: 'fw-detail',
        label: 'Open a product detail sheet',
        check: hasOpenedAnyProductDetail,
      },
      {
        id: 'fw-cart-2',
        label: 'Build a cart with 2+ different items',
        check: (state) => hasMultipleItemsInCart(state, 2),
      },
    ],
  },

  // ── 7. Final knowledge quiz ────────────────────────────────────────────────
  'knowledge-quiz': {
    id: 'knowledge-quiz',
    title: 'Final Knowledge Check',
    icon: '🏆',
    estimatedMinutes: 5,
    type: 'quiz',
    passThreshold: 70,
    brief: {
      headline: 'Final assessment — prove you understand how this app supports sales.',
      body: [
        'A scenario-based knowledge check covering search, filters, cards, detail sheets, and order assembly.',
        'You can retake this as many times as you need to pass.',
      ],
      successCriteria: 'Score 70% or higher to earn IHG Certification.',
    },
    quiz: {
      passMark: 70,
      questions: [
        {
          id: 'kq1',
          question: 'A customer asks for a "24V dimmable LED driver" but you don\'t know the SKU. What\'s the fastest way to find it?',
          options: [
            'Browse category by category manually',
            'Type the description into the search bar — AI Search interprets plain English',
            'Ask a colleague for the SKU',
            'Export the catalogue to Excel',
          ],
          correctIndex: 1,
          explanation: 'AI Search understands natural English — describe what the customer wants.',
        },
        {
          id: 'kq2',
          question: 'A customer wants only in-stock items from a specific brand. Best approach?',
          options: [
            'Search the brand name and manually skip out-of-stock items',
            'Apply the brand filter AND enable "In Stock Only"',
            'Export the catalogue and filter in Excel',
            'Use AI Search with the brand name only',
          ],
          correctIndex: 1,
          explanation: 'Combining the brand facet with the In Stock toggle narrows results precisely.',
        },
        {
          id: 'kq3',
          question: 'A product card shows a red stock dot. What does that tell you?',
          options: [
            'New arrival',
            'Promotional pricing active',
            'Critical stock — very few units remaining; confirm before promising',
            'Product is discontinued',
          ],
          correctIndex: 2,
          explanation: 'Red = critically low stock. Always open detail to see exact count.',
        },
        {
          id: 'kq4',
          question: 'You want to compare 3 similar products before recommending one. What do you do?',
          options: [
            'Order all 3 and return what is not needed',
            'Guess based on the cards alone',
            'Open each product detail sheet to compare specs and stock',
            'Call the warehouse directly',
          ],
          correctIndex: 2,
          explanation: 'Detail sheets show exact specs, stock per warehouse, and images.',
        },
        {
          id: 'kq5',
          question: 'A customer wants to review some products later without committing to an order. What do you do?',
          options: [
            'Add them all to cart and remove later',
            'Open each detail sheet in a new tab',
            'Click the heart icon on each to add them to the wishlist',
            'Export results to Excel',
          ],
          correctIndex: 2,
          explanation: 'Wishlist saves items for later without affecting the cart.',
        },
        {
          id: 'kq6',
          question: 'You need to copy an item code from a product card into an external order system. Best way?',
          options: [
            'Open the detail sheet and type it out',
            'Click the monospace SKU on the card — it copies to clipboard',
            'Right-click and view source',
            'Ask IT to export the item list',
          ],
          correctIndex: 1,
          explanation: 'Clicking the SKU on any card copies it in one click.',
        },
      ],
    },
  },
};

export const getScenarioById = (id) => SCENARIOS[id] || null;

export const getAllScenarios = () => Object.values(SCENARIOS);

export const getScenarioSequence = () => Object.keys(SCENARIOS);

export default SCENARIOS;
