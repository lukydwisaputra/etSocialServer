require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { dbConfig } = require("../archieve/etSocial_API/config/database");
const {
	articlesRouter,
	commentsRouter,
	likesRouter,
	newsRouter,
	postsRouter,
	usersRouter,
} = require("./routers");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

app.get("/api", (req, res) => {
	res.status(200).send("étSocial API");
});

// check database connection
dbConfig.getConnection((error, connection) => {
	if (error) {
		console.log("Error: MySQL COnnection", error.sqlMessage);
	}

	console.log("Connected ✅ :", connection.threadId);

	// articles
	app.use("/api/articles", articlesRouter);

	// comments
	app.use("/api/comments", commentsRouter);

	// likes
	app.use("/api/likes", likesRouter);

	// news
	app.use("/api/news", newsRouter);

	// posts
	app.use("/api/posts", postsRouter);

	// users
	app.use("/api/users", usersRouter);

	app.listen(PORT, () => console.log("étSocial API at PORT:", parseInt(PORT)));
});
