<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const startRecognition = () => {
  console.log("Iniciando reconocimiento de lenguaje de señas...");
  // Aquí se implementaría la lógica de la cámara
};

const learnAlphabet = () => {
  console.log("Navegando al alfabeto de señas...");
  // Esto podría navegar a la vista Guide
};
</script>

<template>
  <div class="min-h-full bg-background">
    <!-- Hero Section -->
    <section class="px-6 py-12 text-center">
      <!-- Icono central grande -->
      <div class="mb-8">
        <div
          class="w-32 h-32 mx-auto bg-secondary bg-opacity-20 rounded-full flex items-center justify-center"
        >
          <font-awesome-icon icon="hand-paper" class="text-6xl text-primary" />
        </div>
      </div>

      <!-- Título principal -->
      <h2 class="text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">
        {{ t("home.heroTitle") }}
      </h2>

      <!-- Descripción -->
      <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        {{ t("home.heroDescription") }}
      </p>

      <!-- Botones principales -->
      <div class="space-y-4">
        <button
          @click="startRecognition"
          class="w-full max-w-sm mx-auto block btn-primary text-lg py-4 shadow-lg"
        >
          {{ t("home.startRecognition") }}
        </button>

        <button
          @click="learnAlphabet"
          class="w-full max-w-sm mx-auto block btn-secondary text-lg py-4"
        >
          {{ t("home.learnAlphabet") }}
        </button>
      </div>
    </section>

    <!-- Features Section -->
    <section class="px-6 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div class="card text-center">
          <font-awesome-icon
            icon="bolt"
            class="text-3xl mb-3 text-yellow-500"
          />
          <h3 class="font-semibold text-text mb-2">
            {{ t("home.features.realTime.title") }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ t("home.features.realTime.description") }}
          </p>
        </div>

        <div class="card text-center">
          <font-awesome-icon
            icon="universal-access"
            class="text-3xl mb-3 text-blue-500"
          />
          <h3 class="font-semibold text-text mb-2">
            {{ t("home.features.accessible.title") }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ t("home.features.accessible.description") }}
          </p>
        </div>

        <div class="card text-center">
          <font-awesome-icon
            icon="globe"
            class="text-3xl mb-3 text-green-500"
          />
          <h3 class="font-semibold text-text mb-2">
            {{ t("home.features.inclusive.title") }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ t("home.features.inclusive.description") }}
          </p>
        </div>
      </div>
    </section>

    <!-- Footer de accesibilidad -->
    <footer class="px-6 py-4 text-center">
      <p class="text-xs text-gray-500">
        {{ t("home.accessibilityFooter") }}
      </p>
    </footer>
  </div>
</template>
