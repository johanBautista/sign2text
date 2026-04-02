<script setup>
import { ref } from "vue";

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
    <!-- Header -->
    <header class="safe-area-inset-top bg-surface shadow-sm">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center space-x-3">
          <div class="text-2xl">🤟</div>
          <h1 class="text-xl font-bold text-primary">Sign2Text</h1>
        </div>
        <div class="text-2xl">👋</div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="px-6 py-12 text-center">
      <!-- Icono central grande -->
      <div class="mb-8">
        <div
          class="w-32 h-32 mx-auto bg-secondary bg-opacity-20 rounded-full flex items-center justify-center"
        >
          <span class="text-6xl">🤟</span>
        </div>
      </div>

      <!-- Título principal -->
      <h2 class="text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">
        Translate Sign Language<br />Into Text
      </h2>

      <!-- Descripción -->
      <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Use your camera to recognize sign language gestures and convert them
        into readable text in real-time.
      </p>

      <!-- Botones principales -->
      <div class="space-y-4">
        <button
          @click="startRecognition"
          class="w-full max-w-sm mx-auto block btn-primary text-lg py-4 shadow-lg"
        >
          Start Recognition
        </button>

        <button
          @click="learnAlphabet"
          class="w-full max-w-sm mx-auto block btn-secondary text-lg py-4"
        >
          Learn Sign Alphabet
        </button>
      </div>
    </section>

    <!-- Features Section -->
    <section class="px-6 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div class="card text-center">
          <div class="text-3xl mb-3">⚡</div>
          <h3 class="font-semibold text-text mb-2">Real-Time</h3>
          <p class="text-sm text-gray-600">Instant translation as you sign</p>
        </div>

        <div class="card text-center">
          <div class="text-3xl mb-3">♿</div>
          <h3 class="font-semibold text-text mb-2">Accessible</h3>
          <p class="text-sm text-gray-600">Built with accessibility in mind</p>
        </div>

        <div class="card text-center">
          <div class="text-3xl mb-3">🌍</div>
          <h3 class="font-semibold text-text mb-2">Inclusive</h3>
          <p class="text-sm text-gray-600">Connecting communities together</p>
        </div>
      </div>
    </section>

    <!-- Footer de accesibilidad -->
    <footer class="px-6 py-4 text-center">
      <p class="text-xs text-gray-500">
        Optimized for screen readers and assistive technologies
      </p>
    </footer>
  </div>
</template>
