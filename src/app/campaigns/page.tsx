// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import CampaignCards from '@/components/campaign-cards';
import { Metadata } from 'next/types';

export const metadata: Metadata = {
  title: 'Campaigns',
  description: 'Trackmania Campaigns',
};

export default function CampaignsPage() {
  return (
    <div>
      <CampaignCards />
    </div>
  );
}
