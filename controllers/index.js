const articlesController = require('./articles');
const commentsController = require('./comments');
const likesController = require('./likes');
const newsController = require('./news');
const postsController = require('./posts');
const usersController = require('./users');
const authController = require('./auth');

module.exports = {
    articlesController,
    commentsController,
    likesController,
    newsController,
    postsController,
    usersController,
    authController
}