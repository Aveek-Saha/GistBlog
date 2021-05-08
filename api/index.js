module.exports = (req, res) => {
    const { id = 'World' } = req.query
    res.send(`<h1>Hello ${id}!</h1>`)
}