const { dbQuery, dbConfig } = require('../config/database')
const objectFilter = require('../helper/objectFilter')

module.exports = {
	get: async (req, res) => {
		try {
			let likes = await dbQuery('SELECT * FROM likes;')

			let isSorting = Object.keys(req.query).length > 0
			let sortedLikes = objectFilter(req.query, likes)

			if (isSorting) {
				if (sortedLikes.length > 0) {
					res.status(200).send({
						success: true,
						likes: sortedLikes,
					})
				} else {
					res.status(200).send({
						success: false,
						message: 'Likes not found',
					})
				}
			} else {
				if (likes.length > 0) {
					res.status(200).send({
						success: true,
						likes,
					})
				} else {
					res.status(200).send({
						success: false,
						message: 'Likes not found',
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
	add: async (req, res) => {
		try {
			let { id_user, id_post } = req.body

			let likes = await dbQuery(
				`SELECT * FROM likes l WHERE l.id_user = ${dbConfig.escape(
					id_user
				)} AND l.id_post = ${dbConfig.escape(id_post)};`
			)

			if (likes.length > 0) {
				return
			} else {
				await dbQuery(`
					INSERT INTO likes (id_user, id_post) VALUES
					(${dbConfig.escape(id_user)},
					${dbConfig.escape(id_post)});
				`)

				let likes = await dbQuery(`
				SELECT * FROM likes l WHERE l.id_user=${dbConfig.escape(id_user)} AND 
				l.id_post=${dbConfig.escape(id_post)};`)

				if(likes.length > 0) {
					res.status(200).send({
						success: true,
						message: 'New like has been submited ✅',
						likes
					})
				} else {
					res.status(400).send({
						success: false,
						message: 'Likes not found',
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
	update: async (req, res) => {
		try {
			let id = req.params.id
			let likes = await dbQuery(`SELECT * FROM likes WHERE id = ${dbConfig.escape(id)};`)
			if (likes.length > 0) {
				let prop = Object.keys(req.body)
				let value = Object.values(req.body)

				let data = prop
					.map((val, idx) => {
						return `${prop[idx]} = ${dbConfig.escape(value[idx])}`
					})
					.join(',')

				await dbQuery(`UPDATE likes SET ${data} WHERE id = ${dbConfig.escape(id)}`)

				likes = await dbQuery(`SELECT * FROM likes WHERE id = ${dbConfig.escape(id)};`)
				res.status(200).send({
					success: true,
					message: 'Like has been updated ✅',
					likes,
				})
			} else {
				res.status(200).send({
					success: false,
					message: `No likes with id ${req.params.id}`,
				})
			}
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
			let likes = await dbQuery(`SELECT * FROM likes l WHERE l.id = ${dbConfig.escape(id)};`)
			if (likes.length > 0) {
				await dbQuery(`
					DELETE FROM likes WHERE id = ${dbConfig.escape(id)};
				`)
				res.status(200).send({
					success: true,
					message: 'Like has been deleted ✅',
				})
			} else {
				res.status(200).send({
					success: false,
					message: `No likes with id ${id}`,
				})
			}
		} catch (error) {
			res.status(500).send({
				success: false,
				message: error,
			})
		}
	},
	removeByPostId: async (req, res) => {
		try {
			let id = req.params.id
			let likes = await dbQuery(`SELECT * FROM likes WHERE id_post = ${dbConfig.escape(id)};`)
			if (likes.length > 0) {
				await dbQuery(`
					DELETE FROM likes WHERE id_post = ${dbConfig.escape(id)};
				`)
				res.status(200).send({
					success: true,
					message: 'Like has been deleted ✅',
				})
			} else {
				res.status(200).send({
					success: false,
					message: `No likes with id ${id}`,
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
