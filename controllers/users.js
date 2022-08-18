const { dbQuery, dbConfig } = require('../config/database')
const objectFilter = require('../helper/objectFilter')
const { hashPassword, createToken } = require('../config/encrypt')
const { transporter } = require('../config/nodemailer')
const hbs = require('nodemailer-express-handlebars')
const fs = require('fs')
const path = require('path')

const HOST = 'http://localhost:3000'

module.exports = {
	register: async (req, res) => {
		let { username, email, password } = req.body
		try {
			let addUser = await dbQuery(`
            INSERT INTO users (username, email, password, name, profile_picture) VALUES
                (${dbConfig.escape(username)}, 
                ${dbConfig.escape(email)},
                ${dbConfig.escape(hashPassword(password))}, 
                '•',
                "https://avatars.dicebear.com/api/identicon/${username}.svg");
            `)

			if (addUser.insertId) {
				let users = await dbQuery(`
				SELECT * FROM users u WHERE u.email = ${dbConfig.escape(email)}
				AND u.password = ${dbConfig.escape(hashPassword(password))}`)
				delete users[0].password

				let token = createToken({ ...users[0] })

				const handlebarOptions = {
					viewEngine: {
						extName: '.handlebars',
						partialsDir: path.resolve('./template'),
						defaultLayout: false,
					},
					viewPath: path.resolve('./template'),
					extName: '.handlebars',
				}

				transporter.use('compile', hbs(handlebarOptions))

				let mailOptions = {
					from: 'étSocial | Social Media',
					to: email,
					subject: 'Email verification',
					template: 'email',
					context: {
						landingPage: HOST,
						username: username,
						verificationLink: `${HOST}/verification/${token}`,
					},
				}

				// transporter.use('compile', hbs(handlebarOptions))

				transporter.sendMail(mailOptions, async (error, info) => {
					if (error) {
						console.log(error)
						await dbQuery(
							`DELETE FROM users u WHERE u.email = ${dbConfig.escape(email)};`
						)
						return
					}
					res.status(200).send({
						success: true,
						message: 'User registered ✅',
						token,
					})
					console.log(`Verification email sent ✅ \nInfo: ${info.response}`)
				})
			}
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	login: async (req, res) => {
		try {
			let { credentials, password } = req.body
			credentials = credentials.toLowerCase()

			let isEmail = credentials.includes('@') && credentials.includes('.')

			if (isEmail) {
				let users = await dbQuery(`
					SELECT * FROM users u WHERE u.email = ${dbConfig.escape(credentials)}
					AND u.password = ${dbConfig.escape(hashPassword(password))}
				`)
				delete users[0].password

				if (users.length > 0) {
					res.status(200).send({
						success: true,
						message: `User login sucess ✅`,
						users: users[0],
						token: createToken({ ...users[0] }),
					})
				} else {
					res.status(401).send({
						success: false,
						message: `User login denied`,
					})
				}
			} else {
				let users = await dbQuery(`
					SELECT * FROM users u WHERE u.username = ${dbConfig.escape(credentials)}
					AND u.password = ${dbConfig.escape(hashPassword(password))}
				`)
				delete users[0]?.password

				if (users.length > 0) {
					res.status(200).send({
						success: true,
						message: `User login sucess ✅`,
						users: users[0],
						token: createToken({ ...users[0] }),
					})
				} else {
					res.status(200).send({
						success: false,
						message: `User login denied`,
					})
				}
			}
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	keepLogin: async (req, res) => {
		try {
			let users = await dbQuery(`
				SELECT * FROM users u WHERE u.id = ${dbConfig.escape(req.dataToken.id)}
			`)
			delete users[0]?.password

			if (users.length > 0) {
				res.status(200).send({
					success: true,
					message: `Refresh token success ✅`,
					users: users[0],
					token: createToken({ ...users[0] }),
				})
			} else {
				res.status(200).send({
					success: false,
					message: `User login denied`,
				})
			}
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	updateProfile: async (req, res) => {

		const file = req?.files ? req?.files[0]?.path : ''
		let profile_picture
		if (file) {
			const image = file.split('/')
			image.shift()
			profile_picture = image.join('/')
		}

		const id = req.params.id
		const isAuthorized = req.dataToken.id == id

		try {
			if (!isAuthorized) {
				res.status(401).send({
					success: false,
					message: `Forbidden activity!`,
				})
				return
			}

			let form = JSON.parse(req.body.data)
			form = file ? {...form, profile_picture} : form

			let prop = Object.keys(form)
			let value = Object.values(form)

			// dynamic update
			let data = prop
				.map((val, idx) => {
					return `${prop[idx]} = ${dbConfig.escape(value[idx])}`
				})
				.join(',')
				
			await dbQuery(`UPDATE users SET ${data} WHERE id = ${id}`)

			users = await dbQuery(`SELECT * FROM users WHERE id = ${id};`)
			res.status(200).send({
				success: true,
				message: 'User has been updated ✅',
				users,
			})
		} catch (error) {
			res.status(500).send({
				success: false, 
				message: error,
			})
		}
	},
	remove: async (req, res) => {
		try {
			let id = req.params.id
			let users = await dbQuery(`SELECT * FROM users WHERE id = ${dbConfig.escape(id)};`)
			if (users.length > 0) {
				await dbQuery(`
					DELETE FROM users WHERE id = ${dbConfig.escape(id)};
				`)
				res.status(200).send({
					success: true,
					message: 'User has been deleted ✅',
				})
			} else {
				res.status(200).send({
					success: false,
					message: `No users with id ${id}`,
				})
			}
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	get: async (req, res) => {
		try {
			let users = await dbQuery(`
                SELECT 
                    u.id, 
                    u.username,
                    u.email, 
                    u.status,
                    u.name,
                    u.bio, 
                    u.profile_picture
                FROM users u;`)

			let isSorting = Object.keys(req.query).length > 0
			let sortedUsers = objectFilter(req.query, users)

			if (isSorting) {
				if (sortedUsers.length > 0) {
					res.status(200).send({
						success: true,
						users: sortedUsers,
					})
				} else {
					res.status(200).send({
						success: false,
						message: 'Users not found',
					})
				}
			} else {
				if (users.length > 0) {
					res.status(200).send({
						success: true,
						users,
					})
				} else {
					res.status(200).send({
						success: false,
						message: 'Users not found',
					})
				}
			}
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	verifyUser: async (req, res) => {
		try {
			await dbQuery(
				`UPDATE users u SET u.status = 'verified' WHERE id = ${dbConfig.escape(
					req.dataToken?.id
				)}`
			)

			let users = await dbQuery(
				`SELECT * FROM users WHERE id = ${dbConfig.escape(
					req.dataToken.id
				)} AND status = 'verified';`
			)
			delete users[0].password

			if (users.length > 0) {
				let newToken = createToken({ ...users[0] })

				res.status(200).send({
					success: true,
					message: 'User is now verified ✅',
					users,
					token: newToken,
				})
			} else {
				await dbQuery(
					`UPDATE users u SET u.status = 'unverified' WHERE id = ${dbConfig.escape(
						req.dataToken?.id
					)}`
				)
			}
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	resendVerification: async (req, res) => {
		try {
			let { email } = req.body
			let users = await dbQuery(
			`SELECT * FROM users u WHERE u.email = ${dbConfig.escape(email)};`)

			delete users[0].password

			let newToken = createToken({ ...users[0] })

			const handlebarOptions = {
				viewEngine: {
					extName: '.handlebars',
					partialsDir: path.resolve('./template'),
					defaultLayout: false,
				},
				viewPath: path.resolve('./template'),
				extName: '.handlebars',
			}

			transporter.use('compile', hbs(handlebarOptions))

			let mailOptions = {
				from: 'étSocial | Social Media',
				to: email,
				subject: 'Email verification',
				template: 'email',
				context: {
					landingPage: HOST,
					username: users[0].username,
					verificationLink: `${HOST}/verification/${newToken}`,
				},
			}
			// transporter.use('compile', hbs(handlebarOptions))

			transporter.sendMail(mailOptions, async (error, info) => {
				if (error) {
					console.log(error)
					return
				}

				res.status(200).send({
					success: true,
					message: 'Verification email sent ✅',
					token: newToken,
				})
				console.log(`Verification email sent ✅ \nInfo: ${info.response}`)
			})
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	sendResetPassword: async (req, res) => {
		try {
			let { email } = req.body
			let users = await dbQuery(
			`SELECT * FROM users u WHERE u.email = ${dbConfig.escape(email)};`)
			delete users[0].password

			let newToken = createToken({ ...users[0] })

			const handlebarOptions = {
				viewEngine: {
					extName: '.handlebars',
					partialsDir: path.resolve('./template'),
					defaultLayout: false,
				},
				viewPath: path.resolve('./template'),
				extName: '.handlebars',
			}

			transporter.use('compile', hbs(handlebarOptions))

			let mailOptions = {
				from: 'étSocial | Social Media',
				to: email,
				subject: 'Password Recovery',
				template: 'password_recovery',
				context: {
					landingPage: HOST,
					username: users[0].username,
					verificationLink: `${HOST}/recovery/${newToken}`,
				},
			}
			// transporter.use('compile', hbs(handlebarOptions))

			transporter.sendMail(mailOptions, async (error, info) => {
				if (error) {
					console.log(error)
					return
				}

				res.status(200).send({
					success: true,
					message: 'Password recovery mail sent ✅',
					token: newToken,
				})
				console.log(`Password recovery mail sent ✅ \nInfo: ${info.response}`)
			})
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	updatePassword: async (req, res) => {
		try {
			let id = req.dataToken.id
			let user = await dbQuery(`SELECT * FROM users WHERE id = ${id};`)

			if (user.length > 0) {
				let prop = Object.keys(req.body)
				let value = Object.values(req.body)

				let data = prop
				.map((val, idx) => {
					return `${prop[idx]} = ${dbConfig.escape(hashPassword(value[idx]))}`
				})
				.join(',')

			await dbQuery(`UPDATE users SET ${data} WHERE id = ${dbConfig.escape(id)};`)

				user = await dbQuery(`SELECT * FROM users WHERE id = ${dbConfig.escape(id)};`)
				delete user[0].password

				res.status(200).send({
					success: true,
					message: 'Password has been updated ✅',
					user,
				})
			} else {
				res.status(200).send({
					success: false,
					message: `No password with id ${dbConfig.escape(id)}`,
				})
			}
		} catch (error) {
			console.log(error)
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
}
