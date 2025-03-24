from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import dlib
import base64
import os
import gdown
# from io import BytesIO
# from PIL import Image

app = Flask(__name__)

# Define the model file path
MODEL_PATH = "shape_predictor_68_face_landmarks.dat"

# Check if file exists, otherwise download
if not os.path.exists(MODEL_PATH):
    print("Downloading shape predictor model...")
    file_id = "1aBcD3eFgHIJKlmNOPQRsTUVwxYZ"  # Replace with your Google Drive file ID
    url = f"https://drive.google.com/uc?id={file_id}"
    gdown.download(url, MODEL_PATH, quiet=False)

# Load the model after downloading
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor(MODEL_PATH)

UPLOAD_FOLDER = "static/uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# detector = dlib.get_frontal_face_detector()
# predictor = dlib.shape_predictor("C:/MINI-FACESWAP/CLARK/FACESWAP/shape_predictor_68_face_landmarks.dat")

# UPLOAD_FOLDER = "static/uploads/"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALIGN_POINTS = list(range(17, 68))

def get_landmarks(im):
    rects = detector(im, 1)
    if len(rects) > 1:
        return None
    if len(rects) == 0:
        return None
    return np.matrix([[p.x, p.y] for p in predictor(im, rects[0]).parts()])

def warp_im(im, M, dshape):
    output_im = np.zeros(dshape, dtype=im.dtype)
    cv2.warpAffine(im, M[:2], (dshape[1], dshape[0]), dst=output_im, borderMode=cv2.BORDER_TRANSPARENT)
    return output_im

def face_swap(image1_path, image2_path):
    image1 = cv2.imread(image1_path)
    image2 = cv2.imread(image2_path)
    
    im1_gray = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    im2_gray = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)
    
    rects1 = detector(im1_gray)
    rects2 = detector(im2_gray)
    
    if len(rects1) == 0 or len(rects2) == 0:
        print("Face not detected in one or both images")
        return None
       # return "static/error.jpg"
    
    landmarks1 = predictor(im1_gray, rects1[0])
    landmarks2 = predictor(im2_gray, rects2[0])
    
    points1 = np.array([(p.x, p.y) for p in landmarks1.parts()])
    points2 = np.array([(p.x, p.y) for p in landmarks2.parts()])
    
    # Compute affine transform
    M, _ = cv2.estimateAffinePartial2D(points2, points1)
    warped_im2 = cv2.warpAffine(image2, M, (image1.shape[1], image1.shape[0]))

    # Create a mask for seamless cloning
    mask = np.zeros_like(im1_gray)
    convex_hull = cv2.convexHull(points1)
    cv2.fillConvexPoly(mask, convex_hull, 255)

    # Find the center of the face for cloning
    (x, y, w, h) = cv2.boundingRect(convex_hull)
    center = (x + w // 2, y + h // 2)

    # Perform seamless cloning (Poisson blending)
    swapped_face = cv2.seamlessClone(warped_im2, image1, mask, center, cv2.NORMAL_CLONE)

    output_path = os.path.join(UPLOAD_FOLDER, "swapped.jpg")
    cv2.imwrite(output_path, swapped_face)
    return f"/{output_path}"


def save_base64_image(data, filename):
    image_data = base64.b64decode(data.split(',')[1])
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    with open(image_path, "wb") as f:
        f.write(image_data)
    return image_path

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    data1 = request.json.get("image1")
    data2 = request.json.get("image2")
    
    if not data1 or not data2:
        return jsonify({"error": "Both images are required"}), 400
    path1 = save_base64_image(data1, "image1.jpg")
    path2 = save_base64_image(data2, "image2.jpg")
    
    swapped_path = face_swap(path1, path2)

    if swapped_path:
        return jsonify({"swapped_image": swapped_path})
    else:
        return jsonify({"error: face swap failed"}), 400


if __name__ == '__main__':
    app.run(debug=True)
