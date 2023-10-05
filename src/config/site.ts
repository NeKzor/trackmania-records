// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'trackmania.nekz.me',
  description: "Trackmania's largest world record database.",
  navTitle: 'trackmania-records',
  navItems: [
    {
      label: 'Campaigns',
      href: '/campaigns',
    },
    {
      label: 'Rankings',
      href: '/rankings',
    },
    {
      label: 'Changelog',
      href: '/changelog',
    },
    {
      label: 'Blog',
      href: '/blog',
    },
  ],
  navMenuItems: [
    {
      label: 'Campaigns',
      href: '/campaigns',
    },
    {
      label: 'Rankings',
      href: '/rankings',
    },
    {
      label: 'Changelog',
      href: '/changelog',
    },
    {
      label: 'Blog',
      href: '/blog',
    },
  ],
  links: {
    github: 'https://github.com/NeKzor/trackmania-records',
    discord: 'https://discord.com/invite/trackmania',
    sponsor: 'https://github.com/sponsors/NeKzor',
  },
};
