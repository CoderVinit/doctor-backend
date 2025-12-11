import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
  }

  async uploadImage(file: string | Express.Multer.File): Promise<string> {
    try {
      if (!file) throw new Error('No file provided');

      // 📌 If string path → upload directly
      if (typeof file === 'string') {
        const result = await cloudinary.uploader.upload(file, {
          resource_type: 'auto',
          folder: 'doctor-app/profiles',
        });
        return result.secure_url;
      }

      const multerFile = file as Express.Multer.File;

      // 📌 If Memory Storage → use upload_stream
      if (multerFile.buffer) {
        const buffer = Buffer.isBuffer(multerFile.buffer)
          ? multerFile.buffer
          : Buffer.from(multerFile.buffer);

        return await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'doctor-app/profiles' },
            (err, result) => {
              if (err) return reject(err);
              if (!result)
                return reject(new Error('Cloudinary returned no result'));
              return resolve(result.secure_url);
            },
          );

          Readable.from(buffer).pipe(uploadStream);
        });
      }

      // 📌 If Disk Storage → use file.path
      if ((multerFile as any).path) {
        const result = await cloudinary.uploader.upload(
          (multerFile as any).path,
          {
            resource_type: 'auto',
            folder: 'doctor-app/profiles',
          },
        );
        return result.secure_url;
      }

      throw new Error('No valid file provided');
    } catch (error: any) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }
}
