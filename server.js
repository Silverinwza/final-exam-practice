const { port } = require('./config');
const target = process.argv[2] === 'starter' ? 'starter' : 'solution';
const app = require(`./${target}/app`);
app.listen(port, () => console.log(`${target}: http://localhost:${port}/api/v1/menu`));
