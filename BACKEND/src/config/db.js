const mysql = require("mysql2/promise");

require('dotenv').config({ override: true });

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hospedaje",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  charset: "utf8mb4",
});

module.exports = db;
