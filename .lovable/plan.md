

## Mobile Optimization for Inventory Page

### Problem
The `scrollbar-hide` utility used on CategoryTabs is not defined anywhere, so the scrollbar is still visible on mobile. The page may also overflow horizontally on small screens.

### Changes

**1. Add `scrollbar-hide` utility to `src/index.css`**
Add a CSS utility class that hides scrollbars while keeping scroll functionality:
```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

**2. Ensure full-viewport layout on mobile in `src/pages/Index.tsx`**
- Change `main` padding to use tighter values on mobile (`px-2 py-2`) and set `overflow-hidden` on the outer container to prevent any horizontal overflow.
- The sidebar logo already hides on mobile (`hidden lg:flex`) — no change needed there.

**3. Verify `CategoryTabs` scroll behavior**
The component already has `overflow-x-auto`, `snap-x`, and `flex-shrink-0` on buttons. Once `scrollbar-hide` is properly defined, horizontal swiping will work cleanly without a visible scrollbar.

These are minor CSS additions — no structural or logic changes required.

