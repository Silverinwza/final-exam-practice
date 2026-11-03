const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { db } = require('../config');
async function main() {
  const { database, ...options } = db;
  const conn = await mysql.createConnection({ ...options, multipleStatements: true });
  try {
    await conn.query('CREATE DATABASE IF NOT EXISTS exam_practice_db CHARACTER SET utf8mb4');
    await conn.changeUser({ database });
    await conn.query(fs.readFileSync(path.join(__dirname, '../seed.sql'), 'utf8'));
    const [[row]] = await conn.query('SELECT COUNT(*) AS total FROM menu_items');
    console.log(`พร้อมซ้อม: ${database}, ${row.total} เมนู (รีเซ็ตเฉพาะฐานข้อมูลซ้อม)`);
  } finally { await conn.end(); }
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
