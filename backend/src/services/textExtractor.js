import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import OpenAI from 'openai';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractText(filePath, sourceType) {
  switch (sourceType) {
    case 'txt':
      return fs.readFile(filePath, 'utf-8');

    case 'pdf': {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    }

    case 'image': {
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const response = await openai.chat.completions.create({
        model: 'gpt-5.2',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extrahiere den gesamten Text aus diesem Bild. Gib nur den extrahierten Text zurück, ohne Kommentare.',
              },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      return response.choices[0].message.content;
    }

    default:
      throw new Error(`Unbekannter Dateityp: ${sourceType}`);
  }
}
