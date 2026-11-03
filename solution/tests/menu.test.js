jest.mock('../../db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const request = require('supertest');
const { pool } = require('../../db');
const app = require('../app');
beforeEach(() => jest.resetAllMocks());

test('หน้า 2: ทั้งข้อมูล metadata และ OFFSET ถูกต้อง', async () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({ id: i + 6, name: `menu${i}`, price: '50.00', available: 1 }));
  pool.query.mockResolvedValueOnce([rows]).mockResolvedValueOnce([[{ total: 22 }]]);
  const res = await request(app).get('/api/v1/menu?page=2&limit=5');
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual(rows);
  expect(res.body.pagination).toEqual({ page: 2, limit: 5, total: 22, totalPages: 5 });
  // Mock คืนค่าที่เตรียมไว้เสมอ จึงต้อง assert SQL parameter เพื่อจับบั๊ก offset ด้วย
  expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('ORDER BY id ASC LIMIT ? OFFSET ?'), [5, 5]);
});
test('ค่าเริ่มต้น page=1 limit=5 offset=0', async () => {
  pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ total: 22 }]]);
  const res = await request(app).get('/api/v1/menu');
  expect(res.status).toBe(200);
  expect(res.body.pagination).toEqual({ page: 1, limit: 5, total: 22, totalPages: 5 });
  expect(pool.query).toHaveBeenNthCalledWith(1, expect.any(String), [5, 0]);
});
test('available=false: กรองทั้ง data และ count', async () => {
  const rows = [{ id: 9, available: 0 }, { id: 18, available: 0 }];
  pool.query.mockResolvedValueOnce([rows]).mockResolvedValueOnce([[{ total: 2 }]]);
  const res = await request(app).get('/api/v1/menu?available=false');
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual(rows);
  expect(res.body.pagination).toEqual({ page: 1, limit: 5, total: 2, totalPages: 1 });
  expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE available = ?'), [0, 5, 0]);
  expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE available = ?'), [0]);
});
test.each(['page=0', 'limit=101'])('query ผิด: %s', async query => {
  const res = await request(app).get(`/api/v1/menu?${query}`);
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('INVALID_QUERY');
  expect(pool.query).not.toHaveBeenCalled();
});
test('หน้าเกินช่วง คืนข้อมูลว่างและ total เดิม', async () => {
  pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ total: 22 }]]);
  const res = await request(app).get('/api/v1/menu?page=99');
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual([]);
  expect(res.body.pagination).toEqual({ page: 99, limit: 5, total: 22, totalPages: 5 });
});
test('DB ล่ม: 500 โดยไม่เปิดเผยข้อความภายใน', async () => {
  pool.query.mockRejectedValueOnce(new Error('database password must not leak'));
  const res = await request(app).get('/api/v1/menu');
  expect(res.status).toBe(500);
  expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR' } });
});
