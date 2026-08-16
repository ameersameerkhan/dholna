import { useEffect, useState } from "react";
import type { SceneAssetFamily } from "../config/scenes";

export function assetFamilyForViewport(
  width: number,
  height: number,
): SceneAssetFamily {
  return width <= 767 && height > width ? "portrait" : "desktop";
}

function currentFamily(): SceneAssetFamily {
  if (typeof window === "undefined") return "desktop";
  return assetFamilyForViewport(window.innerWidth, window.innerHeight);
}

export function useSceneAssetFamily(): SceneAssetFamily {
  const [family, setFamily] = useState(currentFamily);

  useEffect(() => {
    const update = () => setFamily(currentFamily());
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return family;
}
