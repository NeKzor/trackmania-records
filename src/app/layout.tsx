// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import '@/styles/globals.css';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { fontSans } from '@/config/fonts';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import { Link } from '@nextui-org/link';
import clsx from 'clsx';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={clsx('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <Providers themeProps={{ attribute: 'class', defaultTheme: 'dark' }}>
          <div className="relative flex flex-col h-screen">
            <Navbar />
            <main className="container mx-auto max-w-7xl pt-8 px-6 flex-grow">{children}</main>
            <footer className="w-full flex items-center justify-center py-3">
              <div className="w-full mx-auto max-w-screen-xl p-4 flex items-center justify-between">
                <span className="text-sm text-center">
                  <Link isExternal className="flex items-center gap-1 text-current" href="https://nekz.me">
                    <span className="text-default-600">© 2023 NeKz</span>
                  </Link>
                </span>
                <ul className="flex flex-wrap items-center mb-6 gap-6 text-sm">
                  <li>
                    <Link href="/privacy" className="text-current">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      isExternal
                      href="https://github.com/NeKzor/trackmania-records/issues/new/choose"
                      target="_blank"
                      className="text-current"
                    >
                      Report Issue
                    </Link>
                  </li>
                </ul>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
