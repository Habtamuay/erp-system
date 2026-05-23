const { query } = require('../config/db');

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = true LIMIT 1', [email]);
    const user = result.rows[0];

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'ADMIN',
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function me(req, res) {
  try {
    const userId = Number(req.user.userId);
    const result = await query(
      'SELECT id, email, name, role FROM users WHERE id = $1 AND is_active = true LIMIT 1',
      [userId],
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  login,
  me,
};
