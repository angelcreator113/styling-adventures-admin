// server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const { FieldValue } = require('firebase-admin/firestore');

// ✅ Firebase initialization
const serviceAccount = require('./path/to/your-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: '<YOUR_BUCKET_NAME>.appspot.com'
});
const bucket = getStorage().bucket();
const db = admin.firestore();

// ✅ Express app setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// ✅ Multer setup: memory storage
const upload = multer({ storage: multer.memoryStorage() });

const allowedTypes = ['closet', 'voice', 'episode'];
const fileFilters = {
  closet: file => file.mimetype.startsWith('image/'),
  voice: file => file.mimetype.startsWith('audio/'),
  episode: file => file.mimetype.startsWith('video/')
};

allowedTypes.forEach(type => {
  app.post(`/upload/${type}`, upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { category, subcategory, subsubcategory } = req.body;
      if (!file) throw new Error("No file uploaded");
      if (!fileFilters[type](file)) throw new Error("Invalid file type");

      const filename = `${Date.now()}-${file.originalname}`;
      const fileRef = bucket.file(`${type}/${filename}`);
      const metadata = {
        metadata: { firebaseStorageDownloadTokens: filename },
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000'
      };

      await fileRef.save(file.buffer, metadata);

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(type + '/' + filename)}?alt=media&token=${filename}`;

      await db.collection(type).add({
        filename: file.originalname,
        url: downloadUrl,
        category: {
          primary: category,
          secondary: subcategory,
          tertiary: subsubcategory || ''
        },
        createdAt: FieldValue.serverTimestamp()
      });

      res.status(200).json({ success: true, fileUrl: downloadUrl });
    } catch (err) {
      console.error(`Error uploading ${type}:`, err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
