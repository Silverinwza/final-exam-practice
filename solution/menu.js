const { pool } = require('../db');
module.exports = async function menu(req, res, next) {
  const { page = '1', limit = '5', available } = req.query;
  const positive = value => typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
  if (!positive(page) || !positive(limit) || Number(limit) > 100 ||
      (available !== undefined && available !== 'true' && available !== 'false')) {
    return res.status(400).json({ error: { code: 'INVALID_QUERY' } });
  }
  const p = Number(page), size = Number(limit), offset = (p - 1) * size;
  if (!Number.isSafeInteger(offset)) return res.status(400).json({ error: { code: 'INVALID_QUERY' } });
  const where = available === undefined ? '' : ' WHERE available = ?';
  const params = available === undefined ? [] : [available === 'true' ? 1 : 0];
  try {
    const [data] = await pool.query(`SELECT * FROM menu_items${where} ORDER BY id ASC LIMIT ? OFFSET ?`, [...params, size, offset]);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM menu_items${where}`, params);
    res.json({ data, pagination: { page: p, limit: size, total, totalPages: Math.ceil(total / size) } });
  } catch (err) { next(err); }
};
