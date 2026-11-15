import { Order, ORDER_STATUSES, CANCEL_REASONS } from '../models/Order.js';
import { calculateOrderBreakdown } from '../services/orderCalculation.service.js';
import { sendTelegramOrderAlert, sendTelegramStatusAlert } from '../services/telegram.service.js';
import { emitOrderCreated, emitOrderStatusUpdated } from '../services/socket.service.js';

/**
 * Place a new order
 * Prices and totals are ALWAYS recalculated strictly on the server.
 */
export async function createOrder(req, res) {
  try {
    const { orderType, customer, items, paymentMethod, customerNotes } = req.body;

    // Recalculate financials strictly on the server from database items
    const calculation = await calculateOrderBreakdown(items, orderType);

    const orderData = {
      orderNumber: calculation.orderNumber,
      customer: {
        userId: req.user?._id,
        firebaseUid: req.user?.firebaseUid || 'guest',
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: orderType === 'DELIVERY' ? customer.address.trim() : 'Takeaway / Store Pickup',
        landmark: customer.landmark?.trim() || '',
      },
      orderType,
      items: calculation.calculatedItems,
      subtotal: calculation.subtotal,
      deliveryFee: calculation.deliveryFee,
      totalAmount: calculation.totalAmount,
      paymentMethod,
      paymentStatus: 'PENDING',
      status: 'PENDING_CONFIRMATION',
      customerNotes: customerNotes?.trim() || '',
      timeline: [
        {
          status: 'PENDING_CONFIRMATION',
          timestamp: new Date(),
          note: 'Order submitted. Store owner will call customer to confirm before kitchen preparation.',
        },
      ],
    };

    const newOrder = await Order.create(orderData);

    // Send notifications asynchronously (never block or fail order if notifications fail)
    Promise.allSettled([
      sendTelegramOrderAlert(newOrder),
      Promise.resolve(emitOrderCreated(newOrder)),
    ]).catch((err) => {
      console.warn('[Notification Warning] Background alert error:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! The store owner will call you shortly to confirm.',
      order: newOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to place order',
    });
  }
}

/**
 * Get single order details by ID
 */
export async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check: Customer can only view their own order; Admins can view any
    const isOwner = req.user && req.user.firebaseUid === order.customer.firebaseUid;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied to this order' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get customer's past orders
 */
export async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ 'customer.firebaseUid': req.user.firebaseUid })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin: Get all orders with filter, search, and pagination
 */
export async function getAllOrdersAdmin(req, res) {
  try {
    const { status, search, page = '1', limit = '30' } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderNumber: regex },
        { 'customer.name': regex },
        { 'customer.phone': regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin: Advance or change order status
 */
export async function updateOrderStatus(req, res) {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot update status of a cancelled order' });
    }

    const oldStatus = order.status;
    order.status = status;

    if (status === 'COMPLETED') {
      order.paymentStatus = 'PAID';
    }

    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
    });

    await order.save();

    // Trigger non-blocking real-time socket and telegram alerts
    Promise.allSettled([
      Promise.resolve(emitOrderStatusUpdated(order)),
      sendTelegramStatusAlert(order, oldStatus),
    ]).catch((err) => console.warn('[Status Notification Warning]:', err.message));

    return res.status(200).json({
      success: true,
      message: `Order status changed to ${status}`,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Cancel order with a mandatory cancel reason
 */
export async function cancelOrder(req, res) {
  try {
    const { cancelReason, cancelNote } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already completed order' });
    }

    const oldStatus = order.status;
    order.status = 'CANCELLED';
    order.cancelReason = cancelReason;
    order.cancelNote = cancelNote || '';

    order.timeline.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      note: `Cancelled (${cancelReason})${cancelNote ? `: ${cancelNote}` : ''}`,
    });

    await order.save();

    // Trigger non-blocking alerts
    Promise.allSettled([
      Promise.resolve(emitOrderStatusUpdated(order)),
      sendTelegramStatusAlert(order, oldStatus),
    ]).catch((err) => console.warn('[Cancel Notification Warning]:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin: Get dashboard high-level metrics
 */
export async function getOrderStatsAdmin(req, res) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      pendingCount,
      confirmedCount,
      preparingCount,
      readyCount,
      outForDeliveryCount,
      todayCompleted,
      allTimeCount,
    ] = await Promise.all([
      Order.countDocuments({ status: 'PENDING_CONFIRMATION' }),
      Order.countDocuments({ status: 'CONFIRMED' }),
      Order.countDocuments({ status: 'PREPARING' }),
      Order.countDocuments({ status: 'READY' }),
      Order.countDocuments({ status: 'OUT_FOR_DELIVERY' }),
      Order.find({ status: 'COMPLETED', createdAt: { $gte: startOfToday } }),
      Order.countDocuments(),
    ]);

    const todayRevenue = todayCompleted.reduce((acc, curr) => acc + curr.totalAmount, 0);

    return res.status(200).json({
      success: true,
      stats: {
        pendingConfirmation: pendingCount,
        confirmed: confirmedCount,
        preparing: preparingCount,
        ready: readyCount,
        outForDelivery: outForDeliveryCount,
        activeOrders: pendingCount + confirmedCount + preparingCount + readyCount + outForDeliveryCount,
        todayCompletedCount: todayCompleted.length,
        todayRevenue,
        allTimeCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

