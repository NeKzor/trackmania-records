// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

'use client';

import React from 'react';
import Chart from 'react-apexcharts';

const randomColor = () => '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');

const MAX_DATAPOINTS = 30;

interface RankingsChartProps {
  title: string;
  labels: string[];
  series: number[];
  darkMode?: boolean;
  rest?: boolean;
}

export default function RankingsChart({ labels, series, title, darkMode = true, rest = true }: RankingsChartProps) {
  if (rest && series.length > MAX_DATAPOINTS) {
    const rest = series.slice(MAX_DATAPOINTS).reduce((acc, val) => (acc += val), 0);

    series = series.slice(0, MAX_DATAPOINTS);
    labels = labels.slice(0, MAX_DATAPOINTS);

    series.push(rest);
    labels.push('Rest');
  }

  const colors = new Array(series.length).fill(0).map(() => randomColor());

  return (
    <Chart
      options={{
        labels,
        legend: {
          show: false,
        },
        responsive: [
          {
            breakpoint: 380,
            options: {
              chart: {
                height: '300px',
              },
            },
          },
        ],
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                name: {
                  show: true,
                },
                value: {
                  show: true,
                  color: darkMode ? 'white' : 'black',
                },
                total: {
                  show: true,
                  label: title,
                  color: darkMode ? 'white' : 'black',
                },
              },
            },
          },
        },
        colors,
      }}
      series={series}
      type="donut"
      height="400"
    />
  );
}
