const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const message = document.getElementById('message');
const rewardMessage = document.getElementById('rewardMessage');
const smileIndicator = document.getElementById('smileIndicator');

let model = null;
let isSmiling = false;
let smileDetectionCount = 0;
let lastRewardTime = 0;
const SMILE_THRESHOLD = 0.02; // Threshold for smile detection
const REQUIRED_SMILE_FRAMES = 20; // Number of consecutive frames needed to trigger reward
const REWARD_COOLDOWN = 5000; // Minimum time between rewards (ms)

// Initialize camera
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        video.srcObject = stream;
        
        video.addEventListener('loadedmetadata', async () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            await loadModel();
            if (model) {
                detectFaces();
            }
        });
    } catch (error) {
        console.error('Error accessing camera:', error);
        message.innerHTML = `
            <h1>Camera Access Required</h1>
            <p>Please allow camera access to continue...</p>
        `;
    }
}

// Load TensorFlow.js face detection model
async function loadModel() {
    try {
        // Check if library is loaded - it might be faceLandmarksDetection or window.faceLandmarksDetection
        const faceLandmarksDetectionLib = window.faceLandmarksDetection || faceLandmarksDetection;
        if (!faceLandmarksDetectionLib) {
            throw new Error('Face landmarks detection library not loaded');
        }
        
        // Version 1.0.6 uses createDetector instead of load
        const modelType = faceLandmarksDetectionLib.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
            maxFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        };
        
        model = await faceLandmarksDetectionLib.createDetector(modelType, detectorConfig);
        console.log('Model loaded successfully');
        message.innerHTML = `
            <h1>Hey Shuttumani</h1>
            <p>Show me your beautiful smile...</p>
        `;
    } catch (error) {
        console.error('Error loading model:', error);
        message.innerHTML = `
            <h1>Error Loading Face Detection</h1>
            <p>Error: ${error.message}</p>
            <p>Please refresh the page...</p>
        `;
    }
}

// Detect faces and smiles
async function detectFaces() {
    if (!model || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(detectFaces);
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    try {
        const predictions = await model.estimateFaces(video, {
            flipHorizontal: false
        });
        
        if (predictions.length > 0) {
            const prediction = predictions[0];
            // MediaPipe FaceMesh returns keypoints with x, y, z properties
            const keypoints = prediction.keypoints || prediction.scaledMesh || [];
            const keypointsArray = keypoints.map(kp => Array.isArray(kp) ? kp : [kp.x, kp.y]);
            
            if (keypointsArray && keypointsArray.length >= 468) {
                const isSmilingDetected = detectSmile(keypointsArray);
                
                if (isSmilingDetected) {
                    smileDetectionCount++;
                    if (smileDetectionCount >= REQUIRED_SMILE_FRAMES && !isSmiling) {
                        const now = Date.now();
                        if (now - lastRewardTime > REWARD_COOLDOWN) {
                            triggerReward();
                            lastRewardTime = now;
                        }
                    }
                } else {
                    smileDetectionCount = Math.max(0, smileDetectionCount - 1);
                }
            }
        } else {
            smileDetectionCount = Math.max(0, smileDetectionCount - 1);
        }
    } catch (error) {
        console.error('Detection error:', error);
    }
    
    requestAnimationFrame(detectFaces);
}

// Detect smile using facial landmarks
function detectSmile(keypoints) {
    // MediaPipe Face Mesh landmarks for mouth
    // Left corner: 61, Right corner: 291
    // Top lip center: 13, Bottom lip center: 14
    
    const leftCorner = keypoints[61];
    const rightCorner = keypoints[291];
    const topLipCenter = keypoints[13];
    const bottomLipCenter = keypoints[14];
    
    if (!leftCorner || !rightCorner || !topLipCenter || !bottomLipCenter) {
        return false;
    }
    
    // Calculate mouth width
    const mouthWidth = Math.sqrt(
        Math.pow(rightCorner[0] - leftCorner[0], 2) +
        Math.pow(rightCorner[1] - leftCorner[1], 2)
    );
    
    // Calculate average Y position of mouth corners
    const avgCornerY = (leftCorner[1] + rightCorner[1]) / 2;
    
    // Calculate center Y position of mouth
    const centerY = (topLipCenter[1] + bottomLipCenter[1]) / 2;
    
    // Calculate mouth opening
    const mouthOpening = Math.abs(topLipCenter[1] - bottomLipCenter[1]);
    
    // Smile detection: corners should be higher than center (lower Y value = higher position)
    // For a smile, corners should be HIGHER, which means LOWER Y values
    // So we want: centerY > avgCornerY (center is lower than corners = corners are higher)
    const smileRatio = (centerY - avgCornerY) / (mouthWidth + 0.001);
    
    // Normalize mouth opening
    const normalizedOpening = mouthOpening / (mouthWidth + 0.001);
    
    // Smile detected if corners are higher and mouth opening is reasonable
    return smileRatio > SMILE_THRESHOLD && normalizedOpening < 0.5;
}

// Trigger reward message
function triggerReward() {
    isSmiling = true;
    rewardMessage.classList.add('active');
    smileIndicator.classList.add('active');
    
    // Hide reward after 4 seconds
    setTimeout(() => {
        rewardMessage.classList.remove('active');
        
        // Reset after a delay
        setTimeout(() => {
            isSmiling = false;
            smileDetectionCount = 0;
            
            // Keep indicator visible for a bit longer, then fade
            setTimeout(() => {
                if (smileDetectionCount < REQUIRED_SMILE_FRAMES) {
                    smileIndicator.classList.remove('active');
                }
            }, 2000);
        }, 500);
    }, 4000);
}

// Initialize everything when page loads
window.addEventListener('load', () => {
    // Wait for TensorFlow.js to load
    setTimeout(() => {
        if (typeof window.faceLandmarksDetection !== 'undefined' || typeof faceLandmarksDetection !== 'undefined') {
            initCamera();
        } else {
            message.innerHTML = `
                <h1>Loading Face Detection Library...</h1>
                <p>Please wait...</p>
            `;
            // Try again after a delay
            setTimeout(() => {
                if (typeof window.faceLandmarksDetection !== 'undefined' || typeof faceLandmarksDetection !== 'undefined') {
                    initCamera();
                } else {
                    message.innerHTML = `
                        <h1>Error: Library Not Found</h1>
                        <p>Please check your internet connection and refresh...</p>
                    `;
                }
            }, 2000);
        }
    }, 500);
});
