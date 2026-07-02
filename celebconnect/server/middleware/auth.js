const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret-change-me';

function signFanToken(fan) {
  return jwt.sign({ sub: fan.id, email: fan.email }, JWT_SECRET, { expiresIn: '30d' });
}

function signAdminToken(admin) {
  return jwt.sign({ sub: admin.id, email: admin.email, role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '12h' });
}

// Populates req.fan if a valid fan token is present; does not reject otherwise.
function optionalFanAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.fan = { id: payload.sub, email: payload.email };
  } catch (e) { /* ignore invalid token, treat as anonymous */ }
  next();
}

function requireFanAuth(req, res, next) {
  optionalFanAuth(req, res, () => {
    if (!req.fan) return res.status(401).json({ error: 'Please log in to continue.' });
    next();
  });
}

function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Admin login required.' });
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('not admin');
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired admin session.' });
  }
}

module.exports = { signFanToken, signAdminToken, optionalFanAuth, requireFanAuth, requireAdminAuth };
