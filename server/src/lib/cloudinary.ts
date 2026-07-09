import type { Env } from "../types";

type Bindings = Env["Bindings"];

async function sha1Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Cloudinary's signing scheme (shared by every Upload/Admin API call): sort
// params alphabetically, join as "k=v&k=v", append the API secret directly
// (no separator), SHA-1 the result. https://cloudinary.com/documentation/authentication_signatures
async function sign(params: Record<string, string>, apiSecret: string): Promise<string> {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sha1Hex(toSign + apiSecret);
}

// Uploads as `type: "private"` — the resource is never reachable at a plain
// public Cloudinary URL, only via the signed download URL below.
export async function uploadReceipt(
  env: Bindings,
  imageBase64: string,
  publicId: string
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await sign({ public_id: publicId, timestamp, type: "private" }, env.CLOUDINARY_API_SECRET);

  const body = new URLSearchParams({
    file: `data:image/jpeg;base64,${imageBase64}`,
    public_id: publicId,
    timestamp,
    type: "private",
    api_key: env.CLOUDINARY_API_KEY,
    signature,
  });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(20_000),
    body,
  });

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed (${res.status}): ${await res.text()}`);
  }
}

// The private-asset "download" endpoint uses the same signature scheme as
// upload — no need for Cloudinary's separate short-signature delivery-URL
// format. Callers should redirect the client here rather than proxying
// bytes through the Worker.
export async function getSignedDownloadUrl(env: Bindings, publicId: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await sign(
    { public_id: publicId, timestamp, format: "jpg" },
    env.CLOUDINARY_API_SECRET
  );

  const query = new URLSearchParams({
    public_id: publicId,
    timestamp,
    format: "jpg",
    api_key: env.CLOUDINARY_API_KEY,
    signature,
  });

  return `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/download?${query.toString()}`;
}
