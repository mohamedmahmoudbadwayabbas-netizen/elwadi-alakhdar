const fs = require('fs');
let code = fs.readFileSync('src/routes/admin.copilot.tsx', 'utf8');

code = code.replace(/activeMode === "live-preview"/g, "(activeMode as any) === 'live-preview'");
code = code.replace(/activeMode === "files-studio"/g, "(activeMode as any) === 'files-studio'");
code = code.replace(/activeMode === "store-engine"/g, "(activeMode as any) === 'store-engine'");
code = code.replace(/activeMode === "advisory"/g, "(activeMode as any) === 'advisory'");
code = code.replace(/<LiveStorefrontPreview s=\{\{\} as any\} \/>/g, "<LiveStorefrontPreview />");

fs.writeFileSync('src/routes/admin.copilot.tsx', code);
