const { spawnSync } = require('child_process');
const path = require('path');
const target = process.argv[2] === 'starter' ? 'starter' : 'solution';
const jest = path.join(path.dirname(require.resolve('jest/package.json')), 'bin/jest.js');
const result = spawnSync(process.execPath, [jest, '--runInBand', ...process.argv.slice(3)], {
  cwd: path.join(__dirname, '..'), stdio: 'inherit', env: { ...process.env, PRACTICE_TARGET: target }
});
if (result.error) console.error(result.error);
process.exitCode = result.status ?? 1;
