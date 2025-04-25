const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/auth');
const rolesMiddleware = require('./middleware/roles');

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/protected', authMiddleware, rolesMiddleware('admin'), (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});
app.get("/", (req, res) => {
  console.log("welcome to safecampus");
});

module.exports = app;
