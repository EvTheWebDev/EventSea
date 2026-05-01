// src/lib/cropUtils.js

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  // FIXED: Define a maximum size for the profile picture
  const MAX_SIZE = 400;

  // Calculate how much we need to shrink the image to fit MAX_SIZE
  // (If the crop is already smaller than 400px, scale stays at 1 so we don't stretch it)
  const scale = Math.min(MAX_SIZE / pixelCrop.width, MAX_SIZE / pixelCrop.height, 1);

  // Set the canvas to the new, smaller size
  canvas.width = pixelCrop.width * scale;
  canvas.height = pixelCrop.height * scale;

  // Draw the image onto the canvas, automatically shrinking it
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    // FIXED: Drop the quality slightly to 0.85 to further compress the file
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.85); 
  });
}