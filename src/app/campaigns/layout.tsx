// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block text-center justify-center">{children}</div>
    </section>
  );
}
