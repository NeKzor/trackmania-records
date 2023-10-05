// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';

export interface BlogPost {
  id: number;
  date: string;
  author: string;
  text: string;
}

export default function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Card className="max-w-[700px]">
      <CardHeader className="flex gap-3 ml-2">
        <div className="flex flex-col">
          <p className="text-md">{post.date}</p>
          <p className="text-small text-default-500">{post.author}</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="whitespace-pre-wrap">
        <p>{post.text}</p>
      </CardBody>
    </Card>
  );
}
