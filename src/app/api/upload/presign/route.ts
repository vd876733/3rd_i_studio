import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "styling-os-bucket";
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;

    const objectKey = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${filename}`;

    // Return a local sandbox simulation upload URL if credentials aren't set
    if (!accessKeyId || !secretAccessKey || !endpoint) {
      const mockUploadUrl = `${request.nextUrl.origin}/api/upload/sandbox?key=${objectKey}`;
      const mockPublicUrl = `https://picsum.photos/seed/${objectKey}/300/300`; // mock public image return
      return NextResponse.json({
        uploadUrl: mockUploadUrl,
        publicUrl: mockPublicUrl,
        key: objectKey,
        simulated: true,
      });
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `${endpoint}/${bucketName}/${objectKey}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key: objectKey,
      simulated: false,
    });
  } catch (error: any) {
    console.error("Error in presign upload API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  // Support standard PUT simulation on this endpoint directly!
  return NextResponse.json({ success: true, message: "Sandbox file upload simulation successful." });
}
