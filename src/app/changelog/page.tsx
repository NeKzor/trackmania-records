// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import ChangelogTable from "@/components/changelog-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'World Record Changelog',
};

export default function ChangelogPage() {
  return (
    <div>
      <ChangelogTable />
    </div>
  );
}
