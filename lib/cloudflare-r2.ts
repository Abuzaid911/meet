import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client with Cloudflare R2 credentials
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "meet-app-uploads";

/**
 * Upload a file to Cloudflare R2
 * @param buffer File buffer
 * @param key File key (path in bucket)
 * @param contentType MIME type of the file
 * @returns URL of the uploaded file
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
    });

    await upload.done();
    
    // Construct the Cloudflare R2 public URL
    // Format: https://<custom-domain>/<key>
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
    return publicUrl;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to storage");
  }
}

/**
 * Delete a file from Cloudflare R2
 * @param key File key (path in bucket)
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error("Failed to delete file from storage");
  }
}

/**
 * Get a file from Cloudflare R2
 * @param key File key (path in bucket)
 * @returns File buffer
 */
export async function getFromR2(key: string): Promise<Buffer> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    
    // Handle web standard ReadableStream
    const stream = response.Body as unknown as ReadableStream<Uint8Array>;
    const reader = stream.getReader();
    
    const chunks: Uint8Array[] = [];
    
    // Read all chunks from the stream
    let result: ReadableStreamReadResult<Uint8Array>;
    do {
      result = await reader.read();
      if (!result.done) {
        chunks.push(result.value);
      }
    } while (!result.done);
    
    // Concatenate chunks into a single buffer
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error getting from R2:", error);
    throw new Error("Failed to get file from storage");
  }
}

/**
 * Generate a unique file key
 * @param folder Folder path
 * @param userId User ID
 * @param originalFilename Original filename
 * @returns Unique file key
 */
export function generateFileKey(
  folder: string, 
  userId: string, 
  originalFilename: string
): string {
  const timestamp = Date.now();
  const fileExtension = originalFilename.split(".").pop() || "";
  return `${folder}/${userId}-${timestamp}.${fileExtension}`;
}