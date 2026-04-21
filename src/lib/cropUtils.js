export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = new Image();
  image.src = imageSrc;
  
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Failed to load image."));
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // THE FIX: Prove to TypeScript that ctx exists before using it
  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  canvas.width = 400;
  canvas.height = 400;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, 'image/jpeg', 0.9);
  });
}