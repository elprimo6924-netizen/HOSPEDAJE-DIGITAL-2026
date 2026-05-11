const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "Hospedaje",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  charset: "utf8mb4",
});

module.exports = db;
