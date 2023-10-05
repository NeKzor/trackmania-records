// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import { Fira_Code as FontMono, Inter as FontSans } from 'next/font/google';

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
});
