// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import RankingsChart from "@/components/rankings-chart";
import RankingsTable from "@/components/rankings-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Rankings',
  description: 'World Record Rankings',
};

export default function ChangelogPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <RankingsTable />
      </div>
      <RankingsChart
        title="WRs"
        labels={["Eddiel33t", "ShcrTM", "SUSBIT"]}
        series={[1, 1, 1]}
      />
    </div>
  );
}
