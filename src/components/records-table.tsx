// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

'use client';

import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@nextui-org/table';

import '/node_modules/flag-icons/css/flag-icons.min.css';
import { getDateDifferenceColor, toAgo } from '@/utils/format';
import { Link } from '@nextui-org/link';
import PlayerPopover from './player-popover';

const rows = [
  {
    key: '1',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-04T21:42:00+00:00',
    time: 22.672,
    delta: -0.006,
    player: 'Eddiel33t',
    nation: 'se',
  },
  {
    key: '2',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-03T21:42:00+00:00',
    time: 22.678,
    delta: -0.024,
    player: 'ShcrTM',
    nation: 'fr',
  },
  {
    key: '3',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-02T21:42:00+00:00',
    time: 22.702,
    delta: -0.033,
    player: 'SUSBIT',
    nation: 'de',
  },
  {
    key: '4',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: 'fr',
  },
];

const columns = [
  {
    key: 'date',
    label: 'DATE',
  },
  {
    key: 'game',
    label: 'GAME',
  },
  {
    key: 'track',
    label: 'TRACK',
  },
  {
    key: 'time',
    label: 'TIME',
  },
  {
    key: 'delta',
    label: 'DELTA',
  },
  {
    key: 'player',
    label: 'PLAYER',
  },
];

export default function RecordsTable() {
  return (
    <Table aria-label="Latest world records" fullWidth>
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={rows}>
        {(item) => (
          <TableRow key={item.key}>
            <TableCell>
              <span style={{ color: getDateDifferenceColor(item.date) }}>{toAgo(item.date)}</span>
            </TableCell>
            <TableCell>
              <Link href={`/campaigns/${item.game}`} color="foreground" underline="hover">
                {item.game}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/tracks/${item.track}`} color="foreground" underline="hover">
                {item.track}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/times/${item.time}`} color="foreground" underline="hover">
                {item.time}
              </Link>
            </TableCell>
            <TableCell>{item.delta}</TableCell>
            <TableCell>
              <span className={`fi fi-${item.nation} mr-2`}></span>
              <PlayerPopover>
                <Link href={`/players/${item.player}`} color="foreground" underline="hover">
                  {item.player}
                </Link>
              </PlayerPopover>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
