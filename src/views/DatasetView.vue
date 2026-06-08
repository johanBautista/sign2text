<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

const videoEl = ref(null);
const canvasEl = ref(null);

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_".split("");
const selectedLetter = ref("A");
const dataset = ref([]);
const isCapturing = ref(false);
const isHandDetected = ref(false);
const samplesPerLetter = ref({});
const statusMessage = ref("Preparando cámara...");
const totalSamples = ref(0);
const captureCount = ref(0);
const fileInput = ref(null);

let hands = null;
let camera = null;
let canvasCtx = null;
let captureTimer = null;
let captureInterval = null;

letters.forEach((l) => (samplesPerLetter.value[l] = 0));

const HAND_CONNECTIONS = [
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

function normalizeLandmarks(landmarks) {
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];
  const dx = middleMCP.x - wrist.x;
  const dy = middleMCP.y - wrist.y;
  const dz = (middleMCP.z || 0) - (wrist.z || 0);
  const scale = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (scale < 1e-8) return null;
  return landmarks.map((lm) => [
    Number(((lm.x - wrist.x) / scale).toFixed(6)),
    Number(((lm.y - wrist.y) / scale).toFixed(6)),
    Number((((lm.z || 0) - (wrist.z || 0)) / scale).toFixed(6)),
  ]);
}

function onHandsResults(results) {
  if (!canvasCtx || !canvasEl.value || !videoEl.value) return;

  const ctx = canvasCtx;
  const cw = canvasEl.value.width;
  const ch = canvasEl.value.height;

  ctx.save();
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(videoEl.value, 0, 0, cw, ch);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    isHandDetected.value = true;
    const landmarks = results.multiHandLandmarks[0];
    drawHand(ctx, landmarks, cw, ch);

    if (isCapturing.value) {
      const normalized = normalizeLandmarks(landmarks);
      if (normalized) {
        const features = normalized.flat();
        dataset.value.push({ features, label: selectedLetter.value });
        samplesPerLetter.value[selectedLetter.value]++;
        totalSamples.value++;
        captureCount.value++;
      }
    }
  } else {
    isHandDetected.value = false;
  }

  ctx.restore();
}

function drawHand(ctx, landmarks, w, h) {
  ctx.strokeStyle = "#55b491";
  ctx.lineWidth = 3;
  HAND_CONNECTIONS.forEach(([s, e]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[s].x * w, landmarks[s].y * h);
    ctx.lineTo(landmarks[e].x * w, landmarks[e].y * h);
    ctx.stroke();
  });

  landmarks.forEach((lm, i) => {
    const x = lm.x * w;
    const y = lm.y * h;
    const isTip = [4, 8, 12, 16, 20].includes(i);

    ctx.beginPath();
    ctx.arc(x, y, isTip ? 12 : 8, 0, 2 * Math.PI);
    ctx.fillStyle = isTip ? "#28a745" : "#2d7a5f";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  if (statusMessage.value && isHandDetected.value) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(10, h - 38, 200, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(selectedLetter.value, 20, h - 24);
  }
}

function toggleCapture() {
  if (isCapturing.value) {
    stopCapture();
  } else {
    startCapture();
  }
}

function startCapture() {
  if (!isHandDetected.value) {
    statusMessage.value = "No hay mano detectada";
    return;
  }

  isCapturing.value = true;
  captureCount.value = 0;
  const letter = selectedLetter.value;
  statusMessage.value = `Grabando ${letter}...`;

  captureTimer = setTimeout(() => {
    stopCapture();
  }, 4000);
}

function stopCapture() {
  isCapturing.value = false;
  if (captureTimer) {
    clearTimeout(captureTimer);
    captureTimer = null;
  }
  const letter = selectedLetter.value;
  const total = samplesPerLetter.value[letter];
  statusMessage.value = `"${letter}": +${captureCount.value} muestras (total: ${total})`;
}

function exportJSON() {
  if (dataset.value.length === 0) {
    statusMessage.value = "No hay datos para exportar";
    return;
  }
  const json = JSON.stringify({ samples: dataset.value }, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dataset.json";
  a.click();
  URL.revokeObjectURL(url);
  statusMessage.value = `Exportado: ${dataset.value.length} muestras`;
}

function loadDataset(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.samples || !Array.isArray(data.samples)) {
        statusMessage.value = "JSON inválido: falta samples[]";
        return;
      }
      data.samples.forEach((s) => {
        if (s.features && s.label) {
          dataset.value.push(s);
          samplesPerLetter.value[s.label] =
            (samplesPerLetter.value[s.label] || 0) + 1;
          totalSamples.value++;
        }
      });
      statusMessage.value = `Cargadas ${data.samples.length} muestras`;
    } catch (err) {
      statusMessage.value = "Error al leer JSON: " + err.message;
    }
  };
  reader.readAsText(file);
}

function triggerLoad() {
  fileInput.value?.click();
}

function clearLetter(letter) {
  dataset.value = dataset.value.filter((s) => s.label !== letter);
  samplesPerLetter.value[letter] = 0;
  totalSamples.value = dataset.value.length;
  statusMessage.value = `Muestras de "${letter}" eliminadas`;
}

function clearDataset() {
  dataset.value = [];
  totalSamples.value = 0;
  letters.forEach((l) => (samplesPerLetter.value[l] = 0));
  statusMessage.value = "Dataset limpiado";
}

async function initMediaPipe() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    document.head.appendChild(script);
    script.onload = () => {
      if (!window.Hands) {
        reject(new Error("Hands no disponible"));
        return;
      }
      hands = new window.Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(onHandsResults);

      const camScript = document.createElement("script");
      camScript.src =
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
      document.head.appendChild(camScript);
      camScript.onload = () => resolve(window.Camera || null);
      camScript.onerror = () => resolve(null);
    };
    script.onerror = reject;
  });
}

