const { dbQuery, dbConfig } = require("../config/database");
const objectFilter = require("../helper/objectFilter");

module.exports = {
	get: async (req, res) => {
		try {
			let news = await dbQuery("SELECT * FROM news;");

			let isSorting = Object.keys(req.query).length > 0;
			let sortedNews = objectFilter(req.query, news);

			if (isSorting) {
				if (sortedNews.length > 0) {
					res.status(200).send({
						success: true,
						news: sortedNews,
					});
				} else {
					res.status(400).send({
						success: false,
						message: "News not found",
					});
				}
			} else {
				if (news.length > 0) {
					res.status(200).send({
						success: true,
						news,
					});
				} else {
					res.status(400).send({
						success: false,
						message: "News not found",
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
			let { title, category, author, media, url } = req.body;
			await dbQuery(`
				INSERT INTO news (title, category, author, media, url) VALUES
				(${dbConfig.escape(title)},
				${dbConfig.escape(category)},
				${dbConfig.escape(author)},
				${dbConfig.escape(media)},
				${dbConfig.escape(url)});
			`);

			res.status(200).send({
				success: true,
				message: "News has been submited ✅",
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
			let news = await dbQuery(`SELECT * FROM news WHERE id = ${dbConfig.escape(id)};`);
			if (news.length > 0) {
				let prop = Object.keys(req.body);
				let value = Object.values(req.body);

				let data = prop
					.map((val, idx) => {
						return `${prop[idx]} = ${dbConfig.escape(value[idx])}`;
					})
					.join(",");

				await dbQuery(`UPDATE news SET ${data} WHERE id = ${dbConfig.escape(id)}`);

				news = await dbQuery(`SELECT * FROM news WHERE id = ${dbConfig.escape(id)};`);
				res.status(200).send({
					success: true,
					message: "News has been updated ✅",
					news,
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No news with id ${req.params.id}`,
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
			let news = await dbQuery(`SELECT * FROM news WHERE id = ${dbConfig.escape(id)};`);
			if (news.length > 0) {
				await dbQuery(`
					DELETE FROM news WHERE id = ${dbConfig.escape(id)};
				`);
				res.status(200).send({
					success: true,
					message: "News has been deleted ✅",
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No news with id ${id}`,
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
