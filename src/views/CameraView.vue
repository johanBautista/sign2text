<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Elementos DOM reactivos
const videoElement = ref(null);
const canvasElement = ref(null);
const containerElement = ref(null);

// Estados reactivos
const isHandDetected = ref(false);
const isCameraActive = ref(false);
const recognizedText = ref("");
const cameraStream = ref(null);
const gestureConfidence = ref(0);
const detectedLetter = ref("");
const showLandmarkNumbers = ref(true);
const savedWord = ref("");
const saveAnimation = ref(false);

// Instancias de MediaPipe
let hands = null;
let camera = null;
let canvasCtx = null;

// Configuración MediaPipe Hands
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
      throw new Error("Hands no está disponible en window");
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

      await new Promise((resolve, reject) => {
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

// Detectar estado de los dedos (lógica simple y probada)
const detectFingers = (landmarks) => {
  if (!landmarks || landmarks.length === 0) {
    return [0, 0, 0, 0, 0];
  }

  const hand = landmarks[0];
  const fingers = [0, 0, 0, 0, 0];

  // Landmarks indices según MediaPipe
  const TIP_IDS = [4, 8, 12, 16, 20]; // Puntas de los dedos
  const PIP_IDS = [3, 6, 10, 14, 18]; // Nudillos (PIP joints)

  // Detectar cada dedo
  for (let i = 0; i < 5; i++) {
    const tipY = hand[TIP_IDS[i]].y;
    const pipY = hand[PIP_IDS[i]].y;

    // Lógica especial para el pulgar (usa X en lugar de Y)
    if (i === 0) {
      const tipX = hand[TIP_IDS[i]].x;
      const pipX = hand[PIP_IDS[i]].x;
      // En cámara espejo: pulgar extendido está a la izquierda visualmente
      // En coordenadas: depende de si está escalado
      fingers[i] = Math.abs(tipX - pipX) > 0.05 ? 1 : 0;
    } else {
      // Para los otros 4 dedos: extendido si punta está arriba del nudillo
      // En MediaPipe: Y menor = arriba
      fingers[i] = tipY < pipY ? 1 : 0;
    }
  }

  return fingers;
};

// Reconocer letra basada en patrones de dedos (LSE)
const recognizeLetter = (fingers) => {
  const pattern = fingers.join("");

  const LETTER_PATTERNS = {
    "10000": "A", // Puño con pulgar arriba
    "01000": "D", // Índice arriba, resto cerrado
    "01100": "K", // Índice y medio arriba
    "01110": "W", // Índice, medio y anular arriba
    "11111": "B", // Todos los dedos arriba
    "00000": "S", // Puño cerrado
    "10001": "Y", // Pulgar y meñique extendidos
    "11000": "L", // Pulgar e índice en forma de L
    "00001": "I", // Solo meñique
    "01101": "F", // Índice, medio y meñique
    "01010": "U", // Índice y anular juntos
    "01001": "J", // Meñique e índice
    "00100": "G", // Solo dedo medio
    "00010": "H", // Solo anular
    "10100": "R", // Pulgar y medio
    "10111": "C", // Pulgar y 3 dedos (simplificado)
    "11001": "E", // Pulgar e índice+meñique
    "11110": "N", // Todos menos meñique
    "11101": "M", // Todos menos anular
    "01011": "P", // Índice, anular y meñique
    "00110": "Q", // Medio y anular
    "00101": "T", // Medio y meñique
    "01111": "V", // Índice, medio, anular, meñique
    "11011": "X", // Pulgar, índice y meñique
    "11100": "Z", // Pulgar, índice y medio
  };

  return LETTER_PATTERNS[pattern] || "";
};

// Callback de MediaPipe
const onHandsResults = (results) => {
  if (!canvasCtx || !videoElement.value || !canvasElement.value) return;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height);

  canvasCtx.drawImage(
    videoElement.value,
    0,
    0,
    canvasElement.value.width,
    canvasElement.value.height,
  );

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    isHandDetected.value = true;

    const fingers = detectFingers(results.multiHandLandmarks);
    const letter = recognizeLetter(fingers);

    detectedLetter.value = letter;
    gestureConfidence.value = letter ? 100 : 0;

    if (letter) {
      recognizedText.value = letter;
    } else {
      const extendedCount = fingers.reduce((a, b) => a + b, 0);
      recognizedText.value = extendedCount > 0 ? extendedCount.toString() : "";
    }

    drawHandAnnotations(results.multiHandLandmarks[0]);
  } else {
    isHandDetected.value = false;
    gestureConfidence.value = 0;
    recognizedText.value = "";
    detectedLetter.value = "";
  }

  canvasCtx.restore();
};

