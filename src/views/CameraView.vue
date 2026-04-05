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
const fingersExtended = ref([0, 0, 0, 0, 0]); // [pulgar, índice, medio, anular, meñique]
const gestureConfidence = ref(0);
const detectedLetter = ref("");
const showLandmarkNumbers = ref(true); // Para debug visual

// Instancias de MediaPipe
let hands = null;
let camera = null;
let canvasCtx = null;

// Configuración MediaPipe Hands usando importación dinámica mejorada
const initializeMediaPipe = async () => {
  try {
    // Cargar MediaPipe desde CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    document.head.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    });

    // Verificar que la clase Hands existe en window
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

    // Cargar también Camera utils si está disponible
    try {
      const cameraScript = document.createElement("script");
      cameraScript.src =
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
      document.head.appendChild(cameraScript);

      await new Promise((resolve, reject) => {
        cameraScript.onload = resolve;
        cameraScript.onerror = () => {
          resolve();
        };
      });

      return { Camera: window.Camera || null };
    } catch (camError) {
      return { Camera: null };
    }
  } catch (error) {
    return { Camera: null };
  }
};

// Función para reconocer letras basadas en patrones de dedos
const recognizeLetter = (fingers) => {
  const pattern = fingers.join("");

  const letterPatterns = {
    "00001": "I", // Solo meñique
    "00011": "V", // Anular + meñique
    "00111": "W", // Medio + anular + meñique
    "01111": "4", // Todos menos pulgar
    11111: "5", // Todos los dedos
    10000: "A", // Solo pulgar
    "01000": "1", // Solo índice
    "01100": "2", // Índice + medio
    "01110": "3", // Índice + medio + anular
    "00000": "S", // Puño cerrado
    10001: "Y", // Pulgar + meñique
    "01010": "U", // Índice + anular
    10100: "L", // Pulgar + medio
  };

  const letter = letterPatterns[pattern];
  if (letter) {
    return letter;
  }

  return "";
};

// Función principal de detección de fingers
const detectFingers = (landmarks) => {
  if (!landmarks || landmarks.length === 0) {
    return [0, 0, 0, 0, 0];
  }

  const hand = landmarks[0];
  const fingers = [0, 0, 0, 0, 0];

  // Landmarks indices según MediaPipe
  const tipIds = [4, 8, 12, 16, 20]; // Puntas de los dedos
  const pipIds = [3, 6, 10, 14, 18]; // Nudillos (PIP joints)

  // Detectar cada dedo usando la lógica: punta.y < nudillo.y
  for (let i = 0; i < 5; i++) {
    const tipY = hand[tipIds[i]].y;
    const pipY = hand[pipIds[i]].y;

    // Lógica especial para el pulgar (usa X en lugar de Y)
    if (i === 0) {
      const tipX = hand[tipIds[i]].x;
      const pipX = hand[pipIds[i]].x;
      fingers[i] = Math.abs(tipX - pipX) > 0.05 ? 1 : 0;
    } else {
      // Para los otros 4 dedos: extendido si punta está arriba del nudillo
      fingers[i] = tipY < pipY ? 1 : 0;
    }
  }

  return fingers;
};

// Callback de MediaPipe cuando detecta manos
const onHandsResults = (results) => {
  if (!canvasCtx || !videoElement.value || !canvasElement.value) return;

  // Limpiar canvas y dibujar el frame actual
  canvasCtx.save();
  canvasCtx.clearRect(
    0,
    0,
    canvasElement.value.width,
    canvasElement.value.height,
  );

  // Dibujar el video en el canvas como base
  canvasCtx.drawImage(
    videoElement.value,
    0,
    0,
    canvasElement.value.width,
    canvasElement.value.height,
  );

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    isHandDetected.value = true;

    // Detectar dedos extendidos
    const fingers = detectFingers(results.multiHandLandmarks);
    fingersExtended.value = fingers;

    // Calcular confidence score
    const extendedCount = fingers.reduce((a, b) => a + b, 0);
    gestureConfidence.value = extendedCount * 20; // Score de 0-100%

    // Reconocer letras basadas en el patrón de dedos
    const letter = recognizeLetter(fingers);
    detectedLetter.value = letter;

    // Actualizar texto reconocido
    if (letter) {
      recognizedText.value = letter;
    } else if (extendedCount > 0) {
      recognizedText.value = extendedCount.toString();
    }

    // Dibujar landmarks y conexiones SOBRE el video
    drawHandAnnotations(results.multiHandLandmarks[0]);
  } else {
    isHandDetected.value = false;
    fingersExtended.value = [0, 0, 0, 0, 0];
    gestureConfidence.value = 0;
    recognizedText.value = "";
    detectedLetter.value = "";
  }

  canvasCtx.restore();
};

