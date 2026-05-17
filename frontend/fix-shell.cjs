const fs = require('fs');
const files = [
  'src/routes/_app.transcription.$id.tsx',
  'src/routes/_app.settings.tsx',
  'src/routes/_app.pricing.tsx',
  'src/routes/_app.history.tsx',
  'src/routes/_app.dashboard.tsx',
  'src/routes/_app.analytics.tsx',
  'src/routes/_app.admin.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import\s+\{\s*Shell\s*\}\s*from\s+["']@\/components\/Shell["'];?\r?\n?/g, '');
    content = content.replace(/<Shell[^>]*>/g, '<>');
    content = content.replace(/<\/Shell>/g, '</>');
    fs.writeFileSync(file, content);
    console.log('Processed', file);
  }
}
