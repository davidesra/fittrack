import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string,
  publicId?: string
): Promise<{ publicId: string; url: string; secureUrl: string }> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: "image" as const,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    };
    if (publicId) options.public_id = publicId;

    cloudinary.uploader.upload(
      typeof file === "string" ? file : `data:image/jpeg;base64,${file.toString("base64")}`,
      options,
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
        } else {
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
          });
        }
      }
    );
  });
}

export function getCloudinaryUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {}
): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options.width ?? 800,
        height: options.height,
        crop: options.crop ?? "limit",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
}
