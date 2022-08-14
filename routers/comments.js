const express = require('express')
const route = express.Router()
const { get, add, update, remove, removeByPostId } = require('../controllers/comments')
const { verifyToken } = require('../config/encrypt')

route.get('/', get)
route.post('/', add)
route.patch('/:id', update)
route.delete('/:id', remove)
route.delete('/id_post/:id', removeByPostId)

module.exports = route
