const express = require('express')
const route = express.Router()
const { get, add, update, remove } = require('../controllers/articles')

route.get('/', get)
route.post('/', add)
route.patch('/:id', update)
route.delete('/:id', remove)

module.exports = route
