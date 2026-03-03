import OpenAI from 'openai';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function downloadImage(url, destPath) {
  // Use fetch with a 30-second timeout instead of bare https.get (which has no timeout)
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destPath, buffer);
}

export async function generateImage(imagePrompt) {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0].url;

    // Download and save locally
    const filename = `${randomUUID()}.png`;
    const destPath = path.join('uploads', filename);
    await downloadImage(imageUrl, destPath);

    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Image generation failed:', err.message);
    return null;
  }
}
