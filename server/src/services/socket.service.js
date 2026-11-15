import { Server } from 'socket.io';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join admin room
    socket.on('join:admin', () => {
      socket.join('room:admin');
      console.log(`[Socket.io] Socket ${socket.id} joined room:admin`);
    });

    // Join specific order room for real-time tracking
    socket.on('join:order', (orderId) => {
      if (orderId) {
        socket.join(`room:order:${orderId}`);
        console.log(`[Socket.io] Socket ${socket.id} joined room:order:${orderId}`);
      }
    });

    // Leave order room
    socket.on('leave:order', (orderId) => {
      if (orderId) {
        socket.leave(`room:order:${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Emit event to admin room and order room safely.
 * Notification failures must never make an order fail.
 */
export function emitOrderCreated(order) {
  try {
    if (!io) return;
    // Notify all active admin dashboards
    io.to('room:admin').emit('order:created', order);
  } catch (error) {
    console.error('[Socket.io Error] Failed to emit order:created:', error.message);
  }
}

export function emitOrderStatusUpdated(order) {
  try {
    if (!io) return;
    // Notify admin dashboards
    io.to('room:admin').emit('order:updated', order);
    // Notify customer on the tracking screen
    io.to(`room:order:${order._id}`).emit('order:status_changed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      cancelReason: order.cancelReason,
      cancelNote: order.cancelNote,
      timeline: order.timeline,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error('[Socket.io Error] Failed to emit order:status_changed:', error.message);
  }
}

