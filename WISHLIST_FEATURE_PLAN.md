# Wish List Feature - Implementation Plan

## Overview
Add a comprehensive Wish List management system to track desired purchases, analyze want vs need, calculate life quality ROI, and track purchased items satisfaction.

## Feature Requirements (from TODO)

### Core Features
1. **Wish List Management** - Systematically record and analyze potential purchases
2. **Purchase History Tracking** - Track satisfaction and repurchase decisions for bought items
3. **Want/Need Analysis** - Distinguish between wants and needs with frequency tracking
4. **Life Quality ROI** - Calculate quality of life improvement vs cost
5. **Asset Impact Analysis** - Show purchase as percentage of total assets
6. **Data Portability** - Import/Export functionality for backups

### Technical Constraints
- Must be static (GitHub Pages deployment)
- Integrate with existing Next.js asset tracking app
- Use localStorage for data persistence
- Modern UI consistent with current design

---

## Implementation Plan

### Phase 1: Data Structure & Core Logic (Week 1)

#### 1.1 Type Definitions
Create `/src/types/wishlist.ts`:

```typescript
// Life aspect categories
export type LifeAspect =
  | 'exercise'        // 運動
  | 'entertainment'   // 娛樂
  | 'social'          // 社交
  | 'work_efficiency' // 工作效率
  | 'health'          // 健康
  | 'education'       // 學習
  | 'comfort'         // 舒適度
  | 'appearance';     // 外觀

// Want frequency tracking
export interface WantEntry {
  id: string;
  date: string;           // ISO date
  intensity: 1 | 2 | 3 | 4 | 5;  // 1=mild, 5=urgent
  notes?: string;
}

// Wish list item
export interface WishItem {
  id: string;
  name: string;
  category: string;       // User-defined or predefined categories

  // Purchase details
  estimatedPrice: number;
  currency: 'TWD' | 'USD';
  specifications?: string;
  alternativeOptions?: Array<{
    name: string;
    price: number;
    pros: string;
    cons: string;
  }>;

  // Analysis
  isNeed: boolean;        // Want vs Need
  lifeAspect: LifeAspect[];  // Can affect multiple aspects
  aspectImportance: Record<LifeAspect, number>; // 1-10 scale
  currentSatisfaction: Record<LifeAspect, number>; // 1-10 scale
  expectedImprovement: Record<LifeAspect, number>; // 1-10 scale

  // Tracking
  wantHistory: WantEntry[];  // Track when/how often wanted

  // Metadata
  dateAdded: string;
  priority: 'low' | 'medium' | 'high';
  status: 'wishlist' | 'purchased' | 'rejected';
  purchaseDate?: string;
  notes?: string;
  imageUrl?: string;
  links?: string[];       // Product links, reviews, etc.
}

// Purchased item tracking
export interface PurchasedItem {
  id: string;
  name: string;
  originalWishItemId?: string;  // Link to wish item if existed

  // Purchase info
  actualPrice: number;
  currency: 'TWD' | 'USD';
  purchaseDate: string;
  store?: string;

  // Classification
  category: string;
  type: 'daily_necessity' | 'one_time_purchase';

  // Satisfaction tracking
  satisfactionRatings: Array<{
    date: string;
    rating: 1 | 2 | 3 | 4 | 5;
    notes?: string;
  }>;

  // Repurchase
  wouldRepurchase: boolean | null;
  repurchaseNotes?: string;

  // ROI
  lifeAspect: LifeAspect[];
  actualImprovement: Record<LifeAspect, number>; // 1-10 scale

  // Metadata
  dateAdded: string;
  notes?: string;
  imageUrl?: string;
}

// Analytics data
export interface WishListAnalytics {
  totalWishItems: number;
  totalValue: { TWD: number; USD: number };
  percentageOfAssets: number;
  needVsWant: { needs: number; wants: number };
  topLifeAspects: Array<{ aspect: LifeAspect; count: number }>;
  averageSatisfactionByCategory: Record<string, number>;
  mostWantedItems: Array<{ item: WishItem; frequency: number }>;
}
```

