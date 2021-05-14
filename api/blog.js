module.exports = async (req, res) => {
    const { username = '' } = req.query
    const { Octokit } = require("@octokit/rest");
    const { join } = require('path');
    const nunjucks = require('nunjucks');
    
    const template = join(__dirname, 'templates');

    const octokit = new Octokit();

    var gists = await octokit.gists.listForUser({
      username
    });

    var mdFiles = gists.data.filter(function (e) {
      var file = e.files[Object.keys(e.files)[0]]
      var filename = file.filename.split('.')
      return file.language == "Markdown" && filename[filename.length - 2].endsWith("_post");
    });

    res.send(mdFiles)
}