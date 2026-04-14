# Asset Tracker

A comprehensive personal asset tracking web application built with Next.js. Track your asset growth over time with support for multiple asset types, currencies, automatic stock price updates, and a full-featured wishlist system.

## Features

### Asset Management
- **Multi-Asset Support**: Track Cash (TWD/USD), Taiwan Stocks, US Stocks, US Treasury Bills, and Liabilities
- **Dual Currency Display**: View totals in TWD or USD with configurable exchange rates
- **Stock Price Updates**: Automatic stock price fetching from multiple sources (Yahoo Finance, Alpha Vantage, Finnhub, FMP)
- **Moving Averages**: 3-month and 1-year moving averages for stock prices
- **Privacy Mode**: Hide all monetary values with a single click (across all pages)

### Dashboard & Analytics
- **Asset Overview**: Total value, asset count, exchange rate, YoY growth
- **Growth Charts**: Interactive charts with current value, 3-month MA, and 1-year MA lines
- **Asset Allocation**: Pie chart breakdown by asset type
- **Allocation History**: Stacked bar chart showing allocation changes over time
- **Growth Analysis**: Distinguish between new capital contributions and investment returns
- **Portfolio Rebalancing**: Set target allocations and get buy/sell recommendations (3% tolerance threshold)

### Snapshot System
- **Historical Tracking**: Create snapshots to track asset values over time
- **Configurable Intervals**: Set reminder intervals (1-365 days)
- **Snapshot Comparison**: View changes between snapshots with delta analysis
- **Notes Support**: Add notes to snapshots for context

### Wishlist Module
- **Wishlist Management**: Track items you want to purchase with priority levels
- **Purchase Tracking**: Record purchases with actual price, date, store, and satisfaction ratings
- **Life Aspect Analysis**: Categorize purchases by life aspects (Work, Health, Entertainment, etc.)
- **Budget Management**: Set budgets and track remaining amount
- **Analytics Dashboard**: Spending trends, category analysis, purchase recommendations

### Customization
- **Theme Support**: Light/Dark mode for the application
- **Chart Themes**: 5 color schemes (Default, Ocean, Forest, Sunset, Monochrome)
- **Internationalization**: English and Traditional Chinese (繁體中文)
- **Stock Data Sources**: Choose from Yahoo Finance, Alpha Vantage, Finnhub, or FMP

### Data Management
- **Local Storage**: All data stored in browser localStorage (privacy-focused)
- **Export/Import**: Backup and restore data as JSON files
- **URL Import**: Load data from public URLs (Dropbox, GitHub Gist, etc.)
- **Data Migration**: Migrate from legacy database.json format
- **Static Deployment**: No server required - deploy on GitHub Pages

## Pages

| Page | Description |
|------|-------------|
| Dashboard (`/`) | Asset overview, charts, growth analysis, rebalancing recommendations |
| Assets (`/assets`) | Manage assets, update stock prices, add/edit/delete assets |
| Details (`/details`) | Detailed asset table with filtering, sorting, and search |
| Snapshots (`/snapshots`) | Create and manage historical snapshots |
| Settings (`/settings`) | App settings, themes, stock sources, data management |
| Allocation (`/settings/allocation`) | Set target allocation percentages |
| Wishlist (`/wishlist`) | Manage wishlist items |
| Purchased (`/wishlist/purchased`) | Track purchased items with ratings |
| Analytics (`/wishlist/analytics`) | Wishlist spending analysis |

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
   - For stocks: Add the symbol (e.g., "AAPL", "2330.TW")
   - Number of shares (optional for stocks)
4. Click **Update Stock Prices** to fetch latest prices

### Privacy Mode

Click the eye icon (👁️/🙈) in the header of Dashboard, Assets, or Details pages to hide/show all monetary values. The setting is shared across all pages.

### Creating Snapshots

1. Navigate to **Snapshots** page
2. Click **+ Create Snapshot**
3. Add optional notes

The app will remind you when it's time for a new snapshot based on your configured interval.

### Portfolio Rebalancing

1. Go to **Settings** > **Target Allocation**
2. Set target percentages for each asset type
3. View comparison on Dashboard
4. Follow buy/sell recommendations when allocation differs by more than 3%

### Data Backup

In **Settings** > **Data Management**:
- **Export**: Download all data as JSON
- **Import**: Restore from JSON file
- **Import from URL**: Load from Dropbox, GitHub Gist, or other public URLs

## Stock Data Sources

| Source | API Key | Rate Limit | Features |
|--------|---------|------------|----------|
| Yahoo Finance | Not required | Unlimited | TW & US stocks, no key needed |
| Alpha Vantage | Required | 25/day (free) | TW & US stocks, technical indicators |
| Finnhub | Required | 60/min (free) | Primarily US stocks, real-time data |
| FMP | Required | 250/day (free) | TW & US stocks, moving averages |

### Stock Symbols

- **Taiwan stocks**: Add `.TW` suffix (e.g., `2330.TW` for TSMC)
- **US stocks**: Use ticker directly (e.g., `AAPL` for Apple)

## Asset Types

| Type | Description | Currency |
|------|-------------|----------|
| Cash TWD | Cash in Taiwan Dollar | TWD |
| Cash USD | Cash in US Dollar | USD |
| TW Stocks | Taiwan stock market | TWD |
| US Stocks | US stock market | USD |
| US T-Bills | US Treasury Bills | USD |
| Liability | Mortgages, loans, debts | TWD/USD |

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

## Technical Details

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Charts**: Chart.js with react-chartjs-2
- **Data Storage**: Browser localStorage
- **Stock APIs**: Yahoo Finance, Alpha Vantage, Finnhub, FMP (via CORS proxy)
- **i18n**: English and Traditional Chinese
- **Deployment**: Static export for GitHub Pages

## Demo Mode

Want to explore the app before adding your own data?

1. Download `mock.json` from the repository
2. Go to **Settings** > **Data Management**
3. Click **Import Data** and select `mock.json`
4. Explore all features with realistic sample data

See `MOCK_DATA_README.md` for details about what's included in the demo data.

## License

MIT License
