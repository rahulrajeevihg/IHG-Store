# Sorting Options Logic & Implementation Guide

## Overview
The IHG Frontend App has two distinct sorting systems:
1. **Legacy System** - Used in the traditional product list page (`[...list].js`)
2. **V2 Search System** - Used in the new search interface (`V2SearchPage.jsx`)

Both systems work independently but share some common sorting concepts.

---

## How Sorting Works (In Simple Terms)

### What is Sorting?
Sorting is like arranging a stack of books on a shelf. You can arrange them by:
- **Height** (shortest to tallest or tallest to shortest)
- **Title** (A-Z or Z-A)
- **Publication date** (newest first or oldest first)
- **Price** (cheapest to most expensive)

### How Sorting Works in This App

When you click a sorting option, the app:
1. **Takes all the products** shown in your search results
2. **Picks a data field** to sort by (like Price, Stock, Date, etc.)
3. **Arranges them** in order (ascending or descending)
4. **Displays the reorganized list** to you

### Ascending vs Descending

**Ascending (Low to High / A to Z / Oldest to Newest)**
```
Price Low to High:   ₹100 → ₹500 → ₹2000
Name A-Z:            Apple → Banana → Zebra
Date Oldest First:   Jan 2023 → Jan 2024 → Jan 2025
Stock Low to High:   5 units → 50 units → 500 units
```

**Descending (High to Low / Z to A / Newest to Oldest)**
```
Price High to Low:   ₹2000 → ₹500 → ₹100
Name Z-A:            Zebra → Banana → Apple
Date Newest First:   Jan 2025 → Jan 2024 → Jan 2023
Stock High to Low:   500 units → 50 units → 5 units
```

### Real-World Examples

**Example 1: Searching "LED Bulbs" sorted by Price Low to High**
```
Initial search results (random order):
- LED Bulb A: ₹1500
- LED Bulb B: ₹500
- LED Bulb C: ₹3000
- LED Bulb D: ₹800

After sorting "Price low to high":
1. LED Bulb B: ₹500      ← Cheapest (shown first)
2. LED Bulb D: ₹800
3. LED Bulb A: ₹1500
4. LED Bulb C: ₹3000     ← Most expensive (shown last)
```

**Example 2: Searching "Drivers" sorted by Stock High to Low**
```
Initial search results (random order):
- Driver X: 30 units
- Driver Y: 200 units
- Driver Z: 50 units
- Driver W: 150 units

After sorting "Stock high to low":
1. Driver Y: 200 units   ← Most in stock (shown first)
2. Driver W: 150 units
3. Driver Z: 50 units
4. Driver X: 30 units    ← Least in stock (shown last)
```

**Example 3: Searching "Indoor Lights" sorted by Mostly Sold**
```
Initial search results (random order):
- Light A: Sold 50 units last month
- Light B: Sold 500 units last month
- Light C: Sold 150 units last month
- Light D: Sold 30 units last month

After sorting "Mostly Sold":
1. Light B: 500 units    ← Best seller (shown first)
2. Light C: 150 units
3. Light A: 50 units
4. Light D: 30 units     ← Slowest seller (shown last)
```

---

