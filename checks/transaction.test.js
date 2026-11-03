jest.mock('../db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const request = require('supertest');
const { pool } = require('../db');
const target = process.env.PRACTICE_TARGET === 'starter' ? 'starter' : 'solution';
const app = require(`../${target}/app`);
const payload = { customer_name: 'transaction-mock', items: [{ menu_item_id: 1, quantity: 2 }] };
let conn;
beforeEach(() => {
  jest.resetAllMocks();
  conn = { beginTransaction: jest.fn().mockResolvedValue(), commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(), release: jest.fn(), query: jest.fn() };
  pool.getConnection.mockResolvedValue(conn);
});
test('เขียนบน connection เดียว commit และ release เมื่อสำเร็จ', async () => {
  conn.query.mockResolvedValueOnce([{ insertId: 7 }]).mockResolvedValueOnce([[{ id: 1, available: 1 }]]).mockResolvedValueOnce([{}]);
  const res = await request(app).post('/api/v1/orders').send(payload);
  expect(res.status).toBe(201);
  expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
  expect(conn.commit).toHaveBeenCalledTimes(1);
  expect(conn.rollback).not.toHaveBeenCalled();
  expect(conn.release).toHaveBeenCalledTimes(1);
  expect(pool.query).not.toHaveBeenCalled();
});
test('DB error หลังเริ่มเขียน: rollback, release และ 500', async () => {
  conn.query.mockResolvedValueOnce([{ insertId: 7 }]).mockResolvedValueOnce([[{ id: 1, available: 1 }]]).mockRejectedValueOnce(new Error('disk failure'));
  const res = await request(app).post('/api/v1/orders').send(payload);
  expect(res.status).toBe(500);
  expect(res.body.error.code).toBe('INTERNAL_ERROR');
  expect(conn.rollback).toHaveBeenCalledTimes(1);
  expect(conn.commit).not.toHaveBeenCalled();
  expect(conn.release).toHaveBeenCalledTimes(1);
});
test('ขอ connection ไม่ได้: 500 และไม่ค้าง', async () => {
  pool.getConnection.mockRejectedValueOnce(new Error('DB offline'));
  const res = await request(app).post('/api/v1/orders').send(payload);
  expect(res.status).toBe(500);
  expect(conn.rollback).not.toHaveBeenCalled();
});
