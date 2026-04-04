<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const isHandDetected = ref(false);
const isCameraActive = ref(false);
const recognizedText = ref("");
const cameraStream = ref(null);

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
    });
    cameraStream.value = stream;
    isCameraActive.value = true;

    // Simulamos detección de mano después de 2 segundos
    setTimeout(() => {
      isHandDetected.value = true;
    }, 2000);

    // Simulamos texto reconocido
    setTimeout(() => {
      recognizedText.value = "Hello";
    }, 4000);
  } catch (error) {
    console.error("Error accessing camera:", error);
  }
};

const stopCamera = () => {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop());
    cameraStream.value = null;
  }
  isCameraActive.value = false;
  isHandDetected.value = false;
  recognizedText.value = "";
};

const toggleCamera = () => {
  if (isCameraActive.value) {
    stopCamera();
  } else {
    startCamera();
  }
};

onMounted(() => {
  // Auto-start camera cuando entramos a la vista
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
        <!-- Container de cámara -->
        <div
          class="relative bg-black rounded-2xl overflow-hidden aspect-video mb-6 shadow-lg"
        >
          <!-- Placeholder cuando no hay cámara activa -->
          <div
            v-if="!isCameraActive"
            class="absolute inset-0 flex items-center justify-center bg-gray-100"
          >
            <div class="text-center">
              <font-awesome-icon
                icon="camera"
                class="text-6xl mb-4 opacity-50 text-gray-400"
              />
              <p class="text-gray-500">{{ t("camera.cameraPreview") }}</p>
            </div>
          </div>

          <!-- Indicador de cámara activa -->
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center bg-primary bg-opacity-10"
          >
            <div class="text-center">
              <font-awesome-icon
                icon="video"
                class="text-6xl mb-4 animate-pulse text-primary"
              />
              <p
                class="text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm"
              >
                {{ t("camera.cameraActive") }}
              </p>
            </div>
          </div>

          <!-- Overlay de estado -->
          <div class="absolute bottom-4 left-4 right-4">
            <div
              v-if="isHandDetected"
              class="bg-success bg-opacity-90 text-white px-3 py-2 rounded-lg text-center"
            >
              <div class="font-medium">{{ t("camera.gestureDetected") }}</div>
            </div>
          </div>
        </div>

        <!-- Resultado del reconocimiento -->
        <div v-if="recognizedText" class="card mb-6">
          <h3 class="font-semibold text-text mb-2">
            {{ t("camera.recognizedText") }}
          </h3>
          <div class="bg-background rounded-lg p-4">
            <p class="text-2xl font-bold text-primary">{{ recognizedText }}</p>
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