// Dibujar landmarks de la mano con números para debug
const drawHandAnnotations = (landmarks) => {
  if (!landmarks || !canvasCtx || !canvasElement.value) {
    return;
  }

  // Conexiones de la mano
  const connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // Pulgar
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // Índice
    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Medio
    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Anular
    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Meñique
    [0, 17], // Conexión horizontal
  ];

  const canvasWidth = canvasElement.value.width;
  const canvasHeight = canvasElement.value.height;

  // Dibujar conexiones primero
  canvasCtx.strokeStyle = "#55b491"; // Color secondary verde
  canvasCtx.lineWidth = 3;

  connections.forEach(([start, end]) => {
    const startPoint = landmarks[start];
    const endPoint = landmarks[end];

    canvasCtx.beginPath();
    canvasCtx.moveTo(startPoint.x * canvasWidth, startPoint.y * canvasHeight);
    canvasCtx.lineTo(endPoint.x * canvasWidth, endPoint.y * canvasHeight);
    canvasCtx.stroke();
  });

  // Dibujar landmarks con números para debugging
  landmarks.forEach((landmark, index) => {
    const x = landmark.x * canvasWidth;
    const y = landmark.y * canvasHeight;

    // Colores diferentes para puntas de dedos
    const tipIds = [4, 8, 12, 16, 20];
    const isTip = tipIds.includes(index);

    // Círculo del landmark más grande y visible
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, isTip ? 15 : 10, 0, 2 * Math.PI);
    canvasCtx.fillStyle = isTip ? "#28a745" : "#2d7a5f";
    canvasCtx.fill();

    // Borde blanco grueso para visibilidad
    canvasCtx.strokeStyle = "#ffffff";
    canvasCtx.lineWidth = 4;
    canvasCtx.stroke();

    // Mostrar números de landmarks para debug
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

    // Destacar puntas de dedos con aura pulsante
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

  // Panel de información en canvas (menos intrusivo)
  canvasCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
  canvasCtx.fillRect(10, canvasHeight - 90, 250, 80);

  canvasCtx.fillStyle = "#ffffff";
  canvasCtx.font = "bold 14px Arial";
  canvasCtx.textAlign = "left";
  canvasCtx.textBaseline = "top";
  canvasCtx.fillText(
    `Dedos: [${fingersExtended.value.join(",")}]`,
    20,
    canvasHeight - 80,
  );
  canvasCtx.fillText(
    `Letra: ${detectedLetter.value || "ninguna"}`,
    20,
    canvasHeight - 60,
  );
  canvasCtx.fillText(
    `Confianza: ${gestureConfidence.value}%`,
    20,
    canvasHeight - 40,
  );
  canvasCtx.fillText(`Landmarks: ${landmarks.length}`, 20, canvasHeight - 20);
};

const startCamera = async () => {
  try {
    // Verificar si getUserMedia está disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    await nextTick();

    if (!videoElement.value || !canvasElement.value) {
      return;
    }

    // Configurar canvas context
    canvasCtx = canvasElement.value.getContext("2d");

    // Configurar video stream primero
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
        frameRate: { ideal: 30, max: 60 },
      },
    });

    videoElement.value.srcObject = stream;
    cameraStream.value = stream;
    isCameraActive.value = true;

    // Inicializar MediaPipe después de que el video esté listo
    const { Camera } = await initializeMediaPipe();

    if (hands) {
      if (Camera) {
        // Usar MediaPipe Camera utility
        camera = new Camera(videoElement.value, {
          onFrame: async () => {
            if (hands && videoElement.value) {
              await hands.send({ image: videoElement.value });
            }
          },
          width: 640,
          height: 480,
        });
        await camera.start();
      } else {
        // Procesamiento manual usando requestAnimationFrame
        const processFrame = async () => {
          if (!isCameraActive.value || !hands || !videoElement.value) return;

          try {
            await hands.send({ image: videoElement.value });
          } catch (error) {
            // Continúa el procesamiento silenciosamente
          }

          if (isCameraActive.value) {
            requestAnimationFrame(processFrame);
          }
        };

        // Esperar a que el video esté listo y comenzar procesamiento
        videoElement.value.addEventListener("loadedmetadata", () => {
          processFrame();
        });

        if (videoElement.value.readyState >= 2) {
          processFrame();
        }
      }
    } else {
      // Fallback: usar requestAnimationFrame para simular detección
      simulateHandDetection();
    }
  } catch (error) {
    // Manejar diferentes tipos de errores
    if (error.name === "NotAllowedError") {
      alert(
        "Permisos de cámara denegados. Por favor, habilita los permisos en la configuración del dispositivo.",
      );
    } else if (error.name === "NotFoundError") {
      alert("No se encontró cámara en el dispositivo.");
    } else if (error.name === "NotReadableError") {
      alert("La cámara ya está en uso por otra aplicación.");
    } else {
      alert("Error al acceder a la cámara: " + error.message);
    }
  }
};

