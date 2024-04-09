import { Express } from 'express';

// Convert uploaded file to base64
export const fileToBase64 = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([file.buffer], { type: file.mimetype });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    } catch (error) {
      reject(error);
    }
  });
};
