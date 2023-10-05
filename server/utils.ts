// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import { join } from 'path/mod.ts';

export const Storage = {
  Replays: Deno.realPathSync(Deno.env.get('TMR_REPLAYS_FOLDER')!),
  Files: Deno.realPathSync(Deno.env.get('TMR_FILES_FOLDER')!),
};

export const getReplaysFilePath = (filename: string) => join(Storage.Replays, filename);
export const getStorageFilePath = (filename: string) => join(Storage.Files, filename);

export const encodeUrlForm = (data: Record<string, string>) =>
  Object
    .entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
