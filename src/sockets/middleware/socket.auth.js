const jwt = require('jsonwebtoken');

function socketAuth(socket, next) {
  try {
    console.log('Socket auth attempt:', {
      token: socket.handshake.auth.token,
      query: socket.handshake.query
    });

    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      console.log('No token found in handshake');
      return next(new Error('Authentication token is required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    if (!decoded) {
      console.log('Token verification failed');
      return next(new Error('Invalid authentication token'));
    }

    // Attach user data to socket
    socket.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    console.log('Socket user attached:', socket.user);
    console.log('Socket object after auth:', {
      id: socket.id,
      user: socket.user,
      handshake: {
        auth: socket.handshake.auth,
        query: socket.handshake.query
      }
    });

    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication token has expired'));
    }
    return next(new Error('Authentication failed'));
  }
}

module.exports = socketAuth; 