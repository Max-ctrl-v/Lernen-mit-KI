import OpenAI from 'openai';
import { createWriteStream, unlinkSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import https from 'https';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      try { unlinkSync(destPath); } catch {}
      reject(err);
    });
  });
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
