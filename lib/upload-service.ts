import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
}

export class UploadService {
  private static instance: UploadService;

  private constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
      api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
    });
  }

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  public async uploadImage(file: Buffer, folder: string = 'grievances'): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(file);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  public async uploadDocument(file: Buffer, folder: string = 'documents'): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',
          allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
          max_bytes: 10 * 1024 * 1024, // 10MB limit
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
            });
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(file);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  public async deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public async getFileInfo(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.api.resource(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  public generateUploadUrl(folder: string = 'grievances'): string {
    return cloudinary.url(folder, {
      sign_url: true,
      type: 'upload',
      expires_at: Math.round(Date.now() / 1000) + 3600, // 1 hour
    });
  }
}
