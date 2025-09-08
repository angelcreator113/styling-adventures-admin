// src/pages/admin/themes/ThemeLibrary/hooks/useInfiniteScroll.js
import { useEffect, useRef } from "react";

export default function useInfiniteScroll(onHit, opts = {}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onHit?.();
    }, opts);
    io.observe(node);
    return () => io.disconnect();
  }, [onHit, opts.root, opts.rootMargin, opts.threshold]);

  return { sentinelRef };
}
