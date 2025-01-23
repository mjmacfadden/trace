const video = document.getElementById('camera');
const canvas = document.getElementById('overlay');
const context = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const opacityRange = document.getElementById('opacityRange');
const sizeRange = document.getElementById('sizeRange'); // New: Size adjustment slider
const positionXRange = document.getElementById('positionXRange'); // New: Horizontal position slider
const positionYRange = document.getElementById('positionYRange'); // New: Vertical position slider

let image = new Image();
let imageX = 0; 
let imageY = 0; 
let scale = 1; 
let isDragging = false; 
let startX, startY; 
let rotation = 0; 

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
  updateRangeInputs(); // Update range inputs when canvas size changes
});

function updateRangeInputs() {
  sizeRange.max = 2; // Allow image to be twice the size at most, adjust as needed
  sizeRange.value = 1; // Reset to default scale
  positionXRange.min = -canvas.width / 2; // Allow image to move outside canvas bounds
  positionXRange.max = canvas.width / 2;
  positionXRange.value = 0; // Reset to center
  positionYRange.min = -canvas.height / 2;
  positionYRange.max = canvas.height / 2;
  positionYRange.value = 0; // Reset to center
}

// Image upload and validation
imageUpload.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, WebP, or HEIC only).');
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


//File Name
document.getElementById('imageUpload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    document.getElementById('fileNameDisplay').textContent = file.name;
  }
});



// Adjust opacity, size, and position
opacityRange.addEventListener('input', drawOverlay);
sizeRange.addEventListener('input', drawOverlay);
positionXRange.addEventListener('input', drawOverlay);
positionYRange.addEventListener('input', drawOverlay);

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
    positionXRange.value = imageX - canvas.width / 2;
    positionYRange.value = imageY - canvas.height / 2;
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
  scale = 1; // Reset scale when image loads
  imageX = canvas.width / 2; // Center image
  imageY = canvas.height / 2;
  updateRangeInputs(); // Update range inputs based on new image
  drawOverlay();
};

// Redraw the image on canvas
function drawOverlay() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = opacityRange.value;

  // Save the current state
  context.save();

  // Move to the center of the canvas
  context.translate(canvas.width / 2 + parseFloat(positionXRange.value), canvas.height / 2 + parseFloat(positionYRange.value));

  // Apply rotation
  context.rotate((rotation * Math.PI) / 180);

  // Apply scaling
  const currentScale = parseFloat(sizeRange.value);
  context.scale(currentScale, currentScale);

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

