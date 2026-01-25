'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useI18n, Language, languageNames } from '@/i18n';

export default function Navigation() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: t.nav.dashboard, icon: '📊' },
    { href: '/assets', label: t.nav.assets, icon: '💰' },
    { href: '/details', label: t.nav.details, icon: '📋' },
    { href: '/snapshots', label: t.nav.snapshots, icon: '📸' },
    { href: '/wishlist', label: t.nav.wishlist || 'Wish List', icon: '❤️' },
    { href: '/migrate', label: t.nav.migrate, icon: '📥' },
    { href: '/settings', label: t.nav.settings, icon: '⚙️' },
  ];

  // Bottom nav shows only main items
  const bottomNavItems = navItems.slice(0, 5);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📈</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                {t.nav.appName}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-200 cursor-pointer focus:ring-2 focus:ring-blue-500"
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
      </nav>

      {/* Mobile Top Bar */}
      <nav className="md:hidden bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex justify-between items-center h-14 px-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📈</span>
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700 py-2 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
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
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
