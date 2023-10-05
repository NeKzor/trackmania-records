// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import { title } from '@/components/primitives';
import { Metadata } from 'next';

type Props = {
  params: { game: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const game = params.game;
  console.log({ params });

  return {
    title: `${game} | Campaign`,
    openGraph: {
      images: ['/img/trackmania.jpg'],
    },
  };
}
export default function CampaignPage() {
  return (
    <div>
      <h1 className={title()}>Campaign</h1>
    </div>
  );
}
