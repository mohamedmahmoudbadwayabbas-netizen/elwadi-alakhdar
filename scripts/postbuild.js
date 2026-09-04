import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const assetsDir = path.join(distDir, "assets");

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const cssFiles = files.filter((f) => f.endsWith(".css"));
  const clientJs = files.filter((f) => f.startsWith("client-") && f.endsWith(".js"));
  const otherJs = files.filter((f) => (f.startsWith("index-") || f.startsWith("web-")) && f.endsWith(".js"));

  const cssTags = cssFiles
    .map((f) => `    <link rel="stylesheet" href="/assets/${f}" />`)
    .join("\n");

  const jsTags = [...clientJs, ...otherJs]
    .map((f) => `    <script type="module" src="/assets/${f}"></script>`)
    .join("\n");

  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>سوبرماركت الوادي الأخضر - Al-Wadi Supermarket</title>
${cssTags}
  </head>
  <body class="min-h-screen bg-background text-foreground antialiased selection:bg-emerald-500 selection:text-white">
    <div id="root"></div>
${jsTags}
  </body>
</html>
`;

  fs.writeFileSync(path.join(distDir, "index.html"), htmlContent, "utf-8");
  console.log("✓ Successfully generated dist/index.html with assets.");
} else {
  console.warn("! Assets directory not found in dist.");
}
