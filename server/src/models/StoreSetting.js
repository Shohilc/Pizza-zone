import mongoose from 'mongoose';

const storeSettingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'SnackCraft Kitchen',
    },
    storePhone: {
      type: String,
      default: '+91 98765 43210',
    },
    storeAddress: {
      type: String,
      default: 'Shop 12, Main Street, Snack Plaza',
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    closedNotice: {
      type: String,
      default: 'We are currently closed. Accepting orders again tomorrow!',
    },
    deliveryFee: {
      type: Number,
      default: 30,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 99,
      min: 0,
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 30,
    },
    estimatedPickupMinutes: {
      type: Number,
      default: 15,
    },
  },
  {
    timestamps: true,
  }
);

export const StoreSetting = mongoose.model('StoreSetting', storeSettingSchema);

