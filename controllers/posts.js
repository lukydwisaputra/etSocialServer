const { dbQuery, dbConfig } = require("../config/database");
const objectFilter = require("../helper/objectFilter");

module.exports = {
	getFeeds: async (req, res) => {
		// getAllFeeds and getAllUserFeeds
		// http://localhost:3100/api/posts/feeds -> getAllFeeds
		// http://localhost:3100/api/posts/feeds?id=1 -> getAllUserFeeds - or,
		// http://localhost:3100/api/posts/feeds?id_user=1 -> getAllUserFeeds
		try {
			let posts = [];
			if (Object.keys(req?.query).length > 0) {
				let id = req.query?.id_user ? req.query?.id_user : req.query?.id;
				posts = await dbQuery(`
					SELECT 
						u.id, 
						u.username, 
						u.email, 
						u.status, 
						u.name, 
						u.bio, 
						u.profile_picture,
						p.id as id_post, 
						p.caption, 
						p.post_image, 
						p.created_at
					FROM users u 
					JOIN posts p 
					ON u.id = p.id_user
					WHERE u.id = ${id};`);
			} else {
				posts = await dbQuery(`
					SELECT 
						p.id as id_post, 
						p.caption, 
						p.post_image, 
						p.created_at,
						u.id as id_user, 
						u.username, 
						u.email, 
						u.status, 
						u.name, 
						u.bio, 
						u.profile_picture
					FROM users u 
					JOIN posts p 
					ON u.id = p.id_user`);
			}

			postsDetails = [];
			const getDetailSerialized = async (posts) => {
				await posts.reduce(async (acc, post) => {
					await acc; // wait previous process
					const likes = await dbQuery(`
						SELECT 
							l.id, 
							l.id_user, 
							u.username, 
							u.profile_picture 
						FROM likes l 
						JOIN users u
						ON u.id = l.id_user
						WHERE l.id_post = ${post?.id_post};`);
					const comments = await dbQuery(`
						SELECT 
							c.id, 
							c.id_user, 
							u.username, 
							u.profile_picture 
						FROM comments c 
						JOIN users u
						ON u.id = c.id_user
						WHERE c.id_post = ${post?.id_post};`);

					post = { ...post, likes, comments };
					postsDetails.push(post);
				}, Promise.resolve());
				// console.log("async looping finished");
			};

			await getDetailSerialized(posts);

			if (postsDetails.length > 0) {
				res.status(200).send({
					success: true,
					feeds: postsDetails,
				});
			} else {
				res.status(400).send({
					success: false,
					message: `No feeds with id ${id}`,
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
			let posts = await dbQuery("SELECT * FROM posts;");

			let isSorting = Object.keys(req.query).length > 0;
			let sortedPost = objectFilter(req.query, posts);

			if (isSorting) {
				if (sortedPost.length > 0) {
					res.status(200).send({
						success: true,
						posts: sortedPost,
					});
				} else {
					res.status(400).send({
						success: false,
						message: "Posts not found",
					});
				}
			} else {
				if (posts.length > 0) {
					res.status(200).send({
						success: true,
						posts,
					});
				} else {
					res.status(400).send({
						success: false,
						message: "Posts not found",
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
			let { id_user, post_image, caption } = req.body;
			await dbQuery(`
				INSERT INTO posts (id_user, post_image, caption) VALUES
				(${dbConfig.escape(id_user)},
				${dbConfig.escape(post_image)},
				${dbConfig.escape(caption)});
			`);

			res.status(200).send({
				success: true,
				message: "New post has been submited ✅",
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
			let posts = await dbQuery(`SELECT * FROM posts WHERE id = ${dbConfig.escape(id)};`);
			if (posts.length > 0) {
				let prop = Object.keys(req.body);
				let value = Object.values(req.body);

				let data = prop
					.map((val, idx) => {
						return `${prop[idx]} = ${dbConfig.escape(value[idx])}`;
					})
					.join(",");

				await dbQuery(`UPDATE posts SET ${data} WHERE id = ${dbConfig.escape(id)}`);

				posts = await dbQuery(`SELECT * FROM posts WHERE id = ${dbConfig.escape(id)};`);
				res.status(200).send({
					success: true,
					message: "Post has been updated ✅",
					posts,
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No posts with id ${req.params.id}`,
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
			let posts = await dbQuery(`SELECT * FROM posts WHERE id = ${dbConfig.escape(id)};`);
			if (posts.length > 0) {
				await dbQuery(`
					DELETE FROM posts WHERE id = ${dbConfig.escape(id)};
				`);
				res.status(200).send({
					success: true,
					message: "Post has been deleted ✅",
				});
			} else {
				res.status(200).send({
					success: false,
					message: `No posts with id ${id}`,
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
