// convertImage.ts

import { Request, Response, NextFunction } from 'express';
import { fileToBase64 } from '../utils/convertImage';

export const fileToBase64Middleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req?.file) {
      req.body.avatar = await fileToBase64(req.file); // Convert uploaded file to base64
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error converting file to base64' });
  }
};
