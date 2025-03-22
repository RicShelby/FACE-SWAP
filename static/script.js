let video = document.getElementById("video");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error("Error accessing webcam", err));

let images = {};

function captureImage(num) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    images[`image${num}`] = canvas.toDataURL("image/jpeg");

    document.getElementById(`img${num}`).src = images[`image${num}`];
}

function swapFaces() {
    // console.log("swapFaces() function called.");
    // console.log("Swap button clicked");

    if (!images.image1 || !images.image2) {
        alert("Capture both images first!");
        return;
    }
    
    fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(images)
    })
    .then(response => response.json())
    .then(data => {
        if (data.swapped_image) {
            document.getElementById("swappedImage").src = data.swapped_image;
            document.getElementById("swappedImage").style.display = "block"; // Show swapped image
        } else {
            alert("Face swap failed!");
        }
        // document.getElementById("swappedImage").src = data.swappedImage;
    })
    .catch(err => console.error("Error swapping faces", err));
}

document.addEventListener("DOMContentLoaded", () => {
    let swapButton = document.getElementById("swap-button");
    if (swapButton) {
        swapButton.addEventListener("click", function(event) {
            event.preventDefault(); // Prevent form submission (if inside a form)
            swapFaces(); // Call the face swap function
        });
    } else {
        console.error("Swap button not found! Check your HTML.");
    }
});