<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Alfabeto de lenguaje de señas con emojis representativos
const alphabet = [
  { letter: "A", gesture: "✊" },
  { letter: "B", gesture: "🖐️" },
  { letter: "C", gesture: "🤏" },
  { letter: "D", gesture: "👆" },
  { letter: "E", gesture: "✊" },
  { letter: "F", gesture: "👌" },
  { letter: "G", gesture: "👉" },
  { letter: "H", gesture: "✌️" },
  { letter: "I", gesture: "🤘" },
  { letter: "J", gesture: "🤘" },
  { letter: "K", gesture: "✌️" },
  { letter: "L", gesture: "👆" },
  { letter: "M", gesture: "✊" },
  { letter: "N", gesture: "✊" },
  { letter: "O", gesture: "👌" },
  { letter: "P", gesture: "👆" },
  { letter: "Q", gesture: "👇" },
  { letter: "R", gesture: "🤞" },
  { letter: "S", gesture: "✊" },
  { letter: "T", gesture: "✊" },
  { letter: "U", gesture: "✌️" },
  { letter: "V", gesture: "✌️" },
  { letter: "W", gesture: "🤟" },
  { letter: "X", gesture: "👆" },
  { letter: "Y", gesture: "🤟" },
  { letter: "Z", gesture: "👆" },
];

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
            v-for="item in alphabet"
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

            <!-- Gesto (emoji) -->
            <div class="text-4xl mb-2">{{ item.gesture }}</div>

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
              <div class="text-6xl mb-4">{{ selectedLetter.gesture }}</div>
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
