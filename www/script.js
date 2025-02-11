// Global variables
let model, classIndices;
const imageUpload = document.getElementById("imageUpload");
const predictButton = document.getElementById("predictButton");
const imagePreview = document.getElementById("imagePreview");
const resultDiv = document.getElementById("result");
const sampleGallery = document.getElementById("sampleGallery");
const loadingOverlay = document.querySelector(".loading-overlay");
const previewContainer = document.querySelector(".preview-container");

// Sample images data
const sampleImages = [
  { src: "assets/samples/apple_black_rot.jpg", label: "Apple Black Rot" }, 
  { src: "assets/samples/corn_common_rust.jpg", label: "Corn Common Rust" },
  { src: "assets/samples/grape_leaf_blight.jpg", label: "Grape Leaf Blight" },
  { src: "assets/samples/tomato_bacterial_spot.jpg", label: "Tomato Bacterial Spot" }
];

// Initialize the application
async function init() {
  showLoading("Loading model...");
  try {
    // Set up CPU backend for consistent results across devices
    // You can use GPU if if you have good webgl support
    await tf.setBackend('cpu');
    await tf.ready();
    
    // Load model and class indices
    await Promise.all([loadModel(), loadClassIndices()]);
    initSampleGallery();
  } catch (error) {
    console.error("Initialization failed:", error);
  } finally {
    hideLoading();
  }
}

// Show loading overlay with custom message
function showLoading(message = "Processing...") {
  loadingOverlay.querySelector('.loading-text').textContent = message;
  loadingOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Hide loading overlay
function hideLoading() {
  loadingOverlay.style.display = 'none';
  document.body.style.overflow = ''; // Restore scrolling
}

// Load the TensorFlow.js model
async function loadModel() {
  try {
    model = await tf.loadLayersModel("model/model.json");
    updatePredictButtonState();
  } catch (error) {
    console.error("Failed to load the model:", error);
    resultDiv.textContent = "Failed to load model. Please try again.";
  }
}

// Load class indices
async function loadClassIndices() {
  try {
    const response = await fetch("model/class_indices.json");
    classIndices = await response.json();
  } catch (error) {
    console.error("Failed to load class indices:", error);
    resultDiv.textContent = "Failed to load disease classifications. Please try again.";
  }
}

// Initialize sample gallery
function initSampleGallery() {
  sampleGallery.innerHTML = '';
  sampleImages.forEach(imageData => {
    const img = document.createElement('img');
    img.src = imageData.src;
    img.alt = imageData.label;
    img.className = 'sample-image';
    img.title = imageData.label;
    img.onclick = () => handleSampleImageSelect(img);
    sampleGallery.appendChild(img);
  });
}

// Preprocess the image for the model
function preprocessImage(img) {
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(img);
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    const normalized = resized.div(tf.scalar(255));
    return normalized.expandDims(0);
  });
}

// Classify the image
async function classifyImage() {
  if (!model || !classIndices) {
    resultDiv.textContent = "Model or class indices not loaded yet. Please wait.";
    return;
  }

  const file = imageUpload.files[0];
  if (!file && !document.querySelector('.sample-image.selected')) {
    resultDiv.textContent = "Please select an image first.";
    return;
  }

  // Show loading state with specific message
  showLoading("Analyzing image...");
  updateUIState(true);

  try {
    const selectedImage = file ? imagePreview : document.querySelector('.sample-image.selected');
    
    // Add a small delay to ensure loading state is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const tensor = preprocessImage(selectedImage);
    const predictions = await model.predict(tensor).data();
    displayResult(predictions);
    tensor.dispose();
  } catch (error) {
    console.error("Error during classification:", error);
    resultDiv.textContent = "Error during classification. Please try again.";
  } finally {
    hideLoading();
    updateUIState(false);
  }
}

// Update UI state during classification
function updateUIState(isClassifying) {
  predictButton.disabled = isClassifying;
  predictButton.textContent = isClassifying ? " Classifying..." : " Classify Disease";
  predictButton.classList.toggle('loading', isClassifying);
  if (isClassifying) {
    resultDiv.textContent = "Analyzing image...";
  }
}

