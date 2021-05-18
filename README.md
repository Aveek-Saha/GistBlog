<h1 align="center">
  Gist Blog 📃
</h1>
<h3 align="center"> Turn your Gists into blog posts. </h3>

[Gist Blog](https://gistblog.vercel.app/) is a platform that transforms your GitHub Gists into blog posts. This project was heavily inspired by Gist.io, but Gist Blog comes with a few extra perks.

### Why Gist Blog?
Gist Blog is for posts that don't belong on your usual blog, maybe because it doesn't fit the theme or maybe because you want to reach a different audience than the people that usually read your blog.

# Usage

## Create a blog post
1. Create a [GitHub Gist](https://gist.github.com/) in Markdown. Make sure the file name ends with _post.md
1. Replace the URL: <br>
    `gist.github.com/{username}/`*{gist-id}* with <br>
    `gistblog.vercel.app/post/`*{gist-id}*
1. Your blog post is ready!

## List all posts on your profile:
1. Create multiple posts using the instructions above
1. Go to: `gistblog.vercel.app/`*{username}*
1. Your blog is ready!

# Features
* Turn any GitHub Gist into a blog post.
* Have a place to list all your gist blog posts
* Switch between dark/light mode
* Render markdown into HTML. Supports markdown tables and more
* Add a title and description to you blog using YAML metadata

# Development
To run locally for development, fork the project, install the Vercel CLI

```
npm i -g vercel
cd GistBlog
vercel dev
```

Then go to `localhost:3000` to see the sit up and running
 
### Note:
For listing all posts on your profile, the content of each post has to be retreived. This is why only 5 posts are shown per page and even then the page might take 3~4 seconds to load.


