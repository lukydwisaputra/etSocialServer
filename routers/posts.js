const express = require('express');
const route = express.Router();
const { get, add, update, remove, getFeeds } = require('../controllers/posts');

route.get('/', get);
route.get('/feeds', getFeeds);
route.post('/', add);
route.patch('/:id', update);
route.delete('/:id', remove);

module.exports = route;