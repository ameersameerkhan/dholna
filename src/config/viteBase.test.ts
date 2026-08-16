import { describe, expect, it } from "vitest";
import viteConfig from "../../vite.config";

describe("Vite production base", () => {
  it("uses relative asset paths so the build is portable across deployment roots", () => {
    const configFactory = viteConfig as (env: {
      command: "build";
      mode: string;
      isSsrBuild: boolean;
      isPreview: boolean;
    }) => { base?: string };

    const config = configFactory({
      command: "build",
      mode: "production",
      isSsrBuild: false,
      isPreview: false,
    });

    expect(config.base).toBe("./");
  });
});
