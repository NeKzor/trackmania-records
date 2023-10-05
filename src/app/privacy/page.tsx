// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div>
      <article className="format lg:format-lg">
        <h2 className="text-4xl dark:text-white">Privacy Notice</h2>
        <p className="my-4">Last Update: Oct 05, 2023</p>
        <h6 className="my-1">Cookies</h6>
        <ul className="space-y-1 list-disc list-inside">
          <li>We only use two session cookies.</li>
          <li>These cookies are used to identify you with your created user account.</li>
        </ul>
        <br />
        <h6 className="my-1">Stored Data</h6>
        <ul className="space-y-1 list-disc list-inside">
          <li>We store username and ID of your Ubisoft/Maniaplanet account.</li>
          <li>We log and store information such as your IP and your used browser user agent for 30 days.</li>
          <li>These logs are needed to protect and improve our service.</li>
        </ul>
      </article>
    </div>
  );
}
