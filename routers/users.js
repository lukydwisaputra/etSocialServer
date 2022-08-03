const express = require('express');
const route = express.Router();
const { get, login, register, updateProfile, remove, keepLogin } = require('../controllers/users');
const { verifyToken } = require("../config/encrypt");
const { profileUploader } = require('../config/upload');

const uploadProfile = profileUploader('/profile', 'profile').array('profile_picture', 1);

route.get('/', get);
route.post('/keep', verifyToken, keepLogin);
route.post('/login', login);
route.post('/register', register);
route.patch('/:id', verifyToken, uploadProfile, updateProfile);
route.delete('/:id', remove);

module.exports = route;