const path = require('path');
const target = process.env.PRACTICE_TARGET === 'starter' ? 'starter' : 'solution';
module.exports = {
  testEnvironment: 'node',
  testMatch: [`<rootDir>/${target}/tests/**/*.test.js`, '<rootDir>/checks/**/*.test.js'],
  cacheDirectory: path.resolve(__dirname, '../../work/practice-jest-cache'),
  testTimeout: 10000,
  collectCoverageFrom: [`${target}/**/*.js`, '!**/tests/**'],
  coverageDirectory: `coverage/${target}`
};
