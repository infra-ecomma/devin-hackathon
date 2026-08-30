---
name: rendering-performance
description: "Diagnoses and fixes slow rendering, jank, and excessive re-renders in React and vanilla JavaScript by profiling with Chrome DevTools and the React Profiler. Identifies root causes — React re-renders, layout thrash, long tasks, forced reflows, main-thread blocking — then applies targeted fixes like memoization, virtualization, state colocation, CSS containment, and GPU-accelerated transforms. Produces a before/after comparison with FPS and render-time metrics. Reach for it when an app feels sluggish, animations stutter, or scrolling is laggy."
type: skill
---

> **CHAIN:** After this skill → verification-before-completion, quality-gate


# Rendering Performance Skill


## When to use

- User asks any of:
- slow rendering" or "my app feels sluggish
- jank" or "janky animations
- too many re-renders
- why does everything re-render
- performance profiler shows high render time
- laggy scrolling" or "scroll performance
- stutter in animations

## Triggers

User asks any of:
- "slow rendering" or "my app feels sluggish"
- "jank" or "janky animations"
- "too many re-renders"
- "why does everything re-render"
- "performance profiler shows high render time"
- "laggy scrolling" or "scroll performance"
- "stutter in animations"
- "component updates are slow"
- "React profiler shows many renders"

## Process

### Step 1: Identify Symptoms and Collect Evidence
Ask user:
1. When does the slowness occur? (Initial load, interaction, scrolling, animation)
2. What device/browser? (Mobile is more performance-sensitive than desktop)
3. Do they have Performance panel data or React Profiler output?
4. Is it React-based or vanilla JavaScript?

Request artifacts:
- Chrome Performance panel recording (Network + Main thread)
- React Profiler output (from DevTools)
- Browser console warnings (especially React strict mode warnings)
- Code examples of the slow component(s)

### Step 2: Profile with Browser DevTools

#### Open Performance Panel
1. DevTools > Performance tab
2. Click record (red circle)
3. Perform the slow action (scroll, type, animate)
4. Stop recording after 5-10 seconds
5. Examine the timeline

#### Interpret the Timeline
**Three main sections to check**:

1. **Network Panel (top)**: Shows resource loading
   - Long network requests blocking render? Parallelize or defer
   - Missing preloading of critical assets?

2. **Main Thread (middle area)**: Shows JavaScript execution
   - **Tall yellow/orange bars**: JavaScript blocking the main thread
   - **Tall purple bars**: Rendering/layout recalculation
   - **Green bars**: Composite/paint (fastest, GPU-accelerated)
   - **Gaps in main thread**: Idle time (good - browser has time for user input)

3. **Metrics (bottom)**:
   - **FPS chart**: Should stay green (>30 FPS) and preferably >50 FPS for 60 FPS target
   - **Drops to red or orange**: Frame drops indicating jank
   - **Frame rate**: Hover over FPS chart to see exact values

#### Key Metric: Frame Duration
- Target: 16.67ms per frame (60 FPS)
- 16-33ms: Acceptable (30-60 FPS)
- 33-100ms: Noticeable lag
- >100ms: Severely janky

#### Flamechart Interpretation
- Wider bar = longer time in that function
- Taller stack = more nested function calls
- Look for: Functions called frequently or taking >1ms

Colors indicate:
- **Yellow/Orange**: JavaScript (potentially optimizable)
- **Purple**: Layout/Rendering (reflow/repaint)
- **Green**: Composite (GPU, fast)

### Step 3: Diagnose Root Cause

#### Root Cause 1: React Re-renders (React Apps)
**Symptoms**:
- Component renders even when props/state haven't changed
- React Profiler shows "Rendered at [timestamp]" multiple times per interaction
- Parent component updates cause all children to update

**Diagnosis**:
```js
// Add to component to check re-render frequency
useEffect(() => {
  console.log('ComponentName rendered at', new Date().toISOString())
})

// Or use React DevTools Profiler
// Open DevTools > Profiler tab
// Click record, perform action, see which components rendered
```

