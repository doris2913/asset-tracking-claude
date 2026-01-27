import { AssetType } from '@/types';

// Chart color theme types
export type ChartColorTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'monochrome';

// Theme definition for asset type colors
export interface ChartThemeColors {
  cash_twd: string;
  cash_usd: string;
  stock_tw: string;
  stock_us: string;
  liability: string;
  us_tbills: string;
}

// Theme definition for line chart colors
export interface LineChartColors {
  snapshotValue: string;
  snapshotValueBg: string;
  currentValue: string;
  movingAverage3M: string;
  movingAverage1Y: string;
}

// Complete theme definition
export interface ChartTheme {
  id: ChartColorTheme;
  name: string;
  assetColors: ChartThemeColors;
  lineColors: LineChartColors;
}

// Default theme (original colors)
const defaultTheme: ChartTheme = {
  id: 'default',
  name: 'Default',
  assetColors: {
    cash_twd: '#22c55e',
    cash_usd: '#16a34a',
    stock_tw: '#3b82f6',
    stock_us: '#6366f1',
    liability: '#ef4444',
    us_tbills: '#8b5cf6',
  },
  lineColors: {
    snapshotValue: 'rgb(156, 163, 175)',
    snapshotValueBg: 'rgba(156, 163, 175, 0.1)',
    currentValue: 'rgb(59, 130, 246)',
    movingAverage3M: 'rgb(34, 197, 94)',
    movingAverage1Y: 'rgb(249, 115, 22)',
  },
};

// Ocean theme (blue-focused)
const oceanTheme: ChartTheme = {
  id: 'ocean',
  name: 'Ocean',
  assetColors: {
    cash_twd: '#06b6d4',    // cyan-500
    cash_usd: '#0891b2',    // cyan-600
    stock_tw: '#3b82f6',    // blue-500
    stock_us: '#1d4ed8',    // blue-700
    liability: '#f43f5e',   // rose-500
    us_tbills: '#6366f1',   // indigo-500
  },
  lineColors: {
    snapshotValue: 'rgb(14, 165, 233)',      // sky-500
    snapshotValueBg: 'rgba(14, 165, 233, 0.1)',
    currentValue: 'rgb(59, 130, 246)',        // blue-500
    movingAverage3M: 'rgb(6, 182, 212)',      // cyan-500
    movingAverage1Y: 'rgb(99, 102, 241)',     // indigo-500
  },
};

// Forest theme (green-focused)
const forestTheme: ChartTheme = {
  id: 'forest',
  name: 'Forest',
  assetColors: {
    cash_twd: '#22c55e',    // green-500
    cash_usd: '#15803d',    // green-700
    stock_tw: '#84cc16',    // lime-500
    stock_us: '#65a30d',    // lime-600
    liability: '#dc2626',   // red-600
    us_tbills: '#14b8a6',   // teal-500
  },
  lineColors: {
    snapshotValue: 'rgb(34, 197, 94)',       // green-500
    snapshotValueBg: 'rgba(34, 197, 94, 0.1)',
    currentValue: 'rgb(21, 128, 61)',         // green-700
    movingAverage3M: 'rgb(132, 204, 22)',     // lime-500
    movingAverage1Y: 'rgb(20, 184, 166)',     // teal-500
  },
};

// Sunset theme (warm colors)
const sunsetTheme: ChartTheme = {
  id: 'sunset',
  name: 'Sunset',
  assetColors: {
    cash_twd: '#f97316',    // orange-500
    cash_usd: '#ea580c',    // orange-600
    stock_tw: '#eab308',    // yellow-500
    stock_us: '#ca8a04',    // yellow-600
    liability: '#dc2626',   // red-600
    us_tbills: '#f472b6',   // pink-400
  },
  lineColors: {
    snapshotValue: 'rgb(249, 115, 22)',      // orange-500
    snapshotValueBg: 'rgba(249, 115, 22, 0.1)',
    currentValue: 'rgb(234, 179, 8)',         // yellow-500
    movingAverage3M: 'rgb(251, 146, 60)',     // orange-400
    movingAverage1Y: 'rgb(244, 114, 182)',    // pink-400
  },
};

// Monochrome theme (grayscale with blue accent)
const monochromeTheme: ChartTheme = {
  id: 'monochrome',
  name: 'Monochrome',
  assetColors: {
    cash_twd: '#6b7280',    // gray-500
    cash_usd: '#4b5563',    // gray-600
    stock_tw: '#374151',    // gray-700
    stock_us: '#1f2937',    // gray-800
    liability: '#ef4444',   // red-500 (keep for visibility)
    us_tbills: '#9ca3af',   // gray-400
  },
  lineColors: {
    snapshotValue: 'rgb(107, 114, 128)',     // gray-500
    snapshotValueBg: 'rgba(107, 114, 128, 0.1)',
    currentValue: 'rgb(59, 130, 246)',        // blue-500 (accent)
    movingAverage3M: 'rgb(75, 85, 99)',       // gray-600
    movingAverage1Y: 'rgb(55, 65, 81)',       // gray-700
  },
};

// All themes
export const CHART_THEMES: Record<ChartColorTheme, ChartTheme> = {
  default: defaultTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
  monochrome: monochromeTheme,
};

// Get theme by ID
export function getChartTheme(themeId: ChartColorTheme): ChartTheme {
  return CHART_THEMES[themeId] || CHART_THEMES.default;
}

// Get asset color for a specific asset type
export function getAssetColor(themeId: ChartColorTheme, assetType: AssetType): string {
  const theme = getChartTheme(themeId);
  return theme.assetColors[assetType];
}

// Get all asset colors as a record
export function getAssetColors(themeId: ChartColorTheme): Record<AssetType, string> {
  const theme = getChartTheme(themeId);
  return theme.assetColors as Record<AssetType, string>;
}

// Get line chart colors
export function getLineChartColors(themeId: ChartColorTheme): LineChartColors {
  const theme = getChartTheme(themeId);
  return theme.lineColors;
}

// Theme list for UI display
export const CHART_THEME_OPTIONS: Array<{ id: ChartColorTheme; labelKey: string }> = [
  { id: 'default', labelKey: 'default' },
  { id: 'ocean', labelKey: 'ocean' },
  { id: 'forest', labelKey: 'forest' },
  { id: 'sunset', labelKey: 'sunset' },
  { id: 'monochrome', labelKey: 'monochrome' },
];
