export async function fetchPhotos(count = 8) {
  try {
    // 5-second timeout so session creation does not hang on a slow external API
    const response = await fetch(
      `https://randomuser.me/api/?results=${count}&inc=picture&nat=de,fr,gb`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error('randomuser.me unavailable');
    const data = await response.json();
    return data.results.map((r) => r.picture.large);
  } catch {
    // Fallback to DiceBear avatars
    return Array.from({ length: count }, (_, i) =>
      `https://api.dicebear.com/7.x/avataaars/svg?seed=medat-${Date.now()}-${i}`
    );
  }
}