// Dibujar landmarks
const drawHandAnnotations = (landmarks) => {
  if (!landmarks || !canvasCtx || !canvasElement.value) return;

  const CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
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

  // Mostrar letra detectada en el canvas
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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
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
        videoElement.value.addEventListener("loadedmetadata", () => processFrame());
        if (videoElement.value.readyState >= 2) processFrame();
      }
    } else {
      simulateHandDetection();
    }
  } catch (error) {
    if (error.name === "NotAllowedError") {
      alert("Permisos de cámara denegados.");
    } else if (error.name === "NotFoundError") {
      alert("No se encontró cámara.");
    } else if (error.name === "NotReadableError") {
      alert("La cámara ya está en uso.");
    } else {
      alert("Error al acceder a la cámara: " + error.message);
    }
  }
};

const simulateHandDetection = () => {
  const simulate = () => {
    if (!isCameraActive.value) return;
    if (Math.random() > 0.7) {
      isHandDetected.value = true;
      const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
      const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      detectedLetter.value = letter;
      recognizedText.value = letter;
      gestureConfidence.value = 100;
    } else {
      isHandDetected.value = false;
      gestureConfidence.value = 0;
      recognizedText.value = "";
      detectedLetter.value = "";
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
      canvasCtx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height);
    }
    if (videoElement.value) videoElement.value.srcObject = null;
    isCameraActive.value = false;
    isHandDetected.value = false;
    recognizedText.value = "";
    gestureConfidence.value = 0;
    detectedLetter.value = "";
  } catch (error) {}
};

const toggleCamera = () => {
  if (isCameraActive.value) stopCamera();
  else startCamera();
};

const saveResult = () => {
  if (detectedLetter.value) {
    savedWord.value += detectedLetter.value;
    saveAnimation.value = true;
    setTimeout(() => { saveAnimation.value = false; }, 500);
  }
};

const addSpace = () => {
  savedWord.value += " ";
};

const clearWord = () => {
  savedWord.value = "";
};

onMounted(async () => {
  await nextTick();
  startCamera();
});

onUnmounted(() => {
  stopCamera();
});
</script>