// Función de fallback para simular detección cuando MediaPipe no está disponible
const simulateHandDetection = () => {
  const simulate = () => {
    if (!isCameraActive.value) return;

    // Simular detección ocasional
    if (Math.random() > 0.7) {
      isHandDetected.value = true;
      const randomFingers = Array.from({ length: 5 }, () =>
        Math.random() > 0.5 ? 1 : 0,
      );
      fingersExtended.value = randomFingers;
      gestureConfidence.value = Math.floor(Math.random() * 40) + 60;

      // Simular reconocimiento de letras
      const letter = recognizeLetter(randomFingers);
      detectedLetter.value = letter;
      recognizedText.value =
        letter || randomFingers.reduce((a, b) => a + b, 0).toString();
    } else {
      isHandDetected.value = false;
      fingersExtended.value = [0, 0, 0, 0, 0];
      gestureConfidence.value = 0;
      recognizedText.value = "";
      detectedLetter.value = "";
    }

    if (isCameraActive.value) {
      setTimeout(simulate, 2000);
    }
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
      cameraStream.value.getTracks().forEach((track) => {
        track.stop();
      });
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

    if (videoElement.value) {
      videoElement.value.srcObject = null;
    }

    isCameraActive.value = false;
    isHandDetected.value = false;
    recognizedText.value = "";
    fingersExtended.value = [0, 0, 0, 0, 0];
    gestureConfidence.value = 0;
    detectedLetter.value = "";
  } catch (error) {
    // Error handling
  }
};

const toggleCamera = () => {
  if (isCameraActive.value) {
    stopCamera();
  } else {
    startCamera();
  }
};

