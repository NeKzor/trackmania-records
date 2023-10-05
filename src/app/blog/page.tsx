// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import BlogPostCard, { BlogPost } from "@/components/blog-post-card";
import { title } from "@/components/primitives";
import { Metadata } from "next";

const posts: BlogPost[] = [
  {
	id: 4,
    date: "Oct. 2023",
    author: "NeKz",
    text: "• The site has been redesigned! Feel free to give feedback on GitHub.\n• Removed replay inspection and Trackmania competitions.",
  },
  {
	id: 3,
    date: "Jul. 2022",
    author: "NeKz",
    text: "• Removed duration statistics from Trackmania player rankings.\n• Enabled Nations ESWC updates, history and statistics.",
  },
  {
	id: 2,
    date: "Feb. 2022",
    author: "NeKz",
    text: "• Added support for new tmx-exchange.com website!\n• Updates for Nations ESWC are still paused at the moment.	",
  },
  {
	id: 1,
    date: "Nov. 2021",
    author: "NeKz",
    text: "User Authentication via Ubisoft/Maniaplanet!! Right now it's probably useless for everyone since nobody has access to any features. Download button to public replays has been removed for older records because they might not be available anymore. Instead we provide backups from our servers. This service requires permission!",
  },
];

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest Updates',
};

export default function BlogPage() {
  return (
    <div>
      <div className="text-center">
        <h1 className={title()}>Latest Updates</h1>
      </div>
      <div className="grid grid-cols-1 gap-8 mt-8">
        {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}
