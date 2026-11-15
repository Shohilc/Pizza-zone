import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
];

export const CANCEL_REASONS = [
  'NOT_REACHABLE',
  'CUSTOMER_DECLINED',
  'FAKE_ORDER',
  'OUT_OF_STOCK',
];

export const PAYMENT_METHODS = [
  'PAY_AT_STORE',
  'CASH_ON_DELIVERY',
];

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  selectedCustomizations: [
    {
      groupName: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
    },
  ],
  itemTotal: { type: Number, required: true, min: 0 },
});

const orderTimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ORDER_STATUSES,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      firebaseUid: {
        type: String,
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
        default: '',
      },
      landmark: {
        type: String,
        trim: true,
        default: '',
      },
    },
    orderType: {
      type: String,
      enum: ['DELIVERY', 'TAKEAWAY'],
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val) => val.length > 0, 'Order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'PENDING_CONFIRMATION',
      index: true,
    },
    cancelReason: {
      type: String,
      enum: [...CANCEL_REASONS, null],
      default: null,
    },
    cancelNote: {
      type: String,
      default: '',
    },
    customerNotes: {
      type: String,
      default: '',
    },
    timeline: [orderTimelineSchema],
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model('Order', orderSchema);

