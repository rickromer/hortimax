import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "py.hortimax.portal",
  appName: "HORTIMAX",
  webDir: "dist/public",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
};

export default config;
