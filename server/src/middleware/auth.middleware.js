const tokenService = require('../services/token.service');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Не авторизовано' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = tokenService.verifyAccess(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Токен недійсний або прострочений' });
  }
}

module.exports = { requireAuth };
