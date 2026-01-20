'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n, Language, languageNames } from '@/i18n';

export default function Navigation() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();

  const navItems = [
    { href: '/', label: t.nav.dashboard, icon: '📊' },
    { href: '/assets', label: t.nav.assets, icon: '💰' },
    { href: '/details', label: t.nav.details, icon: '📋' },
    { href: '/snapshots', label: t.nav.snapshots, icon: '📸' },
    { href: '/settings', label: t.nav.settings, icon: '⚙️' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
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

            {/* Language Switcher */}
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
  );
}
