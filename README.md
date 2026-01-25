# Asset Tracker

A personal asset tracking web application built with Next.js. Track your asset growth over time with support for multiple asset types, currencies, and automatic stock price updates.

## Features

- **Multi-Asset Support**: Track Cash (TWD/USD), Taiwan Stocks, US Stocks, Liabilities, and US Treasury Bills
- **Dual Currency**: View totals in TWD or USD with configurable exchange rates
- **Stock Price Updates**: Automatic stock price fetching via Yahoo Finance API
- **Snapshot System**: Create snapshots to track asset growth over time with configurable intervals
- **Growth Visualization**: Dashboard with multiple charts:
  - Asset growth over time with current value, 3-month and 1-year moving averages
  - Asset allocation breakdown pie chart
  - Allocation history stacked bar chart
  - Current vs target allocation comparison
- **Asset Growth Analysis**: Distinguish between new capital contributions and investment returns, with support for negative returns
- **Portfolio Rebalancing**:
  - Set target allocation percentages for each asset type
  - View current vs target allocation comparison
  - Get specific buy/sell recommendations (with 3% tolerance threshold)
- **Data Portability**: Export/Import your data as JSON for backup and portability
- **Demo Mode**: Import mock data to explore all features before adding your own
- **Static Deployment**: Deployable on GitHub Pages (no server required)
- **Privacy Focused**: All data stored locally in your browser (localStorage)
- **Internationalization**: Support for English and Traditional Chinese (繁體中文)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/asset-tracking-claude.git
cd asset-tracking-claude

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

The static output will be in the `out/` directory.

## Usage

### Managing Assets

1. Navigate to **Assets** page
2. Click **+ Add Asset** to add a new asset
3. Fill in the asset details:
   - Name: A descriptive name (e.g., "Bank A Savings")
   - Type: Select the asset type
   - Value: Current value
   - Currency: TWD or USD
   - For stocks: Add the Yahoo Finance symbol (e.g., "AAPL", "2330.TW")
   - Number of shares (optional for stocks)
4. Click **Update Stock Prices** to fetch latest prices from Yahoo Finance

### Creating Snapshots

Snapshots capture your asset values at a point in time for historical tracking.

1. Navigate to **Snapshots** page
2. Click **+ Create Snapshot**
3. Add optional notes (e.g., "Monthly snapshot", "Received bonus")

The app will remind you when it's time for a new snapshot based on your configured interval.

### Viewing Growth

The **Dashboard** shows:
- Total asset value
- Asset allocation breakdown (pie chart)
- Growth chart with:
  - Current values (blue line)
  - 3-month moving average (green dashed)
  - 1-year moving average (orange dashed)
- Month-over-month and year-over-year growth rates
- **Asset Growth Analysis**: Breaks down growth into:
  - New capital contributions (salary deposits, savings, new investments)
  - Investment returns (stock price appreciation, gains/losses)
  - Supports analysis for different time periods
- **Allocation History**: Stacked bar chart showing how your asset allocation has changed over time
- **Rebalancing Recommendations**:
  - Set target allocation percentages in Settings
  - View comparison between current and target allocation
  - Get specific buy/sell recommendations when allocation differs by more than 3%

### Data Management

In **Settings** you can:
- Adjust snapshot interval (how often to create snapshots)
- Update exchange rate (USD to TWD)
- Set target allocation percentages for portfolio rebalancing
- Export data (JSON backup)
- Import data (restore from backup or load demo data)
- Clear all data

### Demo Mode

Want to explore the app before adding your own data?

1. Download `mock.json` from the repository
2. Go to **Settings** > **Data Management**
3. Click **Import Data** and select `mock.json`
4. Explore all features with realistic sample data

See `MOCK_DATA_README.md` for details about what's included in the demo data.

## Deployment on GitHub Pages

1. Update `next.config.js` with your repository name:
   ```js
   basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
   assetPrefix: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '',
   ```

2. Enable GitHub Pages in your repository settings:
   - Go to Settings > Pages
   - Set Source to "GitHub Actions"

3. Push to main branch to trigger deployment

## Asset Types

| Type | Description | Currency |
|------|-------------|----------|
| Cash TWD | Cash in Taiwan Dollar | TWD |
| Cash USD | Cash in US Dollar | USD |
| TW Stocks | Taiwan stock market | TWD |
| US Stocks | US stock market | USD |
| US T-Bills | US Treasury Bills | USD |
| Liability | Mortgages, loans, debts | TWD/USD |

## Stock Symbols

For automatic price updates, use Yahoo Finance symbols:

- **Taiwan stocks**: Add `.TW` suffix (e.g., `2330.TW` for TSMC)
- **US stocks**: Use ticker directly (e.g., `AAPL` for Apple)

## Technical Details

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Charts**: Chart.js with react-chartjs-2
- **Data Storage**: Browser localStorage
- **Stock API**: Yahoo Finance (via CORS proxy for client-side)
- **i18n**: Support for English and Traditional Chinese
- **Deployment**: Static export for GitHub Pages

## Key Features Explained

### Asset Growth Analysis

This feature helps you understand where your wealth growth comes from:
- **New Capital**: Money you actively added (salary deposits, savings, new investments)
- **Investment Returns**: Gains or losses from your investments (stock price changes, interest)
- Supports both positive and negative returns
- Can analyze different time periods between snapshots

### Portfolio Rebalancing

Maintain your desired asset allocation:
1. Set target percentages for each asset type in **Settings** > **Target Allocation**
2. View comparison chart on Dashboard showing current vs target allocation
3. Get specific recommendations when allocation differs by more than 3%
4. Recommendations show exact amounts to buy or sell for rebalancing

### Allocation History

Track how your portfolio composition changes over time:
- Stacked bar chart showing each snapshot
- Hover to see exact values and percentages
- Total portfolio value shown in tooltip
- Color-coded by asset type

## License

MIT License
