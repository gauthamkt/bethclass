import sharp from 'sharp';

sharp('src/assets/student-still.png')
  .metadata()
  .then(data => {
    console.log(`✅ student-still.png resolution: ${data.width}x${data.height}`);
  })
  .catch(err => console.error('Error:', err.message));
