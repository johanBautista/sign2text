<script setup>
import { onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useCameraDetection } from "../composables/useCameraDetection";

const { t } = useI18n();
const {
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
} = useCameraDetection();

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
            <div
              class="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"
            ></div>
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
              <p class="text-xs text-gray-400 mt-2">
                MediaPipe detection ready
              </p>
            </div>
          </div>

          <!-- Letra detectada arriba -->
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
                  : 'bg-success text-white hover:bg-opacity-90',
              ]"
            >
              <font-awesome-icon icon="plus" class="mr-2" />
              {{ saveAnimation ? "¡Guardado!" : "Guardar" }}
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
                <span class="font-medium text-primary"
                  >{{ gestureConfidence }}%</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Mano:</span>
                <span class="font-medium text-primary">{{
                  currentHandedness
                }}</span>
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
                {{ detectedLetter ? "Alfabeto LSE" : "Sin letra estable" }}
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
