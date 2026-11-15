import { v2 as cloudinary } from 'cloudinary';

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[Cloudinary] Configured successfully');
} else {
  console.warn('[Cloudinary Warning] Cloudinary credentials not fully set in server/.env. Direct image uploads will use URLs or fallbacks.');
}

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} buffer 
 * @param {string} folder 
 * @returns {Promise<string>} Secure URL of uploaded image
 */
export async function uploadBufferToCloudinary(buffer, folder = 'snack-store') {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Please supply Cloudinary credentials in .env');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

export { cloudinary, isConfigured as isCloudinaryConfigured };

