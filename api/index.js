module.exports = async (req, res) => {
    const { id = '' } = req.query
    const { Octokit } = require("@octokit/rest");
    var MarkdownIt = require('markdown-it');
    var nunjucks = require('nunjucks');
    
    const octokit = new Octokit();
    const md = new MarkdownIt();
    nunjucks.configure( 'templates', {
        autoescape: true
    } ) ;

    var gist = await octokit.gists.get({ gist_id: id });
    var markdown = gist.data.files[Object.keys(gist.data.files)[0]].content
    var result = md.render(markdown);

    var html = nunjucks.render('index.njk', { username: 'James' });

    res.send(html)
}