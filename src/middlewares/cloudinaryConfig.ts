import cloudinary from 'cloudinary';

cloudinary.v2.config({
    cloud_name: 'michael-uploads',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;