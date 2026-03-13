import { Config } from "@remotion/cli/config";

// Keep all render paths aligned with the project layout.
Config.setPublicDir("src/remotion/public");

// New clips are added continuously during Studio sessions, so cached bundles
// can miss freshly copied public assets.
Config.setCachingEnabled(false);
