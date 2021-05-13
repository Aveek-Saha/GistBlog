module.exports = async (req, res) => {
    const { username = '' } = req.query
    const { Octokit } = require("@octokit/rest");
    const { join } = require('path');
    const nunjucks = require('nunjucks');
    
    const template = join(__dirname, 'templates');

    const octokit = new Octokit();

    res.send(username)
}