const fs = require('fs');
const path = require('path');
const filename = path.join(__dirname, '.env');
if (fs.existsSync(filename)) {
  for (const line of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Z_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}
const db = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3309),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'exam_practice_db'
};
// ทุกคำสั่งของชุดซ้อมต้องใช้ฐานข้อมูลซ้อม เพื่อไม่แก้ข้อมูลชุดเตรียมเครื่อง
if (db.database !== 'exam_practice_db') throw new Error('ชุดซ้อมใช้ DB_NAME=exam_practice_db เท่านั้น');
module.exports = { db, port: Number(process.env.PORT || 3010) };
