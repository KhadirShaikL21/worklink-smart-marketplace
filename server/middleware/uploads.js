import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../services/cloudinary.js';

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'worklink/uploads/images',
    resource_type: 'image',
    public_id: `${Date.now()}-${file.originalname}`
  })
});

const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'worklink/uploads/audio',
    resource_type: 'video',
    format: 'mp3',
    public_id: `${Date.now()}-${file.originalname}`
  })
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'worklink/uploads/videos',
    resource_type: 'video',
    public_id: `${Date.now()}-${file.originalname}`
  })
});

const mixedStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'worklink/uploads/misc';
    let resource_type = 'auto';
    
    if (file.mimetype.startsWith('image/')) {
      folder = 'worklink/uploads/images';
      resource_type = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'worklink/uploads/videos';
      resource_type = 'video';
    }

    return {
      folder,
      resource_type,
      public_id: `${Date.now()}-${file.originalname}`
    };
  }
});

export const uploadImage = multer({ storage: imageStorage });
export const uploadAudio = multer({ storage: audioStorage });
export const uploadVideo = multer({ storage: videoStorage });
export const uploadMixed = multer({ storage: mixedStorage });
