module.exports = async (req, res) => {
    const { id = "" } = req.query;
    const { Octokit } = require("@octokit/rest");
    const { join } = require("path");
    const MarkdownIt = require("markdown-it");
    const nunjucks = require("nunjucks");
    const hljs = require("highlight.js");
    const meta = require("markdown-it-meta");

    const template = join(__dirname, "templates");

    const octokit = new Octokit();
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(str, { language: lang }).value;
                } catch (__) {}
            }

            return ""; // use external default escaping
        }
    });
    md.use(meta);
    nunjucks.configure(template, {
        autoescape: false
    });

    var gist = await octokit.gists.get({ gist_id: id });
    var markdown = gist.data.files[Object.keys(gist.data.files)[0]].content;
    var result = md.render(markdown);

    var description = "A Gist Blog post";
    var title = "Gist Blog";
    if (md.meta.description) description = md.meta.description;
    if (md.meta.title) title = md.meta.title;

    var html = nunjucks.render("post.html", {
        owner: gist.data.owner,
        url: gist.data.html_url,
        id: gist.data.id,
        description: description,
        title: title,
        content: result
    });

    res.send(html);
};
