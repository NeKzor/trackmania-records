// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import NextLink from 'next/link';
import { Link } from '@nextui-org/link';
import { Snippet } from '@nextui-org/snippet';
import { Code } from '@nextui-org/code';
import { button as buttonStyles } from '@nextui-org/theme';
import { siteConfig } from '@/config/site';
import { subtitle, title } from '@/components/primitives';
import { GithubIcon } from '@/components/icons';
import RecordsTable from '@/components/records-table';
import { Button } from '@nextui-org/button';
import CampaignCards from '@/components/campaign-cards';

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>Trackmania&#39;s&nbsp;</h1>
        <h1 className={title({ color: 'violet' })}>largest&nbsp;</h1>
        <br />
        <h1 className={title()}>world record database.</h1>
        <h2 className={subtitle({ class: 'mt-4' })}>We list, rank and compare the fastest runs.</h2>
      </div>

      <div className="mt-4">
        <RecordsTable />
      </div>
      <div>
        <Button href="/changelog" as={Link} color="primary" variant="solid" radius="full">
          View full changelog
        </Button>
      </div>
      <CampaignCards />
    </section>
  );
}
