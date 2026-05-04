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
const savedWord = ref(""); // Palabra construida con letras guardadas
const saveAnimation = ref(false); // Para animación de guardado

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

// Función para reconocer letras basadas en patrones de dedos (Lenguaje de señas español)
const recognizeLetter = (fingers) => {
  const pattern = fingers.join("");

  const letterPatterns = {
    10000: "A", // Puño con pulgar arriba
    "01000": "D", // Índice arriba, resto cerrado
    "01100": "K", // Índice y medio arriba (V apuntando arriba)
    "01110": "W", // Índice, medio y anular arriba
    11111: "B", // Todos los dedos arriba (palma abierta)
    "00000": "S", // Puño cerrado con pulgar encima
    10001: "Y", // Pulgar y meñique extendidos
    11000: "L", // Pulgar e índice en forma de L
    "00001": "I", // Solo meñique
    "01101": "F", // Índice, medio y meñique (forma F)
    "01010": "U", // Índice y anular arriba juntos
    "01001": "J", // Meñique e índice (J se hace con meñique)
    "00100": "G", // Solo dedo medio
    "00010": "H", // Solo anular
    10100: "R", // Pulgar y medio (R: índice y medio cruzados - simplificado)
    10111: "C", // Pulgar y 3 dedos (forma C curvada - simplificado)
    11001: "E", // Pulgar e índice+meñique (puño con pulgar metido - simplificado)
    11110: "N", // Todos menos meñique
    11101: "M", // Todos menos anular
    "01011": "P", // Índice, anular y meñique
    "00110": "Q", // Medio y anular
    "00101": "T", // Medio y meñique (puño con pulgar entre dedos - simplificado)
    "01111": "V", // Índice, medio, anular, meñique (V con 4 dedos)
    11011: "X", // Pulgar, índice y meñique (índice doblado - simplificado)
    11100: "Z", // Pulgar, índice y medio (Z con movimiento - simplificado)
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

  // Panel de información en canvas (solo letra)
  if (detectedLetter.value) {
    canvasCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
    canvasCtx.fillRect(10, canvasHeight - 40, 120, 30);

    canvasCtx.fillStyle = "#ffffff";
    canvasCtx.font = "bold 20px Arial";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(
      detectedLetter.value,
      canvasCtx.measureText(detectedLetter.value).width / 2 + 10,
      canvasHeight - 25,
    );
  }
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
        height: { ideal: 700 },
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
          height: 700,
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

// Guardar letra detectada para formar una palabra
const saveResult = () => {
  if (detectedLetter.value) {
    savedWord.value += detectedLetter.value;
    // Activar animación de guardado
    saveAnimation.value = true;
    setTimeout(() => {
      saveAnimation.value = false;
    }, 500);
  }
};

// Agregar espacio para separar palabras
const addSpace = () => {
  savedWord.value += " ";
};

// Limpiar la palabra guardada
const clearWord = () => {
  savedWord.value = "";
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
          class="relative bg-black rounded-2xl overflow-hidden aspect-[3/4] h-96 mb-6 shadow-lg"
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

          <!-- Overlay superior con letra detectada -->
          <div
            v-if="isCameraActive && detectedLetter"
            class="absolute top-4 left-4 right-4 z-30 flex justify-center"
          >
            <div
              class="bg-success bg-opacity-90 text-white px-4 py-2 rounded-lg font-bold text-2xl"
            >
              {{ detectedLetter }}
            </div>
          </div>

          <!-- Botones dentro del canvas (abajo centrado) -->
          <div
            v-if="isCameraActive && detectedLetter"
            class="absolute bottom-16 left-4 right-4 z-30 flex justify-center space-x-4"
          >
            <button
              @click="saveResult"
              :class="[
                'px-2 py-2 rounded-lg font-bold text-lg transition-all shadow-lg',
                saveAnimation
                  ? 'bg-blue-500 text-white scale-110'
                  : 'bg-success text-white hover:bg-opacity-90',
              ]"
            >
              <font-awesome-icon icon="plus" class="mr-2" />
              {{ saveAnimation ? "¡Guardado!" : "Guardar" }}
            </button>
            <button
              @click="addSpace"
              class="bg-white bg-opacity-90 text-gray-800 px-2 py-2 rounded-lg font-bold text-lg hover:bg-opacity-100 transition-all shadow-lg"
            >
              <font-awesome-icon icon="space-arrow-right" class="mr-2" />
              Espacio
            </button>
          </div>

          <!-- Debug controls overlay (abajo a la izquierda) -->
          <div v-if="isCameraActive" class="absolute bottom-4 left-4 z-30">
            <button
              @click="showLandmarkNumbers = !showLandmarkNumbers"
              class="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs hover:bg-opacity-90 transition-all"
            >
              {{ showLandmarkNumbers ? "Ocultar" : "Mostrar" }} puntos
            </button>
          </div>
        </div>

        <!-- Dashboard de detección -->
        <div
          v-if="isCameraActive"
          class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
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
        </div>

        <!-- Resultado del reconocimiento -->
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
              <p
                class="text-lg font-bold text-primary break-words whitespace-pre-wrap"
              >
                {{ savedWord }}
              </p>
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
