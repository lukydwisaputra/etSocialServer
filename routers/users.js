const express = require('express')
const route = express.Router()
const { get, login, register, updateProfile, remove, keepLogin, verifyUser, resendVerification, passwordRecovery } = require('../controllers/users')
const { verifyToken } = require('../config/encrypt')
const { profileUploader } = require('../config/upload')

const uploadProfile = profileUploader('/profile', 'profile').array('profile_picture', 1)

route.get('/', get)
route.get('/verification', verifyToken, verifyUser)
route.get('/recovery', verifyToken, passwordRecovery)
route.get('/keep', verifyToken, keepLogin)

route.post('/login', login)
route.post('/register', register)
route.post('/resend', resendVerification)

route.patch('/:id', verifyToken, uploadProfile, updateProfile)

route.delete('/:id', remove)

module.exports = route
