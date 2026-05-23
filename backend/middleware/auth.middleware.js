function decodeToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId] = decoded.split(':');
    if (!userId) return null;
    return { userId };
  } catch (_error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const payload = decodeToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  req.user = payload;
  return next();
}

module.exports = {
  requireAuth,
};