async function startCamera() {
  try {
    await nextTick();
    if (!videoEl.value || !canvasEl.value) return;

    canvasCtx = canvasEl.value.getContext("2d");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
    });

    videoEl.value.srcObject = stream;
    await videoEl.value.play();

    statusMessage.value = "Cargando MediaPipe...";
    const CameraClass = await initMediaPipe();

    if (!hands) {
      statusMessage.value = "Error: MediaPipe no se cargó";
      return;
    }

    statusMessage.value = "Listo. Elegí letra y presioná GRABAR";

    if (CameraClass) {
      camera = new CameraClass(videoEl.value, {
        onFrame: async () => {
          if (hands && videoEl.value) {
            await hands.send({ image: videoEl.value });
          }
        },
        width: 640,
        height: 480,
      });
      await camera.start();
    } else {
      const processFrame = async () => {
        if (!videoEl.value || !hands) return;
        try {
          await hands.send({ image: videoEl.value });
        } catch (e) {}
        requestAnimationFrame(processFrame);
      };
      if (videoEl.value.readyState >= 2) {
        processFrame();
      } else {
        videoEl.value.addEventListener("loadeddata", processFrame, {
          once: true,
        });
      }
    }
  } catch (err) {
    statusMessage.value = `Error: ${err.message}`;
  }
}

function stopCamera() {
  if (isCapturing.value) stopCapture();
  if (camera && typeof camera.stop === "function") camera.stop();
  if (videoEl.value && videoEl.value.srcObject) {
    videoEl.value.srcObject.getTracks().forEach((t) => t.stop());
    videoEl.value.srcObject = null;
  }
  if (canvasCtx && canvasEl.value) {
    canvasCtx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);
  }
}

onMounted(() => startCamera());
onUnmounted(() => stopCamera());
</script>

<template>
  <div class="min-h-full bg-background flex flex-col">
    <header class="safe-area-inset-top bg-surface shadow-sm px-6 py-4">
      <h1 class="text-xl font-bold text-center text-primary">
        Capturar Dataset - LSE
      </h1>
      <p class="text-xs text-center text-gray-500 mt-1">
        Elegí la letra, hacé la seña y presioná GRABAR (captura 4s en ráfaga)
      </p>
    </header>

    <main class="flex-1 p-4 space-y-4">
      <div
        class="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] shadow-lg"
      >
        <video
          ref="videoEl"
          class="absolute inset-0 w-full h-full object-cover"
          autoplay
          playsinline
          muted
          style="transform: scaleX(-1)"
        ></video>
        <canvas
          ref="canvasEl"
          width="640"
          height="480"
          class="absolute inset-0 w-full h-full object-cover z-10"
          style="pointer-events: none; transform: scaleX(-1)"
        ></canvas>

        <div
          v-if="isCapturing"
          class="absolute top-4 left-4 z-20 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center gap-2"
        >
          <span class="w-2 h-2 bg-white rounded-full inline-block"></span>
          {{ selectedLetter }} · {{ captureCount }}
        </div>

        <div
          v-if="!isHandDetected"
          class="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-60"
        >
          <p class="text-yellow-400 text-lg font-bold animate-pulse">
            Esperando mano...
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5 justify-center">
        <button
          v-for="l in letters"
          :key="l"
          @click="selectedLetter = l"
          @dblclick="clearLetter(l)"
          :class="[
            'w-9 h-9 rounded-lg text-sm font-bold transition-all',
            selectedLetter === l
              ? 'bg-primary text-white shadow-md scale-110'
              : 'bg-surface text-gray-600 border border-gray-200 hover:bg-gray-100',
          ]"
        >
          {{ l }}
          <span
            v-if="samplesPerLetter[l] > 0"
            class="block text-[10px] leading-none opacity-70"
          >
            {{ samplesPerLetter[l] }}
          </span>
        </button>
      </div>

      <button
        @click="toggleCapture"
        :disabled="!isHandDetected"
        :class="[
          'w-full py-4 rounded-xl font-bold text-lg transition-all',
          isCapturing
            ? 'bg-red-500 text-white animate-pulse'
            : isHandDetected
              ? 'bg-primary text-white hover:bg-opacity-90'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
        ]"
      >
        {{ isCapturing ? "DETENER" : "GRABAR" }}
      </button>

      <div class="grid grid-cols-3 gap-2">
        <button
          @click="exportJSON"
          :disabled="dataset.length === 0"
          :class="[
            'py-3 rounded-xl font-bold transition-all',
            dataset.length > 0
              ? 'bg-success text-white hover:bg-opacity-90'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          ]"
        >
          Exportar
        </button>
        <button
          @click="triggerLoad"
          class="py-3 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all"
        >
          Cargar JSON
        </button>
        <button
          @click="clearDataset"
          class="py-3 rounded-xl font-bold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all"
        >
          Limpiar
        </button>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="loadDataset($event.target.files[0])"
      />

      <div
        v-if="statusMessage"
        class="text-center text-sm text-gray-600 bg-surface rounded-lg p-3"
      >
        {{ statusMessage }}
      </div>

      <div class="bg-surface rounded-xl p-3 max-h-40 overflow-y-auto">
        <h3 class="font-semibold text-sm text-text mb-2">Muestras por letra</h3>
        <div class="grid grid-cols-5 gap-1 text-xs">
          <div
            v-for="l in letters"
            :key="l"
            class="flex justify-between px-2 py-1 rounded"
            :class="samplesPerLetter[l] > 0 ? 'bg-primary bg-opacity-10' : ''"
          >
            <span class="font-bold">{{ l }}</span>
            <span class="text-gray-500">{{ samplesPerLetter[l] }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
