const { pool } = require("../db");
// TODO ข้อ 2: validation, offset และ count ให้ตรงเงื่อนไข
module.exports = async function menu(req, res, next) {
  const { page: pageText = "1", limit: limitText = "5", available } = req.query;

  const isPositiveInteger = (value) =>
    typeof value === "string" &&
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value));

  if (
    !isPositiveInteger(pageText) ||
    !isPositiveInteger(limitText) ||
    Number(limitText) > 100 ||
    (available !== undefined && available !== "true" && available !== "false")
  ) {
    return res.status(400).json({
      error: { code: "INVALID_QUERY" },
    });
  }

  const page = Number(pageText);
  const limit = Number(limitText);

  if (!Number.isSafeInteger((page - 1) * limit)) {
    return res.status(400).json({
      error: { code: "INVALID_QUERY" },
    });
  }
  const where = req.query.available === undefined ? "" : " WHERE available = ?";
  const params =
    req.query.available === undefined
      ? []
      : [req.query.available === "true" ? 1 : 0];
  try {
    const [data] = await pool.query(
      `SELECT * FROM menu_items${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit],
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM menu_items${where}`,
      params,
    );
    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};
