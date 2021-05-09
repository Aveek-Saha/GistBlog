module.exports = async (req, res) => {
    const { id = '' } = req.query
    const { Octokit } = require("@octokit/rest");
    var MarkdownIt = require('markdown-it'),
    
    const octokit = new Octokit();
    const md = new MarkdownIt();

    var gist = await octokit.gists.get({ gist_id: id });
    var markdown = gist.data.files[Object.keys(gist.data.files)[0]].content
    var result = md.render(markdown);

    res.send(result)
}