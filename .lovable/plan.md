

## Add Search Bar to Stock Manager (Options Page)

### What it does
Adds a search input to the StockManager component on the Options/editing page, matching the same pattern used on the inventory page. Users can quickly find items to edit or delete.

### Changes

**`src/components/StockManager.tsx`**
- Import `Search` from `lucide-react`
- Add `searchQuery` state
- Update `filtered` to also filter by `item.name.toLowerCase().includes(searchQuery.toLowerCase())`
- Add a search input with Search icon between the category filter dropdown and the item list, styled with `bg-card border-border rounded-lg`

