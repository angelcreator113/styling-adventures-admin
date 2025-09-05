// scripts/dev-make-admin.js
// Promotes an existing emulator user to admin (superAdmin) with claims.
const admin = require('firebase-admin');

// point Admin SDK at the emulators
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'styling-admin';

try { admin.app(); } catch { admin.initializeApp({ projectId }); }

(async () => {
  const email = process.argv[2]; // pass the email on the command line
  if (!email) {
    console.error('Usage: node scripts/dev-make-admin.js user@example.com');
    process.exit(1);
  }

  try {
    const u = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(u.uid, {
      role: 'admin',
      admin: true,
      adminRoles: ['superAdmin'], // full power so you can manage roles
    });
    console.log('✅ Promoted', email, '→ admin (superAdmin). uid=', u.uid);
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(2);
  }
  process.exit(0);
})();
