// 📁 js/dashboard/episode-dashboard.js

import { db } from '../utils/firebase-client.js';
import {
  collection,
  getDocs,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/**
 * 🎬 Refresh the Episode Dashboard
 * Fetches uploaded episodes from Firestore and renders them
 */
export async function refreshEpisodeDashboard() {
  const grid = document.getElementById('episode-dashboard-grid');
  if (!grid) return;

  grid.innerHTML = ''; // Clear any existing content

  try {
    const q = query(collection(db, 'episodes'), orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      grid.innerHTML = '<p class="empty-state">No episodes uploaded yet.</p>';
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'dashboard-card episode-card';
      card.innerHTML = `
        <video src="${data.fileUrl}" class="dashboard-preview" controls></video>
        <div class="dashboard-meta">
          <h4>${data.filename || 'Untitled Episode'}</h4>
          <p>${data.category} → ${data.subcategory}${data.subsubcategory ? ` → ${data.subsubcategory}` : ''}</p>
        </div>
      `;
      grid.appendChild(card);
    });

  } catch (err) {
    console.error('❌ Error loading episodes:', err);
    grid.innerHTML = '<p class="error">Something went wrong loading your episodes.</p>';
  }
}
