import multer from 'multer';
import { randomUUID } from 'crypto';

const MIME_TO_EXT = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'image/png': '.png',
  'image/jpeg': '.jpg',
};

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (_req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.bin';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype in MIME_TO_EXT) {
    cb(null, true);
  } else {
    cb(new Error('Nicht unterstützter Dateityp. Erlaubt: PDF, TXT, PNG, JPG'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
