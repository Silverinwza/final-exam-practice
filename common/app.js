const express = require('express');
module.exports = function createApp(menu, orders) {
  const app = express();
  app.use(express.json());
  app.get('/api/v1/menu', menu);
  app.post('/api/v1/orders', orders);
  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND' } }));
  app.use((err, req, res, next) => {
    const status = err.type === 'entity.parse.failed' ? 400 : (err.status || 500);
    res.status(status).json({ error: { code: status === 400 ? 'INVALID_INPUT' : (status < 500 ? err.code : 'INTERNAL_ERROR') } });
  });
  return app;
};
