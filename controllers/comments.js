const { dbQuery, dbConfig } = require("../config/database");
const objectFilter = require("../helper/objectFilter");

module.exports = {
	get: async (req, res) => {
		try {
			let comments = await dbQuery("SELECT * FROM comments;");

			let isSorting = Object.keys(req.query).length > 0;
			let sortedComments = objectFilter(req.query, comments);

			if (isSorting) {
				if (sortedComments.length > 0) {
					res.status(200).send({
						success: true,
						comments: sortedComments,
					});
				} else {
					res.status(400).send({
						success: false,
						message: "Comments not found",
					});
				}
			} else {
				if (comments.length > 0) {
					res.status(200).send({
						success: true,
						comments,
					});
				} else {
					res.status(400).send({
						success: false,
						message: "Comments not found",
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
			let { id_user, id_post, comment } = req.body;
			await dbQuery(`
				INSERT INTO comments (id_user, id_post, comment) VALUES
				(${dbConfig.escape(id_user)},
				${dbConfig.escape(id_post)},
				${dbConfig.escape(comment)});
			`);

			res.status(200).send({
				success: true,
				message: "New comment has been submited ✅",
			});
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			});
		}
	},
	update: async (req, res) => {
		try {
			let id = req.params.id;
			let comments = await dbQuery(`SELECT * FROM comments WHERE id = ${dbConfig.escape(id)};`);
			if (comments.length > 0) {
				let prop = Object.keys(req.body);
				let value = Object.values(req.body);

				let data = prop
					.map((val, idx) => {
						return `${prop[idx]} = ${dbConfig.escape(value[idx])}`;
					})
					.join(",");

				await dbQuery(`UPDATE comments SET ${data} WHERE id = ${dbConfig.escape(id)}`);

				comments = await dbQuery(`SELECT * FROM comments WHERE id = ${dbConfig.escape(id)};`);
				res.status(200).send({
					success: true,
					message: "Comment has been updated ✅",
					comments,
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No comments with id ${req.params.id}`,
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
			let comments = await dbQuery(`SELECT * FROM comments WHERE id = ${dbConfig.escape(id)};`);
			if (comments.length > 0) {
				await dbQuery(`
					DELETE FROM comments WHERE id = ${dbConfig.escape(id)};
				`);
				res.status(200).send({
					success: true,
					message: "Comment has been deleted ✅",
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No comments with id ${id}`,
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
