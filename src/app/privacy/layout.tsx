// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col justify-center gap-4 py-8 md:py-10">
      <div className="inline-block justify-center">{children}</div>
    </section>
  );
}