**Common causes**:
- Object/function created in render (new {} or () => {})
- Parent passing new object/callback reference each render
- Missing memo() on expensive child components
- State updates in parent causing full tree render
- Prop drilling: deep component trees sharing state

#### Root Cause 2: Layout Thrash (Browser Rendering)
**Symptoms**:
- Many purple (layout) bars in Performance panel
- Stutter during scroll, resize, or DOM manipulation
- CPU usage high during static content viewing

**Diagnosis**:
Watch for alternating patterns:
1. Reading DOM (getBoundingClientRect, offsetHeight) → triggers layout
2. Writing DOM (style changes, innerHTML) → triggers layout
3. Reading again → forces layout recalculation
4. Pattern repeats → "layout thrash"

**Code pattern to identify**:
```js
// BAD - Layout thrash (read, write, read, write...)
for (let i = 0; i < items.length; i++) {
  items[i].style.height = element.offsetHeight + 'px'  // Read then write
  items[i].style.width = element.offsetWidth + 'px'
}
```

#### Root Cause 3: Long JavaScript Task
**Symptoms**:
- Yellow/orange bars in main thread lasting >50ms
- Unresponsive to user input during heavy computation
- User types but text doesn't appear immediately

**Diagnosis**:
- Click on long JavaScript bar in Performance panel
- See function name in flamechart
- Check: Is this calculation really necessary? Can it be deferred?

#### Root Cause 4: Forced Reflows
**Symptoms**:
- Purple bars (layout) appear when no DOM should have changed
- Happens during animation or scroll
- CSS animations stutter

**Common causes**:
- Reading layout properties during update
- Changing inline styles that trigger layout
- Font loading causing layout shift

#### Root Cause 5: Main Thread Blocking
**Symptoms**:
- User types/clicks but nothing happens for >100ms
- Performance panel shows long-running JavaScript
- Scrolling or animations pause during user interaction

**Diagnosis**:
- Check if heavy computation is on main thread
- Look for: Data processing, image manipulation, large array operations
- Solution: Move to Web Worker or break into smaller tasks

### Step 4: React-Specific Diagnostics

#### Open React Profiler
DevTools > Profiler tab (requires React DevTools extension)

**Workflow**:
1. Click record (red circle)
2. Perform the action
3. Stop recording
4. Examine the "Ranked Chart" and "Flamechart"

**Interpret Ranked Chart**:
- Shows components by render time
- Hover over bar to see: Component name, render duration, render reason
- If same component renders multiple times: Click to see "Render causes"

**Render Causes**:
- **props changed**: Parent passed different prop value
- **hooks changed**: useState, useContext, or other hook updated
- **force update**: Called forceUpdate() (rare)

#### Check for Excessive Re-renders
Rule of thumb: A component shouldn't render more than once per intentional state change.

**Test**:
```js
function YourComponent() {
  console.count('Render')  // Will log "Render 1", "Render 2", etc.
  return ...
}
```

If count goes up unexpectedly, find the cause.

### Step 5: Apply Fix Patterns

#### React Fix 1: Memoization with useMemo
**When to use**: Expensive calculation, complex object creation
**Impact**: Prevents re-running expensive code on every render
**Risk**: Small performance cost of dependency checking

```js
// Before: Recalculates on every render
function Dashboard({ items }) {
  const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name))
  return <List data={sortedItems} />
}

// After: Only recalculates when items changes
function Dashboard({ items }) {
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )
  return <List data={sortedItems} />
}
```
**Expected improvement**: 50-90% reduction in compute time for expensive operations
**Careful**: Don't memoize cheap operations (simple calculations, primitive derivations)

#### React Fix 2: useCallback for Stable Functions
**When to use**: Passing callback to memoized child, adding event listener repeatedly
**Impact**: Prevents child re-renders when prop callback changes reference

