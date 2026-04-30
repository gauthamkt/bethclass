import sharp from 'sharp';

sharp('src/assets/caught-banner.svg')
  .png()
  .toFile('src/assets/caught-banner.png')
  .then(() => console.log('✅ SVG converted to PNG successfully!'))
  .catch(err => console.error('❌ Error:', err));