#### 1.2 Core Utilities
Create `/src/utils/wishlistCalculations.ts`:
- `calculateWantFrequency()` - Count want entries per week/month
- `calculateLifeQualityROI()` - ROI = (expected improvement × importance) / price
- `calculateAssetImpact()` - Purchase price / total assets percentage
- `getWishListAnalytics()` - Generate analytics data
- `calculateAverageSatisfaction()` - For purchased items
- `generateRepurchaseRecommendations()` - Based on satisfaction scores

#### 1.3 Custom Hook
Create `/src/hooks/useWishListData.ts`:
- CRUD operations for wish items
- CRUD operations for purchased items
- Want frequency tracking (add/remove entries)
- Status transitions (wishlist → purchased → rejected)
- Analytics calculations
- Import/Export functionality
- localStorage persistence

---

### Phase 2: UI Components (Week 2)

#### 2.1 Page Structure
```
/wishlist              → Wish List main page (active wishes)
/wishlist/purchased    → Purchased items tracker
/wishlist/analytics    → Analytics & insights dashboard
```

#### 2.2 Wish List Page Components

**WishListDashboard.tsx**
- Summary cards: Total items, Total value, % of assets
- Filter/Sort controls (by priority, price, life aspect)
- Add new wish button
- List/Grid view toggle

**WishItemCard.tsx**
- Item name, image, price
- Priority indicator
- Want frequency chart (mini sparkline)
- Life aspects badges
- Quick actions: Edit, Mark as purchased, Delete
- Expand to show full details

**WishItemForm.tsx** (Modal/Drawer)
- Basic info: Name, category, price, specifications
- Want/Need toggle
- Life aspects selection with importance sliders
- Current satisfaction vs expected improvement sliders
- Alternative options comparison table
- Links and notes
- Image upload placeholder (store as base64 or URL)

**WantFrequencyTracker.tsx**
- Quick button to log "I want this now"
- Intensity selector (1-5)
- Weekly/monthly frequency chart
- Historical entries list

**WishItemAnalysis.tsx**
- Life Quality ROI score (formula visualization)
- Asset impact percentage
- Cost-benefit visualization
- Recommendation: "Worth it" / "Consider alternatives" / "Wait"

#### 2.3 Purchased Items Page Components

**PurchasedItemsList.tsx**
- Filter by category, type (daily/one-time), date
- Sort by satisfaction, date, price
- Grid/List view
- Add manually purchased item button

**PurchasedItemCard.tsx**
- Item name, image, price, purchase date
- Satisfaction rating display (average)
- Repurchase indicator
- Quick actions: Rate, Add note, Delete

**PurchasedItemForm.tsx**
- Basic info (similar to wish item)
- Category and type selection
- Link to original wish item (if exists)
- Initial satisfaction rating

**SatisfactionRatingModal.tsx**
- Date of rating
- 5-star rating selector
- Notes field
- Historical ratings timeline

**RepurchaseTracker.tsx**
- Would repurchase? Yes/No/Maybe
- Repurchase notes
- Set reminder for consumables
- Compare with alternatives

#### 2.4 Analytics Page Components

**WishListAnalytics.tsx**
- Total value by currency
- Need vs Want pie chart
- Top life aspects bar chart
- Most wanted items ranking
- Price distribution histogram
- Average satisfaction by category

**LifeAspectMatrix.tsx**
- Heatmap showing importance vs current satisfaction for all aspects
- Identify gaps where purchases could help most

**AssetImpactChart.tsx**
- Show wish list total value vs current assets
- Stacked bar: needs vs wants relative to assets
- Affordability timeline projection

---

### Phase 3: Integration with Asset Tracker (Week 3)

#### 3.1 Cross-Feature Integration

**Dashboard Integration**
- Add "Wish List" widget to main dashboard
- Show total wish list value as separate category
- Alert if wish list > 20% of assets

**Budget Planning**
- In Settings, add "Wish List Budget" configuration
- Monthly/yearly budget allocation
- Track spend against budget

**Purchase Flow**
- When marking wish item as purchased, option to:
  - Create a liability asset entry (if purchased on credit)
  - Deduct from cash assets
  - Update snapshot with new allocation

**Asset Snapshot Enhancement**
- Add "Planned Purchases" field to snapshots
- Track wish list value over time
- Analyze wish list growth vs asset growth

#### 3.2 Navigation Updates

