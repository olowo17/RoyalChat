import streamifier from 'streamifier';
import sharp from 'sharp';
import cloudinary from 'cloudinary';

let streamUpload = async (req: any) => {
  try {
    const data: any = await sharp(req.file.buffer).webp({ quality: 70 }).toBuffer();

    return new Promise((resolve, reject) => {
      let stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'photos',
          cloud_name: process.env.CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );

      streamifier.createReadStream(data).pipe(stream);
    });
  } catch (error) {
    throw error; 
  }
};

export default streamUpload;