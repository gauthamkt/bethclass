import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = 'src/assets';
const targetSize = 32;

// Images to resize
const imagesToResize = [
  'student-still.png',
  'student-throwing.png',
  'student-caught.png',
  'beth-front.png',
  'beth-back.png',
  'beth-warning.png',
  'beth-caught.png'
];

async function resizeImages() {
  for (const imageName of imagesToResize) {
    const imagePath = path.join(assetsDir, imageName);
    const tempPath = path.join(assetsDir, `temp_${imageName}`);
    
    if (fs.existsSync(imagePath)) {
      try {
        await sharp(imagePath)
          .resize(targetSize, targetSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toFile(tempPath);
        
        // Replace original with resized version
        fs.renameSync(tempPath, imagePath);
        console.log(`✅ Resized ${imageName} to ${targetSize}x${targetSize}`);
      } catch (err) {
        console.error(`❌ Error resizing ${imageName}:`, err.message);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    } else {
      console.log(`⚠️  ${imageName} not found`);
    }
  }
}

resizeImages();
