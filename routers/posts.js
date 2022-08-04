const express = require('express');
const route = express.Router();
const { getFeedsByPostId, add, update, remove, getFeedsByUserId } = require('../controllers/posts');
const { postUploader } = require('../config/upload');
const { verifyToken } = require("../config/encrypt");

const uploadPost = postUploader('/posts', 'posts').array('post_image', 1);

// main route -> api/posts/

route.get('/details', getFeedsByPostId); // -> query by post id -> ?id=value | use this for post details
route.get('/feeds', getFeedsByUserId); // -> query by user id -> ?id=value or ?id_user=value | use this for feeds
route.post('/', verifyToken, uploadPost, add);
route.patch('/:id', update);
route.delete('/:id', remove);

module.exports = route;