// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import React from 'react';
import { Card, CardFooter, CardHeader } from '@nextui-org/card';
import { Popover, PopoverContent, PopoverTrigger } from '@nextui-org/popover';

export default function PlayerPopover({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover showArrow placement="top" isOpen={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-1" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
        <Card shadow="none" className="max-w-[300px] border-none bg-transparent">
          <CardHeader className="justify-between">
            <div className="flex gap-3">
              <div className="flex flex-col items-start justify-center">
                <h4 className="text-small font-semibold leading-none text-default-600">Eddiel33t</h4>
              </div>
            </div>
          </CardHeader>
          <CardFooter className="gap-3">
            <div className="flex gap-1">
              <p className="font-semibold text-default-600 text-small">1</p>
              <p className=" text-default-500 text-small">Current WRs</p>
            </div>
            <div className="flex gap-1">
              <p className="font-semibold text-default-600 text-small">2</p>
              <p className="text-default-500 text-small">Unique Wrs</p>
            </div>
            <div className="flex gap-1">
              <p className="font-semibold text-default-600 text-small">2</p>
              <p className="text-default-500 text-small">Total Wrs</p>
            </div>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
