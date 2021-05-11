module.exports = async (req, res) => {
    const { id = '' } = req.query
    const { Octokit } = require("@octokit/rest");
    var MarkdownIt = require('markdown-it');
    var nunjucks = require('nunjucks');
    var hljs = require('highlight.js');
    
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
        
            return ''; // use external default escaping
          }
      });
    nunjucks.configure( './templates', {
        autoescape: false
    } ) ;

    var gist = await octokit.gists.get({ gist_id: id });
    var markdown = gist.data.files[Object.keys(gist.data.files)[0]].content
    var result = md.render(markdown);

    var html = nunjucks.render('layout.njk', { username: 'James', content: result });

    res.send(html)
}