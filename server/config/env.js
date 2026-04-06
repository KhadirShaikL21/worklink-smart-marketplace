import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/worklink',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-too',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  email: {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587,
    secure: (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === 'true' ? true : false,
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '"WorkLink" <noreply@worklink.com>'
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000'
};

export default env;
