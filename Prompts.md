# Prompts.md — AI Transparency Log
## Project: Aura Enterprise Engine

This document records all AI-assisted problem-solving during the development of this project, as required by Prodesk IT delivery protocol.

---

### 1. MongoDB Aggregation Pipeline Architecture

**Problem:** How to compute KPI metrics (total SKU count, total inventory value, out-of-stock count) across 50,000 records without fetching them all to JavaScript — which would cause massive memory and latency issues.

**AI Consultation:** Asked AI to help design a `$group` + `$project` aggregation pipeline that computes `price * stockQuantity` at the database level using `$multiply` and `$sum`.

**Solution Applied (analyticsController.js):**
```js
Product.aggregate([
  { $group: {
    _id: null,
    totalSKUs: { $sum: 1 },
    totalInventoryValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
    outOfStockCount: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } },
  }},
  { $project: { _id: 0, totalInventoryValue: { $round: ['$totalInventoryValue', 2] } }}
], { allowDiskUse: true })
```
**Engineering Decision:** All 4 aggregations (summary, category breakdown, restock priority, OOS) are executed in `Promise.all()` for parallel execution — cutting response time by ~75%. `allowDiskUse: true` was added to prevent the MongoDB 100MB in-memory limit from being exceeded on the 50k-document dataset.

---

### 2. Debounced Search Hook

**Problem:** Need a reusable, type-safe 500ms debounce hook that cancels pending timers on unmount to prevent memory leaks and stale state updates in React 18 strict mode.

**AI Consultation:** Asked AI to confirm the correct pattern for using `useRef` (not `useState`) to store the timer ID, ensuring the timer reference persists across renders without triggering re-renders.

**Critical Bug Found (v2):** The original implementation included `fn` in the `useCallback` dependency array. Since `fn` was defined inline in the component, it changed identity every render — this caused the `useCallback` to recreate the debounced function on every render, effectively resetting the debounce timer on every keystroke (negating the entire feature).

**Fix Applied:** Store `fn` in a second `useRef` (`fnRef`). The debounced wrapper always calls `fnRef.current()`, so `fn` is never a dependency of `useCallback`. The returned function's identity is now fully stable.

**Solution Applied (useDebounce.ts):**
```ts
const fnRef = useRef<T>(fn);
fnRef.current = fn; // always points to latest fn without re-creating the wrapper

const debouncedFn = useCallback((...args) => {
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => fnRef.current(...args), delay);
}, [delay]); // delay is the only real dependency
```

---

### 3. Zod Validation with Cross-Field Business Rules

**Problem:** Standard Zod field validators can't enforce `price >= cost` since it requires comparing two fields simultaneously.

**AI Consultation:** Asked AI about Zod's `.refine()` method for cross-field validation — specifically how to apply it at the schema object level (not field level) so the error can be attributed to the correct field path.

**Solution Applied (validate.js):**
```js
z.object({ price: z.number(), cost: z.number() })
  .refine(data => data.price >= data.cost, {
    message: 'Price cannot be lower than cost',
    path: ['price'], // Points error at the correct field
  })
```

---

### 4. High-Performance Batch Seeder

**Problem:** Inserting 50,000 documents one-by-one would take minutes and overload the event loop.

**AI Consultation:** Asked AI to recommend the optimal batch size for MongoDB `insertMany()` — balancing memory usage and I/O throughput. AI recommended 500–1000 documents per batch.

**Solution Applied (seed.js):** 500-document batches with `{ ordered: false }` to continue inserting even if an individual duplicate SKU is encountered, with a real-time progress bar written to `process.stdout`.

---

### 5. $text Index vs. Regex for Omnisearch Performance

**Problem:** The initial search implementation used MongoDB regex (`$regex: search, $options: 'i'`). On 50,000 documents, a case-insensitive regex causes a **full collection scan** — no index is used. Measured latency was ~800ms per search keypress, which defeats the purpose of the 500ms debounce.

**AI Consultation:** Asked AI to explain the difference between regex and `$text` queries in MongoDB, and when the text index is and is not beneficial.

**Key Learning:**
- `$regex` with `$options: 'i'` cannot use a regular B-tree index (it needs the start anchor `^` for prefix scans).
- `$text` with a compound text index (`{ productName: 'text', sku: 'text' }`) uses an inverted index — query time is O(log n) instead of O(n).
- The `$text` operator breaks the query into tokens (words), so single-character queries are unreliable; a regex fallback is used for terms shorter than 2 characters.

**Solution Applied (inventoryController.js):**
```js
if (trimmedSearch.length >= 2) {
  filter.$text = { $search: trimmedSearch }; // uses compound text index
} else {
  filter.$or = [
    { productName: { $regex: `^${trimmedSearch}`, $options: 'i' } }, // anchored = index-friendly
    { sku: { $regex: `^${trimmedSearch}`, $options: 'i' } },
  ];
}
```

---

### 6. Debouncing Filter Sliders (Non-Obvious Performance Trap)

**Problem:** The stock slider and price inputs were wired directly to `setMaxStock` / `setMinPrice` / `setMaxPrice` with `setCurrentPage(1)` inline — no debounce. A slider fires ~60 events per second while the user drags; each event was triggering a full `fetchInventory()` API call.

**AI Consultation:** Asked AI to confirm the correct pattern for debouncing non-text inputs in React.

**Solution Applied:** Created three separate `useDebounce` wrappers for the slider and price fields with a 400ms delay. The visual label (showing the current slider value) updates immediately from local state (`maxStockInput`), while the actual API filter (`maxStock`) updates only after the debounce settles.

```tsx
const debouncedSetMaxStock = useDebounce((v: number) => {
  setMaxStock(v < 5000 ? v : undefined); // committed filter
  setCurrentPage(1);
}, 400);

// In JSX:
onChange={e => {
  setMaxStockInput(v); // instant visual feedback
  debouncedSetMaxStock(v); // debounced API call
}}
```
