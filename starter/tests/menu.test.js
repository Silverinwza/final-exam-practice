jest.mock("../../db", () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() },
}));
const request = require("supertest");
const { pool } = require("../../db");
const app = require("../app");
beforeEach(() => jest.resetAllMocks());
// TODO ข้อ 1: เปลี่ยน todo เป็น test จริง ใช้ Arrange -> Act -> Assert
test("หน้า 2 คืน 5 เมนู และแบ่งหน้าถูกต้อง", async () => {
  // 1. Arrange: เตรียมข้อมูลจำลอง
  const rows = [
    { id: 6, name: "เมนู 6" },
    { id: 7, name: "เมนู 7" },
    { id: 8, name: "เมนู 8" },
    { id: 9, name: "เมนู 9" },
    { id: 10, name: "เมนู 10" },
  ];

  pool.query
    .mockResolvedValueOnce([rows])
    .mockResolvedValueOnce([[{ total: 22 }]]);

  // 2. Act: เรียก API
  const res = await request(app).get("/api/v1/menu?page=2&limit=5");

  // 3. Assert: ตรวจผล
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual(rows);

  expect(res.body.pagination).toEqual({
    page: 2,
    limit: 5,
    total: 22,
    totalPages: 5,
  });

  expect(pool.query).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("LIMIT ? OFFSET ?"),
    [5, 5],
  );
});
test("ไม่ส่ง query ใช้หน้า 1 หน้าละ 5 และ offset 0", async () => {
  // Arrange
  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

  pool.query
    .mockResolvedValueOnce([rows])
    .mockResolvedValueOnce([[{ total: 22 }]]);

  // Act: ไม่ใส่ ?page=... หรือ &limit=...
  const res = await request(app).get("/api/v1/menu");

  // Assert
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual(rows);

  expect(res.body.pagination).toEqual({
    page: 1,
    limit: 5,
    total: 22,
    totalPages: 5,
  });

  expect(pool.query).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("LIMIT ? OFFSET ?"),
    [5, 0],
  );
});
test("available=false กรองทั้งข้อมูลและจำนวนทั้งหมด", async () => {
  // Arrange: จำลองเมนูที่ขายไม่ได้ 2 รายการ
  const rows = [
    { id: 9, available: 0 },
    { id: 18, available: 0 },
  ];

  pool.query
    .mockResolvedValueOnce([rows])
    .mockResolvedValueOnce([[{ total: 2 }]]);

  // Act
  const res = await request(app).get("/api/v1/menu?available=false");

  // Assert: ตรวจ response
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual(rows);

  expect(res.body.pagination).toEqual({
    page: 1,
    limit: 5,
    total: 2,
    totalPages: 1,
  });

  // ตรวจ query ดึงข้อมูล: available=0, limit=5, offset=0
  expect(pool.query).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("WHERE available = ?"),
    [0, 5, 0],
  );

  // ตรวจ query นับจำนวน: ต้องกรอง available=0 เช่นกัน
  expect(pool.query).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining("WHERE available = ?"),
    [0],
  );
});
test.each(["page=0", "limit=101"])(
  "query ผิด %s ต้องคืน 400 และไม่เรียก DB",
  async (query) => {
    // Act
    const res = await request(app).get(`/api/v1/menu?${query}`);

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
    expect(pool.query).not.toHaveBeenCalled();
  },
);
test("ขอหน้าเกินช่วง คืนข้อมูลว่างแต่ยังมี total", async () => {
  // Arrange: หน้านี้ไม่มีข้อมูล แต่ทั้งหมดมี 22 เมนู
  pool.query
    .mockResolvedValueOnce([[]])
    .mockResolvedValueOnce([[{ total: 22 }]]);

  // Act
  const res = await request(app).get("/api/v1/menu?page=99");

  // Assert
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual([]);

  expect(res.body.pagination).toEqual({
    page: 99,
    limit: 5,
    total: 22,
    totalPages: 5,
  });
});
test("DB ล่ม คืน 500 โดยไม่เปิดเผยข้อความภายใน", async () => {
  // Arrange: จำลองให้ query โยน error
  pool.query.mockRejectedValueOnce(
    new Error("database password must not leak"),
  );

  // Act
  const res = await request(app).get("/api/v1/menu");

  // Assert
  expect(res.status).toBe(500);
  expect(res.body).toEqual({
    error: { code: "INTERNAL_ERROR" },
  });
});
ด;
