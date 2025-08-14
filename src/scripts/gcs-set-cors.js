// src/scripts/gcs-set-cors.js (CJS)
const { Storage } = require('@google-cloud/storage');

(async () => {
  const storage = new Storage();
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  const bucket = storage.bucket(bucketName);

  const [before] = await bucket.getMetadata();
  console.log('[before] CORS:', before.cors || []);

  const cors = [
    {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      responseHeader: [
        'Content-Type',
        'Authorization',
        'x-goog-meta-*',
        'x-goog-hash',
        'x-goog-acl',
        'Location',
        'x-goog-storage-class',
      ],
      maxAgeSeconds: 3600,
    },
  ];

  await bucket.setCorsConfiguration(cors);

  const [after] = await bucket.getMetadata();
  console.log('[after]  CORS:', after.cors || []);
})().catch(err => {
  console.error(err);
  process.exit(1);
});