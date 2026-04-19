const { app, initializeApp } = require('./app');

module.exports = async (req, res) => {
  try {
    await initializeApp();
    return app(req, res);
  } catch (error) {
    console.error('Vercel function startup failed:', error.message);
    return res.status(500).json({ message: 'Server initialization failed' });
  }
};
