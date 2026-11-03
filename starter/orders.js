const { pool } = require("../db");
const validOrder = require("../common/validate-order");

module.exports = async function orders(req, res, next) {
  if (!validOrder(req.body)) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT" },
    });
  }

  let conn;
  let began = false;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    began = true;

    const [result] = await conn.query(
      "INSERT INTO orders (customer_name) VALUES (?)",
      [req.body.customer_name.trim()],
    );

    for (const item of req.body.items) {
      const [[menu]] = await conn.query(
        "SELECT id, available FROM menu_items WHERE id = ? FOR UPDATE",
        [item.menu_item_id],
      );

      if (!menu) {
        throw Object.assign(new Error("ไม่พบเมนู"), {
          status: 404,
          code: "MENU_NOT_FOUND",
        });
      }

      if (!menu.available) {
        throw Object.assign(new Error("เมนูขายไม่ได้"), {
          status: 409,
          code: "MENU_UNAVAILABLE",
        });
      }

      await conn.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?)",
        [result.insertId, item.menu_item_id, item.quantity],
      );
    }

    await conn.commit();
    began = false;

    res.status(201).json({
      data: {
        id: result.insertId,
        status: "pending",
      },
    });
  } catch (err) {
    if (conn && began) {
      try {
        await conn.rollback();
      } catch {
        // ส่งข้อผิดพลาดต้นเหตุให้ error handler ต่อ
      }
    }

    next(err);
  } finally {
    if (conn) conn.release();
  }
};
