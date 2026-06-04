import { ref, nextTick } from "vue";
import { createLetterDetectionEngine } from "./useLetterDetection";

export function useCameraDetection() {
  const USE_LANDMARK_DETECTOR = true;

  const videoElement = ref(null);
  const canvasElement = ref(null);
  const containerElement = ref(null);

  const isHandDetected = ref(false);
  const isCameraActive = ref(false);
  const recognizedText = ref("");
  const cameraStream = ref(null);
  const gestureConfidence = ref(0);
  const detectedLetter = ref("");
  const currentHandedness = ref("Unknown");
  const showLandmarkNumbers = ref(true);
  const savedWord = ref("");
  const saveAnimation = ref(false);

  const MODEL_INPUT_IS_MIRRORED = false;

  let hands = null;
  let camera = null;
  let canvasCtx = null;

  const appendDetectedLetter = (letter) => {
    if (!letter) return;

    savedWord.value += letter;
    saveAnimation.value = true;
    setTimeout(() => {
      saveAnimation.value = false;
    }, 500);
  };

  const letterDetection = createLetterDetectionEngine({
    useLandmarkDetector: USE_LANDMARK_DETECTOR,
    onAutoSave: appendDetectedLetter,
  });

  const applyLetterState = (state) => {
    detectedLetter.value = state.detectedLetter;
    recognizedText.value = state.recognizedText;
    gestureConfidence.value = state.gestureConfidence;
  };

  const clearDetectedState = () => {
    isHandDetected.value = false;
    currentHandedness.value = "Unknown";
    applyLetterState(letterDetection.onNoHandDetected());
  };

  const initializeMediaPipe = async () => {
    try {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
      document.head.appendChild(script);

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });

      if (!window.Hands) {
        throw new Error("Hands no esta disponible en window");
      }

      hands = new window.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onHandsResults);

      try {
        const cameraScript = document.createElement("script");
        cameraScript.src =
          "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
        document.head.appendChild(cameraScript);

        await new Promise((resolve) => {
          cameraScript.onload = resolve;
          cameraScript.onerror = () => resolve();
        });

        return { Camera: window.Camera || null };
      } catch (camError) {
        return { Camera: null };
      }
    } catch (error) {
      return { Camera: null };
    }
  };

  const resolveHandedness = (results) => {
    const firstHandedness = results?.multiHandedness?.[0];
    const rawLabel =
      firstHandedness?.label ||
      firstHandedness?.classification?.[0]?.label ||
      "";

    if (rawLabel !== "Left" && rawLabel !== "Right") {
      return "Unknown";
    }

    if (MODEL_INPUT_IS_MIRRORED) {
      return rawLabel;
    }

    return rawLabel === "Left" ? "Right" : "Left";
  };

  const onHandsResults = (results) => {
    if (!canvasCtx || !videoElement.value || !canvasElement.value) return;

    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      canvasElement.value.width,
      canvasElement.value.height,
    );

    canvasCtx.drawImage(
      videoElement.value,
      0,
      0,
      canvasElement.value.width,
      canvasElement.value.height,
    );

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      isHandDetected.value = true;
      const handedness = resolveHandedness(results);
      currentHandedness.value = handedness;
      const handLandmarks = results.multiHandLandmarks[0];

      const state = letterDetection.onHandDetected({
        handLandmarks,
        handedness,
        isCameraActive: isCameraActive.value,
      });
      applyLetterState(state);

      drawHandAnnotations(handLandmarks);
    } else {
      clearDetectedState();
    }

    canvasCtx.restore();
  };

  const drawHandAnnotations = (landmarks) => {
    if (!landmarks || !canvasCtx || !canvasElement.value) return;

    const CONNECTIONS = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      [13, 17],
      [17, 18],
      [18, 19],
      [19, 20],
      [0, 17],
    ];

    const canvasWidth = canvasElement.value.width;
    const canvasHeight = canvasElement.value.height;

    canvasCtx.strokeStyle = "#55b491";
    canvasCtx.lineWidth = 3;

    CONNECTIONS.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      canvasCtx.beginPath();
      canvasCtx.moveTo(startPoint.x * canvasWidth, startPoint.y * canvasHeight);
      canvasCtx.lineTo(endPoint.x * canvasWidth, endPoint.y * canvasHeight);
      canvasCtx.stroke();
    });

    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvasWidth;
      const y = landmark.y * canvasHeight;
      const TIP_IDS = [4, 8, 12, 16, 20];
      const isTip = TIP_IDS.includes(index);

      canvasCtx.beginPath();
      canvasCtx.arc(x, y, isTip ? 15 : 10, 0, 2 * Math.PI);
      canvasCtx.fillStyle = isTip ? "#28a745" : "#2d7a5f";
      canvasCtx.fill();
      canvasCtx.strokeStyle = "#ffffff";
      canvasCtx.lineWidth = 4;
      canvasCtx.stroke();

      if (showLandmarkNumbers.value) {
        canvasCtx.fillStyle = "#ffffff";
        canvasCtx.font = "bold 12px Arial";
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "middle";
        canvasCtx.strokeStyle = "#000000";
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeText(index.toString(), x, y);
        canvasCtx.fillText(index.toString(), x, y);
      }

      if (isTip) {
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 20, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = "#28a745";
        canvasCtx.lineWidth = 3;
        canvasCtx.setLineDash([8, 8]);
        canvasCtx.stroke();
        canvasCtx.setLineDash([]);
      }
    });

    if (detectedLetter.value) {
      canvasCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
      canvasCtx.fillRect(10, canvasHeight - 40, 120, 30);
      canvasCtx.fillStyle = "#ffffff";
      canvasCtx.font = "bold 20px Arial";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(detectedLetter.value, 70, canvasHeight - 25);
    }
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }

      await nextTick();
      if (!videoElement.value || !canvasElement.value) return;

      canvasCtx = canvasElement.value.getContext("2d");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 700 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 60 },
        },
      });

      videoElement.value.srcObject = stream;
      cameraStream.value = stream;
      await videoElement.value.play();
      isCameraActive.value = true;

      const { Camera } = await initializeMediaPipe();

      if (hands) {
        if (Camera) {
          camera = new Camera(videoElement.value, {
            onFrame: async () => {
              if (hands && videoElement.value) {
                await hands.send({ image: videoElement.value });
              }
            },
            width: 640,
            height: 700,
          });
          await camera.start();
        } else {
          const processFrame = async () => {
            if (!isCameraActive.value || !hands || !videoElement.value) return;
            try {
              await hands.send({ image: videoElement.value });
            } catch (error) {}
            if (isCameraActive.value) requestAnimationFrame(processFrame);
          };

          videoElement.value.addEventListener("loadedmetadata", () =>
            processFrame(),
          );
          if (videoElement.value.readyState >= 2) processFrame();
        }
      } else {
        simulateHandDetection();
      }
    } catch (error) {
      if (error.name === "NotAllowedError") {
        alert("Permisos de camara denegados.");
      } else if (error.name === "NotFoundError") {
        alert("No se encontro camara.");
      } else if (error.name === "NotReadableError") {
        alert("La camara ya esta en uso.");
      } else {
        alert("Error al acceder a la camara: " + error.message);
      }
    }
  };

  const simulateHandDetection = () => {
    const simulate = () => {
      if (!isCameraActive.value) return;
      if (Math.random() > 0.7) {
        isHandDetected.value = true;
        const LETTERS = [
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "G",
          "H",
          "I",
          "J",
          "K",
          "L",
          "M",
          "N",
          "O",
          "P",
          "Q",
          "R",
          "S",
          "T",
          "U",
          "V",
          "W",
          "X",
          "Y",
          "Z",
        ];
        const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        applyLetterState({
          detectedLetter: letter,
          recognizedText: letter,
          gestureConfidence: 100,
        });
      } else {
        clearDetectedState();
      }
      if (isCameraActive.value) setTimeout(simulate, 2000);
    };
    setTimeout(simulate, 1000);
  };

  const stopCamera = () => {
    try {
      if (camera && typeof camera.stop === "function") {
        camera.stop();
        camera = null;
      }

      if (cameraStream.value) {
        cameraStream.value.getTracks().forEach((track) => track.stop());
        cameraStream.value = null;
      }

      if (canvasCtx && canvasElement.value) {
        canvasCtx.clearRect(
          0,
          0,
          canvasElement.value.width,
          canvasElement.value.height,
        );
      }

      if (videoElement.value) videoElement.value.srcObject = null;
      isCameraActive.value = false;
      clearDetectedState();
    } catch (error) {}
  };

  const toggleCamera = () => {
    if (isCameraActive.value) stopCamera();
    else startCamera();
  };

  const saveResult = () => {
    appendDetectedLetter(detectedLetter.value);
  };

  const addSpace = () => {
    savedWord.value += " ";
  };

  const clearWord = () => {
    savedWord.value = "";
    letterDetection.resetAutoSaveTracking();
  };

  return {
    videoElement,
    canvasElement,
    containerElement,
    isHandDetected,
    isCameraActive,
    recognizedText,
    cameraStream,
    gestureConfidence,
    detectedLetter,
    currentHandedness,
    showLandmarkNumbers,
    savedWord,
    saveAnimation,
    startCamera,
    stopCamera,
    toggleCamera,
    saveResult,
    addSpace,
    clearWord,
  };
}
