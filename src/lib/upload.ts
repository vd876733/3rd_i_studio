/**
 * Uploads a file directly to Cloudflare R2 / S3 using client-side pre-signed URLs.
 * Falls back to sandbox upload simulation dynamically if credentials are not configured.
 * 
 * @param file The File object to upload
 * @returns Promise resolving to the public asset URL
 */
export async function uploadFileToR2(file: File): Promise<string> {
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate upload credentials: ${res.statusText}`);
  }

  const { uploadUrl, publicUrl } = await res.json();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to transmit file payload to storage: ${uploadRes.statusText}`);
  }

  return publicUrl;
}
