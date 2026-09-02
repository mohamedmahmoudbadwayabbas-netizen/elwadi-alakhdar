const fs = require('fs');

const path = 'src/routes/admin.copilot.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Find the start of MAIN CHAT / WORKSPACE VIEW
const startMarker = '{/* ─── 2. MAIN CHAT / WORKSPACE VIEW ─── */}';
const startIndex = code.indexOf(startMarker);

// 2. We will replace everything from startIndex to the final `</div>` before `</CopilotTourGuide>`
// Instead of doing it blindly, let's extract the chat block (activeMode === "chat") and the other blocks.

const newLayoutStart = `      {/* ─── 2. MAIN SPLIT WORKSPACE ─── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative">
        {/* RIGHT CHAT PANE (First in RTL flex-row) */}
        <div className="w-full lg:w-[400px] xl:w-[480px] h-[50vh] lg:h-full shrink-0 border-b lg:border-b-0 lg:border-l border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col z-10 relative">
`;

// Replace `<div className="flex-1 min-h-0 relative">` 
// and `{activeMode === "chat" && (`
code = code.replace(
  /<div className="flex-1 min-h-0 relative">\s*\{activeMode === "chat" && \(\s*<div className="h-full flex flex-col">/g,
  newLayoutStart + '          <div className="h-full flex flex-col">'
);

// Close Chat Pane and Start Left Pane. Look for `)}` right before `{/* ─── OTHER MODES ─── */}`
const otherModesMarker = '{/* ─── OTHER MODES ─── */}';
code = code.replace(
  /\)\}\s*\{\/\* ─── OTHER MODES ─── \*\/\}/,
  `
        </div>

        {/* LEFT WORKSPACE PANE */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 relative">
          {activeMode === "live-preview" && (
            <div className="h-full overflow-y-auto">
              <LiveStorefrontPreview />
            </div>
          )}
`
);

// Ensure LiveStorefrontPreview is imported
if (!code.includes('LiveStorefrontPreview')) {
  code = code.replace(
    'import { GeminiProjectFilesStudio } from "@/components/admin/GeminiProjectFilesStudio";',
    'import { GeminiProjectFilesStudio } from "@/components/admin/GeminiProjectFilesStudio";\nimport LiveStorefrontPreview from "@/components/admin/LiveStorefrontPreview";'
  );
}

fs.writeFileSync(path, code);
