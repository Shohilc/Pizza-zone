import mongoose from 'mongoose';

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
});

const customizationGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true }, // e.g., "Add-ons", "Cheese Option", "Spice Level"
  allowMultiple: { type: Boolean, default: false },
  isRequired: { type: Boolean, default: false },
  options: [customizationOptionSchema],
});

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    badge: {
      type: String, // e.g. "Bestseller", "Chef's Choice", "Popular"
      default: null,
    },
    preparationTimeMinutes: {
      type: Number,
      default: 15,
    },
    customizations: [customizationGroupSchema],
  },
  {
    timestamps: true,
  }
);

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);

