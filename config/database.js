const mysql = require("mysql");
const util = require('util');

const dbConfig = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USERNAME,
	password: process.env.DB_SECRETS,
	database: process.env.DB_NAME,
});

const dbQuery = util.promisify(dbConfig.query).bind(dbConfig);

module.exports = { dbConfig, dbQuery };