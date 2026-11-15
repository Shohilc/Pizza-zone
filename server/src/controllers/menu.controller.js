import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';
import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export async function getCategories(req, res) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAllCategoriesAdmin(req, res) {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCategory(req, res) {
  try {
    const category = await Category.create(req.body);
    return res.status(201).json({ success: true, category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category slug already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMenuItems(req, res) {
  try {
    const { category, availableOnly = 'false' } = req.query;
    const filter = {};

    if (availableOnly === 'true') {
      filter.isAvailable = true;
    }

    if (category && category !== 'all') {
      // Find category by slug or ID
      const cat = await Category.findOne({
        $or: [{ slug: category.toLowerCase() }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }],
      });
      if (cat) {
        filter.category = cat._id;
      }
    }

    const items = await MenuItem.find(filter)
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMenuItemById(req, res) {
  try {
    const item = await MenuItem.findById(req.params.id).populate('category', 'name slug icon');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    return res.status(200).json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createMenuItem(req, res) {
  try {
    const item = await MenuItem.create(req.body);
    const populated = await MenuItem.findById(item._id).populate('category', 'name slug');
    return res.status(201).json({ success: true, item: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateMenuItem(req, res) {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    return res.status(200).json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleItemAvailability(req, res) {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    return res.status(200).json({
      success: true,
      message: `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}`,
      isAvailable: item.isAvailable,
      item,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteMenuItem(req, res) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    return res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    if (!isCloudinaryConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary credentials are not configured in server/.env. Provide an external image URL directly.',
      });
    }

    const secureUrl = await uploadBufferToCloudinary(req.file.buffer, 'snack-store/menu');
    return res.status(200).json({ success: true, url: secureUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

