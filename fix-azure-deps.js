// Script to fix workspace dependencies for Azure deployment
const fs = require('fs');
const path = require('path');

const adminConsoleDir = path.join(__dirname, 'apps/admin-console');
const realtimeClientDir = path.join(__dirname, 'packages/realtime-client');

// Read admin-console package.json
const packageJsonPath = path.join(adminConsoleDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Remove the workspace dependency
delete packageJson.dependencies['@grota/realtime-client'];

// Write back the modified package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Removed @grota/realtime-client from package.json dependencies');

// Copy realtime-client source to admin-console
const targetDir = path.join(adminConsoleDir, 'src/lib/realtime-client');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy all source files
const srcFiles = fs.readdirSync(path.join(realtimeClientDir, 'src'));
srcFiles.forEach(file => {
  const srcPath = path.join(realtimeClientDir, 'src', file);
  const destPath = path.join(targetDir, file);
  fs.copyFileSync(srcPath, destPath);
});

// Copy index files
fs.copyFileSync(
  path.join(realtimeClientDir, 'index.js'),
  path.join(targetDir, 'index.js')
);

fs.copyFileSync(
  path.join(realtimeClientDir, 'index.d.ts'),
  path.join(targetDir, 'index.d.ts')
);

console.log('Copied realtime-client source to admin-console/src/lib/realtime-client/');

// Update imports in files that use @grota/realtime-client
const filesToUpdate = [
  'src/presentation/features/painel-geral/components/RealtimeBridgePanel.tsx',
  'src/presentation/features/esteira-propostas/index.tsx',
  'src/presentation/features/painel-geral/components/RecentActivity.tsx',
  'src/presentation/features/esteira-propostas/components/ProposalTimelineSheet.tsx',
  'app/(admin)/gestao-documentos/page.tsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(adminConsoleDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(
      /from "@grota\/realtime-client"/g,
      'from "@/lib/realtime-client"'
    );
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in ${file}`);
  }
});

console.log('\nDone! The admin-console is now ready for Azure deployment.');
console.log('Note: You may need to run this script again if dependencies change.');
console.log('For production, consider publishing @grota/realtime-client as a proper npm package.');