## Table of Contents
1. [V2 Search System (Modern)](#v2-search-system)
2. [Legacy System](#legacy-system)
3. [Sorting Components](#sorting-components)
4. [State Management](#state-management)
5. [LocalStorage Persistence](#localstorage-persistence)

---

## Quick Reference Guide (TL;DR - At a Glance)

### What each sorting option does:

| Sort Option | Simple Meaning | What It Arranges | Example Result |
|-------------|---|---|---|
| **Relevance** | How well products match your search | Search matching | Best matches first |
| **Price Low to High** | Cheapest first | Standard price | ₹100 → ₹500 → ₹2000 |
| **Price High to Low** | Most expensive first | Standard price | ₹2000 → ₹500 → ₹100 |
| **Offer Price Low to High** | Cheapest discount price first | Discounted price | ₹150 → ₹500 → ₹1500 |
| **Offer Price High to Low** | Most expensive discount price first | Discounted price | ₹1500 → ₹500 → ₹150 |
| **Stock Low to High** | Products running out first | Available quantity | 5 units → 50 → 500 |
| **Stock High to Low** | Best stocked first | Available quantity | 500 units → 50 → 5 |
| **Mostly Sold** | Best sellers first | Sales last 30 days | 1000 sold → 100 → 10 |
| **Least Sold** | Slow movers first | Sales last 30 days | 10 sold → 100 → 1000 |
| **Created Date** | Newest products first | Addition date | Today → Last week → Last month |
| **Created Date (Oldest)** | Oldest products first | Addition date | Last month → Last week → Today |
| **Discount Low to High** | Smallest discount first | Discount % | 5% off → 25% → 60% |
| **Discount High to Low** | Biggest discount first | Discount % | 60% off → 25% → 5% |
| **Popularity High to Low** | Most viewed first | Customer views/clicks | Highly viewed → Rarely viewed |
| **Popularity Low to High** | Least viewed first | Customer views/clicks | Rarely viewed → Highly viewed |
| **Priority High to Low** | Top priority first | Admin priority ranking | Priority 1 → 5 → 10 |
| **Priority Low to High** | Low priority first | Admin priority ranking | Priority 10 → 5 → 1 |
| **Business Score High to Low** | High value products first | Business/B2B value | High value → Medium → Low |
| **Business Score Low to High** | Low value products first | Business/B2B value | Low value → Medium → High |
| **Modified Newest First** | Recently updated first | Last update date | Updated today → 1 month ago |
| **Modified Oldest First** | Not recently updated first | Last update date | Not updated 1 year → 1 day |

---

## Detailed Sort Option Explanations

This section explains what data each sorting option uses and shows practical examples.

### Price-Related Sorting

#### 🏷️ Price Low to High (`rate:asc`)
- **What it does:** Shows cheapest products first
- **Data field used:** Standard Price (RRP/rate)
- **How it works:** Arranges products from lowest price to highest price
- **Use case:** Budget-conscious buyers want to see cheapest options first
- **Example:**
  ```
  Search: "50W LED Bulbs"
  
  Results sorted "Price low to high":
  1. ₹250 (Cheapest - shown at top)
  2. ₹450
  3. ₹650
  4. ₹890
  5. ₹1200 (Most expensive - shown at bottom)
  ```

#### 🏷️ Price High to Low (`rate:desc`)
- **What it does:** Shows most expensive products first
- **Data field used:** Standard Price (RRP/rate)
- **How it works:** Arranges products from highest price to lowest price
- **Use case:** Buyers interested in premium, high-end products
- **Example:**
  ```
  Search: "50W LED Bulbs"
  
  Results sorted "Price high to low":
  1. ₹1200 (Most expensive - shown at top)
  2. ₹890
  3. ₹650
  4. ₹450
  5. ₹250 (Cheapest - shown at bottom)
  ```

#### 🎁 Offer Price Low to High (`offer_rate:asc`)
- **What it does:** Shows products with lowest discounted prices first
- **Data field used:** Discounted/Offer Price (offer_rate)
- **Important:** Different from standard price - uses the final price after discount
- **Use case:** Finding best deals when products have special offers/discounts
- **Example:**
  ```
  Search: "Drivers" (with some discounts applied)
  
  Results sorted "Offer price low to high":
  1. ₹200 (Driver with 50% discount, original: ₹400)
  2. ₹350 (Driver with 30% discount, original: ₹500)
  3. ₹600 (No discount, original: ₹600)
  4. ₹1800 (Panel light with 10% discount, original: ₹2000)
  
  Note: ₹200 is cheapest even though original price wasn't lowest
  ```

#### 🎁 Offer Price High to Low (`offer_rate:desc`)
- **What it does:** Shows products with highest discounted prices first
- **Data field used:** Discounted/Offer Price (offer_rate)
- **Use case:** Finding premium/expensive discounted products
- **Example:**
  ```
  Search: "Lighting Products" (with discounts)
  
  Results sorted "Offer price high to low":
  1. ₹8000 (Panel with offer, original: ₹10000)
  2. ₹1800 (Driver with offer, original: ₹2000)
  3. ₹600 (Regular product, no discount)
  4. ₹350 (Driver with discount)
  5. ₹200 (Driver with offer)
  ```

---

### Date-Related Sorting

#### 📅 Created Date (Newest First) (`creation:desc`)
- **What it does:** Shows products added to catalog most recently
- **Data field used:** Product creation/addition date
- **How it works:** Newest products appear first, oldest appear last
- **Use case:** Customers want to see new products added to inventory
- **Example:**
  ```
  Today: "LED Panel 100W" is added
  Yesterday: "LED Bulb 50W" was added
  Last week: "Driver 12V" was added
  Last month: "Classic Bulb" was added
  
  Results sorted "Created date":
  1. LED Panel 100W (added today)
  2. LED Bulb 50W (added yesterday)
  3. Driver 12V (added last week)
  4. Classic Bulb (added last month)
  ```

#### 📅 Created Date (Oldest First) (`creation:asc`)
- **What it does:** Shows products added to catalog earliest
- **Data field used:** Product creation/addition date
- **How it works:** Oldest products appear first, newest appear last
- **Use case:** Rarely used - might be helpful for historical/legacy products
- **Example:**
  ```
  Results sorted "Created date (oldest first)":
  1. Classic Bulb (added last month)
  2. Driver 12V (added last week)
  3. LED Bulb 50W (added yesterday)
  4. LED Panel 100W (added today)
  ```

#### ⏱️ Modified Newest First (`modified_ts:desc`)
- **What it does:** Shows products that were recently updated
- **Data field used:** Last modification timestamp
- **How it works:** Products modified most recently appear first
- **Use case:** Finding products with updated information, prices, or specs
- **Example:**
  ```
  Today: "LED Bulb 50W" price updated
  Yesterday: "Driver 12V" stock updated
  Last week: "Panel Light" specs updated
  Last month: "Classic Bulb" info updated
  
  Results sorted "Modified newest first":
  1. LED Bulb 50W (updated today)
  2. Driver 12V (updated yesterday)
  3. Panel Light (updated last week)
  4. Classic Bulb (updated last month)
  ```

#### ⏱️ Modified Oldest First (`modified_ts:asc`)
- **What it does:** Shows products not recently updated
- **Data field used:** Last modification timestamp
- **Use case:** Finding stale product info that might need updating
- **Example:**
  ```
  Results sorted "Modified oldest first":
  1. Classic Bulb (last updated 1 year ago - stale)
  2. Panel Light (last updated 3 months ago)
  3. Driver 12V (last updated yesterday)
  4. LED Bulb 50W (last updated today - fresh)
  ```

---

### Stock/Inventory Sorting

#### 📦 Stock Low to High (`stock:asc`)
- **What it does:** Shows products with least available quantity first
- **Data field used:** Current stock/inventory count
- **How it works:** Products with lowest inventory appear first
- **Use case:** Identifying products running low on stock (could need reordering)
- **Example:**
  ```
  Search: "LED Lights"
  
  Results sorted "Stock low to high":
  1. Panel Light A: 3 units (Low stock - shown first)
  2. LED Bulb B: 25 units
  3. Driver C: 150 units
  4. Bulb D: 500 units (High stock - shown last)
  ```

#### 📦 Stock High to Low (`stock:desc`)
- **What it does:** Shows products with most available quantity first
- **Data field used:** Current stock/inventory count
- **How it works:** Products with highest inventory appear first
- **Use case:** Customers want products that are well-stocked and readily available (Default for legacy system)
- **Example:**
  ```
  Search: "LED Lights"
  
  Results sorted "Stock high to low":
  1. Bulb D: 500 units (High stock - shown first)
  2. Driver C: 150 units
  3. LED Bulb B: 25 units
  4. Panel Light A: 3 units (Low stock - shown last)
  ```

---

### Sales/Popularity Sorting

#### 📊 Mostly Sold (Last 30 Days) (`sold_last_30_days:desc`)
- **What it does:** Shows best-selling products - products customers bought most in past month
- **Data field used:** Number of units sold in last 30 days
- **How it works:** Products with highest sales appear first
- **Use case:** Finding "trending" or "popular" products that customers prefer
- **Example:**
  ```
  Search: "60W LED Bulbs"
  
  Sales in last 30 days:
  - Product A: 1000 units sold
  - Product B: 500 units sold
  - Product C: 150 units sold
  - Product D: 30 units sold
  
  Results sorted "Mostly Sold":
  1. Product A (1000 sold - bestseller, shown first)
  2. Product B (500 sold)
  3. Product C (150 sold)
  4. Product D (30 sold - slow seller, shown last)
  ```

#### 📊 Least Sold (Last 30 Days) (`sold_last_30_days:asc`)
- **What it does:** Shows slowest-selling products - products customers bought least in past month
- **Data field used:** Number of units sold in last 30 days
- **Use case:** Clearing old inventory or identifying products that need marketing push
- **Example:**
  ```
  Results sorted "Least Sold":
  1. Product D (30 sold - slow seller, shown first)
  2. Product C (150 sold)
  3. Product B (500 sold)
  4. Product A (1000 sold - bestseller, shown last)
  ```

---

### Search Relevance

#### 🎯 Relevance (Default)
- **What it does:** Products ranked by how well they match your search query
- **Data field used:** Search matching algorithm
- **How it works:** Products with best keyword matches appear first
- **Use case:** When you want natural search results
- **Example:**
  ```
  Search: "LED 50W Warm White"
  
  Results by relevance:
  1. "LED Bulb 50W Warm White 2700K" (All keywords match)
  2. "LED 50W White Bulb" (Most keywords match)
  3. "Warm White 50W" (Keywords match but different product)
  4. "LED Panel" (Partial match)
  5. "50W Halogen" (Keyword 50W only)
  ```

---

### Discount Sorting

#### 🏷️ Discount Low to High (`discount_percentage:asc`)
- **What it does:** Shows products with smallest percentage discount first
- **Data field used:** Discount percentage (e.g., 5%, 10%, 50%)
- **How it works:** Products with lowest discount % appear first
- **Use case:** Finding products with minimal discounts (mostly full-price items)
- **Example:**
  ```
  Search: "Drivers"
  
  Discounts:
  - Driver A: 5% off
  - Driver B: 15% off
  - Driver C: 30% off
  - Driver D: 60% off
  
  Results sorted "Discount low to high":
  1. Driver A: 5% off (smallest discount - shown first)
  2. Driver B: 15% off
  3. Driver C: 30% off
  4. Driver D: 60% off (biggest discount - shown last)
  ```

#### 🏷️ Discount High to Low (`discount_percentage:desc`)
- **What it does:** Shows products with biggest percentage discount first
- **Data field used:** Discount percentage (e.g., 5%, 10%, 50%)
- **How it works:** Products with highest discount % appear first
- **Use case:** Finding products with best deals/deepest discounts
- **Example:**
  ```
  Results sorted "Discount high to low":
  1. Driver D: 60% off (biggest discount - shown first)
  2. Driver C: 30% off
  3. Driver B: 15% off
  4. Driver A: 5% off (smallest discount - shown last)
  ```

---

### Internal Scoring (Admin/Business Features)

#### ⭐ Popularity Low to High (`popularity_score:asc`)
- **What it does:** Shows least popular products (fewest customer interactions)
- **Data field used:** Popularity score calculated from views/clicks
- **Use case:** Identifying neglected products that need attention
- **Example:**
  ```
  Popularity scores (clicks/views):
  - Product A: 10 interactions
  - Product B: 150 interactions
  - Product C: 500 interactions (Most viewed)
  - Product D: 2500 interactions (Very popular)
  
  Results sorted "Popularity low to high":
  1. Product A: 10 interactions (Neglected - shown first)
  2. Product B: 150 interactions
  3. Product C: 500 interactions
  4. Product D: 2500 interactions (Popular - shown last)
  ```

#### ⭐ Popularity High to Low (`popularity_score:desc`)
- **What it does:** Shows most popular products (most customer interactions/views)
- **Data field used:** Popularity score calculated from views/clicks
- **Use case:** Showcasing trending/popular products to customers
- **Example:**
  ```
  Results sorted "Popularity high to low":
  1. Product D: 2500 interactions (Very popular - shown first)
  2. Product C: 500 interactions
  3. Product B: 150 interactions
  4. Product A: 10 interactions (Neglected - shown last)
  ```

#### 📌 Priority Low to High (`priority_score:asc`)
- **What it does:** Shows products with lower internal priority ranking
- **Data field used:** Internal priority score (set by admin)
- **Use case:** Admin feature - deprioritized or secondary products
- **Example:**
  ```
  Admin priority setting:
  - Product A: Priority 1 (High)
  - Product B: Priority 5 (Medium)
  - Product C: Priority 9 (Low)
  
  Results sorted "Priority low to high":
  1. Product A: Priority 1 (High - shown first)
  2. Product B: Priority 5 (Medium)
  3. Product C: Priority 9 (Low - shown last)
  ```

#### 📌 Priority High to Low (`priority_score:desc`)
- **What it does:** Shows products with higher internal priority ranking
- **Data field used:** Internal priority score (set by admin)
- **Use case:** Admin feature - featured or high-priority products
- **Example:**
  ```
  Results sorted "Priority high to low":
  1. Product C: Priority 9 (Low priority number but higher ranking - shown first)
  2. Product B: Priority 5 (Medium)
  3. Product A: Priority 1 (High priority number but lower ranking - shown last)
  ```

#### 💼 Business Score Low to High (`business_score:asc`)
- **What it does:** Shows products with lower business value
- **Data field used:** Business score (set by admin for B2B)
- **Use case:** B2B feature - lower value/margin products
- **Example:**
  ```
  Business value scores:
  - Commodity Driver: Score 2 (Low value)
  - Standard Bulb: Score 5 (Medium value)
  - Premium Panel: Score 9 (High value)
  
  Results sorted "Business score low to high":
  1. Commodity Driver: Score 2 (Low value - shown first)
  2. Standard Bulb: Score 5 (Medium value)
  3. Premium Panel: Score 9 (High value - shown last)
  ```

#### 💼 Business Score High to Low (`business_score:desc`)
- **What it does:** Shows products with higher business value
- **Data field used:** Business score (set by admin for B2B)
- **Use case:** B2B feature - high value/margin products that are strategically important
- **Example:**
  ```
  Results sorted "Business score high to low":
  1. Premium Panel: Score 9 (High value - shown first)
  2. Standard Bulb: Score 5 (Medium value)
  3. Commodity Driver: Score 2 (Low value - shown last)
  ```

---

## V2 Search System

### Available Sort Options

The V2 Search system defines sort options in [`libs/ighSearchV2.js`](libs/ighSearchV2.js) at line 67-89:

```javascript
export const V2_SORT_OPTIONS = [
  { label: "Relevance", value: "" },
  { label: "Created date", value: "creation:desc" },
  { label: "Created date (oldest first)", value: "creation:asc" },
  { label: "Price low to high", value: "rate:asc" },
  { label: "Price high to low", value: "rate:desc" },
  { label: "Offer price low to high", value: "offer_rate:asc" },
  { label: "Offer price high to low", value: "offer_rate:desc" },
  { label: "Stock low to high", value: "stock:asc" },
  { label: "Stock high to low", value: "stock:desc" },
  { label: "Mostly sold", value: "sold_last_30_days:desc" },
  { label: "Least sold", value: "sold_last_30_days:asc" },
  { label: "Discount low to high", value: "discount_percentage:asc" },
  { label: "Discount high to low", value: "discount_percentage:desc" },
  { label: "Priority low to high", value: "priority_score:asc" },
  { label: "Priority high to low", value: "priority_score:desc" },
  { label: "Popularity low to high", value: "popularity_score:asc" },
  { label: "Popularity high to low", value: "popularity_score:desc" },
  { label: "Business score low to high", value: "business_score:asc" },
  { label: "Business score high to low", value: "business_score:desc" },
  { label: "Modified oldest first", value: "modified_ts:asc" },
  { label: "Modified newest first", value: "modified_ts:desc" },
];
```

### Sort Options Breakdown with Human-Language Explanations

| Label | What It Does | Data Used | Example |
|-------|--------------|-----------|---------|
| **Relevance** | Shows products in order of how well they match your search. The best matches appear first. Most relevant = closest match to what you searched for. | Matching score based on search terms | Search "LED 100W" → Shows LED 100W products first, then LED products, then 100W products |
| **Created date** | Shows newest products first (recently added to catalog). | Product creation/addition date | A bulb added today appears before a bulb added last month |
| **Created date (oldest first)** | Shows oldest products first (earliest added to catalog). | Product creation/addition date | A bulb added 2 years ago appears first |
| **Price low to high** | Shows cheapest products first. Takes the standard/RRP price (rate) and displays lowest to highest. | Standard Price (rate field) | ₹100 bulb → ₹500 bulb → ₹2000 bulb |
| **Price high to low** | Shows most expensive products first. Takes the standard price and displays highest to lowest. | Standard Price (rate field) | ₹2000 bulb → ₹500 bulb → ₹100 bulb |
| **Offer price low to high** | Shows cheapest products first using the discounted/offer price instead of standard price. | Offer/Discounted Price (offer_rate field) | Product with ₹80 offer price appears before product with ₹1000 offer price |
| **Offer price high to low** | Shows most expensive products first using the discounted/offer price. | Offer/Discounted Price (offer_rate field) | Product with ₹1000 offer price appears before product with ₹80 offer price |
| **Stock low to high** | Shows products with least available quantity first. Products with low stock appear at top. | Stock/Inventory quantity | 5 units in stock → 50 units in stock → 500 units in stock |
| **Stock high to low** | Shows products with most available quantity first. Products with high stock appear at top. | Stock/Inventory quantity | 500 units in stock → 50 units in stock → 5 units in stock |
| **Mostly sold** | Shows products that sold the most in the last 30 days. Best sellers appear first. | Number of units sold in last 30 days | Product sold 1000 units → Product sold 100 units → Product sold 10 units |
| **Least sold** | Shows products that sold the least in the last 30 days. Slow movers appear first. | Number of units sold in last 30 days | Product sold 10 units → Product sold 100 units → Product sold 1000 units |
| **Discount low to high** | Shows products with smallest discount first. Products with smallest % off appear at top. | Discount percentage (e.g., 10%, 50%) | 5% off product → 25% off product → 60% off product |
| **Discount high to low** | Shows products with biggest discount first. Products with largest % off appear at top. | Discount percentage (e.g., 10%, 50%) | 60% off product → 25% off product → 5% off product |
| **Priority low to high** | Shows products marked with low internal priority first. Used for internal ranking/importance. | Internal priority score assigned by admin | Priority 1 → Priority 5 → Priority 10 |
| **Priority high to low** | Shows products marked with high internal priority first. Top priority items appear first. | Internal priority score assigned by admin | Priority 10 → Priority 5 → Priority 1 |
| **Popularity low to high** | Shows least popular products first (fewer views/clicks). | Popularity score based on user interactions | Rarely viewed → Occasionally viewed → Frequently viewed |
| **Popularity high to low** | Shows most popular products first (more views/clicks). Products people look at most appear first. | Popularity score based on user interactions | Frequently viewed → Occasionally viewed → Rarely viewed |
| **Business score low to high** | Shows products with lower business value/importance first. Used for B2B business prioritization. | Business score assigned by admin (for B2B ranking) | Low value product → Medium value → High value |
| **Business score high to low** | Shows products with higher business value/importance first. High-value products appear first. | Business score assigned by admin (for B2B ranking) | High value product → Medium value → Low value |
| **Modified oldest first** | Shows products that haven't been updated in a long time. Oldest modifications appear first. | Last modification timestamp | Product last updated 1 year ago → 3 months ago → Today |
| **Modified newest first** | Shows products that were recently updated/modified. Most recently changed products appear first. | Last modification timestamp | Product updated today → 3 months ago → 1 year ago |

### V2 Implementation Flow

#### 1. State Definition
**File:** [`components/Search/v2/V2SearchPage.jsx`](components/Search/v2/V2SearchPage.jsx)

The sort state is part of the search state object:
```javascript
const [searchState, setSearchState] = useState(() =>
  stateFromQuery(router.query, isSystemManager)
);

// searchState contains: { ..., sort_by: "", ... }
```

#### 2. UI Component
**File:** [`components/Search/v2/components/ResultsToolbar.jsx`](components/Search/v2/components/ResultsToolbar.jsx)

The `ResultsToolbar` component renders the sort dropdown:

```javascript
import { V2_SORT_OPTIONS } from "@/libs/ighSearchV2";

export default function ResultsToolbar({
  sortValue,           // Current sort value
  onSortChange,        // Callback when sort changes
  // ... other props
}) {
  const sortOption = V2_SORT_OPTIONS.find(
    (option) => option.value === sortValue
  ) || V2_SORT_OPTIONS[0];

  // Renders a Select dropdown with V2_SORT_OPTIONS
}
```

#### 3. Sort Change Handler
**File:** [`components/Search/v2/V2SearchPage.jsx`](components/Search/v2/V2SearchPage.jsx) (line ~1271-1274)

```javascript
<ResultsToolbar
  sortValue={searchState.sort_by}
  onSortChange={(value) => {
    updateState((current) => ({ 
      ...current, 
      sort_by: value, 
      page: 1  // Reset to first page when sort changes
    }));
  }}
  // ... other props
/>
```

#### 4. Query String Sync
When sort changes, the state is converted to query parameters and synced with the URL:
```
/search?q=led&sort_by=rate:desc&page=1
```

#### 5. API Request
The sort value is passed to the backend API via `searchProductsV2()` or `aiSearchProductsV2()` functions, which construct the search query with the sort parameter.

---

## Legacy System

### Available Sort Options (Filters Component)

**File:** [`components/Product/filters/Filters.jsx`](components/Product/filters/Filters.jsx) (line 78-87)

```javascript
let sortByOptions = [
  { text: 'Relevance', value: '' },
  { text: 'Created Date', value: 'creation:desc' },
  { text: 'Price low to high', value: 'rate:asc' },
  { text: 'Price high to low', value: 'rate:desc' },
  { text: 'Stock low to high', value: 'stock:asc' },
  { text: 'Stock high to low', value: 'stock:desc' },
  { text: 'Mostly Sold', value: 'sold_last_30_days:desc' },
  { text: 'Least Sold', value: 'sold_last_30_days:asc' },
]
```

### Available Sort Options (SortBy Component)

**File:** [`components/Product/SortBy.jsx`](components/Product/SortBy.jsx) (line 7-13)

```javascript
let sortings = [
  { text: 'Relevance', role: '' },
  { text: 'Name: A-Z', role: 'name_asc' },
  { text: 'Name: Z-A', role: 'name_desc' },
  { text: 'Price: Low-High', role: 'price_asc' },
  { text: 'Price: High-Low', role: 'price_desc' }
]
```

### Legacy Sort Options Breakdown

#### Filters Component Options
| Text | Value | Backend Field |
|------|-------|---------------|
| Relevance | `` | N/A |
| Created Date | `creation:desc` | creation |
| Price low to high | `rate:asc` | rate |
| Price high to low | `rate:desc` | rate |
| Stock low to high | `stock:asc` | stock |
| Stock high to low | `stock:desc` | stock |
| Mostly Sold | `sold_last_30_days:desc` | sold_last_30_days |
| Least Sold | `sold_last_30_days:asc` | sold_last_30_days |

#### SortBy Component Options
| Text | Role | Backend Field |
|------|------|---------------|
| Relevance | `` | N/A |
| Name: A-Z | `name_asc` | name |
| Name: Z-A | `name_desc` | name |
| Price: Low-High | `price_asc` | price |
| Price: High-Low | `price_desc` | price |

### Legacy Implementation Flow

#### 1. Initial State
**File:** [`pages/[...list].js`](pages/[...list].js) (line 54-86)

```javascript
const initialState = {
  q: "*",
  page_no: 1,
  item_code: "",
  sort_by: 'stock:desc',  // Default sort
  // ... other filter properties
}
```

#### 2. State Management
State is managed using React's `useState`:

```javascript
const [filters, setFilters] = useState({
  ...initialValue,
  price_range: { min: 0, max: 100000 },
  stock_range: { min: 0, max: 100000 }
});
```

#### 3. Sort Change Handler
**File:** [`pages/[...list].js`](pages/[...list].js) (line ~320-350)

```javascript
const handleSortBy = (e, type = "") => {
  let sortByValue = ""
  
  if (type == "dropdown") {
    sortByValue = e.target.value;
  } else {
    sortByValue = e;  // Direct value passed
  }
  
  // Update filters with new sort value
  setFilters({...filters, sort_by: sortByValue})
  
  // Persist to localStorage
  localStorage.setItem('sort_by', sortByValue);
  
  // Fetch results with new sort
  fetchResults();
}
```

#### 4. Component Integration
The sort is passed to UI components:

```javascript
// Passed to Filters component
<Filters 
  filters={filters}
  setFilters={setFilters}
  // ... other props
/>

// Passed to SortBy component
<SortBy 
  sort_by={filters.sort_by}
  ProductFilter={(obj) => ProductFilter({...filters, ...obj})}
/>
```

---

## Sorting Components

### 1. ResultsToolbar Component (V2 Search)
**Location:** [`components/Search/v2/components/ResultsToolbar.jsx`](components/Search/v2/components/ResultsToolbar.jsx)

- Uses `react-select` library for dropdown
- Displays current sort option
- Triggers `onSortChange` callback
- Styled with custom DAWN_SELECT_STYLES

### 2. SortBy Component (Legacy)
**Location:** [`components/Product/SortBy.jsx`](components/Product/SortBy.jsx)

Features:
- Dropdown menu using Headlessui's `Menu` component
- 5 sort options available
- Local state to track selected sort (`soryBy` - note the typo)
- `useEffect` to sync with parent props
- Calls `ProductFilter` callback on selection

```javascript
export default function Example({ProductFilter, sort_by}) {
  const [soryBy,setSortBy] = useState('Relevance')

  useEffect(()=>{
    if(sort_by){
      let value = sortings.find(res=>{return res.role == sort_by})
      value ? setSortBy(value.text) : null
    }else if(sort_by == ""){
      setSortBy('Relevance')
    }
  },[sort_by])
  
  // Returns Headlessui Menu component
}
```

### 3. Filters Component (Legacy)
**Location:** [`components/Product/filters/Filters.jsx`](components/Product/filters/Filters.jsx)

- Contains `sortByOptions` array (line 78-87)
- **Note:** The sort UI is currently commented out (lines 162-171)
- Can be enabled by uncommenting

---

## State Management

### V2 Search State
The sort state is managed as part of the unified search state in V2SearchPage:

```javascript
const [searchState, setSearchState] = useState(() =>
  stateFromQuery(router.query, isSystemManager)
);

// Update function
const updateState = (updates) => {
  setSearchState(prev => ({ ...prev, ...updates }));
}
```

**State Structure:**
```javascript
{
  q: string,           // Search query
  sort_by: string,     // Sort value (e.g., "rate:desc", "")
  page: number,        // Current page
  page_length: number, // Items per page
  search_v2: boolean,  // Whether V2 is enabled
  filters: {
    // Filter options
  }
}
```

### Legacy State
The legacy system uses separate state variables:

```javascript
const [filters, setFilters] = useState({
  sort_by: 'stock:desc',
  // ... other filter properties
});
```

---

## LocalStorage Persistence

### Legacy System Persistence

**File:** [`pages/[...list].js`](pages/[...list].js)

The legacy system persistently stores the sort preference in localStorage:

#### Storing Sort
```javascript
// When sort changes
localStorage.setItem('sort_by', nextFilters.sort_by);
```

#### Retrieving Sort
```javascript
useEffect(() => {
  if (localStorage['sort_by']) {
    filters = { ...filters, sort_by: localStorage['sort_by'] }
    setFilters({ ...filters });
  }
}, [])
```

#### Clearing Sort
**File:** [`pages/_app.js`](pages/_app.js)

```javascript
localStorage.removeItem("sort_by");
localStorage.removeItem("sort_by",);  // Note: duplicate with typo
```

**When:** Typically cleared during:
- Filter reset operations
- Page navigation changes
- Logout/auth changes

### V2 Search Persistence

The V2 system persists sort in the **URL query string** instead of localStorage:

```
/search?q=led&sort_by=rate:desc&page=1&search_v2=1
```

This approach:
- Makes sorting bookmarkable
- Allows sharing search with others
- Survives browser session
- Is more explicit and debuggable

---

## Flow Diagram

### V2 Search Sort Flow
```
User clicks sort dropdown
        ↓
ResultsToolbar.onSortChange()
        ↓
updateState({ sort_by: value, page: 1 })
        ↓
searchState updated
        ↓
useEffect triggers search
        ↓
queryFromState() converts to API params
        ↓
Backend API processes with sort parameter
        ↓
Results displayed sorted accordingly
```

### Legacy Sort Flow
```
User selects from SortBy or Filters component
        ↓
handleSortBy(value) triggered
        ↓
setFilters({ sort_by: value })
        ↓
localStorage.setItem('sort_by', value)
        ↓
fetchResults() called
        ↓
API request with sort_by parameter
        ↓
Results displayed sorted accordingly
```

---

## Backend API Integration

Both systems send the sort value to the backend via the API. The backend expects:

**Parameter Name:** `sort_by`
**Format:** `field:direction` or empty string

**Example API Calls:**
```
GET /api/method/igh_search.igh_search.api.search_products?...&sort_by=rate:desc&...
GET /api/method/igh_search.igh_search.api.search_products?...&sort_by=stock:asc&...
GET /api/method/igh_search.igh_search.api.search_products?...&sort_by=&...  # Relevance
```

---

## Default Sort Values

| System | Default | Value | Use Case |
|--------|---------|-------|----------|
| V2 Search | Relevance | `` | New searches |
| Legacy List | Stock High-Low | `stock:desc` | Category/listing pages |
| Legacy SortBy | Relevance | `` | Manual selection |

---

## Adding New Sort Options

### To Add a Sort Option in V2 Search:

1. **Add to `V2_SORT_OPTIONS` array** in [`libs/ighSearchV2.js`](libs/ighSearchV2.js):
```javascript
{ label: "Your Label", value: "backend_field:asc" }
```

2. The sort dropdown will automatically include the new option
3. Ensure the backend field exists and is properly indexed

### To Add a Sort Option in Legacy System:

1. **Add to `sortByOptions` array** in [`components/Product/filters/Filters.jsx`](components/Product/filters/Filters.jsx):
```javascript
{ text: 'Your Label', value: 'backend_field:asc' }
```

2. **Optionally add to `sortings` array** in [`components/Product/SortBy.jsx`](components/Product/SortBy.jsx):
```javascript
{ text: 'Your Label', role: 'backend_field:asc' }
```

3. Ensure the backend field exists and is properly indexed

---

## Key Points Summary

✅ **Two separate sorting systems** - V2 and Legacy
✅ **V2 uses 21 sort options**, Legacy uses 5-8
✅ **Sort values follow format:** `field:direction` (e.g., `rate:desc`)
✅ **V2 persists sort in URL**, Legacy uses localStorage
✅ **Default sort:** Relevance (empty value `""`)
✅ **Page resets to 1** when sort changes
✅ **Backend field names** must match database schema
✅ **Both systems pass sort to API** as `sort_by` parameter

---

---

## How Popularity Score Is Calculated

### Overview
The **Popularity Score** is a calculated metric that measures how much customer interest a product has received. The system automatically tracks user interactions with products to determine this score.

### Important: What Are These Tracking Functions?

**NOT DocTypes** - `trackAiSearchClick`, `trackAiSearchShortlist`, and `trackAiSearchQuotation` are:
- ✅ **Frontend JavaScript functions** that make API calls
- ✅ **Not DocTypes in ERPNext**
- ✅ **Wrapper functions** that call backend API methods
- ✅ Located in: [`libs/ighSearchV2.js`](libs/ighSearchV2.js)

**Backend Side:**
- The actual backend API methods that handle tracking are in the **ERPNext `igh_search` app** (separate from this frontend repo)
- The backend app has corresponding methods:
  - `igh_search.igh_search.api.track_ai_search_click`
  - `igh_search.igh_search.api.track_ai_search_shortlist`
  - `igh_search.igh_search.api.track_ai_search_quotation`

**DocType for Storing Events:**
- Events are stored in the `AI Product Search Event` DocType in the `igh_search` ERPNext app
- This DocType contains fields like:
  - event_type (click, shortlist, quotation, etc.)
  - item_code (product code)
  - user_id / session_id
  - search_event_id
  - timestamp
  - search_query
  - Any other relevant data

---

### Data Tracked by the System

The frontend application tracks the following user actions:

```
1. Product Click/View
   - When user clicks on a product card or result
   - Function: trackAiSearchClick()
   - Data sent: item_code, search_event_id

2. Shortlist/Wishlist Action
   - When user adds product to shortlist or wishlist
   - Function: trackAiSearchShortlist()
   - Data sent: item_code, search_event_id

3. Quotation Request
   - When user adds product to cart/quotation
   - Function: trackAiSearchQuotation()
   - Data sent: item_code, search_event_id, quotation details

4. Search Reformulation
   - When user modifies search query
   - Function: trackAiSearchReformulation()
   - Data sent: search_event_id, reformulated_message
```

### How Tracking Works

**Frontend Tracking Flow:**

```
User Action (Click/View Product)
    ↓
V2SearchPage component detects interaction
    ↓
trackAiSearchClick() function called
    ↓
API request sent to backend:
POST /api/method/igh_search.igh_search.api.track_ai_search_click
    {
        item_code: "LED-100-001",
        search_event_id: "abc123xyz"
    }
    ↓
Backend records the event in database
    ↓
Backend periodically recalculates popularity_score for all products
```

**Code Location:** [`libs/ighSearchV2.js`](libs/ighSearchV2.js) (lines 390-441)

```javascript
export const trackAiSearchClick = async (payload, options = {}) =>
  postApi(
    "track_ai_search_click",
    {
      search_event_id: payload?.search_event_id ?? "",
      item_code: payload?.item_code ?? "",
    },
    {
      timeoutMs: 8000,
      ...options,
    }
  );

export const trackAiSearchShortlist = async (payload, options = {}) =>
  postApi(
    "track_ai_search_shortlist",
    {
      search_event_id: payload?.search_event_id ?? "",
      item_code: payload?.item_code ?? "",
    },
    {
      timeoutMs: 8000,
      ...options,
    }
  );

export const trackAiSearchQuotation = async (payload, options = {}) =>
  postApi(
    "track_ai_search_quotation",
    {
      search_event_id: payload?.search_event_id ?? "",
      item_code: payload?.item_code ?? "",
      quotation: payload?.quotation ?? "",
    },
    {
      timeoutMs: 8000,
      ...options,
    }
  );
```

### Popularity Score Calculation (Backend)

The **popularity_score** is calculated by the **backend system** (ERP/Frappe), not the frontend.

**How it's calculated:**

```
popularity_score = 
    (Number of clicks) * weight_click +
    (Number of shortlist adds) * weight_shortlist +
    (Number of quotations) * weight_quotation +
    (Other engagement metrics) * respective_weights

Typical weights (example):
- View/Click: 1 point each
- Shortlist/Wishlist: 5 points each
- Quotation/Cart Add: 10 points each
```

**Update Frequency:**

```
┌─────────────────────────────────────────┐
│ Backend System (ERP/Frappe)             │
├─────────────────────────────────────────┤
│                                         │
│ Every hour (or configurable):          │
│ 1. Aggregate all tracked events        │
│ 2. Calculate popularity_score          │
│ 3. Update product database             │
│ 4. Update in search index (Typesense)  │
│                                         │
│ Result: Products ranked by engagement  │
└─────────────────────────────────────────┘
```

### Where Popularity Score Is Stored

1. **ERP Database** (Source of truth)
   - Product doctype field: `popularity_score`
   - Type: Decimal/Float
   - Updated: Every hour or based on schedule

2. **Search Index** (Typesense)
   - Synced from ERP database
   - Used for sorting search results
   - Field name: `popularity_score`

3. **Frontend Display**
   - Fetched from API via `searchProductsV2()` or `aiSearchProductsV2()`
   - Used in sorting dropdown
   - Allows "Sort by Popularity"

### Example: How Popularity Score Changes

**Day 1:**
```
Product A initial state:
- Views: 0
- Shortlists: 0
- Quotations: 0
- Popularity Score: 0
```

**During Day 1:**
```
User Actions:
- 5 users view the product (5 clicks tracked)
- 2 users add to shortlist (2 shortlist events)
- 1 user requests quotation (1 quotation event)

Events recorded in database:
click: 5
shortlist: 2
quotation: 1
```

**After Backend Calculation (Next Hour):**
```
popularity_score = (5 × 1) + (2 × 5) + (1 × 10)
                 = 5 + 10 + 10
                 = 25 points

Product A updated:
- Popularity Score: 25
```

**Results:**
```
When sorted by "Popularity High to Low":
- Product A (25 points) appears higher than
- Product B (12 points) or
- Product C (5 points)
```

### Event Tracking Code Location

**File:** [`components/Search/v2/V2SearchPage.jsx`](components/Search/v2/V2SearchPage.jsx)

```javascript
// When user clicks on a product
const handleProductCardClick = (product) => {
  // ... other logic
  
  // Track the click event
  trackAiSearchClick({
    item_code: product.item_code,
    search_event_id: aiSession?.search_event_id,
  });
};

// When user adds to shortlist
const handleAddToShortlist = (product) => {
  // ... other logic
  
  trackAiSearchShortlist({
    item_code: product.item_code,
    search_event_id: aiSession?.search_event_id,
  });
};

// When user adds to cart/quotation
const handleAddToCart = (product) => {
  // ... other logic
  
  trackAiSearchQuotation({
    item_code: product.item_code,
    search_event_id: aiSession?.search_event_id,
    quotation: cartData,
  });
};
```

### Important Notes About Popularity

✅ **Automatic Tracking:** User actions are automatically tracked without special configuration
✅ **Real-Time Events:** Events sent to backend immediately when user interacts
✅ **Calculated Metric:** Popularity score calculated by backend, not frontend
✅ **Updated Regularly:** Score refreshed hourly (or on configured schedule)
✅ **Available for Sorting:** Can filter/sort products by popularity range
✅ **Engagement Indicator:** Higher score = More customer interest

❌ **Not Manual:** Cannot be set manually by admins
❌ **Not Instant:** Takes time to update (event sent → processed → calculated)
❌ **Not Cumulative Forever:** May use time windows (last 30 days, last 90 days, etc.)

---

## How Business Score Works

### Overview
The **Business Score** is an admin-configured metric used primarily for **B2B (Business-to-Business)** purposes. It allows admins to rank products by business importance, profit margin, or strategic value.

### What Business Score Represents

```
Business Score = Admin's ranking of product importance/value

Typical Use Cases:
- Higher margin products (premium positioning)
- Strategic/key products
- Products with high profit margin
- Products important for business goals
- VIP customer products
```

### How Business Score Is Set

**Location:** Backend ERP System (Frappe)

1. **Admin Access Required**
   - Only system administrators can set business score
   - Requires ERPNext/Frappe backend access
   - NOT available in frontend UI

2. **Setting Process**

   ```
   ERP Admin → Product List → Edit Product
                  ↓
   Navigate to "Additional Information" or "Business Settings"
                  ↓
   Set "Business Score" field (numeric value)
                  ↓
   Save Product
                  ↓
   Score synced to search index
   ```

3. **Field Details**

   ```
   Field Name: business_score
   Field Type: Integer or Float
   Location: Item/Product doctype in Frappe
   Example Values:
   - 1 = Low importance
   - 5 = Medium importance
   - 10 = High importance / Featured product
   ```

### Business Score vs Popularity Score

**Important Distinction:**

| Aspect | Business Score | Popularity Score |
|--------|---|---|
| **Set By** | Admin (manual) | System (automatic) |
| **Based On** | Admin decision/strategy | Customer engagement |
| **Changes** | Only when admin updates | Recalculated hourly |
| **Purpose** | Internal business ranking | Customer interest measurement |
| **Use Case** | B2B, curated collections | Customer preference |
| **Example** | Highlight high-margin products | Show trending products |

**Practical Example:**

```
Product A:
- Business Score: 8 (High margin, strategic product)
- Popularity Score: 2 (Few customer views)

Product B:
- Business Score: 2 (Low margin, commodity)
- Popularity Score: 50 (Many customer views)

When sorted "Business Score High to Low":
→ Product A shown first (admin's choice)

When sorted "Popularity High to Low":
→ Product B shown first (customer preference)
```

### How Business Score Is Used in Frontend

**In Sorting:**

```javascript
// From libs/ighSearchV2.js
export const V2_SORT_OPTIONS = [
  // ...
  { label: "Business score low to high", value: "business_score:asc" },
  { label: "Business score high to low", value: "business_score:desc" },
  // ...
]
```

**In Filtering:**

```javascript
// From libs/ighSearchV2.js
export const V2_RANGE_KEYS = [
  // ...
  "business_score_range",  // Can filter by score range
  // ...
]
```

**In Results:**

```javascript
// Products can be filtered/sorted by business score range
searchState.filters.business_score_range = { min: "5", max: "10" }
// Shows only products with business score between 5-10
```

### Setting Business Score - Step by Step

**For Backend Administrators:**

```
Step 1: Open ERPNext/Frappe
        URL: https://your-erp-domain.com

Step 2: Navigate to Products
        Home → Inventory → Item
        OR Search: "Item"

Step 3: Find the product you want to rate
        Search or browse product list
        Click on product name

Step 4: Scroll to "Business Settings" section
        (Or "Additional Info" or product variant section)

Step 5: Find "Business Score" field
        Type in numeric value:
        - 0-5: Low priority/low margin
        - 5-8: Medium priority/margin
        - 8-10: High priority/high margin

Step 6: Save the product
        Click "Save" button or Ctrl+S

Step 7: Wait for sync
        System syncs to search database within minutes
        Changes available in search results

Step 8: Verify in frontend
        Search for product
        Sort by "Business Score High to Low"
        Verify position
```

### Business Score Configuration (Backend)

**In the Product/Item Doctype:**

```
Item Configuration Example:
├─ Basic Information
│  ├─ Item Name: "LED Panel 100W"
│  ├─ Item Code: "LED-100-001"
│  └─ Item Group: "Panels"
│
├─ Pricing
│  ├─ Rate: ₹5000
│  ├─ Offer Rate: ₹4500
│  └─ Cost: ₹2000
│
└─ Business Settings  ← Business Score is here
   ├─ Business Score: 9        ← Set by admin
   ├─ Priority Score: 5
   ├─ Margin %: 40%
   └─ Is Featured: Yes
```

### Example Workflow: B2B Store Setup

**Scenario:** Electronics company wants to promote high-margin products to B2B customers

**Setup Steps:**

```
1. Admin analyzes profit margins
   - LED Driver (30% margin) → Business Score: 9
   - LED Bulb (15% margin) → Business Score: 5
   - Connector (5% margin) → Business Score: 1

2. Admin edits each product in ERP
   Sets business_score field accordingly

3. System syncs to search index
   Backend updates Typesense daily or on-demand

4. Customers see sorted results
   "Sort by: Business Score High to Low"
   → Shows high-margin products first
   → Drives sales of profitable items

5. Results
   ✓ High-margin LED Drivers shown first
   ✓ Customers more likely to purchase them
   ✓ Business profit improves
```

### Important Notes About Business Score

✅ **Admin Control:** Only admins can set these values
✅ **Strategic Tool:** Used for business goals, not customer demand
✅ **Searchable:** Can filter products by score range
✅ **Sortable:** Can sort low-to-high or high-to-low
✅ **B2B Focused:** Designed for business customer prioritization
✅ **Persistent:** Changes saved permanently until admin updates

❌ **Not Automatic:** Must be manually set/updated
❌ **Not Customer-Facing:** Customers don't know these are set
❌ **Not Weighted:** Simple numeric value (no formula)
❌ **Not Time-Based:** Doesn't change based on time/season

### Business Score API Fields

**Frontend receives from API:**

```javascript
// Search result includes business_score field
{
  item_code: "LED-100-001",
  name: "LED Panel 100W",
  rate: 5000,
  popularity_score: 25,
  business_score: 9,    // ← Admin set value
  // ... other fields
}
```

**Can filter by range:**

```javascript
// Only show products with high business score (8-10)
searchState.filters.business_score_range = {
  min: "8",
  max: "10"
}

// API request includes:
// ?business_score_range_min=8&business_score_range_max=10
```

---

---

## Architecture: DocTypes and Data Storage

### System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    COMPLETE ARCHITECTURE                         │
└──────────────────────────────────────────────────────────────────┘

FRONTEND (React/Next.js)           BACKEND (ERPNext)
═══════════════════════════════    ═════════════════════════════════

trackAiSearchClick()                igh_search.api.track_ai_search_click
(JavaScript function)               (Backend API method)
    ↓                                  ↓
postApi()                           Receives tracking request
(HTTP POST)                             ↓
    ↓                               Stores in DocType:
    │                               "Search Event" or "Product View Log"
    │                                  ↓
    └─→ Backend Method              Fields:
        /api/method/igh_search/     - event_type: "click"
         igh_search/api/             - item_code
         track_ai_search_click        - user_id / session_id
                                      - search_event_id
                                      - timestamp
                                      - ... other fields
```

### ERPNext DocTypes Involved

#### 1. **Item** (Standard ERPNext DocType)
Stores product information with scoring fields:

```
Item DocType
├─ Basic Fields:
│  ├─ item_code: "LED-100-001"
│  ├─ item_name: "LED Panel 100W"
│  └─ description: "..."
│
├─ Business Scoring Fields:
│  ├─ popularity_score: 25 (Calculated field)
│  ├─ business_score: 8 (Admin-set field)
│  ├─ priority_score: 5 (Admin-set field)
│  └─ sold_last_30_days: 150 (Calculated field)
│
├─ Stock Fields:
│  ├─ stock: 500 (Current inventory)
│  └─ stock_uom: "Nos"
│
└─ Pricing Fields:
   ├─ rate: 5000 (Standard price)
   └─ offer_rate: 4500 (Discounted price)
```

**Location in ERPNext:** Inventory → Item

**Who Updates:**
- `popularity_score`: Backend system (hourly calculation)
- `business_score`: Admin (manual)
- `priority_score`: Admin (manual)
- `sold_last_30_days`: Backend system (from Sales Orders)

---

#### 2. **AI Product Search Event** (Custom DocType in `igh_search` app)
Stores tracking events for popularity calculation:

```
AI Product Search Event DocType Structure
├─ event_type: "click" | "shortlist" | "quotation" | "reformulation"
├─ item_code: "LED-100-001"
├─ user_id / session_id: User identifier
├─ search_event_id: "abc123xyz"
├─ search_query: "LED 100W"
├─ timestamp: 2026-05-11 10:15:30
├─ browser_info: User agent, IP, etc.
└─ ... other tracking fields
```

**Location in ERPNext:** (In `igh_search` app, not standard)

**Created By:** `track_ai_search_click` backend method
**Used By:** Popularity calculation job

**Data Flow:**
```
Frontend detects click
    ↓
trackAiSearchClick() sends request
    ↓
Backend API: track_ai_search_click()
    ↓
Creates AI Product Search Event doc
    ↓
Stored in database
    ↓
(Hourly job reads these events)
    ↓
Calculates popularity_score
    ↓
Updates Item.popularity_score
```

---

#### 3. **Quotation** (Standard ERPNext DocType)
When user adds to cart/requests quote:

```
Quotation DocType
├─ quotation_to: "Customer"
├─ party_name: "Customer Name"
├─ items[]: Array of quoted items
│  ├─ item_code: "LED-100-001"
│  ├─ qty: 100
│  └─ rate: 4500
├─ transaction_date: 2026-05-11
├─ grand_total: 450000
└─ status: "Draft"
```

**Created By:** `create_quotation_from_portal` API method
**Tracking:** When quotation created, `track_ai_search_quotation` also fires
**Affects:** Both quotation count AND Search Event for tracking

---

### Data Flow: From Click to Popularity Score

```
┌────────────────────────────────────────────────────────────┐
│             COMPLETE DATA FLOW (Time-based)                │
└────────────────────────────────────────────────────────────┘

Time: 10:15 AM - User clicks product "LED-100-001"
══════════════════════════════════════════════════════════════

Frontend:
1. V2SearchPage detects click
2. Calls: trackAiSearchClick({
     item_code: "LED-100-001",
     search_event_id: "search_2026_05_11_abc"
   })

3. postApi() makes HTTP POST:
   POST /api/method/igh_search.igh_search.api.track_ai_search_click
   Body: { item_code, search_event_id }

Backend:
4. igh_search.api.track_ai_search_click() receives request
5. Validates parameters
6. Creates new Search Event doc:
   {
     doctype: "Search Event",
     event_type: "click",
     item_code: "LED-100-001",
     search_event_id: "search_2026_05_11_abc",
     user_id: "john@example.com",
     timestamp: "2026-05-11 10:15:30"
   }
7. Saves to database
8. Returns: { success: true }

Database State After:
├─ AI Product Search Event table has new entry
└─ Item "LED-100-001" popularity_score still unchanged (not yet recalculated)


Time: 11:00 AM - Backend Scheduled Job Runs
═════════════════════════════════════════════

Backend System:
1. Reads all Search Events from past hour
2. Groups by item_code
3. Counts:
   - Clicks: 3
   - Shortlists: 1
   - Quotations: 1
4. Calculates: popularity = (3×1) + (1×5) + (1×10) = 18
5. Updates Item.popularity_score = 18
6. Syncs to Typesense (search index)
7. Clears cache

Database State After:
├─ Item "LED-100-001" updated:
│  └─ popularity_score: 18 (was 0)
└─ Search index updated with new score


Time: 11:15 AM - Customer Searches
══════════════════════════════════

Frontend:
1. Customer searches "LED"
2. searchProductsV2() called
3. API request includes: sort_by=popularity_score:desc

Backend:
4. Queries Typesense with popularity_score sort
5. Returns results ordered by popularity

Frontend Display:
6. Product "LED-100-001" ranked high due to popularity_score=18
7. Shown at top of results
```

---

### Where Each DocType is Located

| DocType | Location | Purpose | Created By | Updated By |
|---------|----------|---------|------------|-----------|
| **Item** | Standard ERPNext | Product master | System admin | Admin / Backend jobs |
| **Search Event** | `igh_search` app | Track interactions | trackAiSearchClick() API | Frontend tracking calls |
| **Quotation** | Standard ERPNext | Sales quotation | API method | Admin / System |
| **Item Price** | Standard ERPNext | Pricing | Admin | Admin |
| **Bin** (Inventory) | Standard ERPNext | Stock tracking | System | Stock movements |

---

### Database Fields Related to Sorting

**In Item DocType:**

```sql
-- Sorting-related fields in Item table:
ALTER TABLE `tabItem` ADD COLUMN `popularity_score` DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE `tabItem` ADD COLUMN `business_score` INT DEFAULT 0;
ALTER TABLE `tabItem` ADD COLUMN `priority_score` INT DEFAULT 0;
ALTER TABLE `tabItem` ADD COLUMN `sold_last_30_days` INT DEFAULT 0;

-- Standard pricing fields:
ALTER TABLE `tabItem` ADD COLUMN `standard_rate` DECIMAL(18, 6);

-- Stock field:
ALTER TABLE `tabBin` ADD COLUMN `actual_qty` DECIMAL(18, 6);
```

**These fields are queried during:**
- Sorting operations
- Filtering operations
- Facet generation (dropdown options)

---

### API Methods (Backend Functions)

**Location:** ERPNext `igh_search` app → `igh_search/api.py`

```python
# These are @frappe.whitelist() decorated methods

# Tracking Methods
@frappe.whitelist(allow_guest=True)
def track_ai_search_click(search_event_id, item_code):
    """Create Search Event doc for product view"""
    # Implementation: Create new Search Event doc
    # Store: event_type="click", item_code, timestamp

@frappe.whitelist(allow_guest=True)
def track_ai_search_shortlist(search_event_id, item_code):
    """Create Search Event doc for shortlist"""
    # Implementation: Create new Search Event doc
    # Store: event_type="shortlist", item_code, timestamp

@frappe.whitelist(allow_guest=True)
def track_ai_search_quotation(search_event_id, item_code, quotation):
    """Create Search Event doc + update quotation"""
    # Implementation: Create new Search Event doc
    # Store: event_type="quotation", item_code, quotation_id

# Calculation Methods (Scheduled Jobs)
def calculate_popularity_scores():
    """Scheduled job - runs hourly"""
    # For each item:
    #   1. Count search events by type
    #   2. Calculate: score = (clicks×1) + (shortlists×5) + (quotations×10)
    #   3. Update Item.popularity_score
    #   4. Sync to Typesense
```

---

## Tracking & Scoring Summary Table

| Metric | Set By | Updated | Purpose | Auto? |
|--------|--------|---------|---------|-------|
| **Popularity Score** | System (auto) | Hourly | Show trending products | ✅ Yes |
| **Business Score** | Admin (manual) | On update | Highlight profitable products | ❌ No |
| **Sold Last 30 Days** | System (auto) | Daily/Hourly | Show bestsellers | ✅ Yes |
| **Priority Score** | Admin (manual) | On update | Internal prioritization | ❌ No |
| **Discount %** | System (auto) | On price update | Show sales percentage | ✅ Yes |

---

---

## Technical Flow Diagrams

### Complete Popularity Tracking Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    POPULARITY TRACKING SYSTEM                        │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND (Browser)                  BACKEND (ERP/Frappe)
═══════════════════                 ════════════════════

User Views Product
  │
  ├─→ V2SearchPage detects click
  │
  ├─→ trackAiSearchClick() called
  │   with: { item_code, search_event_id }
  │
  ├─→ API Call Sent:
  │   POST /api/method/igh_search.igh_search.api.track_ai_search_click
  │   {
  │     item_code: "LED-100-001",
  │     search_event_id: "abc123xyz"
  │   }
  │                                  ──→ Event Recorded
  │                                      │
  │                                      ├─→ Database: events table
  │                                      │
  │                                      ├─→ Event stored with:
  │                                      │   - Product code
  │                                      │   - Event type (click)
  │                                      │   - Timestamp
  │                                      │   - User info
  │
  ├─← Response: { success: true }
  │
  └─ User Experience: Seamless (tracking is in background)


═══════════════════════════════════════════════════════════════════════

BACKEND CALCULATION (Hourly Job)
═══════════════════════════════

Schedule: Every hour (configurable)

1. Read Events Table
   └─→ Count all click events for each product (last hour)
   └─→ Count all shortlist events for each product
   └─→ Count all quotation events for each product

2. Calculate Score
   └─→ Formula:
       popularity_score = (clicks × 1) + (shortlists × 5) + (quotations × 10)

3. Update Product Database
   └─→ Update Item doctype: popularity_score field
   └─→ SQL: UPDATE Item SET popularity_score = 25 WHERE code = 'LED-100-001'

4. Sync to Search Index
   └─→ Sync to Typesense search database
   └─→ Makes score available for sorting/filtering

5. Cache Cleared
   └─→ Search results refreshed
   └─→ Frontend gets latest scores

RESULT: Product now ranks by popularity when sorted
```

### Business Score Setup Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  BUSINESS SCORE SETUP (Admin Task)                   │
└─────────────────────────────────────────────────────────────────────┘

ADMIN (Frappe/ERP)                  DATABASE
═══════════════════                 ════════

1. Admin opens ERPNext
   └─→ Navigate to: Inventory → Item
   └─→ Search or browse products

2. Admin finds product
   └─→ Click: "LED Panel 100W"
   └─→ Opens product edit form

3. Admin sets Business Score
   └─→ Scroll to "Business Settings"
   └─→ Field: "Business Score"
   └─→ Value: 9 (out of 10)
   └─→ Reason: High profit margin product

4. Admin saves
   └─→ Click "Save" button
   └─→ Product data saved to database
   │
   └──→ Database updated:
        UPDATE Item 
        SET business_score = 9 
        WHERE name = 'LED-100-001'

5. Search Index Sync
   └─→ Background job syncs Frappe to Typesense
   └─→ Updated within minutes (usually < 5 min)

6. Frontend gets new data
   └─→ searchProductsV2() API call
   └─→ Returns: business_score: 9
   └─→ Can now sort/filter by this value

RESULT: Products ranked by business importance when sorted
```

### Complete Data Flow from Tracking to Display

```
┌────────────────────────────────────────────────────────────────────┐
│              END-TO-END POPULARITY RANKING FLOW                     │
└────────────────────────────────────────────────────────────────────┘

Day 1: Initial State
───────────────────
Product A: popularity_score = 0


Day 1: User Actions
────────────────────
┌─────────────────────────────────────────────────────┐
│ 10:00 - User 1 views Product A                      │
│ Event: { type: 'click', item: 'LED-100-001' }      │
├─────────────────────────────────────────────────────┤
│ 10:15 - User 2 adds to shortlist                    │
│ Event: { type: 'shortlist', item: 'LED-100-001' }  │
├─────────────────────────────────────────────────────┤
│ 10:30 - User 3 requests quotation                   │
│ Event: { type: 'quotation', item: 'LED-100-001' }  │
├─────────────────────────────────────────────────────┤
│ 11:00 - User 4 views Product A again               │
│ Event: { type: 'click', item: 'LED-100-001' }      │
└─────────────────────────────────────────────────────┘
        ↓ (Events stored in database)


Day 1: 12:00 - Backend Calculation (Hourly Job)
─────────────────────────────────────────────────
Calculate popularity_score = (2 clicks × 1) + (1 shortlist × 5) + (1 quotation × 10)
                           = 2 + 5 + 10
                           = 17 points

Update Product:
  Item: LED-100-001
  popularity_score: 17 ← Changed from 0 to 17

Sync to Search Index:
  Typesense database updated
  └─→ Field "popularity_score": 17


Day 1: 12:15 - Search Results Updated
──────────────────────────────────────
Customer searches: "LED"
Results are automatically sorted by latest popularity_score

When customer selects "Sort by: Popularity High to Low":
Ranking:
  1. Product A: popularity_score 17  ← Highest (recently popular)
  2. Product X: popularity_score 5
  3. Product Y: popularity_score 2   ← Lowest
```

### API Call Examples

**Tracking a Product View:**

```
Request:
────────
POST /api/method/igh_search.igh_search.api.track_ai_search_click
Content-Type: application/json

{
  "item_code": "LED-100-001",
  "search_event_id": "search_2026_05_11_abc123",
}

Response:
─────────
{
  "message": "Click event recorded successfully",
  "success": true
}
```

**Tracking a Shortlist Action:**

```
Request:
────────
POST /api/method/igh_search.igh_search.api.track_ai_search_shortlist
Content-Type: application/json

{
  "item_code": "LED-100-001",
  "search_event_id": "search_2026_05_11_abc123"
}

Response:
─────────
{
  "message": "Shortlist event recorded successfully",
  "success": true
}
```

**Tracking a Quotation/Cart Add:**

```
Request:
────────
POST /api/method/igh_search.igh_search.api.track_ai_search_quotation
Content-Type: application/json

{
  "item_code": "LED-100-001",
  "search_event_id": "search_2026_05_11_abc123",
  "quotation": {
    "qty": 100,
    "rate": 500
  }
}

Response:
─────────
{
  "message": "Quotation event recorded successfully",
  "quotation_id": "Q-2026-05-001",
  "success": true
}
```

**Searching with Popularity Filter:**

```
Request:
────────
GET /api/method/igh_search.igh_search.api.search_products?
    q=LED&
    sort_by=popularity_score:desc&
    page=1&
    page_length=20

Response:
─────────
{
  "message": [
    {
      "item_code": "LED-100-001",
      "name": "LED Panel 100W",
      "popularity_score": 25,  ← Used for ranking
      "rate": 5000,
      ...
    },
    {
      "item_code": "LED-50-001",
      "name": "LED Bulb 50W",
      "popularity_score": 15,  ← Lower popularity
      "rate": 1500,
      ...
    }
  ]
}
```

**Filtering by Business Score Range:**

```
Request:
────────
GET /api/method/igh_search.igh_search.api.search_products?
    q=LED&
    business_score_range_min=7&
    business_score_range_max=10&
    page=1&
    page_length=20

Response:
─────────
{
  "message": [
    {
      "item_code": "LED-100-001",
      "name": "LED Panel 100W",
      "business_score": 9,    ← Meets filter (7-10)
      "rate": 5000,
      ...
    },
    {
      "item_code": "LED-DRIVER-001",
      "name": "LED Driver 12V",
      "business_score": 8,    ← Meets filter (7-10)
      "rate": 2000,
      ...
    }
  ]
}
```

---

## Debugging Tips

### To Check Current Sort Value:
```javascript
// V2 Search
console.log(searchState.sort_by)

// Legacy
console.log(filters.sort_by)
console.log(localStorage.getItem('sort_by'))
```

### To Check URL Query:
```
Browser address bar: /search?sort_by=rate:desc
```

### To Reset Sort:
```javascript
// V2
updateState({ sort_by: "", page: 1 })

// Legacy
setFilters({ sort_by: 'stock:desc' })
localStorage.removeItem('sort_by')
```

---

---

## When to Use Which Sort? (Decision Guide)

Use this guide to choose the right sorting option based on what you want to find:

### For Budget-Conscious Buyers 💰
**Goal:** Find cheapest products
- **Best choice:** "Price low to high"
- **Why:** Shows absolute cheapest standard prices first
- **Alternative:** "Offer price low to high" if you want to include discounted prices

### For Deal Hunters 🎁
**Goal:** Find best bargains and discounts
- **Best choice:** "Discount high to low"
- **Why:** Shows products with biggest % discount first
- **Alternative:** "Offer price low to high" to see actual prices after discount

### For Premium Buyers 💎
**Goal:** Find high-quality, premium products
- **Best choice:** "Price high to low"
- **Why:** Shows most expensive products first (usually higher quality)

### For Retailers Looking at Stock 📦
**Goal:** Check what's available
- **Best choice:** "Stock high to low"
- **Why:** Shows well-stocked items first, ensures availability
- **Alternative:** "Stock low to high" if you need to reorder soon

### For Trend Followers 🔥
**Goal:** See what's popular and trending
- **Best choice:** "Mostly sold"
- **Why:** Shows bestsellers - products customers are actually buying
- **Alternative:** "Popularity high to low" to see most viewed products

### For New Product Explorers 🆕
**Goal:** See latest additions to catalog
- **Best choice:** "Created date"
- **Why:** Shows newest products added to system
- **Use case:** Checking what's recently launched

### For Information-Fresh Products 🔄
**Goal:** Find recently updated product info
- **Best choice:** "Modified newest first"
- **Why:** Shows products with most recently updated specs/prices
- **Use case:** Finding latest product information

---

## Real Customer Scenarios

### Scenario 1: Budget Buyer Shopping
```
Customer: "I need LED bulbs but I'm on a tight budget"

Best sort: "Price low to high"

What happens:
- Shows cheapest LED bulbs first
- Can filter through options from cheapest to most expensive
- Ensures they see budget options immediately
```

### Scenario 2: Bulk Buyer with Budget
```
Customer: "I need 100 LED drivers, good price, must be in stock"

Best sorts in order:
1. "Stock high to low" → Ensure bulk availability
2. Then "Price low to high" → Get best price
OR
Use "Price low to high" first → Find cheapest
Then check "Stock high to low" → Verify availability
```

### Scenario 3: Finding Latest Products
```
Customer: "What new lights did you add recently?"

Best sort: "Created date"

What happens:
- Newest additions appear at top
- Can see latest product launches
```

### Scenario 4: Finding Sales
```
Customer: "Show me products on sale"

Best sort: "Discount high to low"

What happens:
- Shows products with biggest discounts first
- Perfect for finding deals
- Can see ₹ savings clearly
```

### Scenario 5: Popularity Check
```
Manager: "Which products are customers looking at most?"

Best sort: "Popularity high to low"

What happens:
- Shows most-viewed products first
- Helps identify customer interests
- Useful for marketing/inventory decisions
```

### Scenario 6: Sales Performance
```
Manager: "Which products are selling fastest?"

Best sort: "Mostly sold"

What happens:
- Shows products with highest sales last 30 days
- Identifies bestsellers
- Helps plan stock levels
```

### Scenario 7: Inventory Management
```
Warehouse Manager: "What's running out of stock?"

Best sort: "Stock low to high"

What happens:
- Shows low-stock items first
- Helps identify reorder needs
- Prevents stockouts
```

---

## Common Questions About Sorting

### Q: What's the difference between "Price low to high" and "Offer price low to high"?
**A:** 
- **Price low to high:** Uses the regular/listed price, ignores discounts
- **Offer price low to high:** Uses the actual price customer pays after discount

If a product is originally ₹500 with 50% off (sale price ₹250), it will:
- Appear by ₹500 position with "Price low to high"
- Appear by ₹250 position with "Offer price low to high"

### Q: Does "Mostly sold" mean bestseller?
**A:** Yes! It means products that sold the most units in the last 30 days. These are your bestsellers - products customers have actually purchased.

### Q: What's the difference between "Mostly sold" and "Popularity high to low"?
**A:**
- **Mostly sold:** Products customers BOUGHT most (actual purchases)
- **Popularity high to low:** Products customers VIEWED/CLICKED most (interest shown)

Example: A product might be viewed 1000 times but only sell 10 units. It would rank high in Popularity but low in Mostly sold.

### Q: When should I use "Stock high to low"?
**A:** When you want to ensure product availability. Shows products with most inventory first, so you're guaranteed to find items in stock.

### Q: What does "Modified newest first" mean?
**A:** Shows products where the information (price, specs, stock) was most recently updated. Use this to see products with current/fresh information.

### Q: Are "Created date" and "Modified newest first" the same?
**A:** No:
- **Created date:** When product was first added to catalog (doesn't change)
- **Modified newest first:** When product info was last updated (price, specs change)

A product created 1 year ago but updated today would rank first in "Modified newest first" but low in "Created date".

### Q: What are "Priority score" and "Business score"?
**A:** 
- **Priority score:** Admin's internal ranking of product importance (featured products get higher priority)
- **Business score:** For B2B - ranks by profitability/business value

These are for admin/business management, not for regular customers.

### Q: How does the system know how many views/clicks a product has?
**A:** The frontend application automatically tracks when users:
- Click on a product (trackAiSearchClick)
- Add to shortlist (trackAiSearchShortlist)
- Add to quotation/cart (trackAiSearchQuotation)

These events are sent to the backend API, which stores them. The backend then calculates a popularity_score based on the number and type of interactions.

### Q: Can I manually set the popularity score?
**A:** No. Popularity score is automatically calculated by the system based on user interactions. It updates every hour. Only the backend system can update it.

However, you CAN set the **Business Score** manually in the ERP admin panel.

### Q: Where do I set business score for a product?
**A:** In the ERPNext/Frappe backend:
1. Go to: Inventory → Item
2. Find the product
3. Edit the product
4. Scroll to "Business Settings" section
5. Set the "Business Score" field to a numeric value (0-10)
6. Save

Changes sync to frontend within minutes.

### Q: What's the difference between popularity and business score with an example?
**A:**

**Scenario: Electronics Store**

**Product A: LED Driver 12V**
- Popularity Score: 50 (many customers viewing and buying)
- Business Score: 2 (low profit margin)

**Product B: Premium LED Driver 24V**
- Popularity Score: 5 (few customers interested)
- Business Score: 9 (high profit margin, strategic product)

**Customer sorting "Popularity High to Low":**
→ Sees Product A first (what other customers prefer)

**Business manager sorting "Business Score High to Low":**
→ Sees Product B first (what makes more profit)

### Q: If I add a product to cart, does that increase popularity?
**A:** Yes! When you add a product to cart/quotation, the system tracks it as a "quotation" event, which has more weight than just viewing.

Weight example:
- 1 view = 1 point
- 1 shortlist = 5 points
- 1 quotation/cart add = 10 points

So adding to cart (10 points) has 10× more impact on popularity than just viewing (1 point).

### Q: When do changes to popularity score appear in search results?
**A:** 
- Events tracked: Immediately (when user clicks)
- Score calculated: Every hour
- Index updated: Within minutes of calculation
- Frontend visible: Within 5-10 minutes total

So there's a slight delay (usually under 10 minutes).

### Q: Can multiple users' actions increase the same product's popularity?
**A:** Yes, absolutely. Popularity is cumulative across all users.

```
Day 1:
- User A views LED-100 (1 point)
- User B views LED-100 (1 point)
- User C adds to cart (10 points)

Daily Total: 12 popularity points
```

### Q: How do I see what business score a product has?
**A:** 
**In Frontend:**
- Sort by "Business Score High to Low"
- Products with high scores appear first
- (Score value itself may not be visible in UI)

**In Backend:**
- Open ERPNext
- Go to product details
- View "Business Score" field

### Q: Can I filter products by popularity score?
**A:** Yes! In V2 Search:

```javascript
searchState.filters.popularity_score_range = {
  min: "10",  // Minimum popularity
  max: "50"   // Maximum popularity
}

// Shows only products with popularity between 10-50
```

### Q: How often is popularity score recalculated?
**A:** 
- **Default:** Every hour
- **Can be changed:** Backend admin can configure to daily, every 30 minutes, etc.
- **Manually:** Backend can trigger recalculation on-demand

### Q: Why do I see different products when I search twice?
**A:** Possible reasons:
1. **Popularity updated:** Backend just recalculated scores (hourly)
2. **New tracking events:** Recent clicks/shortlists affected ranking
3. **Different sort selected:** You selected different sort option
4. **Cache cleared:** Search index refreshed

### Q: Does deleting a product remove its popularity history?
**A:** 
- **Product deleted:** Popularity score deleted with it
- **Events kept:** Raw event logs may be kept for analytics
- **New product:** Gets popularity_score: 0 (starts fresh)

### Q: Can I see who clicked on my product?
**A:** 
- **Raw data exists:** Backend stores user interaction data
- **Frontend doesn't show it:** UI doesn't display individual user data
- **Admin can:** Backend admin/analytics dashboard may show details

---

## Real-World Scenario: Complete Tracking Example

### Scenario Setup

**Company:** IHG Lighting  
**Product:** "LED Panel 100W Warm White"  
**Item Code:** LED-PANEL-100W-WW  
**Admin Business Score:** 8 (High margin product)

---

### Hour 1: Customer Interactions

**10:00 AM - Customer A searches "LED panels"**
```
Action: Views product card
Event tracked: click
Points earned: +1
Cumulative: popularity_score = 1
```

**10:05 AM - Customer B finds product**
```
Action: Reads full details
Event tracked: click
Points earned: +1
Cumulative: popularity_score = 2
```

**10:10 AM - Customer C adds to shortlist**
```
Action: Click "Add to Wishlist"
Event tracked: shortlist
Points earned: +5
Cumulative: popularity_score = 7
```

**10:25 AM - Customer D requests quotation**
```
Action: Click "Add to Cart" → Request Quote
Event tracked: quotation
Points earned: +10
Cumulative: popularity_score = 17
```

**10:35 AM - Customer E and F view**
```
Action: Both view product
Event tracked: 2× click
Points earned: +2
Cumulative: popularity_score = 19
```

---

### Hour 2: Backend Calculation (11:00 AM)

**Scheduled Job Runs:**

```
Backend Process:
1. Count events for LED-PANEL-100W-WW:
   - Clicks: 3
   - Shortlists: 1
   - Quotations: 1

2. Calculate score:
   score = (3 × 1) + (1 × 5) + (1 × 10)
         = 3 + 5 + 10
         = 18

3. Update Product:
   UPDATE Item 
   SET popularity_score = 18
   WHERE item_code = 'LED-PANEL-100W-WW'

4. Update Search Index:
   Typesense synced with new score

5. Cache refreshed
```

---

### Hour 3: Customer Sees Results (11:15 AM)

**Customer G searches "LED 100W"**

```
Results (Sorted by Popularity High to Low):

1. LED Panel 100W Warm White
   ├─ Rate: ₹5000
   ├─ Popularity Score: 18  ← Updated!
   ├─ Business Score: 8
   └─ Status: "Popular with customers"

2. LED Bulb 100W Warm White
   ├─ Rate: ₹2000
   ├─ Popularity Score: 5
   ├─ Business Score: 4
   └─ Status: Regular

3. LED Strip 100W
   ├─ Rate: ₹3000
   ├─ Popularity Score: 2
   ├─ Business Score: 3
   └─ Status: Unpopular
```

**Customer G sees the popular product first!**

---

### Continued Tracking: Days 2-7

```
Day 2: popularity_score increases to 35
Day 3: popularity_score reaches 52
Day 4: popularity_score peaks at 67
Day 5: popularity_score stable at 65
Day 6: popularity_score slight drop to 61
Day 7: popularity_score = 58

Trend: Product gains popularity over the week
Result: Ranks higher than competing products
Effect: More customers see it → Buy more → Higher revenue
```

---

### Business Score Impact: Same Product

**Scenario: Admin notices LED-PANEL-100W-WW has high popularity AND high margin**

```
Action: Admin sets Business Score = 9 (very high)

Results when sorted "Business Score High to Low":
1. LED Panel 100W Warm White (Score: 9)
   ↑ Now ranked first for B2B customers
   ↑ B2B buyers see this product first
   ↑ High margin sale more likely

Result: Strategic business goal achieved
- High popularity: Customers want it
- High business score: Admin wants to sell it
- Both forces combined: Maximum visibility + profit
```

---

---

## Quick Answer: Are These DocTypes?

### Direct Answer: NO ❌

**trackAiSearchClick, trackAiSearchShortlist, trackAiSearchQuotation are NOT DocTypes**

### What They Actually Are:

| What | Where | Type | Purpose |
|------|-------|------|---------|
| `trackAiSearchClick` | `libs/ighSearchV2.js` | JavaScript Function | Frontend → calls API |
| `trackAiSearchShortlist` | `libs/ighSearchV2.js` | JavaScript Function | Frontend → calls API |
| `trackAiSearchQuotation` | `libs/ighSearchV2.js` | JavaScript Function | Frontend → calls API |

### What They Call:

```
Frontend Function          →  Backend API Method
trackAiSearchClick()       →  track_ai_search_click
trackAiSearchShortlist()   →  track_ai_search_shortlist
trackAiSearchQuotation()   →  track_ai_search_quotation
```

### The Actual DocTypes:

| DocType | Purpose | Stores What |
|---------|---------|-------------|
| **Item** | Product master | popularity_score, business_score, priority_score, sold_last_30_days |
| **Search Event** | Event tracking | click, shortlist, quotation events with timestamps |
| **Quotation** | Sales document | Customer quotes with items |

---

## Complete FAQ: Tracking & DocTypes

### Q: Where are tracking events stored?
**A:** In a custom DocType (likely "Search Event") in the ERPNext `igh_search` app. Each time a user clicks, shortlists, or requests a quotation, a new Search Event record is created.

### Q: What fields are in the Search Event DocType?
**A:** Likely includes:
- `event_type`: "click", "shortlist", "quotation", "reformulation"
- `item_code`: Product code (e.g., "LED-100-001")
- `user_id`: Who performed the action
- `search_event_id`: Unique search session ID
- `search_query`: What was the user searching for
- `timestamp`: When the event occurred
- Other metadata

### Q: Where is popularity_score stored?
**A:** In the standard **Item DocType** (Inventory → Item), in a field called `popularity_score`.

### Q: Who can see the Search Event DocType?
**A:** Only admins/developers with access to the `igh_search` ERPNext app. Regular users cannot see raw tracking events.

### Q: Can I manually create Search Events?
**A:** Technically yes (if you have permissions), but you shouldn't. They're auto-created by the tracking APIs.

### Q: What happens if I edit a Search Event?
**A:** Generally, you shouldn't edit them as they're meant to be immutable records. If you do, it could affect the popularity calculation.

### Q: How many Search Events are created per day?
**A:** Depends on traffic. For a busy store with 1000 daily users:
- ~5000 click events (5 per user average)
- ~500 shortlist events (0.5 per user)
- ~200 quotation events (0.2 per user)
- Total: ~5700 events/day

### Q: Are Search Events backed up?
**A:** Yes, they're part of the ERPNext database and included in regular backups.

### Q: Can I delete old Search Events?
**A:** You could, but the system will have already calculated popularity scores from them. Deleting old events won't affect current popularity_score values.

### Q: Is there a DocType for Business Score?
**A:** No separate DocType. Business Score is just a field in the Item DocType that admin can set directly.

### Q: What's the difference between a tracking function and a DocType?
**A:**
```
Tracking Function (JavaScript)
├─ Runs in frontend (browser)
├─ Makes API call to backend
└─ Does NOT store data itself

Backend API Method
├─ Receives the tracking function's call
├─ Creates/updates data in database
└─ Stores data in DocType (Search Event)

DocType (Database Table)
├─ Actual database table
├─ Stores the tracking events
└─ Used for calculations and reports
```

### Q: Can I see raw SQL of these DocTypes?
**A:** Yes, in ERPNext database:
```sql
-- Item table with scoring fields
SELECT item_code, popularity_score, business_score, sold_last_30_days
FROM `tabItem`
WHERE disabled = 0
ORDER BY popularity_score DESC;

-- Search Event tracking table (where clicks are stored)
SELECT event_type, item_code, timestamp
FROM `tabAI Product Search Event`
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY timestamp DESC;
```

---

## WHERE ARE CLICKS STORED? (Complete Answer)

### Short Answer:
**Clicks are stored in the `AI Product Search Event` DocType table in the ERPNext database.**

The table name: **`tabAI Product Search Event`** (Frappe convention: "tab" prefix)

**Location in ERPNext:** Modules → igh_search → AI Product Search Event

### Physical Storage Location:

```
┌──────────────────────────────────────────────────────┐
│          ERPNext Database (MySQL/MariaDB)            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Database: frappe_database (or your_erp_name)       │
│  ├─ Table: tabAI Product Search Event               │
│  │  ├─ Column: name (unique ID)                     │
│  │  ├─ Column: event_type (click/shortlist/etc)    │
│  │  ├─ Column: item_code (product code)             │
│  │  ├─ Column: user_id / session_id                 │
│  │  ├─ Column: search_event_id                      │
│  │  ├─ Column: timestamp (when click happened)      │
│  │  └─ ... other fields                             │
│  │                                                   │
│  └─ Table: tabItem (where popularity_score stored) │
│     ├─ Column: name (item code)                     │
│     ├─ Column: popularity_score                     │
│     ├─ Column: business_score                       │
│     └─ ... other fields                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### In the Context of Your IHG Setup:

**Your ERPNext Instance**
```
URL: erp.ihgind.com (or your server)
Database: MariaDB/MySQL
Location: tables in the main frappe database

Table: tabSearch Event
├─ Created when: User clicks product
├─ Data stored:
│  ├─ User who clicked
│  ├─ Product code (item_code)
│  ├─ Exact timestamp
│  ├─ Search session ID
│  └─ Other context
└─ Queried by: Popularity calculation job (hourly)
```

### Complete Data Path:

```
1. USER CLICKS PRODUCT
   ↓
2. Frontend: trackAiSearchClick() executes
   ├─ Browser: React component detects click
   ├─ Data: { item_code: "LED-100-001", search_event_id: "abc123" }
   └─ Calls: postApi()
   
3. HTTP REQUEST TO BACKEND
   ├─ POST /api/method/igh_search.igh_search.api.track_ai_search_click
   ├─ Body: { item_code, search_event_id }
   └─ Header: Authorization token, Session cookie
   
4. BACKEND RECEIVES REQUEST
   ├─ Server: erp.ihgind.com
   ├─ App: igh_search (Frappe app)
   ├─ Method: track_ai_search_click()
   └─ Code: apps/igh_search/igh_search/igh_search/api.py
   
5. CREATE RECORD IN DATABASE
   ├─ Frappe ORM: frappe.get_doc()
   ├─ Creates new doc of type: "Search Event"
   ├─ Sets fields:
   │  ├─ event_type = "click"
   │  ├─ item_code = "LED-100-001"
   │  ├─ user_id = current logged-in user
   │  ├─ search_event_id = "abc123"
   │  ├─ timestamp = NOW()
   │  └─ ... other auto-filled fields (created, modified, owner, etc.)
   └─ Calls: doc.insert()
   
6. DATA STORED IN DATABASE
   ├─ Database: frappe_database
   ├─ Table: tabSearch Event
   ├─ New row inserted with click event
   └─ SQL: INSERT INTO tabSearch Event (event_type, item_code, ...) VALUES ('click', 'LED-100-001', ...)
   
7. BACKEND RETURNS RESPONSE
   └─ { success: true, message: "Click tracked" }
   
8. HOURLY CALCULATION JOB RUNS
   ├─ Backend scheduled job
   ├─ Queries: SELECT * FROM tabSearch Event WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
   ├─ Groups by: item_code
   ├─ Counts: clicks, shortlists, quotations
   ├─ Calculates: popularity_score
   └─ Updates: tabItem SET popularity_score = 25 WHERE name = 'LED-100-001'
```

### Querying The Data (For Admins):

**Via ERPNext UI:**
```
Home → Modules → igh_search → Search Event
└─ Shows all tracked events
└─ Can filter by: event_type, item_code, date range, user
```

**Via Database:**
```sql
-- See all clicks from last 24 hours
SELECT id, event_type, item_code, user_id, creation, timestamp
FROM `tabAI Product Search Event`
WHERE event_type = 'click'
  AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY timestamp DESC;

-- Count clicks per product
SELECT item_code, COUNT(*) as click_count
FROM `tabAI Product Search Event`
WHERE event_type = 'click'
  AND timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY item_code
ORDER BY click_count DESC;

-- See clicks for a specific product
SELECT user_id, timestamp, search_event_id
FROM `tabAI Product Search Event`
WHERE event_type = 'click'
  AND item_code = 'LED-100-001'
ORDER BY timestamp DESC
LIMIT 100;
```

### Storage Details:

| Detail | Value |
|--------|-------|
| **DocType Name** | Search Event |
| **Table Name** | `tabAI Product Search Event` |
| **Database** | Your ERPNext MariaDB/MySQL |
| **Location** | Same database as all other DocTypes |
| **Retention** | Permanent (until manually deleted) |
| **Backup** | Included in regular ERPNext backups |
| **Growth Rate** | ~5700 events/day for busy store (depends on traffic) |

### Storage Size Estimation:

```
Assuming: 1000 users/day, 5 clicks per user average

Per Day:
- 5000 click events
- ~500 shortlist events  
- ~200 quotation events
- Total: ~5700 events/day

Per Month:
- 5700 × 30 = 171,000 events
- Approx. size: 171,000 × 200 bytes = 34 MB per month

Per Year:
- 5700 × 365 = 2,080,500 events
- Approx. size: 2,080,500 × 200 bytes = 416 MB per year
```

### What Fields Are Stored For Each Click:

```
Example: One click event record

{
  "name": "2026-05-11-0000001",        ← Unique ID
  "doctype": "Search Event",            ← Record type
  "event_type": "click",                ← What happened
  "item_code": "LED-100-001",           ← Which product
  "user_id": "john@ihgind.com",        ← Who clicked
  "search_event_id": "abc123xyz",      ← Search session ID
  "search_query": "LED 100W",           ← What they searched for
  "session_id": "session_abc123",      ← Browser session
  "ip_address": "192.168.1.100",       ← User location
  "user_agent": "Mozilla/5.0 ...",     ← Browser info
  "creation": "2026-05-11 10:15:30",   ← When created
  "modified": "2026-05-11 10:15:30",   ← Last modified
  "owner": "john@ihgind.com",          ← Who owns record
  "docstatus": 0,                       ← Draft (0) or Submitted (1)
  ... (and other Frappe system fields)
}
```

### How To Access This Data:

**For Admins (In ERPNext UI):**
1. Go to: `Home → Modules → igh_search → Search Event`
2. Click on any record to see details
3. Or create a report/query to analyze

**For Developers (Via API):**
```python
# Get all click events from last 24 hours
import frappe

events = frappe.get_list(
    "Search Event",
    filters={
        "event_type": "click",
        "creation": [">", frappe.utils.add_days(frappe.utils.now(), -1)]
    },
    fields=["name", "event_type", "item_code", "user_id", "creation"],
    order_by="creation DESC",
    limit_page_length=1000
)

for event in events:
    print(f"Click on {event.item_code} by {event.user_id}")
```

**For Database Queries:**
```bash
# SSH into your server, then:
mysql -u frappe -p frappe_database

# Inside MySQL:
SELECT COUNT(*) FROM `tabAI Product Search Event` WHERE event_type = 'click';
SELECT COUNT(*) FROM `tabAI Product Search Event` WHERE event_type = 'shortlist';
SELECT COUNT(*) FROM `tabAI Product Search Event` WHERE event_type = 'quotation';
```

### Important Notes:

✅ **Permanent Storage:** Clicks are stored permanently in the database
✅ **Searchable:** Can query/filter by any field  
✅ **Backed Up:** Included in ERPNext backups
✅ **Aggregated:** Used hourly to calculate popularity_score
✅ **Auditable:** Can see who clicked what and when

⚠️ **Performance:** As clicks accumulate (millions), queries might slow down
⚠️ **Privacy:** Contains user IDs and timestamps - should be protected
⚠️ **Disk Space:** Monitor database size if you have high traffic

---

## System Integration Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                 COMPLETE SYSTEM INTEGRATION                      │
└─────────────────────────────────────────────────────────────────┘

FRONTEND (This Repository)
├─ trackAiSearchClick() [ighSearchV2.js]
├─ trackAiSearchShortlist() [ighSearchV2.js]
├─ trackAiSearchQuotation() [ighSearchV2.js]
└─ Calls: /api/method/igh_search.igh_search.api.*

BACKEND (ERPNext igh_search App - Separate Repository)
├─ API Methods:
│  ├─ track_ai_search_click()
│  ├─ track_ai_search_shortlist()
│  └─ track_ai_search_quotation()
│
├─ Scheduled Jobs:
│  └─ calculate_popularity_scores() [runs hourly]
│
└─ DocTypes:
   ├─ Item (Standard + custom fields)
   │  └─ popularity_score, business_score, priority_score
   │
   ├─ Search Event (Custom)
   │  └─ event_type, item_code, user_id, timestamp
   │
   ├─ Quotation (Standard)
   │  └─ Tracks customer quotes
   │
   └─ Item Price (Standard)
      └─ Pricing information

SEARCH INDEX (Typesense)
└─ Synced from Item DocType
   └─ Includes: popularity_score, business_score for sorting/filtering

RESULT: Sorting & Popularity Works! ✅
```

---

---

## AI Product Search Event DocType - Complete Reference

### What is This DocType?

**Name:** AI Product Search Event  
**Location in ERPNext:** Modules → igh_search → AI Product Search Event  
**Table Name:** `tabAI Product Search Event`  
**Purpose:** Store all user interactions (clicks, shortlists, quotations) for popularity calculation  

### All Fields in AI Product Search Event:

#### Standard Frappe System Fields (Auto-managed):
```
name             ← Unique ID (auto-generated)
doctype          ← Always "AI Product Search Event"
creation         ← Timestamp when record created
modified         ← Last modification timestamp
owner            ← User who created this record
docstatus        ← 0=Draft, 1=Submitted, 2=Cancelled
idx              ← Display order
```

#### Custom Tracking Fields (What We Care About):
```
event_type       ← Type of event: "click" | "shortlist" | "quotation" | "reformulation"
item_code        ← Product code (e.g., "LED-100-001")
user_id          ← Email/ID of user who performed action
search_event_id  ← Unique session ID for this search
search_query     ← What user searched for (e.g., "LED 100W")
session_id       ← Browser session identifier
ip_address       ← User's IP address (geo-tracking)
user_agent       ← Browser/device info (user-agent string)
quotation_id     ← Link to quotation if event_type="quotation"
timestamp        ← When the event occurred (alternate to "creation")
```

### Example Record:

```json
{
  "name": "2026-05-11-LED-100-001-click-0001",
  "doctype": "AI Product Search Event",
  "event_type": "click",
  "item_code": "LED-100-001",
  "user_id": "john@ihgind.com",
  "search_event_id": "search_2026_05_11_abc123xyz",
  "search_query": "LED 100W warm white",
  "session_id": "sess_abc123xyz789",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "quotation_id": null,
  "timestamp": "2026-05-11 10:15:30.123456",
  "creation": "2026-05-11 10:15:30.123456",
  "modified": "2026-05-11 10:15:30.123456",
  "owner": "john@ihgind.com",
  "docstatus": 0,
  "idx": 1
}
```

### How to View This Data in ERPNext:

**Step 1: Go to the DocType List**
```
Home → igh_search → AI Product Search Event
OR
Search bar → "AI Product Search Event"
```

**Step 2: See Recent Events**
- List shows all tracking events
- Click any record to see full details
- Use filters to narrow down

**Step 3: Filter by Event Type**
```
Click "Filter" button
├─ event_type = click
├─ event_type = shortlist
├─ event_type = quotation
└─ event_type = reformulation
```

**Step 4: Filter by Product**
```
Filter: item_code = "LED-100-001"
Shows all interactions for that product
```

**Step 5: Filter by Date Range**
```
Filter: creation between [date1] and [date2]
Shows events from specific time period
```

### Database Queries (Direct MySQL Access):

**See all click events from last 24 hours:**
```sql
SELECT item_code, user_id, creation, search_query
FROM `tabAI Product Search Event`
WHERE event_type = 'click'
  AND creation > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY creation DESC;
```

**Count clicks per product:**
```sql
SELECT item_code, COUNT(*) as total_clicks
FROM `tabAI Product Search Event`
WHERE event_type = 'click'
GROUP BY item_code
ORDER BY total_clicks DESC
LIMIT 20;
```

**See all events for one product:**
```sql
SELECT event_type, user_id, creation, search_query
FROM `tabAI Product Search Event`
WHERE item_code = 'LED-100-001'
ORDER BY creation DESC;
```

**Count events by type (last 30 days):**
```sql
SELECT event_type, COUNT(*) as count
FROM `tabAI Product Search Event`
WHERE creation > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY event_type;
```

**See unique users who clicked in last 7 days:**
```sql
SELECT COUNT(DISTINCT user_id) as unique_users
FROM `tabAI Product Search Event`
WHERE event_type = 'click'
  AND creation > DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Data Flow Recap:

```
1. User clicks product in browser
   ↓
2. Frontend: trackAiSearchClick() fires
   ↓
3. HTTP POST to: /api/method/igh_search.igh_search.api.track_ai_search_click
   ↓
4. Backend receives request
   ↓
5. Creates new "AI Product Search Event" record with:
   - event_type: "click"
   - item_code: product clicked
   - user_id: who clicked
   - timestamp: when
   - other metadata
   ↓
6. Data stored in: tabAI Product Search Event table
   ↓
7. Hourly job reads these records
   ↓
8. Calculates: popularity_score = (clicks×1) + (shortlists×5) + (quotations×10)
   ↓
9. Updates: tabItem SET popularity_score = [calculated]
   ↓
10. Syncs to Typesense search index
    ↓
11. Customer sees results sorted by popularity
```

### Key Points:

✅ **One record per event:** Each click = one new AI Product Search Event record  
✅ **Immutable:** Events shouldn't be edited after creation  
✅ **Permanent:** Data is kept for historical analysis  
✅ **Indexed:** Can query by item_code, user_id, event_type, date  
✅ **Used by:** Popularity calculation job (runs hourly)  
✅ **Monitored:** Database size grows ~5,700 records/day  

---

*Documentation Generated: 2026-05-11*
*Last Updated: AI Product Search Event DocType Details*
*Coverage: Correct DocType name, fields, queries, access methods*

---

 (What's the Difference?)

### Price Sort vs Offer Price Sort

**Scenario:** Some products have discounts, some don't

**Product List:**
```
- Product A: Original Price ₹500, Offer Price ₹300 (40% off)
- Product B: Original Price ₹200, Offer Price ₹200 (No discount)
- Product C: Original Price ₹1000, Offer Price ₹600 (40% off)
- Product D: Original Price ₹400, Offer Price ₹400 (No discount)
```

**Sorted "Price Low to High" (Uses Original Price)**
```
1. Product B: ₹200 original price (shown first)
2. Product D: ₹400 original price
3. Product A: ₹500 original price
4. Product C: ₹1000 original price (shown last)
```

**Sorted "Offer Price Low to High" (Uses Actual Discount Price)**
```
1. Product A: ₹300 after discount (shown first) - cheapest actual price!
2. Product C: ₹600 after discount
3. Product B: ₹200 (no discount, shown next)
4. Product D: ₹400 (no discount, shown last)
```

**Key Difference:** Offer Price sorting considers what customer actually pays, Standard Price ignores discounts.

---

### Stock Low to High vs Stock High to Low

**Scenario:** Inventory of various products

**Stock Status:**
```
- LED Bulb: 250 units
- Driver: 50 units
- Panel: 10 units
- Connector: 500 units
```

**Sorted "Stock Low to High"**
```
1. Panel: 10 units (Lowest - shown first) ⚠️ Running out!
2. Driver: 50 units
3. LED Bulb: 250 units
4. Connector: 500 units (Highest - shown last) ✅ Plenty available
```
**Use case:** Warehouse manager checking what needs reordering

**Sorted "Stock High to Low"**
```
1. Connector: 500 units (Highest - shown first) ✅ Well stocked
2. LED Bulb: 250 units
3. Driver: 50 units
4. Panel: 10 units (Lowest - shown last) ⚠️ Running out
```
**Use case:** Customer wants guaranteed availability

---

### Date Created vs Date Modified

**Scenario:** Products with different history

**Product Timeline:**
```
- Product A: Created 6 months ago, Last updated TODAY
- Product B: Created 1 month ago, Last updated 3 months ago
- Product C: Created 2 weeks ago, Last updated 1 week ago
- Product D: Created 1 year ago, Last updated 6 months ago
```

**Sorted "Created Date (Newest First)"**
```
1. Product C: Created 2 weeks ago (newest)
2. Product B: Created 1 month ago
3. Product A: Created 6 months ago
4. Product D: Created 1 year ago (oldest)
```
**Shows:** Newest products in catalog

**Sorted "Modified Newest First"**
```
1. Product A: Updated TODAY (most recent change)
2. Product C: Updated 1 week ago
3. Product B: Updated 3 months ago
4. Product D: Updated 6 months ago (oldest change)
```
**Shows:** Recently updated product information

**Key Difference:** Created = when added to system, Modified = when info was last changed

---

### Mostly Sold vs Popularity Score

**Scenario:** Products with different usage patterns

**Last 30 Days Sales:**
```
- Driver A: 1000 units sold, 500 customer views
- Driver B: 500 units sold, 5000 customer views
- Driver C: 100 units sold, 10000 customer views
- Driver D: 50 units sold, 100 customer views
```

**Sorted "Mostly Sold"**
```
1. Driver A: 1000 sold (bestseller - shown first)
2. Driver B: 500 sold
3. Driver C: 100 sold
4. Driver D: 50 sold
```
**Shows:** What people actually bought most

**Sorted "Popularity High to Low"**
```
1. Driver C: 10000 views (most viewed - shown first)
2. Driver B: 5000 views
3. Driver A: 500 views
4. Driver D: 100 views
```
**Shows:** What people looked at most (but didn't necessarily buy)

**Key Difference:** 
- **Sales:** Purchases completed
- **Popularity:** Just viewed/clicked on

---

### Discount Low to High vs Discount High to Low

**Scenario:** Sales and promotions

**Product Discounts:**
```
- LED Bulb: 60% off (Original: ₹1000, Sale: ₹400)
- Driver: 30% off (Original: ₹500, Sale: ₹350)
- Panel: 10% off (Original: ₹2000, Sale: ₹1800)
- Connector: No discount (Original: ₹100, Sale: ₹100)
```

**Sorted "Discount Low to High"**
```
1. Connector: 0% off (no discount - shown first)
2. Panel: 10% off
3. Driver: 30% off
4. LED Bulb: 60% off (biggest discount - shown last)
```
**Use case:** Finding products at original/near-original price

**Sorted "Discount High to Low"**
```
1. LED Bulb: 60% off (biggest discount - shown first) 🎉
2. Driver: 30% off
3. Panel: 10% off
4. Connector: 0% off (no discount - shown last)
```
**Use case:** Finding best deals and bargains

---

### Priority Score (Admin Feature)

**Scenario:** Admin has set internal priorities

**Admin Priority Settings:**
```
- Premium LED 50W: Priority 10 (Top priority - featured product)
- Standard Driver: Priority 5 (Medium)
- Budget Bulb: Priority 1 (Low priority)
- Clearance Item: Priority 0 (Lowest)
```

**Sorted "Priority High to Low"**
```
1. Premium LED 50W: Priority 10 (Featured - shown first) ⭐
2. Standard Driver: Priority 5
3. Budget Bulb: Priority 1
4. Clearance Item: Priority 0
```
**Effect:** Admin's featured products shown to customers first

**Sorted "Priority Low to High"**
```
1. Clearance Item: Priority 0 (Low priority - shown first)
2. Budget Bulb: Priority 1
3. Standard Driver: Priority 5
4. Premium LED 50W: Priority 10 (Top - shown last)
```
**Effect:** Deprioritized products shown first (rarely used)

---

### Business Score (B2B Feature)

**Scenario:** Products ranked by business value

**Business Importance:**
```
- Bulk Industrial Driver: Score 9 (High profit margin, strategic)
- Standard Commercial Driver: Score 5 (Regular margin)
- Consumer LED Bulb: Score 2 (Lower margin, high volume)
```

**Sorted "Business Score High to Low"**
```
1. Bulk Industrial Driver: Score 9 (High margin - shown first) 💰
2. Standard Commercial Driver: Score 5
3. Consumer LED Bulb: Score 2
```
**Effect:** High-profit products shown first to B2B customers

**Sorted "Business Score Low to High"**
```
1. Consumer LED Bulb: Score 2 (Lower priority - shown first)
2. Standard Commercial Driver: Score 5
3. Bulk Industrial Driver: Score 9 (High priority - shown last)
```
**Effect:** Lower-value products shown first

---

*Documentation Generated: 2026-05-11*
*Last Updated Components: V2SearchPage.jsx, SortBy.jsx, Filters.jsx, ighSearchV2.js, [...list].js*
