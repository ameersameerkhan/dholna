import { describe, expect, it } from "vitest";
import { assetFamilyForViewport } from "./useSceneAssetFamily";

describe("assetFamilyForViewport", () => {
  it("uses portrait artwork for portrait phones", () => {
    expect(assetFamilyForViewport(390, 844)).toBe("portrait");
    expect(assetFamilyForViewport(767, 1024)).toBe("portrait");
  });

  it("uses desktop artwork for wider and landscape viewports", () => {
    expect(assetFamilyForViewport(768, 1024)).toBe("desktop");
    expect(assetFamilyForViewport(844, 390)).toBe("desktop");
    expect(assetFamilyForViewport(1440, 900)).toBe("desktop");
  });
});
