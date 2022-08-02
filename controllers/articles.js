const { dbQuery, dbConfig } = require("../config/database");
const objectFilter = require("../helper/objectFilter");

module.exports = {
	get: async (req, res) => {
		try {
			let articles = await dbQuery("SELECT * FROM articles;");

			let isSorting = Object.keys(req.query).length > 0;
			let sortedArticles = objectFilter(req.query, articles);

			if (isSorting) {
				if (sortedArticles.length > 0) {
					res.status(200).send({
						success: true,
						articles: sortedArticles,
					});
				} else {
					res.status(400).send({
						success: false,
						message: "Articles not found",
					});
				}
			} else {
				if (articles.length > 0) {
					res.status(200).send({
						success: true,
						articles,
					});
				} else {
					res.status(400).send({
						success: false,
						message: "Articles not found",
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
			let { title, category, image, url } = req.body;
			await dbQuery(`
				INSERT INTO articles (title, category, image, url) VALUES
				(${dbConfig.escape(title)},
				${dbConfig.escape(category)},
				${dbConfig.escape(image)},
				${dbConfig.escape(url)});
			`);

			res.status(200).send({
				success: true,
				message: "New articles has been submited ✅",
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
			let articles = await dbQuery(`SELECT * FROM articles WHERE id = ${dbConfig.escape(id)};`);
			if (articles.length > 0) {
				let prop = Object.keys(req.body);
				let value = Object.values(req.body);

				let data = prop
					.map((val, idx) => {
						return `${prop[idx]} = ${dbConfig.escape(value[idx])}`;
					})
					.join(",");

				await dbQuery(`UPDATE articles SET ${data} WHERE id = ${dbConfig.escape(id)}`);

				articles = await dbQuery(`SELECT * FROM articles WHERE id = ${dbConfig.escape(id)};`);
				res.status(200).send({
					success: true,
					message: "Article has been updated ✅",
					articles,
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No articles with id ${req.params.id}`,
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
			let articles = await dbQuery(`SELECT * FROM articles WHERE id = ${dbConfig.escape(id)};`);
			if (articles.length > 0) {
				await dbQuery(`
					DELETE FROM articles WHERE id = ${dbConfig.escape(id)};
				`);
				res.status(200).send({
					success: true,
					message: "Article has been deleted ✅",
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No articles with id ${id}`,
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