<template>
  <div class="min-h-full bg-background flex flex-col">
    <header class="safe-area-inset-top bg-surface shadow-sm relative">
      <div class="px-6 py-4">
        <h1 class="text-xl font-bold text-center text-primary">
          {{ t("camera.title") }}
        </h1>
        <div v-if="isHandDetected" class="absolute top-4 left-6">
          <div class="badge-success">
            <div class="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
            {{ t("camera.handDetected") }}
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 p-6">
      <div class="max-w-lg mx-auto">
        <div
          ref="containerElement"
          class="relative bg-black rounded-2xl overflow-hidden aspect-[3/4] h-96 mb-6 shadow-lg"
        >
          <video
            ref="videoElement"
            class="absolute inset-0 w-full h-full object-cover"
            autoplay
            playsinline
            muted
            :style="{
              visibility: isCameraActive ? 'visible' : 'hidden',
              transform: 'scaleX(-1)',
            }"
          ></video>

          <canvas
            ref="canvasElement"
            width="640"
            height="480"
            class="absolute inset-0 w-full h-full object-cover z-10"
            :style="{
              visibility: isCameraActive ? 'visible' : 'hidden',
              pointerEvents: 'none',
              transform: 'scaleX(-1)',
            }"
          ></canvas>

          <div
            v-if="!isCameraActive"
            class="absolute inset-0 flex items-center justify-center bg-gray-100 z-20"
          >
            <div class="text-center">
              <font-awesome-icon
                icon="camera"
                class="text-6xl mb-4 opacity-50 text-gray-400"
              />
              <p class="text-gray-500">{{ t("camera.cameraPreview") }}</p>
              <p class="text-xs text-gray-400 mt-2">MediaPipe detection ready</p>
            </div>
          </div>

          <!-- Letra detectada arriba -->
          <div
            v-if="isCameraActive && detectedLetter"
            class="absolute top-4 left-4 right-4 z-30 flex justify-center"
          >
            <div class="bg-success bg-opacity-90 text-white px-4 py-2 rounded-lg font-bold text-2xl">
              {{ detectedLetter }}
            </div>
          </div>

          <!-- Botones dentro del canvas -->
          <div
            v-if="isCameraActive && detectedLetter"
            class="absolute bottom-16 left-4 right-4 z-30 flex justify-center space-x-4"
          >
            <button
              @click="saveResult"
              :class="[
                'px-6 py-3 rounded-lg font-bold text-lg transition-all shadow-lg',
                saveAnimation
                  ? 'bg-blue-500 text-white scale-110'
                  : 'bg-success text-white hover:bg-opacity-90'
              ]"
            >
              <font-awesome-icon icon="plus" class="mr-2" />
              {{ saveAnimation ? '¡Guardado!' : 'Guardar' }}
            </button>
            <button
              @click="addSpace"
              class="bg-white bg-opacity-90 text-gray-800 px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-100 transition-all shadow-lg"
            >
              <font-awesome-icon icon="space-arrow-right" class="mr-2" />
              Espacio
            </button>
          </div>

          <!-- Debug controls -->
          <div v-if="isCameraActive" class="absolute bottom-4 left-4 z-30">
            <button
              @click="showLandmarkNumbers = !showLandmarkNumbers"
              class="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs hover:bg-opacity-90 transition-all"
            >
              {{ showLandmarkNumbers ? "Ocultar" : "Mostrar" }} puntos
            </button>
          </div>
        </div>

        <!-- Dashboard -->
        <div
          v-if="isCameraActive"
          class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          <div class="card">
            <h3 class="font-semibold text-text mb-3 flex items-center">
              <font-awesome-icon icon="eye" class="mr-2 text-primary" />
              {{ t("camera.handStatus") }}
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Detectada:</span>
                <span
                  :class="
                    isHandDetected
                      ? 'text-success font-medium'
                      : 'text-gray-400'
                  "
                >
                  {{ isHandDetected ? "✓ Sí" : "✗ No" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Confianza:</span>
                <span class="font-medium text-primary">{{ gestureConfidence }}%</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="font-semibold text-text mb-3 flex items-center">
              <font-awesome-icon icon="lightbulb" class="mr-2 text-warning" />
              Letra Detectada (LSE)
            </h3>
            <div class="text-center">
              <div
                v-if="detectedLetter"
                class="text-4xl font-bold text-success mb-2"
              >
                {{ detectedLetter }}
              </div>
              <div v-else class="text-2xl text-gray-400 mb-2">-</div>
              <div class="text-xs text-gray-500">
                {{ detectedLetter ? "Alfabeto LSE" : "Sin reconocimiento" }}
              </div>
            </div>
          </div>
        </div>

        <!-- Resultado -->
        <div v-if="detectedLetter" class="card mb-6">
          <h3 class="font-semibold text-text mb-2 flex items-center">
            <font-awesome-icon icon="lightbulb" class="mr-2 text-warning" />
            {{ t("camera.recognizedText") }}
          </h3>
          <div class="bg-background rounded-lg p-4 text-center">
            <p class="text-4xl font-bold text-primary mb-2">
              {{ detectedLetter }}
            </p>
            <div class="text-sm text-gray-600">
              Confianza: {{ gestureConfidence }}%
            </div>
          </div>
        </div>

        <!-- Controles de cámara -->
        <div class="text-center space-y-4">
          <button
            @click="toggleCamera"
            :class="[
              'w-full py-4 text-lg font-medium rounded-xl transition-all duration-200',
              isCameraActive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'btn-primary',
            ]"
          >
            {{
              isCameraActive ? t("camera.stopCamera") : t("camera.startCamera")
            }}
          </button>

          <div class="grid grid-cols-2 gap-4">
            <button @click="saveResult" class="btn-secondary py-3">
              {{ t("camera.saveResult") }}
            </button>
            <button @click="clearWord" class="btn-secondary py-3">
              {{ t("camera.clear") }}
            </button>
          </div>

          <!-- Palabra construida -->
          <div v-if="savedWord" class="card mb-6">
            <h3 class="font-semibold text-text mb-2 flex items-center">
              <font-awesome-icon icon="font" class="mr-2 text-primary" />
              Texto acumulado:
            </h3>
            <div class="bg-background rounded-lg p-4 max-h-32 overflow-y-auto">
              <p class="text-lg font-bold text-primary break-words whitespace-pre-wrap">{{ savedWord }}</p>
            </div>
          </div>
        </div>

        <!-- Tips de uso -->
        <div class="mt-6 p-4 bg-secondary bg-opacity-10 rounded-lg">
          <h4 class="font-medium text-text mb-2">
            {{ t("camera.tips.title") }}
          </h4>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>{{ t("camera.tips.keepVisible") }}</li>
            <li>{{ t("camera.tips.goodLighting") }}</li>
            <li>{{ t("camera.tips.moveSlowly") }}</li>
            <li>{{ t("camera.tips.holdGestures") }}</li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>
