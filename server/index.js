const { app, initializeApp } = require('./app');

const PORT = process.env.PORT || 5000;

initializeApp()
  .then(() => {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
