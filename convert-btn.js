import sharp from 'sharp';

sharp('src/assets/try-again-btn.svg')
  .png()
  .toFile('src/assets/try-again-btn.png')
  .then(() => console.log('✅ Try Again button SVG converted to PNG!'))
  .catch(err => console.error('❌ Error:', err));
