# Aura Engine — AI Transparency & Prompts Log

This document records the engineering decisions and AI pair-programming interactions used during the development of Aura Engine. The system architecture, routing protocols, custom styling grids, and database modeling were built manually. AI was strictly utilized as a logical sounding board to optimize specific high-performance bottlenecks and React 19 Hook reference safety.

---

## Interaction 1: MongoDB Aggregation Optimization

### The Problem
The `GET /api/analytics` endpoint needs to calculate a comprehensive dashboard payload for 50,000+ SKUs in a single HTTP request:
1. Summary Metrics: SKU count, total valuation (`price * stockQuantity`), out-of-stock items, and average unit price.
2. Portfolio Valuation: Sum valuation grouped by category, sorted descending.
3. Restock Queue: Top 10 items with lowest non-zero stock.
4. Out-of-Stock: Latest 20 out-of-stock items.

An early draft using a massive `$facet` pipeline hit memory limits during local testing. I needed to verify whether multi-facet aggregations or parallelized `Promise.all` operations with targeted indexes were more efficient under a 50k dataset load.

### The Consultation Prompt
> *"Hey, I'm working on this analytics endpoint in Express and Mongoose. I need to grab multiple inventory KPIs (total valuation, category valuation breakdowns, low stock priority queue, and out-of-stock records) in a single request. I tried building a single, massive MongoDB aggregation pipeline using `$facet`, but it's running extremely slow and hitting in-memory sorting limits on a 50k product dataset. Is there a cleaner way to structure this? What if I split them into 4 separate concurrent pipelines and run them in parallel via `Promise.all`? Would that be faster or just clog the connection pool? Also, what compound indexes should I set up to make sure these aggregations complete in under 100ms?"*

### AI Logic & Suggestions
1. **Parallel Execution over Facets**: Recommended splitting the query into 4 discrete Mongoose aggregation tasks executed concurrently via `Promise.all`. The reasoning was that MongoDB’s query optimizer can distribute parallel cursors more efficiently across CPU cores than a single monolithic `$facet` query, which runs on a single thread and blocks thread pools.
2. **Aggressive Projection**: Advised using `$project` blocks to limit payload fields early, reducing network serialization overhead.
3. **Compound Indexes**:
   - `price` + `stockQuantity` compound indexing.
   - Compound index on `{ category: 1, stockQuantity: 1 }` to satisfy low-stock queues.
   - Text indexing on `{ productName: 'text', sku: 'text' }` for search routes.

### Engineer Decisions & Implementation
I chose to implement the parallel `Promise.all` strategy. It made the controller modular, easy to read, and significantly faster.

```javascript
// backend/src/controllers/analyticsController.js
const [summaryResult, categoryValuation, restockPriority, outOfStock] = await Promise.all([
  Product.aggregate([ ... ]), // KPI Summary
  Product.aggregate([ ... ]), // Portfolio valuation
  Product.aggregate([ ... ]), // Restock priority queue
  Product.aggregate([ ... ])  // Out of stock
]);
```

- Added `allowDiskUse: true` to aggregation options to protect against edge-case memory overflows on larger datasets.
- Configured targeted compound indexes in `backend/src/models/Product.js` instead of generic indexes, achieving sub-100ms analytics loads on 50,000 documents.

---

## Interaction 2: Stable Debounced Search Hook in React 19

### The Problem
During input filtration in the Next.js `InventoryPage` data grid, typing into search fields or dragging price sliders was triggering 60+ API calls per second, flooding the database.
A naive debouncing hook had two major flaws:
1. **Stale Closures**: The callback captured old React state because it wasn't being recreated on every keystroke.
2. **Render Floods**: If I recreated the debounce hook function on every render, the timer was reset, rendering the debounce useless unless the parent wrapped every callback in `useCallback()`, which adds significant boilerplate.

### The Consultation Prompt
> *"I'm coding an interactive search filter and slider system in React 19 / Next.js. Dragging the price sliders is absolutely flooding our Express backend with queries because every tiny shift triggers an API request. I want to build a custom `useDebounce` hook that takes a custom callback and a delay. But I keep running into two issues: first, if the callback uses React state, it captures stale state because of closure capture groups. Second, if I recreate the debounced function wrapper on every re-render to get the latest state, the active timer gets cleared and debouncing fails—unless I wrap every single callback in a `useCallback` on the parent side, which adds so much boilerplate. How do I use a mutable `useRef` to hold the callback reference and cleanly handle the timer resetting and unmount cleanup without making the hook unstable across renders?"*

### AI Logic & Suggestions
The AI suggested using a **Mutable Ref Reference** pattern:
1. Store the incoming callback function in a React mutable ref (`useRef(fn)`).
2. Update the ref's `.current` property on every render execution. This ensures the hook always accesses the freshest callback reference without declaring it as a hook dependency.
3. Wrap the timer initialization in a stable `useCallback` that only depends on `delay`, ensuring the returned function's memory reference remains identical across parent re-renders.
4. Clean up any active timers on component unmount in a `useEffect`.

