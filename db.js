require('dotenv').config();//加载环境变量

const mysql = require('mysql2/promise');//使用mysql2/primise模块

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10
});

module.exports = pool;


