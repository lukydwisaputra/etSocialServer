require('dotenv').config()
const Crypto = require('crypto')
const jwt = require('jsonwebtoken')

module.exports = {
	hashPassword: (pass) => {
		return Crypto.createHmac(process.env.ENCRYPTION_ALGORITHM, process.env.ENCRYPTION_KEY)
			.update(pass)
			.digest(process.env.ENCRYPTION_OUTPUT)
	},
	createToken: (payload) => {
		return jwt.sign(payload, process.env.JWT_SECRETS, { expiresIn: '1h' })
	},
	verifyToken: (req, res, next) => {
		jwt.verify(req.token, process.env.JWT_SECRETS, (err, decode) => {
			if (err) {
				return res.status(200).send({
					success: false,
					message: 'Unauthorized request ❌',
				})
			}
			req.dataToken = decode
			next()
		})
	},
}
