const fs = require('fs');
let code = fs.readFileSync('src/routes/__root.tsx', 'utf8');

if (!code.includes('autoSeedDatabaseIfNeeded')) {
  code = code.replace('import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";', 'import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";\nimport { AnnouncementBar } from "@/components/storefront/AnnouncementBar";');
  
  const rootComp = `function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  
  useEffect(() => {
    // Attempt auto-seed ONLY IF Supabase products are empty (as requested)
    autoSeedDatabaseIfNeeded().catch(console.error);
  }, []);
`;
  
  code = code.replace('function RootComponent() {\n  const { queryClient } = Route.useRouteContext();', rootComp);
  fs.writeFileSync('src/routes/__root.tsx', code);
}
