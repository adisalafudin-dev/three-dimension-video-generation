import { staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

// Local font so every machine renders the same glyphs (file: public/fonts/Inter-Bold.woff2)
loadFont({
  family: "Inter",
  url: staticFile("fonts/Inter-Bold.woff2"),
  weight: "700",
});
