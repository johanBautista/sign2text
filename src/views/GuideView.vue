<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Alfabeto de lenguaje de señas
const ALPHABET = [
  { letter: "A" },
  { letter: "B" },
  { letter: "C" },
  { letter: "D" },
  { letter: "E" },
  { letter: "F" },
  { letter: "G" },
  { letter: "H" },
  { letter: "I" },
  { letter: "J" },
  { letter: "K" },
  { letter: "L" },
  { letter: "M" },
  { letter: "N" },
  { letter: "O" },
  { letter: "P" },
  { letter: "Q" },
  { letter: "R" },
  { letter: "S" },
  { letter: "T" },
  { letter: "U" },
  { letter: "V" },
  { letter: "W" },
  { letter: "X" },
  { letter: "Y" },
  { letter: "Z" },
];

const getLetterImage = (letter) => {
  return new URL(`../assets/alphabet/${letter.toLowerCase()}.jpg`, import.meta.url).href;
};

const selectedLetter = ref(null);

const selectLetter = (letter) => {
  selectedLetter.value =
    selectedLetter.value?.letter === letter.letter ? null : letter;
};

const getDescription = (letter) => {
  return t(`alphabet.descriptions.${letter}`);
};
</script>

<template>
  <div class="min-h-full bg-background">
    <!-- Header -->
    <header class="safe-area-inset-top bg-surface shadow-sm">
      <div class="px-6 py-4">
        <h1 class="text-xl font-bold text-center text-primary">
          {{ t("guide.title") }}
        </h1>
        <p class="text-center text-gray-600 text-sm mt-1">
          {{ t("guide.subtitle") }}
        </p>
      </div>
    </header>

    <!-- Alphabet Grid -->
    <main class="p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Grid responsivo del alfabeto -->
        <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div
            v-for="item in ALPHABET"
            :key="item.letter"
            @click="selectLetter(item)"
            class="card cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 text-center relative"
            :class="{
              'ring-2 ring-primary bg-primary bg-opacity-5':
                selectedLetter?.letter === item.letter,
              'shadow-sm': selectedLetter?.letter !== item.letter,
            }"
          >
            <!-- Letra -->
            <div class="text-2xl font-bold text-text mb-2">
              {{ item.letter }}
            </div>

            <!-- Imagen del gesto -->
            <img
              :src="getLetterImage(item.letter)"
              :alt="`Seña letra ${item.letter}`"
              class="w-full h-16 object-contain mb-2"
            />

            <!-- Indicator de selección -->
            <div
              v-if="selectedLetter?.letter === item.letter"
              class="absolute top-2 right-2"
            >
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
              <img
                :src="getLetterImage(selectedLetter.letter)"
                :alt="`Seña letra ${selectedLetter.letter}`"
                class="w-32 h-32 object-contain mx-auto mb-4"
              />
              <h2 class="text-3xl font-bold text-primary mb-2">
                {{ t("guide.letter") }} {{ selectedLetter.letter }}
              </h2>
              <p class="text-gray-600 mb-4">
                {{ getDescription(selectedLetter.letter) }}
              </p>

              <div class="flex gap-4 justify-center">
                <button class="btn-primary px-6 py-2">
                  {{ t("guide.practice") }}
                </button>
                <button class="btn-secondary px-6 py-2">
                  {{ t("guide.nextLetter") }}
                </button>
              </div>
            </div>
          </div>
        </transition>

        <!-- Practice Section -->
        <div class="mt-8">
          <div class="card">
            <h3 class="text-lg font-semibold text-text mb-4 text-center">
              {{ t("guide.practiceTips.title") }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium text-text mb-2">
                  {{ t("guide.practiceTips.learning.title") }}
                </h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>{{ t("guide.practiceTips.learning.slow") }}</li>
                  <li>{{ t("guide.practiceTips.learning.shape") }}</li>
                  <li>{{ t("guide.practiceTips.learning.mirror") }}</li>
                  <li>{{ t("guide.practiceTips.learning.daily") }}</li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium text-text mb-2">
                  {{ t("guide.practiceTips.mistakes.title") }}
                </h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>{{ t("guide.practiceTips.mistakes.thumb") }}</li>
                  <li>{{ t("guide.practiceTips.mistakes.fast") }}</li>
                  <li>{{ t("guide.practiceTips.mistakes.finger") }}</li>
                  <li>{{ t("guide.practiceTips.mistakes.maintain") }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation to other sections -->
        <div class="mt-8 text-center space-y-4">
          <p class="text-gray-600">{{ t("guide.readyToPractice") }}</p>
          <button class="btn-primary text-lg px-8 py-3">
            {{ t("guide.goToCamera") }}
          </button>
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
