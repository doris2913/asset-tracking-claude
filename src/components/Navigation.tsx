'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useI18n, Language, languageNames } from '@/i18n';

type Section = 'assets' | 'wishlist';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine which section is active based on the current path
  const getActiveSection = (): Section => {
    if (pathname.startsWith('/wishlist')) return 'wishlist';
    return 'assets';
  };

  const activeSection = getActiveSection();

  // Section definitions
  const sections: { key: Section; label: string; icon: string }[] = [
    { key: 'assets', label: t.nav.sectionAssets, icon: '💰' },
    { key: 'wishlist', label: t.nav.sectionWishlist, icon: '❤️' },
  ];

  // Sub-navigation items per section
  const sectionNavItems: Record<Section, NavItem[]> = {
    assets: [
      { href: '/', label: t.nav.dashboard, icon: '📊' },
      { href: '/assets', label: t.nav.assets, icon: '💼' },
      { href: '/details', label: t.nav.details, icon: '📋' },
      { href: '/snapshots', label: t.nav.snapshots, icon: '📸' },
    ],
    wishlist: [
      { href: '/wishlist', label: t.nav.wishlistItems, icon: '📝' },
      { href: '/wishlist/analytics', label: t.nav.wishlistAnalytics, icon: '📊' },
      { href: '/wishlist/purchased', label: t.nav.wishlistPurchased, icon: '🛒' },
      { href: '/wishlist/settings', label: t.nav.wishlistSettings, icon: '⚙️' },
    ],
  };

  // Utility items (settings, migrate)
  const utilityItems: NavItem[] = [
    { href: '/migrate', label: t.nav.migrate, icon: '📥' },
    { href: '/settings', label: t.nav.settings, icon: '⚙️' },
  ];

  const isUtilityPage = pathname.startsWith('/settings') || pathname.startsWith('/migrate');

  // Check if a nav item is active
  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/wishlist') return pathname === '/wishlist';
    return pathname.startsWith(href);
  };

  // Mobile bottom nav: key items from both sections
  const bottomNavItems: NavItem[] = [
    { href: '/', label: t.nav.dashboard, icon: '📊' },
    { href: '/assets', label: t.nav.assets, icon: '💼' },
    { href: '/wishlist', label: t.nav.wishlist, icon: '❤️' },
    { href: '/snapshots', label: t.nav.snapshots, icon: '📸' },
    { href: '/settings', label: t.nav.settings, icon: '⚙️' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white dark:bg-gray-800 shadow-lg">
        {/* Tier 1: App name + Section tabs + Utilities */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            {/* App Name */}
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-2xl">🏠</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                {t.nav.appName}
              </span>
            </div>

            {/* Section Tabs */}
            <div className="flex items-center space-x-1 mx-4">
              {sections.map((section) => {
                const isActive = activeSection === section.key && !isUtilityPage;
                return (
                  <Link
                    key={section.key}
                    href={section.key === 'assets' ? '/' : '/wishlist'}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{section.icon}</span>
                    <span>{section.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Utilities: Migrate, Settings, Language */}
            <div className="flex items-center space-x-1 shrink-0">
              {utilityItems.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    title={item.label}
                  >
                    <span className="text-lg">{item.icon}</span>
                  </Link>
                );
              })}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-200 cursor-pointer focus:ring-2 focus:ring-blue-500 ml-1"
              >
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <option key={lang} value={lang}>
                    {languageNames[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tier 2: Sub-navigation for active section */}
        {!isUtilityPage && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center space-x-1 h-10">
                {sectionNavItems[activeSection].map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                        isActive
                          ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'text-gray-600 hover:bg-white/60 dark:text-gray-400 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <span className="text-xs">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Top Bar */}
      <nav className="md:hidden bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex justify-between items-center h-14 px-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏠</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              {t.nav.appName}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <option key={lang} value={lang}>
                  {languageNames[lang]}
                </option>
              ))}
            </select>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu - Grouped by Section */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700 py-2 px-4 max-h-[70vh] overflow-y-auto">
            {/* Asset Management Section */}
            <div className="mb-3">
              <div className="flex items-center space-x-2 px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <span>💰</span>
                <span>{t.nav.sectionAssets}</span>
              </div>
              {sectionNavItems.assets.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Wish List Section */}
            <div className="mb-3">
              <div className="flex items-center space-x-2 px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <span>❤️</span>
                <span>{t.nav.sectionWishlist}</span>
              </div>
              {sectionNavItems.wishlist.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Utility Items */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              {utilityItems.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Section Tabs - shown below the top bar, horizontally scrollable */}
        {!isUtilityPage && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center px-2 h-10 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Section selector pills */}
              {sections.map((section) => {
                const isSectionActive = activeSection === section.key;
                return (
                  <Link
                    key={section.key}
                    href={section.key === 'assets' ? '/' : '/wishlist'}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors mx-0.5 whitespace-nowrap ${
                      isSectionActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <span className="mr-0.5">{section.icon}</span>
                    {section.label}
                  </Link>
                );
              })}
              <div className="shrink-0 w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1.5" />
              {/* Sub-page tabs */}
              {sectionNavItems[activeSection].map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors mx-0.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <span className="mr-0.5">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation - Touch optimized */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16">
          {bottomNavItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : item.href === '/wishlist'
              ? pathname.startsWith('/wishlist')
              : isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors active:bg-gray-100 dark:active:bg-gray-700 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="text-2xl mb-0.5">{item.icon}</span>
                <span className={`text-[10px] leading-tight ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
