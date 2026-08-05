<h1 align="center">
  Gist Blog 📃
</h1>
<h3 align="center"> Turn your Gists into blog posts. </h3>

[Gist Blog](https://gistblog.vercel.app/) is a platform that transforms your GitHub Gists into blog posts. This project was heavily inspired by Gist.io, but Gist Blog comes with a few extra perks.

### Why Gist Blog?
Gist Blog is for posts that don't belong on your usual blog, maybe because it doesn't fit the theme or maybe because you want to reach a different audience than the people that usually read your blog.

# Usage

## Create a blog post
1. Create a public [GitHub Gist](https://gist.github.com/) with a Markdown file whose name ends in `_post.md`.
1. Replace the URL: <br>
    `gist.github.com/{username}/`*{gist-id}* with <br>
    `gistblog.vercel.app/post/`*{gist-id}*
1. Your blog post is ready!

## Blog:
List all posts on your profile
1. Create multiple posts using the instructions above
1. Go to: `gistblog.vercel.app/`*{username}*
1. Your blog is ready!

## *Metadata
You can add metadata to your post in the form of yaml at the top of your markdown file. The syntax for metadata is as follows

```
---
title: A very interesting and unique blog title
description: An even more interesting and unique description that provides more info about the post
---
```

Supported fields are `title`, `description`, `tags`, `date`, `canonical`, `image`, and `draft`. A title is optional; the filename is used as a fallback. Set `draft: true` to keep a gist out of public pages and feeds.

# Features
* Turn any GitHub Gist into a blog post.
* Have a place to list all your gist blog posts
* Switch between dark/light mode
* Render GitHub-flavored Markdown, syntax highlighting, math, images, and heading links
* Search and filter an author's posts by title, description, and tag
* Navigate between posts with a table of contents, reading progress, and previous/next links
* Publish RSS and Atom feeds, canonical metadata, social cards, and raw Markdown exports
* Generate frontmatter and use a bookmarklet to open any gist in GistBlog
* Copy code blocks and share articles from the reader

# Development
To run locally, install the dependencies and start Next.js:

```
npm install
npm run dev
```

Then go to `localhost:3000`.

For a higher GitHub API allowance, copy `.env.example` to `.env.local` and set
`GITHUB_TOKEN` to a server-side token. Never expose this value through a
`NEXT_PUBLIC_` variable.

Before submitting changes, run:

```
npm test
npm run typecheck
npm run build
npm run test:e2e
```

The browser suite runs Chromium at desktop and mobile viewports and includes automated accessibility checks. Install its browser once with `npx playwright install chromium`.
