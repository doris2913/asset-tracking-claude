# Asset Tracker

A personal asset tracking web application built with Next.js. Track your asset growth over time with support for multiple asset types, currencies, and automatic stock price updates.

## Features

- **Multi-Asset Support**: Track Cash (TWD/USD), Taiwan Stocks, US Stocks, Rent/Property, and US Treasury Bills
- **Dual Currency**: View totals in TWD or USD with configurable exchange rates
- **Stock Price Updates**: Automatic stock price fetching via Yahoo Finance API
- **Snapshot System**: Create monthly snapshots to track asset growth over time
- **Growth Visualization**: Dashboard with charts showing current value, 3-month and 1-year moving averages
- **Data Portability**: Export/Import your data as JSON for backup and portability
- **Static Deployment**: Deployable on GitHub Pages (no server required)
- **Privacy Focused**: All data stored locally in your browser (localStorage)

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
- Asset allocation breakdown
- Growth chart with:
  - Current values (blue line)
  - 3-month moving average (green dashed)
  - 1-year moving average (orange dashed)
- Month-over-month and year-over-year growth rates

### Data Management

In **Settings** you can:
- Adjust snapshot interval
- Update exchange rate
- Export data (JSON backup)
- Import data (restore from backup)
- Clear all data

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
| Rent | Rental property/deposits | TWD/USD |
| US T-Bills | US Treasury Bills | USD |

## Stock Symbols

For automatic price updates, use Yahoo Finance symbols:

- **Taiwan stocks**: Add `.TW` suffix (e.g., `2330.TW` for TSMC)
- **US stocks**: Use ticker directly (e.g., `AAPL` for Apple)

## Technical Details

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Data Storage**: Browser localStorage
- **Stock API**: Yahoo Finance (via CORS proxy for client-side)
- **Deployment**: Static export for GitHub Pages

## License

MIT License
