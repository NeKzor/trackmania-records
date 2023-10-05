// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

'use client';

import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@nextui-org/table';
import { Pagination } from '@nextui-org/pagination';
import { getDateDifferenceColor, toAgo } from '@/utils/format';
import { Link } from '@nextui-org/link';

import '/node_modules/flag-icons/css/flag-icons.min.css';
import React from 'react';
import { Select, SelectItem } from '@nextui-org/select';

const rows = [
  {
    key: '1',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-04T21:42:00+00:00',
    time: 22.672,
    delta: -0.006,
    player: 'Eddiel33t',
    nation: {
      code: 'se',
      name: 'Sweden',
    },
  },
  {
    key: '2',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-03T21:42:00+00:00',
    time: 22.678,
    delta: -0.024,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
  },
  {
    key: '3',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-02T21:42:00+00:00',
    time: 22.702,
    delta: -0.033,
    player: 'SUSBIT',
    nation: {
      code: 'de',
      name: 'Germany',
    },
  },
  {
    key: '4',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
  },
  {
    key: '5',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
  },
  {
    key: '6',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
  },
  {
    key: '7',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
  },
  {
    key: '8',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
  },
  {
    key: '9',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
  },
  {
    key: '10',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
  },
  {
    key: '11',
    game: 'Trackmania',
    track: 'Fall 2023 - 01',
    date: '2023-10-01T21:42:00+00:00',
    time: 22.735,
    delta: -0.049,
    player: 'ShcrTM',
    nation: {
      code: 'fr',
      name: 'France',
    },
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

const games = [
  {
    label: 'Trackmania',
    value: 'tm',
  },
  {
    label: 'Trackmania 2',
    value: 'tm2',
  },
  {
    label: 'Trackmania Wii',
    value: 'tmwii',
  },
  {
    label: 'Nations Forever',
    value: 'tmnf',
  },
  {
    label: 'United Forever',
    value: 'tmuf',
  },
  {
    label: 'Nations ESWC',
    value: 'tmeswc',
  },
];

const tracks = [
  {
    label: 'Fall 2023 - 01',
    value: 'fall-2023-01',
  },
  {
    label: 'Fall 2023 - 02',
    value: 'fall-2023-02',
  },
  {
    label: 'Fall 2023 - 03',
    value: 'fall-2023-03',
  },
  {
    label: 'Fall 2023 - 04',
    value: 'fall-2023-04',
  },
  {
    label: 'Fall 2023 - 05',
    value: 'fall-2023-05',
  },
  {
    label: 'Fall 2023 - 06',
    value: 'fall-2023-06',
  },
  {
    label: 'Fall 2023 - 07',
    value: 'fall-2023-07',
  },
  {
    label: 'Fall 2023 - 08',
    value: 'fall-2023-08',
  },
  {
    label: 'Fall 2023 - 09',
    value: 'fall-2023-09',
  },
  {
    label: 'Fall 2023 - 10',
    value: 'fall-2023-10',
  },
];

export default function ChangelogTable() {
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;

  const pages = Math.ceil(rows.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return rows.slice(start, end);
  }, [page, rows]);

  const [game, setGame] = React.useState(new Set<string>());
  const [track, setTrack] = React.useState(new Set<string>());

  return (
    <>
      <div className="w-full flex gap-4">
        <Select
          label="Game"
          className="max-w-xs"
          labelPlacement="inside"
          size="sm"
          disableAnimation
          selectedKeys={game}
          onSelectionChange={(keys) => setGame(keys as Set<string>)}
        >
          {games.map((game) => (
            <SelectItem key={game.value} value={game.value}>
              {game.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          label="Track"
          className="max-w-xs"
          labelPlacement="inside"
          size="sm"
          disableAnimation
          selectedKeys={track}
          onSelectionChange={(keys) => setTrack(keys as Set<string>)}
        >
          {tracks.map((track) => (
            <SelectItem key={track.value} value={track.value}>
              {track.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      <Table
        aria-label="Changelog"
        fullWidth
        className="mt-4"
        classNames={{
          table: 'min-h-[500px]',
          td: 'align-top',
        }}
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={pages}
              onChange={(page) => setPage(page)}
            />
          </div>
        }
      >
        <TableHeader columns={columns}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody items={items}>
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
                <span className={`fi fi-${item.nation.code} mr-4`} title={item.nation.name}></span>
                <Link href={`/players/${item.player}`} color="foreground" underline="hover">
                  {item.player}
                </Link>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
