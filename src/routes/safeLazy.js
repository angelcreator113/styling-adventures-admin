// src/routes/safeLazy.js
import React from "react";

export function safeLazy(loader, label) {
  return React.lazy(() =>
    loader()
      .then(mod => {
        console.debug(`[lazy] loaded: ${label}`);
        return { default: mod.default || mod };
      })
      .catch(err => {
        console.error(`[lazy] failed: ${label}`, err);
        throw err;
      })
  );
}
