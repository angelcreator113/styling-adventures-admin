import React, { useEffect, useState } from 'react';
import SceneForm from './SceneForm';
import { getScenes, saveScene, deleteScene } from '@/utils/firestoreScenes';

export default function ClosetSceneManager() {
  const [scenes, setScenes] = useState([]);
  const [selectedScene, setSelectedScene] = useState(null);

  useEffect(() => {
    getScenes().then(setScenes);
  }, []);

  return (
    <section className="container" style={{ padding: 16 }}>
      <header className="dashboard-card" style={{ marginBottom: 24 }}>
        <h1 className="page-title">Closet Scene Manager</h1>
      </header>

      <section style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {scenes.map((scene) => (
          <div key={scene.id} className="dashboard-card" style={{ padding: 16, flex: '1 1 300px' }}>
            <h3>{scene.name}</h3>
            <p>Font: {scene.font}</p>
            <p>Badge: {scene.access?.badgeRequired || 'None'}</p>
            <p>Status: {scene.access?.releaseDate ? 'Scheduled' : 'Draft'}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setSelectedScene(scene)}>Edit</button>
              <button onClick={() => deleteScene(scene.id).then(() => getScenes().then(setScenes))}>Delete</button>
            </div>
          </div>
        ))}
      </section>

      <SceneForm
        scene={selectedScene}
        onSave={() => {
          setSelectedScene(null);
          getScenes().then(setScenes);
        }}
      />
    </section>
  );
}
