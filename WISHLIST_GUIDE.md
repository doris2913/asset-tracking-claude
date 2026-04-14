# Wishlist Feature Guide

## Overview

The wishlist feature is a comprehensive tool for tracking desired purchases, analyzing their impact on your financial goals, and making informed buying decisions based on life quality ROI.

## Features

### 1. Wish List Management
- **Add items** with detailed information (name, category, price, specifications)
- **Track alternatives** - Compare different options before buying
- **Life aspects** - Tag items by how they improve your life (運動, 娛樂, 社交, 工作效率, 健康, 學習, 舒適度, 外觀, 家電)
- **Need vs Want** - Distinguish between necessities and desires
- **Priority levels** - High, Medium, Low
- **Want frequency tracking** - Record when you want something to identify patterns
- **ROI calculation** - Life Quality ROI = Σ(expected improvement × importance) / price

### 2. Purchase Tracking
- **Manual purchase logging** - Mark items as purchased with actual price
- **Satisfaction ratings** - Rate purchases over time (1-5 stars)
- **Repurchase tracking** - For daily necessities, track if you'd buy again
- **Monthly spend monitoring** - Track against your budget
- **Purchase history** - Filter and sort by date, satisfaction, or price

### 3. Analytics Dashboard
- **Key metrics**: Total items, total value, % of assets, need/want ratio
- **Need vs Want distribution** - Visual breakdown
- **Priority distribution** - See what matters most
- **Life aspects analysis** - Which areas you invest in most
- **Category breakdown** - Spending patterns by category
- **Most wanted items** - Items you want most frequently
- **Purchase recommendations** - Smart suggestions based on budget and priority
- **Satisfaction by category** - Learn which purchases bring most joy

### 4. Smart Recommendations
The system generates purchase recommendations based on:
- **Monthly budget** - Respects your spending limit
- **Priority score** - Weighted algorithm considering:
  - Life quality ROI (40%)
  - Priority level (30%)
  - Need status (20%)
  - Want frequency (10%)
- **Remaining budget** - Only recommends what you can afford

## How to Use

### Loading Demo Data

1. **Navigate to Settings** (⚙️ icon in navigation)
2. **Click "Load from URL"** under Data Management
3. **Option A - Local file**:
   - Copy the path: `/Users/doris/Documents/claude/asset/wishlist-demo.json`
   - Note: This only works if you're running a local server
4. **Option B - Upload the file**:
   - Use the "Import Data" button
   - Select `wishlist-demo.json`

Alternatively, you can manually copy the contents of `wishlist-demo.json` to your browser's localStorage:
```javascript
// In browser console:
const demoData = /* paste content from wishlist-demo.json */;
localStorage.setItem('wishlist-items', JSON.stringify(demoData.wishItems));
localStorage.setItem('purchased-items', JSON.stringify(demoData.purchasedItems));
localStorage.setItem('wishlist-settings', JSON.stringify(demoData.settings));
window.location.reload();
```

### Adding Your First Wish Item

1. **Go to Wish List page** (❤️ icon)
2. **Click "+ 新增願望"**
3. **Fill in basic info**:
   - Name: e.g., "Sony WH-1000XM5 降噪耳機"
   - Category: e.g., "3C產品"
   - Estimated Price: e.g., 10990
   - Type: Need or Want
   - Priority: High/Medium/Low
4. **Select life aspects** that this item will improve
5. **Rate each aspect** (1-5):
   - **Importance**: How important is this aspect to you?
   - **Current**: How satisfied are you currently?
   - **Expected**: How much will this item improve it?
6. **Optional**: Add specifications, alternatives, notes, links
7. **Click "儲存"**

### Tracking Want Frequency

When you find yourself wanting something again:
1. **Click "記錄想要"** on the wish item card
2. **Select intensity** (1-5): How much do you want it right now?
3. **Add context** (optional): Why do you want it?
4. **Save**

The system will calculate want frequency (times per week) and factor it into recommendations.

### Making a Purchase

1. **Click "標記為已購買"** on a wish item
2. **Enter actual price** (if different from estimate)
3. **Add purchase date and store** (optional)
4. **Choose type**:
   - **一次性購買**: Items you buy once (electronics, furniture)
   - **日常用品**: Items you may repurchase (consumables)
5. **Save**

The item moves to the "已購買" page.

### Rating Purchases

1. **Go to "已購買" page**
2. **Click "⭐ 評分"** on a purchased item
3. **Select rating** (1-5 stars)
4. **Add notes** about your experience
5. **Submit**

You can rate items multiple times to track satisfaction over time.

### Using Analytics

The analytics page provides insights to help you:
- **Understand spending patterns** - Which categories and life aspects you invest in
- **Make better decisions** - See which categories bring highest satisfaction
- **Prioritize wisely** - View need/want balance and priority distribution
- **Get recommendations** - Smart suggestions based on your budget and priorities

## Demo Data Contents

The `wishlist-demo.json` includes:

### Wish Items (8 items)
1. **Sony WH-1000XM5 降噪耳機** (NT$10,990) - High priority want
   - Life aspects: Work efficiency, Entertainment, Comfort
   - Multiple want entries showing strong desire
   - Includes 2 alternatives