```js
// Before: New function reference every render, child re-renders
function Parent() {
  const handleClick = (id) => {
    API.delete(id)
  }
  return <Child onDelete={handleClick} />
}

// After: Stable callback reference unless dependencies change
function Parent() {
  const handleClick = useCallback((id) => {
    API.delete(id)
  }, [])
  return <Child onDelete={handleClick} />
}
```
**Expected improvement**: 30-70% fewer re-renders of memoized children
**Common mistake**: Forgetting dependency array

#### React Fix 3: React.memo for Child Components
**When to use**: Child component expensive to render, receives same props often
**Impact**: Skips re-render if props haven't changed

```js
// Before: Always renders when parent renders
function ListItem({ item, onDelete }) {
  return <div>{item.name} <button onClick={() => onDelete(item.id)}>X</button></div>
}

// After: Only renders if item changes or onDelete reference changes
const ListItem = React.memo(({ item, onDelete }) => {
  return <div>{item.name} <button onClick={() => onDelete(item.id)}>X</button></div>
})

// Combine with useCallback in parent for best results
function List({ items }) {
  const handleDelete = useCallback((id) => {
    setItems(items.filter(i => i.id !== id))
  }, [items])

  return items.map(item => <ListItem key={item.id} item={item} onDelete={handleDelete} />)
}
```
**Expected improvement**: 40-80% fewer re-renders when parent updates
**Caution**: Check if it's actually expensive before memoizing

#### React Fix 4: Virtualization for Large Lists
**When to use**: Rendering 100+ items, scrolling is laggy
**Impact**: Only renders visible items, massive FPS improvement
**Popular libraries**: `react-window`, `react-virtual` (TanStack Virtual), `virtuoso`

```js
// Before: Renders all 10,000 items (slow)
function BigList({ items }) {
  return (
    <div style={{ overflow: 'auto', height: '600px' }}>
      {items.map(item => <ListItem key={item.id} item={item} />)}
    </div>
  )
}

// After: Only renders visible items (fast)
import { FixedSizeList } from 'react-window'

function BigList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ListItem item={items[index]} />
    </div>
  )

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```
**Expected improvement**: 10-100x FPS improvement on large lists
**Effort**: Medium (component structure change)

#### React Fix 5: State Colocation
**When to use**: State update causes entire app to re-render
**Impact**: Only affected components re-render
**Pattern**: Move state as close to where it's used as possible

```js
// Before: Global state, everything re-renders on change
function App() {
  const [inputValue, setInputValue] = useState('')
  return (
    <>
      <BigComponent /> {/* Re-renders even though it doesn't use inputValue */}
      <SearchBox value={inputValue} onChange={setInputValue} />
    </>
  )
}

// After: State only in component that needs it
function BigComponent() {
  return <ExpensiveComponent />
}

function SearchContainer() {
  const [inputValue, setInputValue] = useState('')
  return <SearchBox value={inputValue} onChange={setInputValue} />
}

function App() {
  return (
    <>
      <BigComponent />
      <SearchContainer />
    </>
  )
}
```
**Expected improvement**: 60-90% reduction in unnecessary re-renders
**Principle**: Keep state as local as possible, lift only when shared

#### React Fix 6: Code Splitting and Lazy Loading
**When to use**: Large components not visible immediately (below fold, modals)
**Impact**: Reduces initial JavaScript, loads components on demand
**Pattern**: `React.lazy()` with `Suspense`

```js
// Before: Import everything upfront
import HeavyEditor from './components/Editor'
import ComplexChart from './components/Chart'

function App() {
  const [showEditor, setShowEditor] = useState(false)
  return (
    <>
      <button onClick={() => setShowEditor(!showEditor)}>Toggle Editor</button>
      {showEditor && <HeavyEditor />}
      <ComplexChart /> {/* Maybe not visible immediately */}
    </>
  )
}

// After: Lazy load when needed
const HeavyEditor = React.lazy(() => import('./components/Editor'))
const ComplexChart = React.lazy(() => import('./components/Chart'))

function App() {
  const [showEditor, setShowEditor] = useState(false)
  return (
    <>
      <button onClick={() => setShowEditor(!showEditor)}>Toggle Editor</button>
      {showEditor && (
        <Suspense fallback={<div>Loading editor...</div>}>
          <HeavyEditor />
        </Suspense>
      )}
      <Suspense fallback={<div>Loading chart...</div>}>
        <ComplexChart />
      </Suspense>
    </>
  )
}
```
**Expected improvement**: Faster initial load (20-50% reduction in initial JS)
**Trade-off**: First use is slightly slower (lazy loading time)

