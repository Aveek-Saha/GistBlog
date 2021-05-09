module.exports = (req, res) => {
    const { id = 'World' } = req.query

    var MarkdownIt = require('markdown-it'),
    md = new MarkdownIt();
    var result = md.render('# markdown-it rulezz!');

    res.send(result)
}