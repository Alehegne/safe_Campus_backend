require("dotenv").config();
const app = require("./src/app");
const { createServer } = require("http");
const connectToDatabase = require("./src/config/dbConnection");
const { initSocket } = require("./src/config/socket.config");
const cors = require("cors");
const getCorsConfig = require("./src/config/cors.config");
//configure app
app.use(cors(getCorsConfig()));
connectToDatabase();
// Step 2: create server AFTER app is fully configured
const server = createServer(app);
initSocket(server);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { createServer } = require('http');
// const { Server } = require('socket.io');
// const jwt = require('jsonwebtoken');

// const app = express();
// const connectToDatabase = require('./src/config/dbConnection');
// const getSocketConfig = require('./src/config/socket.config');
// const getCorsConfig = require('./src/config/cors.config');
// const initSocket = require('./src/sockets/index');
// const User = require('./src/models/User');
// const authRoutes = require('./src/routes/authRoutes');

// app.use(cors(getCorsConfig()));
// app.use(express.json());
// app.use('/api/auth', authRoutes);

// connectToDatabase();

// const server = createServer(app);
// const io = new Server(server, getSocketConfig());

// io.use(async (socket, next) => {
//   try {
//     const token = socket.handshake.auth.token || socket.handshake.query.token;
//     if (!token) return next(new Error('Authentication error'));

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select('-password');
//     if (!user) return next(new Error('User not found'));

//     socket.user = user;
//     next();
//   } catch (error) {
//     next(new Error('Authentication failed'));
//   }
// });

// initSocket(io);

// app.post('/api/auth/register', async (req, res) => {
//   try {
//     const { campusId, email, password } = req.body;

//     if (!campusId || !email || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     const existingUser = await User.findOne({ $or: [{ email }, { campusId }] });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const user = await User.create({ campusId, email, password });
//     res.status(201).json({
//       _id: user._id,
//       campusId: user.campusId,
//       email: user.email,
//       role: user.role
//     });
//   } catch (error) {
//     console.error('Register error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.post('/api/auth/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password required' });
//     }

//     const user = await User.findOne({ email }).select('+password');
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.json({
//       token,
//       user: {
//         _id: user._id,
//         campusId: user.campusId,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.get('/api/protected', (req, res) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   const token = authHeader.split(' ')[1];
//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) return res.status(403).json({ message: 'Forbidden' });
//     res.json({ message: 'Protected data', user: decoded });
//   });
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
