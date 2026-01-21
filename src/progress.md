# Implementation Progress

## Must Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Migrate database.json to web import format | ✅ Completed | Created /migrate page and migration script |
| 2 | Auto-fetch stock price when adding stock asset | ✅ Completed | Added "Get Price" button in AssetForm, name defaults to symbol |
| 3 | Add button to manually update all stock prices | ✅ Completed | Already existed in assets page |
| 4 | Display stock prices on screen after update | ✅ Completed | Already shows prices and status |
| 5 | Fix growth chart - moving averages and add snapshot totals | ✅ Completed | Implemented 4-line chart: Snapshot Value, Current Value, 3M MA, 1Y MA. MA = shares × MA price |
| 6 | Add asset details page | ✅ Completed | Created /details page with sortable table |
| 7 | Record shares in snapshots for stock assets | ✅ Completed | Snapshots already store assets with shares, updated view modal |
| 8 | Change rent to liability/loan category | ✅ Completed | Changed type from 'rent' to 'liability' |

## Minor Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Fix 新增資產 button text | ✅ Completed | Now uses t.assets.addAsset/editAsset |
| 2 | Create asset allocation settings page | ⏳ Pending | |
| 3 | Add allocation comparison chart to Dashboard | ✅ Completed | Added stacked bar chart showing allocation history |
| 4 | Add migrate page to navigation menu | ✅ Completed | Added with 📥 icon |
| 5 | Add category history table to Snapshots page | ✅ Completed | Shows each asset type value across all snapshots |

## Legend
- ⏳ Pending
- 🔄 In Progress
- ✅ Completed

## Files Modified/Created

### New Files
- `/src/app/migrate/page.tsx` - Data migration page
- `/src/app/details/page.tsx` - Asset details page
- `/src/scripts/migrate-data.ts` - Migration script
- `/src/components/AllocationHistoryChart.tsx` - Stacked bar chart for allocation history

### Modified Files
- `/src/types/index.ts` - Changed 'rent' to 'liability', added StockPrice interface
- `/src/components/AssetForm.tsx` - Added auto-fetch stock price, fixed button text
- `/src/components/AssetList.tsx` - Updated icons for liability
- `/src/components/AssetBreakdownChart.tsx` - Updated colors for liability
- `/src/components/DashboardChart.tsx` - Added snapshotValues prop, 4-line chart display
- `/src/components/Navigation.tsx` - Added details and migrate page links
- `/src/app/page.tsx` - Calculate 4 chart lines (snapshot, current, 3M MA, 1Y MA) using stock prices
- `/src/app/assets/page.tsx` - Updated to use fetchPricesWithMA for stock price updates
- `/src/app/snapshots/page.tsx` - Updated icons, show shares in snapshot modal
- `/src/lib/yahooFinance.ts` - Added StockPriceWithMA interface, fetchStockQuoteWithMA for MA calculation
- `/src/hooks/useAssetData.ts` - Added updateStockPricesWithMA, stockPrices state
- `/src/i18n/en.ts` - Added 'liability', 'details', 'snapshotValue' translations
- `/src/i18n/zh-TW.ts` - Added 'liability', 'details', 'snapshotValue' translations
