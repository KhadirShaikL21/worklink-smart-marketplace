import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true
});

export function requireCloudinaryConfig() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new Error('Cloudinary is not configured');
  }
}

export async function uploadBase64Image({ base64, folder = 'worklink/uploads', publicId }) {
  requireCloudinaryConfig();
  return cloudinary.uploader.upload(base64, {
    folder,
    public_id: publicId,
    resource_type: 'image'
  });
}

export async function uploadFilePath({ filePath, folder = 'worklink/uploads', publicId, resourceType = 'image' }) {
  requireCloudinaryConfig();
  return cloudinary.uploader.upload(filePath, {
    folder,
    public_id: publicId,
    resource_type: resourceType
  });
}

export default cloudinary;
