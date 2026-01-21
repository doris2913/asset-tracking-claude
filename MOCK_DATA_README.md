# Mock Data for Asset Tracker Demo

## Overview
This mock.json file contains sample data to demonstrate all features of the Asset Tracker application.

## What's Included

### 1. **Current Assets** (8 assets total)
   - **Cash (TWD)**: Cathay Bank Savings - $500,000 TWD
   - **Cash (USD)**: CTBC Bank USD Account - $15,000 USD
   - **Taiwan Stocks**:
     - TSMC (2330.TW) - 300 shares
     - 0050 ETF (0050.TW) - 400 shares
   - **US Stocks**:
     - Apple Inc (AAPL) - 100 shares
     - Microsoft Corp (MSFT) - 100 shares
   - **US T-Bills**: $50,000 USD
   - **Liability**: Mortgage - -$800,000 TWD

### 2. **Historical Snapshots** (5 snapshots)
   - January 2024
   - April 2024
   - July 2024
   - October 2024
   - January 2025

   These snapshots show portfolio growth from ~$5.5M TWD to ~$7M TWD over one year.

### 3. **Target Allocation Settings**
   - Cash (TWD): 10%
   - Cash (USD): 15%
   - Taiwan Stocks: 35%
   - US Stocks: 30%
   - US T-Bills: 10%
   - Liability: 0%

### 4. **Stock Price Data**
   Complete historical price data with moving averages for:
   - TSMC (2330.TW)
   - 0050 ETF (0050.TW)
   - Apple (AAPL)
   - Microsoft (MSFT)

## How to Use

### Method 1: Import via Settings Page
1. Navigate to the Asset Tracker application
2. Go to **Settings** page
3. Scroll down to **Data Management** section
4. Click **Import Data** button
5. Select the `mock.json` file
6. Confirm the import

### Method 2: Manual Copy (for Development)
Copy the contents of `mock.json` and paste it into your browser's localStorage:
```javascript
// Open browser console (F12)
localStorage.setItem('asset-tracker-data', JSON.stringify(mockData));
// Refresh the page
location.reload();
```

## Features Demonstrated

After importing this mock data, you'll be able to see:

1. **Dashboard**
   - Total assets displayed in both TWD and USD
   - Year-over-year growth calculation
   - Asset growth chart with historical data
   - Asset allocation pie chart
   - Allocation history stacked bar chart
   - **Current vs Target Allocation** comparison chart
   - **Rebalancing Recommendations** with specific buy/sell suggestions
   - Asset summary table by type

2. **Assets Page**
   - List of all current assets
   - Update stock prices functionality
   - Stock symbols with automatic price fetching

3. **Snapshots Page**
   - Historical snapshots from 2024-2025
   - View detailed breakdown of each snapshot
   - Category history comparison

4. **Settings - Allocation Page**
   - Pre-configured target allocation percentages
   - Visual indication when total allocation = 100%

## Notes

- All monetary values are realistic and demonstrate typical portfolio scenarios
- Stock prices show realistic growth patterns over the year
- The mock data includes both gains (stocks growing) and regular expenses (mortgage payments)
- Exchange rate is set to 31.85 TWD/USD
- Snapshot interval is set to 90 days (quarterly)

## Clearing Mock Data

To return to an empty state:
1. Go to **Settings** page
2. Scroll to **Data Management**
3. Click **Clear All Data**
4. Confirm the action

---

**Tip**: Use this mock data to explore all features before adding your own real data!
