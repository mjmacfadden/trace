const video = document.getElementById('camera');
const canvas = document.getElementById('overlay');
const context = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const opacityRange = document.getElementById('opacityRange');

let image = new Image();
let imageX = 0; // Initial image X position
let imageY = 0; // Initial image Y position
let scale = 1; // Initial scale
let isDragging = false; // Drag state
let startX, startY; // Drag start positions

// Access the rear camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
  } catch (err) {
    alert('Camera access denied or unavailable.');
    console.error(err);
  }
}

// Set canvas size to match video feed
video.addEventListener('loadeddata', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
});

// Image upload and validation
imageUpload.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, or HEIC only).');
      imageUpload.value = '';
      return;
    }

    if (file.type === 'image/heic') {
      try {
        const convertedDataURL = await convertHEICtoJPEG(file);
        image.src = convertedDataURL;
      } catch (error) {
        alert('Failed to process the HEIC file.');
        console.error(error);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        image.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
});

async function convertHEICtoJPEG(file) {
  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Adjust opacity
opacityRange.addEventListener('input', drawOverlay);

// Dragging logic
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.offsetX - imageX;
  startY = e.offsetY - imageY;
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    imageX = e.offsetX - startX;
    imageY = e.offsetY - startY;
    drawOverlay();
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

canvas.addEventListener('mouseout', () => {
  isDragging = false;
});

image.onload = () => {
  // Get canvas dimensions
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate aspect ratios
  const imageAspectRatio = image.width / image.height;
  const canvasAspectRatio = canvasWidth / canvasHeight;

  // Determine scaling factor based on aspect ratio
  if (imageAspectRatio > canvasAspectRatio) {
    // Image is wider than the canvas
    scale = canvasWidth / image.width; // Scale by width
  } else {
    // Image is taller than or matches the canvas aspect ratio
    scale = canvasHeight / image.height; // Scale by height
  }

  // Calculate scaled dimensions of the image
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;

  // Center the image in the canvas
  imageX = (canvasWidth - scaledWidth) / 2; // Horizontal centering
  imageY = (canvasHeight - scaledHeight) / 2; // Vertical centering

  // Redraw the image
  drawOverlay();
};

let rotation = 0; // Rotation angle in degrees


// Redraw the image on canvas
function drawOverlay() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = opacityRange.value;

  // Save the current state
  context.save();

  // Move to the center of the canvas
  context.translate(canvas.width / 2, canvas.height / 2);

  // Apply rotation
  context.rotate((rotation * Math.PI) / 180);

  // Draw the image, centered at the origin
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  context.drawImage(
    image,
    -scaledWidth / 2,
    -scaledHeight / 2,
    scaledWidth,
    scaledHeight
  );

  // Restore the previous state
  context.restore();
}

const rotateButton = document.getElementById('rotateButton');

rotateButton.addEventListener('click', () => {
  rotation = (rotation + 90) % 360; // Increment rotation, wrap at 360
  drawOverlay(); // Redraw the canvas with the updated rotation
});


// Start the camera
startCamera();