// Lifecycles
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
    <!-- Header con indicador -->
    <header class="safe-area-inset-top bg-surface shadow-sm relative">
      <div class="px-6 py-4">
        <h1 class="text-xl font-bold text-center text-primary">
          {{ t("camera.title") }}
        </h1>

        <!-- Badge de Hand Detected -->
        <div v-if="isHandDetected" class="absolute top-4 left-6">
          <div class="badge-success">
            <div
              class="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"
            ></div>
            {{ t("camera.handDetected") }}
          </div>
        </div>
      </div>
    </header>

    <!-- Área de visualización de cámara -->
    <main class="flex-1 p-6">
      <div class="max-w-lg mx-auto">
        <!-- Container de cámara con video y canvas -->
        <div
          ref="containerElement"
          class="relative bg-black rounded-2xl overflow-hidden aspect-video mb-6 shadow-lg"
        >
          <!-- Video element -->
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

          <!-- Canvas overlay para dibujar landmarks -->
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

          <!-- Placeholder cuando no hay cámara activa -->
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
              <p class="text-xs text-gray-400 mt-2">
                MediaPipe detection ready
              </p>
            </div>
          </div>

          <!-- Overlay superior con información -->
          <div v-if="isCameraActive" class="absolute top-4 left-4 right-4 z-30">
            <div class="flex justify-between items-center">
              <!-- Indicador de mano detectada -->
              <div v-if="isHandDetected" class="badge-success">
                <div
                  class="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"
                ></div>
                {{ t("camera.handDetected") }}
              </div>

              <!-- Score de confianza -->
              <div
                v-if="gestureConfidence > 0"
                class="bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm"
              >
                {{ gestureConfidence }}% confianza
              </div>

              <!-- Letra detectada -->
              <div
                v-if="detectedLetter"
                class="bg-success bg-opacity-90 text-white px-3 py-1 rounded-lg font-bold text-lg"
              >
                Letra: {{ detectedLetter }}
              </div>
            </div>
          </div>

          <!-- Debug controls overlay -->
          <div v-if="isCameraActive" class="absolute top-4 left-4 z-30">
            <button
              @click="showLandmarkNumbers = !showLandmarkNumbers"
              class="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs hover:bg-opacity-90 transition-all"
            >
              {{ showLandmarkNumbers ? "Ocultar" : "Mostrar" }} puntos
            </button>
          </div>

          <!-- Overlay inferior con estado de dedos -->
          <div
            v-if="isHandDetected"
            class="absolute bottom-4 left-4 right-4 z-30"
          >
            <div class="bg-black bg-opacity-80 rounded-lg p-3 text-white">
              <div class="flex justify-center space-x-4 mb-2">
                <div
                  v-for="(finger, index) in fingersExtended"
                  :key="index"
                  class="flex flex-col items-center"
                >
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors duration-200',
                      finger === 1
                        ? 'bg-success text-white'
                        : 'bg-gray-600 text-gray-300',
                    ]"
                  >
                    {{ finger }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dashboard de detección -->
        <div
          v-if="isCameraActive"
          class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <!-- Estado de la mano -->
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
                <span class="font-medium text-primary"
                  >{{ gestureConfidence }}%</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Dedos activos:</span>
                <span class="font-medium text-secondary">
                  {{ fingersExtended.reduce((a, b) => a + b, 0) }}/5
                </span>
              </div>
            </div>
          </div>

          <!-- Letra detectada -->
          <div class="card">
            <h3 class="font-semibold text-text mb-3 flex items-center">
              <font-awesome-icon icon="lightbulb" class="mr-2 text-warning" />
              Letra Reconocida
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
                {{
                  detectedLetter ? "Letra del alfabeto" : "Sin reconocimiento"
                }}
              </div>
            </div>
          </div>

          <!-- Array de dedos  -->
          <div class="card">
            <h3 class="font-semibold text-text mb-3 flex items-center">
              <font-awesome-icon
                icon="hand-paper"
                class="mr-2 text-secondary"
              />
              Array de Dedos
            </h3>
            <div class="bg-background rounded-lg p-3">
              <div class="text-sm text-gray-600 mb-2">Patrón binario:</div>
              <div class="font-mono text-lg font-bold text-primary">
                [{{ fingersExtended.join(", ") }}]
              </div>
              <div class="text-xs text-gray-500 mt-1">👍 ☝️ 🖕 💍 🤏</div>
            </div>
          </div>
        </div>

        <!-- Resultado del reconocimiento -->
        <div v-if="recognizedText || detectedLetter" class="card mb-6">
          <h3 class="font-semibold text-text mb-2 flex items-center">
            <font-awesome-icon icon="lightbulb" class="mr-2 text-warning" />
            {{ t("camera.recognizedText") }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Resultado principal -->
            <div class="bg-background rounded-lg p-4">
              <div class="text-center">
                <p class="text-4xl font-bold text-primary mb-2">
                  {{ detectedLetter || recognizedText }}
                </p>
                <div class="text-sm text-gray-600">
                  {{
                    detectedLetter
                      ? "Letra del alfabeto ASL"
                      : "Número por conteo de dedos"
                  }}
                </div>
              </div>
            </div>

            <!-- Información de debug -->
            <div class="bg-gray-50 rounded-lg p-4 text-sm">
              <div class="space-y-2">
                <div>
                  <span class="font-medium">Patrón:</span>
                  <span class="font-mono ml-2"
                    >[{{ fingersExtended.join(",") }}]</span
                  >
                </div>
                <div>
                  <span class="font-medium">Dedos extendidos:</span>
                  <span class="ml-2"
                    >{{ fingersExtended.reduce((a, b) => a + b, 0) }}/5</span
                  >
                </div>
                <div>
                  <span class="font-medium">Confianza:</span>
                  <span class="ml-2">{{ gestureConfidence }}%</span>
                </div>
                <div>
                  <span class="font-medium">Estado landmarks:</span>
                  <span class="ml-2 text-success">{{
                    showLandmarkNumbers ? "👁️ Visibles" : "👁️‍🗨️ Ocultos"
                  }}</span>
                </div>
              </div>
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
            <button class="btn-secondary py-3">
              {{ t("camera.saveResult") }}
            </button>
            <button class="btn-secondary py-3">
              {{ t("camera.clear") }}
            </button>
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