2. **Dyson V15 無線吸塵器** (NT$24,900) - High priority need
   - Life aspects: Home appliances, Health, Comfort
   - Strong life quality ROI
   - Urgent (old vacuum broke)

3. **MacBook Pro 14吋 M3** (NT$62,900) - Medium priority want
   - Life aspects: Work efficiency, Education
   - Expensive but high impact
   - Includes 2 alternatives

4. **Lululemon 瑜珈墊** (NT$3,200) - Low priority want
   - Life aspects: Exercise, Health
   - Not urgent (gym provides mats)

5. **Herman Miller Aeron 人體工學椅** (NT$42,000) - High priority need
   - Life aspects: Work efficiency, Health, Comfort
   - Health investment (back pain issue)
   - Multiple want entries
   - Includes 2 alternatives

6. **Kindle Paperwhite** (NT$4,490) - Low priority want
   - Life aspects: Education, Entertainment
   - Nice to have, not urgent

7. **Switch OLED 主機** (NT$10,480) - Medium priority want
   - Life aspects: Entertainment, Social
   - Waiting for good games

8. **Uniqlo 羽絨外套** (NT$1,990) - High priority need
   - Life aspects: Comfort, Appearance
   - Seasonal need (cold weather)

### Purchased Items (5 items)
1. **AirPods Pro 2** (NT$7,490) - Rated 5/5 stars
   - 2 satisfaction ratings showing consistent happiness
   - Purchased Dec 2023

2. **無印良品收納盒組** (NT$999) - Rated 4/5 stars
   - Got on sale (estimated NT$1,200)
   - Practical purchase

3. **Nike 慢跑鞋** (NT$2,800) - Rated 4-5/5 stars
   - 3 satisfaction ratings tracking durability over time
   - Would repurchase
   - Sale purchase (estimated NT$3,500)

4. **星巴克隨行杯** (NT$450) - Rated 3/5 stars
   - Impulse buy, moderate satisfaction
   - Would NOT repurchase (looking for better insulation)

5. **Costco 床墊** (NT$13,999) - Rated 5/5 stars
   - 3 satisfaction ratings, all excellent
   - Health investment that paid off
   - Improved sleep quality

### Settings
- **Monthly budget**: NT$15,000
- **Auto-archive**: 6 years for rejected items
- **Currency**: TWD only

## Key Metrics from Demo Data

Based on the demo data:
- **Total wish items**: 8 items worth NT$163,440
- **High priority items**: 4 items (3 needs, 1 want)
- **Need vs Want ratio**: 50/50 (4 needs, 4 wants)
- **Average satisfaction of purchases**: 4.2/5 stars
- **Purchase success rate**: 80% (4 out of 5 items rated 4+ stars)

## Tips for Best Use

1. **Update want frequency regularly** - The more data, the better recommendations
2. **Be honest with ratings** - Importance, satisfaction, and expected improvement
3. **Track alternatives** - Helps avoid buyer's remorse
4. **Rate purchases multiple times** - Track satisfaction over time (1 week, 1 month, 3 months)
5. **Review analytics monthly** - Identify patterns and adjust spending
6. **Set realistic budget** - Update in settings based on actual finances
7. **Use need/want wisely** - Be honest about what's truly necessary
8. **Consider life quality ROI** - Not everything expensive has high ROI

## Integration with Asset Tracker

The wishlist integrates with your main asset tracker:
- **Asset impact %** - Shows each wish item as % of total assets
- **Budget calculation** - Can optionally link to available cash
- **Holistic view** - Understand how purchases affect net worth

## Data Management

All wishlist data is stored locally in your browser's localStorage:
- `wishlist-items` - Active wish items
- `purchased-items` - Purchase history
- `wishlist-settings` - Budget and preferences

To backup:
1. Go to Settings
2. Click "Export Data"
3. Save the JSON file

To restore:
1. Go to Settings
2. Click "Import Data"
3. Select your backup file

## Auto-Archive Feature

Items marked as "Rejected" will automatically be removed after 6 years. This keeps your wishlist clean while preserving recent decision data.

## Future Enhancements (Optional)

Potential additions not yet implemented:
- Gift tracking for received items
- Price drop alerts
- Seasonal purchase planning
- Shared wishlists with family
- Purchase deadline reminders
- Category budgets

## Troubleshooting

**Q: Demo data not showing?**
- Check browser console for errors
- Verify localStorage has the data: `localStorage.getItem('wishlist-items')`
- Try refreshing the page

**Q: Calculations seem off?**
- Ensure life aspect ratings are set (importance, current, expected)
- Check that monthly budget is set in settings
- Verify asset data is loaded (for % calculation)

**Q: Want to reset everything?**
- Go to Settings → Clear All Data (will clear both assets and wishlist)
- Or manually: `localStorage.removeItem('wishlist-items')` in console

## Support

For issues or questions:
- Check the implementation plan: `WISHLIST_FEATURE_PLAN.md`
- Review the type definitions: `src/types/wishlist.ts`
- Check calculation logic: `src/utils/wishlistCalculations.ts`

Enjoy tracking your wishes and making smarter purchase decisions! 🎯
