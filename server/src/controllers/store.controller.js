import { StoreSetting } from '../models/StoreSetting.js';

export async function getStoreSettings(req, res) {
  try {
    let settings = await StoreSetting.findOne();
    if (!settings) {
      settings = await StoreSetting.create({});
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateStoreSettings(req, res) {
  try {
    let settings = await StoreSetting.findOne();
    if (!settings) {
      settings = await StoreSetting.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    return res.status(200).json({
      success: true,
      message: 'Store settings updated successfully',
      settings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