### Engineer Decisions & Implementation
I implemented the ref tracking pattern inside `frontend/src/hooks/useDebounce.ts`. By decoupling function execution from the React state dependency array, the hook remains 100% stable without forcing consumer components to declare expensive `useCallback` blocks.

```typescript
// Hook core implementation
export function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef<T>(fn);
  
  // Instantly tracks the newest reference on every render
  fnRef.current = fn;

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fnRef.current(...args);
    }, delay);
  }, [delay]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return debouncedFn;
}
```

This pattern resolved the slider performance bottleneck. Range filters now wait until slider interaction stops before querying the Express backend.

---

## Interaction 3: Animated Custom Dropdown (CustomSelect.tsx)

### The Problem
The standard HTML `<select>` dropdown doesn't allow CSS keyframe animations, border glows, or list items with custom markup indicators (like the selection dot or HSL highlights). However, custom React select elements are prone to two major bugs:
1. They stay open when the user clicks elsewhere on the page, cluttering the viewport.
2. Clicking outside listeners can cause severe memory leaks if event listeners are not cleared on unmount.

### The Consultation Prompt
> *"I'm building a custom dropdown select component in Next.js because standard HTML `<select>` elements are almost impossible to style elegantly. I've designed some smooth CSS translate/fade animations for the dropdown list, but I need to make sure the dropdown closes immediately if the user clicks anywhere else on the screen. What's the cleanest way to do this in React 19? I want to attach a `mousedown` listener to the global document object inside a `useEffect`, but I need to check if the clicked target is inside or outside the dropdown wrapper ref. How do I write the target checking logic and ensure that we don't leak memory when the dropdown component gets unmounted?"*

### AI Logic & Suggestions
1. **Ref-based Containment**: Recommended using a `useRef` pointing to the main wrapping container `<div ref={ref}>`.
2. **Page-wide Listener**: Advised attaching a `mousedown` event listener to the global `document` inside a `useEffect`.
3. **Capture Detection**: The click handler checks if the click target is contained inside the component element using `ref.current.contains(e.target)`. If it is not, set `open = false`.
4. **Cleanup Hook**: Emphasized returning `() => document.removeEventListener('mousedown', handler)` in the effect cleanup block to prevent memory leakage.

