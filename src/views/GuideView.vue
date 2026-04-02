<script setup>
import { ref } from "vue";

// Alfabeto de lenguaje de señas con emojis representativos
const alphabet = [
  { letter: "A", gesture: "✊", description: "Closed fist with thumb up" },
  { letter: "B", gesture: "🖐️", description: "Open palm, fingers together" },
  { letter: "C", gesture: "🤏", description: "Curved hand like letter C" },
  { letter: "D", gesture: "👆", description: "Index finger up, others closed" },
  { letter: "E", gesture: "✊", description: "Closed fist, thumb tucked" },
  {
    letter: "F",
    gesture: "👌",
    description: "OK gesture with three fingers up",
  },
  { letter: "G", gesture: "👉", description: "Index finger extended sideways" },
  { letter: "H", gesture: "✌️", description: "Two fingers extended sideways" },
  { letter: "I", gesture: "🤘", description: "Pinky finger extended" },
  { letter: "J", gesture: "🤘", description: "Pinky finger drawing J motion" },
  { letter: "K", gesture: "✌️", description: "Index and middle finger up" },
  { letter: "L", gesture: "👆", description: "L shape with thumb and index" },
  { letter: "M", gesture: "✊", description: "Fist with thumb under fingers" },
  {
    letter: "N",
    gesture: "✊",
    description: "Fist with thumb under two fingers",
  },
  { letter: "O", gesture: "👌", description: "Circle shape with fingers" },
  { letter: "P", gesture: "👆", description: "K handshape pointing down" },
  { letter: "Q", gesture: "👇", description: "G handshape pointing down" },
  { letter: "R", gesture: "🤞", description: "Index and middle crossed" },
  { letter: "S", gesture: "✊", description: "Closed fist with thumb over" },
  {
    letter: "T",
    gesture: "✊",
    description: "Fist with thumb between fingers",
  },
  { letter: "U", gesture: "✌️", description: "Two fingers up together" },
  { letter: "V", gesture: "✌️", description: "Two fingers up separated" },
  { letter: "W", gesture: "🤟", description: "Three fingers up separated" },
  { letter: "X", gesture: "👆", description: "Index finger crooked like hook" },
  { letter: "Y", gesture: "🤟", description: "Thumb and pinky extended" },
  { letter: "Z", gesture: "👆", description: "Index finger drawing Z pattern" },
];

const selectedLetter = ref(null);

const selectLetter = (letter) => {
  selectedLetter.value = selectedLetter.value === letter ? null : letter;
};
</script>

<template>
  <div class="min-h-full bg-background">
    <!-- Header -->
    <header class="safe-area-inset-top bg-surface shadow-sm">
      <div class="px-6 py-4">
        <h1 class="text-xl font-bold text-center text-primary">
          Sign Language Alphabet
        </h1>
        <p class="text-center text-gray-600 text-sm mt-1">
          Tap any letter to learn more
        </p>
      </div>
    </header>

    <!-- Alphabet Grid -->
    <main class="p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Grid responsivo del alfabeto -->
        <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div
            v-for="item in alphabet"
            :key="item.letter"
            @click="selectLetter(item)"
            class="card cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 text-center relative"
            :class="{
              'ring-2 ring-primary bg-primary bg-opacity-5':
                selectedLetter === item,
              'shadow-sm': selectedLetter !== item,
            }"
          >
            <!-- Letra -->
            <div class="text-2xl font-bold text-text mb-2">
              {{ item.letter }}
            </div>

            <!-- Gesto (emoji) -->
            <div class="text-4xl mb-2">{{ item.gesture }}</div>

            <!-- Indicator de selección -->
            <div v-if="selectedLetter === item" class="absolute top-2 right-2">
              <div class="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
        </div>

        <!-- Detalles de la letra seleccionada -->
        <transition name="fade">
          <div
            v-if="selectedLetter"
            class="card bg-primary bg-opacity-5 border-primary border-2"
          >
            <div class="text-center">
              <div class="text-6xl mb-4">{{ selectedLetter.gesture }}</div>
              <h2 class="text-3xl font-bold text-primary mb-2">
                Letter {{ selectedLetter.letter }}
              </h2>
              <p class="text-gray-600 mb-4">{{ selectedLetter.description }}</p>

              <div class="flex gap-4 justify-center">
                <button class="btn-primary px-6 py-2">Practice</button>
                <button class="btn-secondary px-6 py-2">Next Letter</button>
              </div>
            </div>
          </div>
        </transition>

        <!-- Practice Section -->
        <div class="mt-8">
          <div class="card">
            <h3 class="text-lg font-semibold text-text mb-4 text-center">
              Quick Practice Tips
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium text-text mb-2">📚 Learning Tips:</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>• Practice each letter slowly</li>
                  <li>• Focus on hand shape first</li>
                  <li>• Use a mirror for feedback</li>
                  <li>• Practice daily for muscle memory</li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium text-text mb-2">✨ Common Mistakes:</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>• Forgetting thumb position</li>
                  <li>• Moving too quickly</li>
                  <li>• Incorrect finger placement</li>
                  <li>• Not maintaining hand shape</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation to other sections -->
        <div class="mt-8 text-center space-y-4">
          <p class="text-gray-600">Ready to practice with the camera?</p>
          <button class="btn-primary text-lg px-8 py-3">Go to Camera 📷</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
