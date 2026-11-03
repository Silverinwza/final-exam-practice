const request = require('supertest');
const { pool } = require('../db');
const target = process.env.PRACTICE_TARGET === 'starter' ? 'starter' : 'solution';
const app = require(`../${target}/app`);
afterAll(async () => { await pool.end(); });
test('MySQL จริง: หน้า 2 ได้ seed id 6–10 จาก 22 เมนู', async () => {
  const res = await request(app).get('/api/v1/menu?page=2&limit=5');
  expect(res.status).toBe(200);
  expect(res.body.data.map(row => row.id)).toEqual([6, 7, 8, 9, 10]);
  expect(res.body.pagination).toEqual({ page: 2, limit: 5, total: 22, totalPages: 5 });
});
test('MySQL จริง: เมนู unavailable มี 2 รายการ', async () => {
  const res = await request(app).get('/api/v1/menu?available=false');
  expect(res.status).toBe(200);
  expect(res.body.data.map(row => row.id)).toEqual([9, 18]);
  expect(res.body.pagination.total).toBe(2);
  expect(res.body.pagination.totalPages).toBe(1);
});
test('MySQL จริง: หน้าเกินช่วงยังคืน total=22', async () => {
  const res = await request(app).get('/api/v1/menu?page=99');
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual([]);
  expect(res.body.pagination.total).toBe(22);
});
