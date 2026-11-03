const mysql = require('mysql2/promise');
const { db } = require('./config');
module.exports = { pool: mysql.createPool({ ...db, connectionLimit: 5, connectTimeout: 5000 }) };
