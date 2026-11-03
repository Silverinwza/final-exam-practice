jest.mock('../db', () => ({ pool: { query: jest.fn(), getConnection: jest.fn() } }));
const request = require('supertest');
const { pool } = require('../db');
const target = process.env.PRACTICE_TARGET === 'starter' ? 'starter' : 'solution';
const app = require(`../${target}/app`);
beforeEach(() => {
  jest.resetAllMocks();
  pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ total: 22 }]]);
});
test('ตรวจเฉลยข้อ 2: หน้า 2 offset=5 และ ceil(22/5)=5', async () => {
  const res = await request(app).get('/api/v1/menu?page=2&limit=5');
  expect(res.status).toBe(200);
  expect(res.body.pagination.totalPages).toBe(5);
  expect(pool.query.mock.calls[0][1]).toEqual([5, 5]);
});
test.each(['page=0', 'page=-1', 'page=1.5', 'page=2abc', 'page=', 'page=1&page=2',
  'limit=0', 'limit=-3', 'limit=101', 'limit=1.5', 'available=yes', 'page=9007199254740991&limit=100'])('ปฏิเสธ query %s ก่อนเรียก DB', async query => {
  const res = await request(app).get(`/api/v1/menu?${query}`);
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('INVALID_QUERY');
  expect(pool.query).not.toHaveBeenCalled();
});
test.each([['true', 1], ['false', 0]])('available=%s ต้องใช้ parameter ทั้ง 2 query', async (filter, expected) => {
  const res = await request(app).get(`/api/v1/menu?available=${filter}`);
  expect(res.status).toBe(200);
  expect(pool.query.mock.calls[0][1]).toEqual([expected, 5, 0]);
  expect(pool.query.mock.calls[1][0]).toContain('WHERE available = ?');
  expect(pool.query.mock.calls[1][1]).toEqual([expected]);
});
