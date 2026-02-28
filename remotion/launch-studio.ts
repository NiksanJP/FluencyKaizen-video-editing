import { studio } from "remotion";
import { ClipComposition } from "./src/ClipComposition";

// Launch Remotion Studio
console.log("🎬 Launching Remotion Studio...");
console.log("Opening http://localhost:3000 in your browser");

studio()
  .launchBrowser(true)
  .then(() => {
    console.log("✅ Studio is running!");
  })
  .catch((err) => {
    console.error("❌ Failed to launch studio:", err);
    process.exit(1);
  });
