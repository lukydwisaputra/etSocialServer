const { dbQuery, dbConfig } = require("../config/database");
const objectFilter = require("../helper/objectFilter");
const { hashPassword, createToken } = require("../config/encrypt");
const { transporter } = require('../config/nodemailer');
const hbs = require('nodemailer-express-handlebars');
const fs = require("fs");
const path = require("path");

module.exports = {
	register: async (req, res) => {
		let { username, email, password } = req.body;
		try {
			let addUser = await dbQuery(`
            INSERT INTO users (username, email, password, name, profile_picture) VALUES
                (${dbConfig.escape(username)}, 
                ${dbConfig.escape(email)},
                ${dbConfig.escape(hashPassword(password))}, 
                ${dbConfig.escape(username)},
                "https://avatars.dicebear.com/api/identicon/${username}.svg");
            `);

			if (addUser.insertId) {
				let users = await dbQuery(`
				SELECT * FROM users u WHERE u.email = ${dbConfig.escape(email)}
				AND u.password = ${dbConfig.escape(hashPassword(password))}`)
				delete users[0].password;

				let token = createToken({...users[0]})

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
					from :'étSocial | Social Media',
					to : email,
					subject : 'Email verification',
					template: 'email',
					context: {
						landingPage: 'http://localhost:3000',
						username: username,
						verificationLink: `http://localhost:3000/home/${token}`
					}
				}

				transporter.sendMail(mailOptions, async (error, info) => {
					if (error) {
						console.log(error);
						await dbQuery(`DELETE FROM users u WHERE u.email = ${dbConfig.escape(email)};`);
						return 
					} 
					console.log(`Verification email sent to ${email} ✅ \nInfo: ${info.response}`);

					res.status(200).send({
						success: true,
						message: `User registered✅`,
					});
				})


				
			}
		} catch (error) {
			console.log(error);
			res.status(500).send({
				success: false,
				message: error,
			});
		}
	},
	login: async (req, res) => {
		try {
			let { credentials, password } = req.body;
			credentials = credentials.toLowerCase();
			
			let isEmail = credentials.includes("@") && credentials.includes(".");

			if (isEmail) {
				let users = await dbQuery(`
					SELECT * FROM users u WHERE u.email = ${dbConfig.escape(credentials)}
					AND u.password = ${dbConfig.escape(hashPassword(password))}
				`)
				delete users[0].password;

				if (users.length > 0) {
					res.status(200).send({
						success: true,
						message: `User login sucess ✅`,
						users: users[0],
						token: createToken({...users[0]})
					});
				} else {
					res.status(401).send({
						success: false,
						message: `User login denied`,
					});
				}
			} else {
				let users = await dbQuery(`
					SELECT * FROM users u WHERE u.username = ${dbConfig.escape(credentials)}
					AND u.password = ${dbConfig.escape(hashPassword(password))}
				`)
				delete users[0].password;

				if (users.length > 0) {
					res.status(200).send({
						success: true,
						message: `User login sucess ✅`,
						users: users[0],
						token: createToken({...users[0]})
					});
				} else {
					res.status(401).send({
						success: false,
						message: `User login denied`,
					});
				}
			}
		} catch (error) {
			console.log(error);
			res.status(500).send({
				success: false,
				message: error,
			});
		}
	},
	keepLogin: async (req, res) => {
		try {
			console.log(req.dataToken)
			let users = await dbQuery(`
				SELECT * FROM users u WHERE u.id = ${dbConfig.escape(req.dataToken.id)}
			`)
			delete users[0].password;

			if (users.length > 0) {
				res.status(200).send({
					success: true,
					message: `Refresh token success ✅`,
					users: users[0],
					token: createToken({...users[0]})
				});
			} else {
				res.status(200).send({
					success: false,
					message: `User login denied`,
				});
			}
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			});
		}
	},
	updateProfile: async (req, res) => {
		const profile_picture = req.files[0]?.path ? req.files[0]?.path : "";
		const id = req.params.id;
		const isAuthorized = req.dataToken.id == id;

		try {
			if (!isAuthorized) {
				res.status(401).send({
					success: false,
					message: `Forbidden activity!`,
				});
				return
			} 
			
			let users = await dbQuery(`SELECT * FROM users WHERE id = ${dbConfig.escape(id)};`);
			req.body = profile_picture ? {...req.body, profile_picture} : req.body;

			if (users.length === 0) {
				res.status(200).send({
					success: false,
					message: `No users with id ${req.params.id}`,
				});
				return;
			} 
			// delete previous profile picture of this user 
			if (fs.existsSync(users[0].profile_picture) && profile_picture) {
				fs.unlinkSync(users[0].profile_picture);
			}

			let prop = Object.keys(req.body);
			let value = Object.values(req.body);
			
			// dynamic update
			let data = prop
				.map((val, idx) => {
					return `${prop[idx]} = ${dbConfig.escape(value[idx])}`;
				})
				.join(",");

			await dbQuery(`UPDATE users SET ${data} WHERE id = ${dbConfig.escape(id)}`);

			users = await dbQuery(`SELECT * FROM users WHERE id = ${dbConfig.escape(id)};`);
			res.status(200).send({
				success: true,
				message: "User has been updated ✅",
				users,
			});
		} catch (error) {
			fs.unlinkSync(profile_picture);
			res.status(500).send({
				success: false,
				message: error,
			});
		}
	},
	remove: async (req, res) => {
		try {
			let id = req.params.id;
			let users = await dbQuery(`SELECT * FROM users WHERE id = ${dbConfig.escape(id)};`);
			if (users.length > 0) {
				await dbQuery(`
					DELETE FROM users WHERE id = ${dbConfig.escape(id)};
				`);
				res.status(200).send({
					success: true,
					message: "User has been deleted ✅",
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No users with id ${id}`,
				});
			}
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			});
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
                FROM users u;`);

			let isSorting = Object.keys(req.query).length > 0;
			let sortedUsers = objectFilter(req.query, users);

			if (isSorting) {
				if (sortedUsers.length > 0) {
					res.status(200).send({
						success: true,
						users: sortedUsers,
					});
				} else {
					res.status(200).send({
						success: false,
						message: "Users not found",
					});
				}
			} else {
				if (users.length > 0) {
					res.status(200).send({
						success: true,
						users,
					});
				} else {
					res.status(200).send({
						success: false,
						message: "Users not found",
					});
				}
			}
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			});
		}
	},
	verify: async (req, res) => {

	}
};