#### Browser Fix 1: Avoid Layout Thrash
**Problem**: Reading and writing DOM properties in sequence causes multiple reflows

**Solution**: Batch reads, then batch writes
```js
// Before: Layout thrash (read, write, read, write)
const boxes = document.querySelectorAll('.box')
boxes.forEach(box => {
  const height = box.offsetHeight  // READ - forces layout
  box.style.width = height + 'px'  // WRITE - forces layout
})

// After: Batch reads, then writes
const boxes = document.querySelectorAll('.box')
const heights = Array.from(boxes).map(box => box.offsetHeight)  // All reads first
boxes.forEach((box, i) => {
  box.style.width = heights[i] + 'px'  // All writes after
})
```
**Expected improvement**: 50-90% faster for large DOM manipulation
**Principle**: FastDOM library can help with this automatically

#### Browser Fix 2: Use requestAnimationFrame for Animations
**Problem**: setInterval/setTimeout animations don't sync with refresh rate, causing jank

**Solution**: requestAnimationFrame syncs with browser refresh (60 FPS)
```js
// Before: Uses system timer (not synced to refresh)
let position = 0
setInterval(() => {
  position += 5
  element.style.transform = `translateX(${position}px)`
}, 16)  // Trying to hit 60 FPS but timing is imprecise

// After: Synced to browser refresh rate
function animate() {
  position += 5
  element.style.transform = `translateX(${position}px)`
  if (position < 500) {
    requestAnimationFrame(animate)
  }
}
requestAnimationFrame(animate)
```
**Expected improvement**: Smooth 60 FPS animations, no stutter
**Advantage**: Browser can optimize paint timing

#### Browser Fix 3: Use IntersectionObserver for Lazy Loading
**Problem**: Scroll events fire constantly, attached handlers block main thread

**Solution**: IntersectionObserver triggers when element becomes visible
```js
// Before: Scroll listener fires hundreds of times per second
window.addEventListener('scroll', () => {
  document.querySelectorAll('img[data-src]').forEach(img => {
    const rect = img.getBoundingClientRect()
    if (rect.top < window.innerHeight) {
      img.src = img.dataset.src  // Load visible images
      img.removeAttribute('data-src')
    }
  })
})

// After: Efficient intersection detection
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target
      img.src = img.dataset.src
      observer.unobserve(img)
    }
  })
})

document.querySelectorAll('img[data-src]').forEach(img => {
  observer.observe(img)
})
```
**Expected improvement**: 90% reduction in scroll event handler calls
**Bonus**: Better for battery life on mobile

#### Browser Fix 4: CSS Containment (contain property)
**Problem**: Browser must recalculate layout/paint for entire page on one element change

**Solution**: Use CSS `contain` to isolate element styling impact
```css
/* Before: One element change affects entire page layout */
.card {
  /* styles */
}

/* After: Declare that card styles are contained */
.card {
  contain: layout style;  /* Paint and layout don't affect outside */
  /* styles */
}
```
**Expected improvement**: 30-80% faster paint for large pages
**Support**: Modern browsers (Chrome, Firefox, Safari)

#### Browser Fix 5: GPU-Accelerated Properties
**Problem**: Changing certain CSS properties triggers expensive layout recalculation

