const fs = require('fs');
let code = fs.readFileSync('src/routes/admin.copilot.tsx', 'utf8');

code = code.replace(/totalCustomers: 0\n/g, "");
code = code.replace(/totalCustomers: 0/g, "");

fs.writeFileSync('src/routes/admin.copilot.tsx', code);