// Display the classification result
function displayResult(predictions) {
  resultDiv.innerHTML = "";
  
  // Create header section
  const header = document.createElement('div');
  header.className = 'result-header';
  header.innerHTML = `
    <h2>Analysis Results</h2>
    <div class="result-explanation">
      Based on the image analysis, here are the most likely plant diseases detected, 
      ranked by confidence level. The primary match is highlighted, with alternative 
      possibilities listed below.
    </div>
  `;
  resultDiv.appendChild(header);

  // Create results container
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'result-items';

  // Sort and get top 3 predictions
  const results = Array.from(predictions)
    .map((confidence, index) => ({
      name: classIndices[index].name,
      description: classIndices[index].description,
      confidence: confidence * 100
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  // Add rank classes for visual hierarchy
  const rankClasses = ['primary', 'secondary', 'tertiary'];
  const rankLabels = ['Primary Match', 'Alternative 1', 'Alternative 2'];

  results.forEach((result, index) => {
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${rankClasses[index]}`;
    
    const label = document.createElement('div');
    label.className = 'result-label';
    
    const confidenceLabel = document.createElement('div');
    confidenceLabel.className = 'confidence-label';
    confidenceLabel.textContent = rankLabels[index];
    
    const diseaseName = document.createElement('div');
    diseaseName.className = 'disease-name';
    diseaseName.textContent = result.name;
    
    const confidenceValue = document.createElement('div');
    confidenceValue.className = 'confidence-value';
    confidenceValue.textContent = `${result.confidence.toFixed(1)}%`;
    
    label.appendChild(diseaseName);
    label.appendChild(confidenceValue);
    
    const bar = document.createElement('div');
    bar.className = 'confidence-bar';
    
    const level = document.createElement('div');
    level.className = 'confidence-level';
    level.style.width = '0%';
    
    const description = document.createElement('div');
    description.className = 'result-description';
    description.textContent = result.description;
    
    bar.appendChild(level);
    resultItem.appendChild(confidenceLabel);
    resultItem.appendChild(label);
    resultItem.appendChild(bar);
    resultItem.appendChild(description);
    resultsContainer.appendChild(resultItem);
    
    // Animate the confidence bar with a staggered delay
    setTimeout(() => {
      level.style.width = `${result.confidence}%`;
    }, 100 * (index + 1));
  });

  resultDiv.appendChild(resultsContainer);
}

// Handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    showLoading("Loading image...");
    const reader = new FileReader();
    reader.onload = function(e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
      imagePreview.onload = function() {
        imagePreview.classList.add('visible');
        previewContainer.classList.add('has-image');
      };
      document.querySelectorAll('.sample-image').forEach(img => img.classList.remove('selected'));
      updatePredictButtonState();
      hideLoading();
    };
    reader.readAsDataURL(file);
  }
}

// Handle sample image selection
function handleSampleImageSelect(img) {
  showLoading("Loading sample...");
  document.querySelectorAll('.sample-image').forEach(image => image.classList.remove('selected'));
  img.classList.add('selected');
  imagePreview.src = img.src;
  imagePreview.style.display = "block";
  imagePreview.onload = function() {
    imagePreview.classList.add('visible');
    previewContainer.classList.add('has-image');
  };
  imageUpload.value = "";
  updatePredictButtonState();
  hideLoading();
}

// Reset image preview
function resetImagePreview() {
  imagePreview.classList.remove('visible');
  previewContainer.classList.remove('has-image');
  imagePreview.src = '';
  updatePredictButtonState();
}

// Update predict button state
function updatePredictButtonState() {
  const hasImage = imageUpload.files.length > 0 || document.querySelector('.sample-image.selected');
  predictButton.disabled = !hasImage || !model;
}

// Event listeners
imageUpload.addEventListener("change", handleImageUpload);
predictButton.addEventListener("click", classifyImage);

// Initialize the app
init();
