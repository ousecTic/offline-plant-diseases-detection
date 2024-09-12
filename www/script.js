// Global variables
let model, classIndices;
const imageUpload = document.getElementById("imageUpload");
const predictButton = document.getElementById("predictButton");
const imagePreview = document.getElementById("imagePreview");
const resultDiv = document.getElementById("result");
const uploadStatus = document.getElementById("uploadStatus");

// Load the TensorFlow.js model
async function loadModel() {
  try {
    model = await tf.loadLayersModel("model/model.json");
    console.log("Model loaded successfully");
    model.summary();
    updatePredictButtonState();
  } catch (error) {
    console.error("Failed to load the model:", error);
    resultDiv.textContent =
      "Failed to load model. Please check console for details.";
  }
}

// Load the class indices (disease names and descriptions)
async function loadClassIndices() {
  try {
    const response = await fetch("model/class_indices.json");
    classIndices = await response.json();
    console.log("Class indices loaded successfully");
  } catch (error) {
    console.error("Failed to load class indices:", error);
    resultDiv.textContent =
      "Failed to load class indices. Please check console for details.";
  }
}

// Preprocess the image for the model
function preprocessImage(img) {
  return tf.tidy(() => {
    const tensor = tf.browser
      .fromPixels(img)
      .resizeNearestNeighbor([224, 224])
      .div(tf.scalar(255))
      .expandDims(0);
    return tensor;
  });
}

// Classify the uploaded image
async function classifyImage() {
  if (!model || !classIndices) {
    resultDiv.textContent =
      "Model or class indices not loaded yet. Please wait.";
    return;
  }

  const file = imageUpload.files[0];
  if (!file) {
    resultDiv.textContent = "Please select an image first.";
    return;
  }

  resultDiv.textContent = "Classifying...";

  try {
    const tensor = preprocessImage(imagePreview);
    const predictions = await model.predict(tensor).data();
    displayResult(predictions);
    tensor.dispose();
  } catch (error) {
    console.error("Error during classification:", error);
    resultDiv.textContent = "Error during classification. Please try again.";
  }
}

// Display the classification result
function displayResult(predictions) {
  const topPrediction = Array.from(predictions)
    .map((p, i) => ({ probability: p, classInfo: classIndices[i] }))
    .sort((a, b) => b.probability - a.probability)[0];

  const confidencePercentage = (topPrediction.probability * 100).toFixed(2);

  const resultHTML = `
        <h2>Prediction Result</h2>
        <div class="result-item">
            <span class="result-label">Detected Condition:</span>
            <span>${topPrediction.classInfo.name}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Confidence:</span>
            <span>${confidencePercentage}%</span>
            <div class="confidence-bar">
                <div class="confidence-level" style="width: ${confidencePercentage}%"></div>
            </div>
        </div>
        <div class="result-item">
            <span class="result-label">Description:</span>
            <p>${topPrediction.classInfo.description}</p>
        </div>
    `;

  resultDiv.innerHTML = resultHTML;
}

// Handle image upload and preview
function handleImageUpload(event) {
  resultDiv.innerHTML = "";
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "inline-block";
      uploadStatus.textContent = "Image uploaded: " + file.name;
      updatePredictButtonState();
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.style.display = "none";
    uploadStatus.textContent = "No image selected";
    updatePredictButtonState();
  }
}

// Update the state of the Predict button
function updatePredictButtonState() {
  predictButton.disabled = !model || !imageUpload.files[0];
}

// Event listeners
imageUpload.addEventListener("change", handleImageUpload);
predictButton.addEventListener("click", classifyImage);

// Initialize the application
async function init() {
  await Promise.all([loadModel(), loadClassIndices()]);
  updatePredictButtonState();
}

init();
