// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

'use client';

import { Card, CardBody, CardFooter } from '@nextui-org/card';
import { Image } from '@nextui-org/image';
import Link from 'next/link';

const list = [
  {
    title: 'Trackmania',
    url: 'tm',
    img: '/img/trackmania.jpg',
    recordCount: 100_000,
  },
  {
    title: 'Trackmania 2',
    url: 'tm2',
    img: '/img/tm2_stadium.jpg',
    recordCount: 10_000,
  },
  {
    title: 'Trackmania Wii',
    url: 'tmwii',
    img: '/img/trackmania_wii.png',
    recordCount: 10_000,
  },
  {
    title: 'Nations Forever',
    url: 'tmnf',
    img: '/img/nations_forever.jpg',
    recordCount: 10_000,
  },
  {
    title: 'United Forever',
    url: 'tmuf',
    img: '/img/united_forever.jpg',
    recordCount: 10_000,
  },
  {
    title: 'Nations ESWC',
    url: 'tmeswc',
    img: '/img/nations_eswc.webp',
    recordCount: 10_000,
  },
];

export default function CampaignCards() {
  return (
    <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 mt-8">
      {list.map((item, index) => (
        <Card
          shadow="sm"
          key={index}
          isPressable
          onPress={() => console.log('item pressed')}
          as={Link}
          href={`/campaigns/${item.url}`}
        >
          <CardBody className="overflow-visible p-0">
            <Image
              isZoomed
              shadow="sm"
              radius="lg"
              width="100%"
              alt={item.title}
              className="w-full object-cover h-[140px] w-[540px]"
              src={item.img}
            />
          </CardBody>
          <CardFooter className="text-small justify-between">
            <b>{item.title}</b>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
