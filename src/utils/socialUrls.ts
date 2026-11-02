/** Normalises a stored Instagram handle or URL into a full profile link. */
export function getInstagramUrl(handleOrUrl: string): string {
  if (handleOrUrl.startsWith('http://') || handleOrUrl.startsWith('https://')) return handleOrUrl;
  return `https://instagram.com/${handleOrUrl.replace(/^@/, '')}`;
}

/** Normalises a stored TikTok handle or URL into a full profile link. */
export function getTikTokUrl(handleOrUrl: string): string {
  if (handleOrUrl.startsWith('http://') || handleOrUrl.startsWith('https://')) return handleOrUrl;
  return `https://tiktok.com/@${handleOrUrl.replace(/^@/, '')}`;
}