**Solution**: Use GPU-accelerated transforms instead
```js
// Before: Trigger reflow (expensive)
element.style.left = x + 'px'      // Triggers layout
element.style.top = y + 'px'       // Triggers layout
element.style.width = w + 'px'     // Triggers layout

// After: GPU-accelerated transform (cheap)
element.style.transform = `translate(${x}px, ${y}px) scale(${w / originalWidth})`
```
**GPU-safe properties**: `transform`, `opacity`
**Avoid**: `left`, `top`, `width`, `height`, `padding`, `margin` for animations

### Step 6: Verify Improvement

After applying fixes:

#### Measure FPS
1. Open Performance panel again
2. Record the same action
3. Compare FPS chart: Should be higher, more consistently green
4. Check frame duration: Should be <16.67ms more often

#### Use React Profiler
1. Open Profiler tab
2. Record again
3. Compare "Render duration" in Ranked Chart
4. Should see fewer renders or shorter render times

#### Measure with Metrics
```js
// Use Performance API
const start = performance.now()
// ... perform action ...
const end = performance.now()
console.log(`Operation took ${end - start}ms`)

// Or use PerformanceObserver for Long Tasks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long task detected:', entry.duration, 'ms')
  }
})
observer.observe({ entryTypes: ['longtask'] })
```

#### Validate on Mobile
- Test on real mobile device (not just DevTools simulation)
- Use Chrome Remote Debugging
- Mobile is 3-5x slower than desktop, will reveal remaining issues

### Step 7: Implement and Monitor

#### Create Before/After Comparison
Document baseline and improvements:
```
Before Optimization:
- Average frame duration: 35ms (28 FPS)
- React render time: 120ms
- Component re-renders per action: 45
- Scroll jank: Severe (red bars in FPS chart)

After Optimization:
- Average frame duration: 12ms (83 FPS)
- React render time: 15ms
- Component re-renders per action: 8
- Scroll jank: None (consistent green FPS)

Improvements: 65% faster FPS, 87% fewer re-renders, eliminated jank
```

#### Deploy and Monitor
- Ship changes to production
- Use RUM (Real User Monitoring) to track actual user performance
- Monitor Core Web Vitals: INP should improve significantly
- Watch for performance regressions in future updates

## Output Deliverable

Provide the user with:
1. **Root Cause Analysis**: What is causing the slowness (React renders, layout thrash, long tasks)
2. **Priority Fixes**: Top 3-5 changes ranked by impact-to-effort ratio
3. **Code Examples**: Before/after code for each fix
4. **Performance Impact**: Estimated FPS or render time improvement
5. **Implementation Steps**: Concrete steps to apply each fix
6. **Validation Plan**: How to measure and confirm improvements
7. **Risk Assessment**: Any potential side effects or breaking changes

Include Performance panel screenshots or React Profiler data showing the improvements if available.

---

## Example Session

```
User: My React table feels janky when filtering 5K rows

Step 1 — Profile (React DevTools Profiler):
  Each keystroke triggers 5000 ItemRow renders, 80ms commit time
  Long task: 380ms blocking main thread

Step 2 — Root causes identified:
  1. ItemRow not memoized — re-renders on every parent state change
  2. filter callback recreated every render → breaks memo equality
  3. Inline style object creates new ref every render

Step 3 — Priority fixes:
  F1: React.memo(ItemRow) with custom equality
  F2: useCallback on filter handler
  F3: Move static style to module-level const
  F4: useDeferredValue on the filter input (low-priority updates)
  F5: react-window virtualization for >500 row tables

Step 4 — Apply F1-F4, measure:
  Commit time 80ms → 12ms (85% reduction)
  Long task vanishes
  Profiler shows only changed rows re-render

Step 5 — Add F5 (react-window) for tables over 1000 rows:
  Renders only ~30 visible rows at any time
  Memory drops, scroll stays smooth at 60fps

Step 6 — Validate on slow device (CPU 4x throttle):
  Still 60fps during filter typing ✓
  No layout shifts, no jank
Chain → verification-before-completion
```

---

## Chain Dispatch

### Always invoke after this skill:
Skill: verification-before-completion

### If UI was touched, also invoke:
Skill: quality-gate
