let video = document.getElementById("video");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error("Error accessing webcam", err));

let images = {};

// Capture image from webcam
function captureImage(num) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    images[`image${num}`] = canvas.toDataURL("image/jpeg");

    document.getElementById(`img${num}`).src = images[`image${num}`];
}

// Swap faces and display results
function swapFaces() {
    if (!images.image1 || !images.image2) {
        alert("Capture both images first!");
        return;
    }

    console.log("Swapping faces with images:", images);

    fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(images)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response from server:", data);
        if (data.swapped_image) {
            document.getElementById("swappedImage").src = data.swapped_image;
            document.getElementById("swappedImage").style.display = "block";
            document.getElementById("downloadButton").href = data.swapped_image; 
            document.getElementById("downloadButton").style.display = "block";
        }
    })
    .catch(err => console.error("Error swapping faces", err));
}

// Handle download with error handling
function handleDownload() {
    if (!images.image1 || !images.image2) {
        alert("Capture an image first before downloading!");
    } else {
        const downloadButton = document.getElementById("downloadButton");
        downloadButton.href = swapped.jpg; 
        downloadButton.download = "swapped_image.jpg"; 
    }
}


function handleUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = handleImageUpload;
    fileInput.click();
}

let currentImageIndex = 1; // Track which image to upload (1 or 2)

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          
            images[`image${currentImageIndex}`] = e.target.result; 
            document.getElementById(`img${currentImageIndex}`).src = images[`image${currentImageIndex}`]; 
            
            // Toggle the index for the next upload
            currentImageIndex = currentImageIndex === 1 ? 2 : 1;
        };
        reader.readAsDataURL(file);
    }
}



const downloadButton = document.getElementById("downloadButton");
downloadButton.addEventListener("click", handleDownload); // Add download handling

let swapButton = document.getElementById("swap-button");
if (swapButton) {
    swapButton.addEventListener("click", function (event) {
        event.preventDefault();
        swapFaces();
    });
} else {
    console.error("Swap button not found! Check your HTML.");
}
