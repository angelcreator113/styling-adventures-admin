import React, { useState, useEffect } from 'react';

export default function SceneForm({ scene, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    font: '',
    backgroundImageUrl: '',
    iconSet: '',
    audioFxUrl: '',
    access: {
      default: false,
      vip: false,
      badgeRequired: '',
      releaseDate: '',
      discontinueDate: ''
    }
  });

  useEffect(() => {
    if (scene) setFormData(scene);
  }, [scene]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("access.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        access: { ...prev.access, [key]: type === 'checkbox' ? checked : value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = formData.name.toLowerCase().replace(/\s+/g, '-');
    const sceneWithId = { ...formData, id };
    const { saveScene } = await import('@/utils/firestoreScenes');
    await saveScene(sceneWithId);
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="dashboard-card" style={{ marginTop: 32, padding: 16 }}>
      <h3>{scene ? 'Edit Scene' : 'Create New Scene'}</h3>
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Scene Name" required />
      <input name="font" value={formData.font} onChange={handleChange} placeholder="Font Family" />
      <input name="backgroundImageUrl" value={formData.backgroundImageUrl} onChange={handleChange} placeholder="Background Image URL" />
      <input name="iconSet" value={formData.iconSet} onChange={handleChange} placeholder="Icon Set (e.g. glossy-pink)" />
      <input name="audioFxUrl" value={formData.audioFxUrl} onChange={handleChange} placeholder="Audio FX URL (optional)" />

      <label><input type="checkbox" name="access.default" checked={formData.access.default} onChange={handleChange} /> Default</label>
      <label><input type="checkbox" name="access.vip" checked={formData.access.vip} onChange={handleChange} /> VIP Only</label>
      <input name="access.badgeRequired" value={formData.access.badgeRequired} onChange={handleChange} placeholder="Badge Required (optional)" />
      <input name="access.releaseDate" type="datetime-local" value={formData.access.releaseDate} onChange={handleChange} />
      <input name="access.discontinueDate" type="datetime-local" value={formData.access.discontinueDate} onChange={handleChange} />

      <button type="submit">Save Scene</button>
    </form>
  );
}