Add to main navigation:
```
- Dashboard
- Assets
- Snapshots
- Wish List ← NEW
  - Active Wishes
  - Purchased Items
  - Analytics
- Settings
```

---

### Phase 4: Advanced Features (Week 4)

#### 4.1 Smart Recommendations

**AI-like Logic (Rule-based)**
- Suggest items to remove based on low want frequency
- Flag items that are want > need with low life aspect importance
- Recommend purchase timing based on asset growth trends
- Suggest alternatives based on better ROI

**Priority Scoring Algorithm**
```
Priority Score =
  (Want Frequency × 0.3) +
  (Life Quality ROI × 0.3) +
  (Is Need × 0.2) +
  (Affordability × 0.2)
```

#### 4.2 Comparison Tools

**WishItemComparison.tsx**
- Side-by-side comparison table
- Select multiple items to compare
- Highlight best value
- Show trade-offs

**Historical Price Tracking**
- Manual price updates over time
- Show price trends
- Alert when price drops

#### 4.3 Gamification

**Progress Tracking**
- "Purchases fulfilled": Count of wishlist → purchased
- "Avoided impulse buys": Count of rejected items
- "Total saved": Sum of rejected item prices
- "Satisfaction score": Average satisfaction across purchases

**Achievements**
- "Thoughtful Buyer" - 90%+ satisfaction rate
- "Patient Saver" - Wait 30+ days before purchasing
- "Need Focused" - 80%+ purchases are needs
- "ROI Master" - Average ROI > 8.0

---

### Phase 5: Data Management & Polish (Week 5)

#### 5.1 Import/Export

**Export Format** (JSON)
```json
{
  "version": "1.0.0",
  "exportDate": "2024-01-15T00:00:00.000Z",
  "wishItems": [...],
  "purchasedItems": [...],
  "settings": {
    "monthlyBudget": 10000,
    "defaultCurrency": "TWD"
  }
}
```

**Import Validation**
- Check schema version
- Validate required fields
- Handle missing optional fields
- Merge or replace strategy

**Demo Data**
- Create `wishlist-demo.json` with realistic examples
- Cover all life aspects
- Mix of needs and wants
- Various price ranges

#### 5.2 Settings Integration

Add to Settings page:
- Wish List monthly budget
- Default want intensity
- Auto-archive purchased items older than X months
- Notification preferences (when to create snapshot, etc.)

#### 5.3 Mobile Responsiveness
- Optimize all components for mobile
- Touch-friendly buttons
- Swipe actions for cards
- Bottom sheet for forms on mobile

---

## UI/UX Design Guidelines

### Visual Style
- Consistent with current Asset Tracker design
- Use existing color scheme
- Wish List accent color: Purple/Magenta (different from assets)
- Icons: Shopping bag, heart, checkmark, star

### Color Coding
- **Needs**: Green badges/borders
- **Wants**: Blue badges/borders
- **High Priority**: Red indicator
- **Purchased**: Gray with checkmark
- **High Satisfaction**: Gold star

### Responsive Layout
```
Mobile:     Single column, stack cards
Tablet:     2 columns, sidebar filters
Desktop:    3 columns, persistent filters, comparison panel
```

---

## Data Storage Structure

### localStorage Keys
```
wishlist-data: {
  wishItems: WishItem[],
  purchasedItems: PurchasedItem[],
  settings: WishListSettings,
  version: string
}
```

---

## Testing Strategy

### Unit Tests
- `wishlistCalculations.ts` - All utility functions
- `useWishListData.ts` - Hook state management
- Want frequency calculations
- ROI calculations
- Asset impact calculations

### Component Tests
- Form validation
- Want entry tracking
- Status transitions
- Satisfaction rating submission

### Integration Tests
- Complete purchase flow (wishlist → purchased)
- Import/Export round-trip
- Asset tracker integration

---

## Performance Considerations

1. **Large Data Sets**
   - Virtualize long lists (react-window)
   - Paginate analytics data
   - Lazy load images

2. **localStorage Limits**
   - Compress old want entries (keep summary stats)
   - Archive purchased items older than 2 years
   - Warn when approaching 5MB limit

3. **Calculations**
   - Memoize expensive calculations
   - Debounce frequency updates
   - Cache analytics results

---

## Migration Strategy

### Adding to Existing App

