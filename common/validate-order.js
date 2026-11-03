// ส่วนที่ให้มาพร้อมโจทย์ ไม่ใช่ไฟล์ที่ต้องแก้
module.exports = function validOrder(body) {
  return body && typeof body.customer_name === 'string' &&
    body.customer_name.trim().length >= 1 && body.customer_name.trim().length <= 100 &&
    Array.isArray(body.items) && body.items.length >= 1 && body.items.length <= 50 &&
    body.items.every(item => item && Number.isSafeInteger(item.menu_item_id) && item.menu_item_id > 0 &&
      Number.isSafeInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99);
};
