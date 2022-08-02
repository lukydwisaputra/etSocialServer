const { dbQuery, dbConfig } = require("../config/database");
const objectFilter = require("../helper/objectFilter");
const { hashPassword } = require("../config/encrypt");

module.exports = {
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
					res.status(400).send({
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
					res.status(400).send({
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
	add: async (req, res) => {
		try {
			let { username, email, password } = req.body;
			await dbQuery(`
            INSERT INTO users (username, email, password, name, profile_picture) VALUES
                (${dbConfig.escape(username)}, 
                ${dbConfig.escape(email)},
                ${dbConfig.escape(hashPassword(password))}, 
                ${dbConfig.escape(username)},
                "https://avatars.dicebear.com/api/identicon/${username}.svg");
            `);

			res.status(200).send({
				success: true,
				message: "New user has been submited ✅",
			});
		} catch (error) {
			console.log(error);
			res.status(500).send({
				success: false,
				message: error,
			});
		}
	},
	update: async (req, res) => {
		try {
			let id = req.params.id;
			let users = await dbQuery(`SELECT * FROM users WHERE id = ${dbConfig.escape(id)};`);
			if (users.length > 0) {
				let prop = Object.keys(req.body);
				let value = Object.values(req.body);

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
			} else {
				res.status(200).send({
					success: false,
					message: `No users with id ${req.params.id}`,
				});
			}
		} catch (error) {
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
};