1. **No Breaking Changes**
   - Wish list data stored separately
   - Existing asset data untouched
   - Can be used independently

2. **Gradual Integration**
   - Phase 1: Standalone wish list
   - Phase 2: Link to asset data (read-only)
   - Phase 3: Two-way integration (purchases affect assets)

3. **Feature Flag**
   - Add `ENABLE_WISHLIST` flag in settings
   - Allow users to hide feature if not needed

---

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Data Structure & Core Logic | Types, utilities, hooks |
| 2 | UI Components | All pages and components |
| 3 | Integration | Asset tracker integration |
| 4 | Advanced Features | Recommendations, comparisons |
| 5 | Polish & Testing | Import/export, tests, docs |

**Total Estimated Time**: 5 weeks

---

## Success Metrics

- ✅ Can add and track wish list items
- ✅ Want frequency automatically calculated
- ✅ Life quality ROI displayed
- ✅ Purchase flow integrated with assets
- ✅ Satisfaction tracking for purchases
- ✅ Analytics dashboard functional
- ✅ Import/Export working
- ✅ 80%+ test coverage on new code
- ✅ Mobile responsive
- ✅ No impact on existing features

---

## Reference Resources

### Notion Template Analysis
From https://www.notion.com/templates/shopping-wishlist-tracker:

**Good Ideas to Adopt:**
- Category grouping
- Priority levels
- Purchase status tracking
- Price tracking
- Notes field

**Enhancements Over Notion:**
- Want frequency tracking (automated)
- Life quality ROI calculation
- Integration with asset tracking
- Satisfaction ratings over time
- Need vs want analysis
- Asset impact percentage

---

## Future Enhancements (Post-MVP)

1. **Social Features**
   - Share wish lists
   - Gift registry mode
   - Price drop alerts from friends

2. **AI Integration**
   - Price prediction
   - Sentiment analysis of notes
   - Automatic categorization

3. **External Integrations**
   - Price comparison API
   - Review aggregation
   - Store inventory checking

4. **Advanced Analytics**
   - Seasonal purchase patterns
   - Category spending trends
   - Impulse buy detection

---

## Files to Create

### Types
- `/src/types/wishlist.ts`

### Hooks
- `/src/hooks/useWishListData.ts`

### Utils
- `/src/utils/wishlistCalculations.ts`

### Pages
- `/src/app/wishlist/page.tsx`
- `/src/app/wishlist/purchased/page.tsx`
- `/src/app/wishlist/analytics/page.tsx`

### Components
- `/src/components/wishlist/WishListDashboard.tsx`
- `/src/components/wishlist/WishItemCard.tsx`
- `/src/components/wishlist/WishItemForm.tsx`
- `/src/components/wishlist/WantFrequencyTracker.tsx`
- `/src/components/wishlist/WishItemAnalysis.tsx`
- `/src/components/wishlist/PurchasedItemsList.tsx`
- `/src/components/wishlist/PurchasedItemCard.tsx`
- `/src/components/wishlist/PurchasedItemForm.tsx`
- `/src/components/wishlist/SatisfactionRatingModal.tsx`
- `/src/components/wishlist/RepurchaseTracker.tsx`
- `/src/components/wishlist/WishListAnalytics.tsx`
- `/src/components/wishlist/LifeAspectMatrix.tsx`
- `/src/components/wishlist/AssetImpactChart.tsx`
- `/src/components/wishlist/WishItemComparison.tsx`

### Tests
- `/src/hooks/__tests__/useWishListData.test.ts`
- `/src/utils/__tests__/wishlistCalculations.test.ts`
- `/src/components/wishlist/__tests__/` (component tests)

### Fixtures
- `/src/test/fixtures/wishlist.ts`
- `/wishlist-demo.json`

---

## Next Steps

1. Review and approve this plan
2. Clarify any requirements or preferences
3. Begin Phase 1 implementation
4. Set up project board for tracking progress

---

**Questions for Clarification:**

1. Should purchases automatically deduct from asset values, or keep it manual?
2. Any specific life aspects to add beyond the 8 suggested?
3. Preferred currency display when mixing TWD/USD wish items?
4. Should archived wish items be kept forever or auto-deleted after X years?
5. Any specific Notion features you'd like to ensure we include?
