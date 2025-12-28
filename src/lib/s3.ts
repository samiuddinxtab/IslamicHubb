export const FILE_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

export function createSignedDownloadUrl(params: {
  bucket?: string;
  key: string;
  expiresInSeconds?: number;
}): { url: string; expiresAt: Date } {
  const expiresInSeconds = params.expiresInSeconds ?? FILE_URL_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const bucket = params.bucket ?? 'stub-bucket';
  const url = new URL(`https://s3.stub.local/${bucket}/${encodeURIComponent(params.key)}`);
  url.searchParams.set('X-Amz-Expires', String(expiresInSeconds));
  url.searchParams.set('X-Amz-Date', new Date().toISOString());

  return { url: url.toString(), expiresAt };
}
