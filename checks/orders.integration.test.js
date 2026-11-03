const request = require('supertest');
const { pool } = require('../db');
const target = process.env.PRACTICE_TARGET === 'starter' ? 'starter' : 'solution';
const app = require(`../${target}/app`);
// ใช้ชื่อเฉพาะรอบการรัน เก็บกวาดเฉพาะข้อมูลที่เทสต์สร้าง
const customer = `practice-test-${Date.now()}-${process.pid}`;
let active, inactive;
beforeAll(async () => {
  const [a] = await pool.query('INSERT INTO menu_items (name, price, available) VALUES (?, 10, TRUE)', [customer]);
  active = a.insertId;
  const [b] = await pool.query('INSERT INTO menu_items (name, price, available) VALUES (?, 20, FALSE)', [customer]);
  inactive = b.insertId;
});
beforeEach(async () => { await pool.query('DELETE FROM orders WHERE customer_name = ?', [customer]); });
afterAll(async () => {
  try {
    await pool.query('DELETE FROM orders WHERE customer_name = ?', [customer]);
    if (active) await pool.query('DELETE FROM menu_items WHERE id = ?', [active]);
    if (inactive) await pool.query('DELETE FROM menu_items WHERE id = ?', [inactive]);
  } finally { await pool.end(); }
});
const body = items => ({ customer_name: customer, items });
const item = (id, quantity = 1) => ({ menu_item_id: id, quantity });
async function expectNoPartialWrites() {
  const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM orders WHERE customer_name = ?', [customer]);
  expect(row.total).toBe(0);
  const [[details]] = await pool.query('SELECT COUNT(*) AS total FROM order_items WHERE menu_item_id = ?', [active]);
  expect(details.total).toBe(0);
}
test('สร้าง order และ order_items สำเร็จบน MySQL จริง', async () => {
  const res = await request(app).post('/api/v1/orders').send(body([item(active, 2)]));
  expect(res.status).toBe(201);
  expect(res.body.data).toEqual({ id: expect.any(Number), status: 'pending' });
  const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [res.body.data.id]);
  expect(order.customer_name).toBe(customer);
  expect(order.status).toBe('pending');
  const [details] = await pool.query('SELECT menu_item_id, quantity FROM order_items WHERE order_id = ?', [order.id]);
  expect(details).toEqual([item(active, 2)]);
});
test('รายการแรกเขียนสำเร็จ แต่รายการถัดไปไม่มีจริง: rollback ทั้ง order และ items', async () => {
  const res = await request(app).post('/api/v1/orders').send(body([item(active), item(2147483647)]));
  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('MENU_NOT_FOUND');
  await expectNoPartialWrites();
});
test('รายการถัดไปขายไม่ได้: 409 และไม่มีข้อมูลบางส่วนค้าง', async () => {
  const res = await request(app).post('/api/v1/orders').send(body([item(active), item(inactive)]));
  expect(res.status).toBe(409);
  expect(res.body.error.code).toBe('MENU_UNAVAILABLE');
  await expectNoPartialWrites();
});
test.each([0, -1, 1.5, '2', 100])('quantity=%s ต้องคืน 400 ก่อนเขียน', async quantity => {
  const res = await request(app).post('/api/v1/orders').send(body([item(active, quantity)]));
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('INVALID_INPUT');
  await expectNoPartialWrites();
});
test.each([{ customer_name: '', items: [] }, { customer_name: customer, items: [] }, {}])('body ไม่ครบหรือว่าง: 400', async data => {
  const res = await request(app).post('/api/v1/orders').send(data);
  expect(res.status).toBe(400);
  await expectNoPartialWrites();
});
