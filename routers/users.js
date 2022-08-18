const express = require('express')
const route = express.Router()
const { get, login, register, updateProfile, remove, keepLogin, verifyUser, resendVerification, sendResetPassword, updatePassword } = require('../controllers/users')
const { verifyToken } = require('../config/encrypt')
const { profileUploader } = require('../config/upload')

const uploadProfile = profileUploader('/profile', 'profile').array('profile_picture', 1)

route.get('/', get)
route.get('/verification', verifyToken, verifyUser)
route.get('/keep', verifyToken, keepLogin)

route.post('/login', login)
route.post('/register', register)
route.post('/resend', resendVerification)
route.post('/recovery', sendResetPassword)

route.patch('/:id', verifyToken, uploadProfile, updateProfile)
route.patch('/reset/password', verifyToken, updatePassword)

route.delete('/:id', remove)

module.exports = route
