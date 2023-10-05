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
    player: 'Eddiel33t',
    nation: {
      code: 'se',
      name: 'Sweden',
    },
    rank: 1,
    count: 1,
  },
  {
    key: '2',
    player: 'ShcrTm',
    nation: {
      code: 'fr',
      name: 'France',
    },
    rank: 1,
    count: 1,
  },
  {
    key: '3',
    player: 'SUSBIT',
    nation: {
      code: 'de',
      name: 'Germany',
    },
    rank: 1,
    count: 1,
  },
];

const columns = [
  {
    key: 'rank',
    label: 'RANK',
  },
  {
    key: 'player',
    label: 'PLAYER',
  },
  {
    key: 'count',
    label: 'RECORDS',
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

const types = [
  {
    label: 'Current Records',
    value: 'current',
  },
  {
    label: 'Unique Records',
    value: 'unique',
  },
  {
    label: 'Total Records',
    value: 'total',
  },
];

export default function RankingsTable() {
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;

  const pages = Math.ceil(rows.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return rows.slice(start, end);
  }, [page, rows]);

  const [game, setGame] = React.useState(new Set<string>(['tm']));
  const [type, setType] = React.useState(new Set<string>(['current']));

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
          onSelectionChange={(keys) => (keys as Set<string>).size && setGame(keys as Set<string>)}
        >
          {games.map((game) => (
            <SelectItem key={game.value} value={game.value}>
              {game.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          label="Type"
          className="max-w-xs"
          labelPlacement="inside"
          size="sm"
          disableAnimation
          selectedKeys={type}
          onSelectionChange={(keys) => (keys as Set<string>).size && setType(keys as Set<string>)}
        >
          {types.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      <Table
        aria-label="Rankings"
        className="mt-4"
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
        <TableHeader>
          <TableColumn key="rank">RANK</TableColumn>
          <TableColumn key="player">PLAYER</TableColumn>
          <TableColumn key="records">RECORDS</TableColumn>
        </TableHeader>
        <TableBody items={items}>
          {(item) => (
            <TableRow key={item.key}>
              <TableCell>{item.rank}</TableCell>
              <TableCell>
                <span className={`fi fi-${item.nation.code} mr-2`} title={item.nation.name}></span>
                <Link href={`/players/${item.player}`} color="foreground" underline="hover">
                  {item.player}
                </Link>
              </TableCell>
              <TableCell>{item.count}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
