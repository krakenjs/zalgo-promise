// @ts-expect-error
module.exports = require('./promise').ZalgoPromise; // eslint-disable-line import/no-commonjs

// @ts-expect-error
module.exports.ZalgoPromise = require('./promise').ZalgoPromise; // eslint-disable-line import/no-commonjs