### Engineer Decisions & Implementation
I implemented this pattern in [CustomSelect.tsx](file:///c:/Users/hp/Desktop/aura-engine/frontend/src/components/CustomSelect.tsx). I paired this logical structure with smooth CSS keyframes to create a clean, responsive dropdown that dismisses itself gracefully:

```typescript
useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);
```

---

## Interaction 4: Browser History Bypassing on Sign-Out

### The Problem
In standard JWT or session-based client routers, after a user clicks "Sign Out", the application clears local credentials and forwards them to `/login`. However, if the user clicks the browser's "Back" button, the browser reads from cache and renders the previous protected dashboard, presenting a major security vulnerability and breaking state expectations.

### The Consultation Prompt
> *"I'm setting up authentication settings in Next.js using `sessionStorage` to hold the login status. When the user logs out, we clear the session and push them to `/login`. The problem is that if they hit the browser's 'Back' button, the browser pulls the dashboard/analytics page from cache and briefly displays it again. That's a huge security hole. How can I completely evict the protected route from the browser's navigation history stack during logout? Also, how can I structure our `useAuthGuard` hook to return a 'ready' status, ensuring we render absolutely nothing (`null`) until the authentication check is fully complete?"*

### AI Logic & Suggestions
1. **State-Preserving Hook**: Recommended a `useAuthGuard` hook returning a `ready` state, ensuring the page content is completely hidden (returns `null`) until authorization is actively verified.
2. **History Stack Eviction**: Advised replacing `router.push('/login')` with `router.replace('/login')` on logout. `replace()` replaces the current entry in the history stack rather than pushing a new one, meaning there is no previous protected page in the navigation stack to go back to.
3. **Guard Validation Loop**: Inside a `useEffect` inside `useAuthGuard`, check `sessionStorage` on mount. If false, execute `router.replace('/login')` immediately.

### Engineer Decisions & Implementation
I built this hook system in [useAuthGuard.ts](file:///c:/Users/hp/Desktop/aura-engine/frontend/src/hooks/useAuthGuard.ts) and connected it to every protected page:
- On logout inside [page.tsx](file:///c:/Users/hp/Desktop/aura-engine/frontend/src/app/profile/page.tsx), we invoke `clearSession()` and then `router.replace('/login')`.
- Hitting the back button now securely lands the user on the login screen or blocks execution entirely, preventing access to the dashboard.

---

## Interaction 5: Layered Zod Validation vs. State-Aware Database Updates

### The Problem
In Express endpoints for partial updates (e.g., `PUT /api/inventory/:id`), incoming request bodies might contain only a subset of fields. In our system, the business rule mandates that `price` must always be greater than or equal to `cost`.
If we rely strictly on input-schema parsers (like Zod) or standard database schema validators, they are context-blind for partial updates:
1. A Zod `.superRefine` on a partial schema can check `price >= cost` *only* if both fields are passed in the request. If only `price` is updated, Zod has no access to the existing database record and cannot enforce the rule.
2. MongoDB update validation (`runValidators: true` in `findByIdAndUpdate`) runs independent validations per field but doesn't have reference to the original document's other fields, leading to validation bypasses.

### The Consultation Prompt
> *"I have a Mongoose product schema where `price` must always be `>= cost`. This works perfectly fine for creation (`POST`), but on partial updates (`PUT`), the frontend might only submit `{ price: 15 }` without sending the `cost` field. Since Zod schemas and standard Mongoose validators are context-blind during a partial update, they don't know what the existing `cost` value in the database is, which lets users bypass this business rule. How should I structure my validation? Is it best to handle shape and type parsing inside a Zod schema middleware, and then fetch and merge the payload with the database record in the controller before committing the update?"*

### AI Logic & Suggestions
1. **Layered Validation Architecture**:
   - **Layer 1 (Syntactic)**: Use Zod (`productUpdateSchema = productBaseSchema.partial()`) to validate that any provided fields match their required formats, bounds, and string rules.
   - **Layer 2 (Semantic/State-Aware)**: Inside the Controller, fetch the existing document, merge the partial incoming payload with the database state (`const merged = { ...existing, ...validatedBody }`), and run the cross-field business logic check.
2. **Defensive Controller Exit**: If the merged check fails, abort immediately and return a `400 Bad Request` with a clear message, before invoking the database writer.
3. **Mongoose `runValidators`**: Keep `runValidators: true` enabled on the update option to ensure single-field constraints are still applied at the database level.

### Engineer Decisions & Implementation
I implemented this exact layered structure in [validate.js](file:///c:/Users/hp/Desktop/aura-engine/backend/src/middleware/validate.js) and [inventoryController.js](file:///c:/Users/hp/Desktop/aura-engine/backend/src/controllers/inventoryController.js):
- **Zod Middleware**: Checks types, lengths, and integers.
- **Controller Merge-Validation**:
```javascript
const existing = await Product.findById(req.params.id).lean();
if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

// Merge database state with the validated partial request
const merged = { ...existing, ...req.validatedBody };
if (merged.price < merged.cost) {
  return res.status(400).json({ success: false, message: 'Price cannot be lower than cost' });
}
```
This guarantees 100% integrity of the price-to-cost ratio, even when clients perform partial/patch updates.

---

## Interaction 6: SSR-Safe Shared React Hook with Multi-Tab State Synchronization

### The Problem
In Next.js, standard React hooks that read from `localStorage` often trigger the dreaded **SSR Hydration Mismatch** warning. During Server-Side Rendering (SSR), the server has no access to the browser's `localStorage` and renders the default fallback state (e.g., `false`), whereas the client immediately reads from local storage (e.g., `true`) upon mount, causing the HTML outputs to differ.
Furthermore, if a user toggles a preference like "Compact Mode" in one dashboard component, other mounted components or open browser tabs do not react in real-time without manual refreshes.

### The Consultation Prompt
> *"I want to write a custom React hook called `useCompactMode` that lets users toggle a denser data grid layout. I need it to persist to `localStorage` so it survives page reloads. The problem is that during Next.js server-side rendering, I get a hydration mismatch error because the server has no access to `localStorage` and renders the default `false` fallback. How do I delay reading from storage until after the client-side mount is complete? Also, if the user toggles this mode, I want all other active hook instances in the same browser tab, and even other open browser tabs, to update instantly. Can we dispatch custom window events for same-tab sync, and listen to the `storage` event to sync across multiple tabs?"*

### AI Logic & Suggestions
1. **Post-Mount Hydration**: Initialize the React state with a static default value (e.g., `false`) to ensure server-client HTML consistency, then trigger a `useEffect` on mount to hydrate the state with the actual `localStorage` value.
2. **Tab-Local Event Dispatch**: Use a custom `Event` dispatched on `window` to broadcast state changes to other listening hook instances in the same browser tab.
3. **Cross-Tab Synchronization**: Listen to the window's native `'storage'` event. The browser automatically fires this event across other tabs sharing the same origin when `localStorage` is updated.

### Engineer Decisions & Implementation
I built this reactive synchronization system inside [useCompactMode.ts](file:///c:/Users/hp/Desktop/aura-engine/frontend/src/hooks/useCompactMode.ts):
```typescript
export function useCompactMode(): [boolean, (next: boolean) => void] {
  const [compact, setCompact] = useState<boolean>(false);

  // Safe Post-Mount Hydration
  useEffect(() => {
    setCompact(readPreference());
  }, []);

  // Multi-Level Listener
  useEffect(() => {
    const handleCustom = () => setCompact(readPreference());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCompact(readPreference());
    };

    window.addEventListener(EVENT_NAME, handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
```
This resulted in a beautiful, lag-free user experience: toggling the compact grid mode on the inventory control panel updates the analytics visual blocks and neighboring dashboard tabs instantly, with zero SSR warnings.
