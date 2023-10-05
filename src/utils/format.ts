// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import { scaleLinear } from 'd3-scale';
import { Temporal } from '@js-temporal/polyfill';

export const toAgo = (date: string | null) => {
  if (!date) {
    return '';
  }

  const now = Temporal.Now.instant();
  const then = Temporal.Instant.from(date);
  const ago = then.until(now);

  const days = Math.floor(ago.seconds / 60 / 60 / 24);
  if (days) {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }

    if (days >= 31) {
      const months = Math.floor(days / 31);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }

    if (days >= 14) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }

    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(ago.seconds / 60 / 60);
  if (hours) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const minutes = Math.floor(ago.seconds / 60);
  if (minutes) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  return `${ago.seconds} second${ago.seconds === 1 ? '' : 's'} ago`;
};

const hourScale = scaleLinear<string>()
  .domain([0, 24, 14 * 24, 2 * 30 * 24])
  .range(['#2eb82e', '#258e25', '#cca300', '#e67300']);

export function getDateDifferenceColor(date: string) {
  const now = Temporal.Now.instant();
  const then = Temporal.Instant.from(date);
  const ago = then.until(now);
  const passedHours = ago.seconds / 60;
  const result = passedHours <= 2 * 30 * 24 ? hourScale(passedHours) : undefined;
  console.log(date, passedHours, result, passedHours <= 2 * 30 * 24);
  return result;
}