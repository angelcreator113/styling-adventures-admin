// src/scripts/setAdminClaim.js

const admin = require('firebase-admin');
const readline = require('readline');
const path = require('path');

// Adjust to the actual location of your service account file
const serviceAccountPath = path.resolve(__dirname, '../keys/styling-admin-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

async function listUsers() {
  const users = [];
  let nextPageToken;

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    result.users.forEach((userRecord) => {
      users.push({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || '(No Name)',
        admin: userRecord.customClaims?.admin || false,
      });
    });
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  return users;
}

async function promptUser(users) {
  console.log('\n📋 Select a user to grant admin access:\n');
  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.displayName} (${u.email || 'no email'}) [admin: ${u.admin}]`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nEnter the number of the user: ', (input) => {
      const index = parseInt(input, 10) - 1;
      rl.close();
      if (index >= 0 && index < users.length) {
        resolve(users[index]);
      } else {
        console.error('❌ Invalid selection.');
        process.exit(1);
      }
    });
  });
}

async function setAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Admin claim added for user: ${uid}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting admin claim:', err.message);
    process.exit(1);
  }
}

(async () => {
  const arg = process.argv[2];

  if (arg) {
    try {
      const user = arg.includes('@')
        ? await admin.auth().getUserByEmail(arg)
        : await admin.auth().getUser(arg);

      await setAdmin(user.uid);
    } catch (err) {
      console.error('❌ User not found:', err.message);
      process.exit(1);
    }
  } else {
    const users = await listUsers();
    const selected = await promptUser(users);
    await setAdmin(selected.uid);
  }
})();

