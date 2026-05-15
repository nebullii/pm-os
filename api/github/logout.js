const { clearCookie, json } = require('./_shared');

module.exports = async function handler(req, res) {
  clearCookie(res);
  json(res, 200, { ok: true });
};
