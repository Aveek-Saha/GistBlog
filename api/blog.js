module.exports = async (req, res) => {
    const { username = '', page = 1 } = req.query
    const { Octokit } = require("@octokit/rest");
    const { join } = require('path');
    const nunjucks = require('nunjucks');
    const { load } = require('js-yaml')
    
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

    mdFiles.sort((a, b) => {
      var dateA = new Date(a.created_at)
      var dateB = new Date(b.created_at)
      return dateA > dateB
    });

    var ids = []

    mdFiles.forEach(file => {
      ids.push(file.id)
    });

    var page_ids = ids.slice((page-1)*5, page*5)

    const findMetadataIndices = (mem, item, i) => {
      if (/^---/.test(item)) {
        mem.push(i)
      }
      return mem
    }

    const parseMetadata = ({ lines, metadataIndices }) => {
      if (metadataIndices.length > 0) {
        let metadata = lines.slice(metadataIndices[0] + 1, metadataIndices[1])
        return load(metadata.join('\n'))
      }
      return {}
    }

    const parseMD = contents => {
      const lines = contents.split('\n')
      const metadataIndices = lines.reduce(findMetadataIndices, [])
      const metadata = parseMetadata({ lines, metadataIndices })
      return metadata
    }

    var meta = []

    for (const id of page_ids) {
      var gist = await octokit.gists.get({ gist_id: id });
      var markdown = gist.data.files[Object.keys(gist.data.files)[0]].content
      meta.push(parseMD(markdown))
    }

    res.send(meta)
}