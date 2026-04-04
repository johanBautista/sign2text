<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// Componentes de vistas
import HomeView from "./views/HomeView.vue";
import CameraView from "./views/CameraView.vue";
import GuideView from "./views/GuideView.vue";
import AboutView from "./views/AboutView.vue";

// i18n
const { t, locale } = useI18n();

// Estado de navegación
const currentView = ref("home");

// Datos de navegación
const navItems = computed(() => [
  {
    id: "home",
    label: t("nav.home"),
    icon: "home",
    component: HomeView,
  },
  {
    id: "camera",
    label: t("nav.camera"),
    icon: "camera",
    component: CameraView,
  },
  {
    id: "guide",
    label: t("nav.guide"),
    icon: "book",
    component: GuideView,
  },
  {
    id: "about",
    label: t("nav.about"),
    icon: "info-circle",
    component: AboutView,
  },
]);

// Funciones de navegación
const setActiveView = (viewId) => {
  currentView.value = viewId;
};

const getCurrentComponent = () => {
  const activeItem = navItems.value.find(
    (item) => item.id === currentView.value,
  );
  return activeItem ? activeItem.component : HomeView;
};

// Toggle de idioma
const toggleLanguage = () => {
  locale.value = locale.value === "es" ? "en" : "es";
};

const currentLanguageFlag = computed(() => {
  return locale.value === "es" ? "🇪🇸" : "🇺🇸";
});
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col safe-area-inset-top">
    <!-- Header con toggle de idioma -->
    <header class="bg-surface border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between max-w-4xl mx-auto">
        <div class="flex items-center space-x-3">
          <font-awesome-icon icon="hand-paper" class="text-2xl text-primary" />
          <h1 class="text-lg font-bold text-primary">{{ t("home.title") }}</h1>
        </div>

        <!-- Language Toggle -->
        <button
          @click="toggleLanguage"
          class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          :title="`${locale === 'es' ? 'Cambiar a English' : 'Switch to Español'}`"
        >
          <span class="text-lg">{{ currentLanguageFlag }}</span>
          <span class="text-sm font-medium text-gray-700">
            {{ locale === "es" ? "ES" : "EN" }}
          </span>
        </button>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="flex-1 overflow-y-auto">
      <component :is="getCurrentComponent()" />
    </main>

    <!-- Bottom Navigation Bar -->
    <nav class="bg-surface border-t border-gray-200 safe-area-inset-bottom">
      <div class="flex justify-around items-center px-4 py-2">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="setActiveView(item.id)"
          class="nav-item"
          :class="{
            active: currentView === item.id,
            inactive: currentView !== item.id,
          }"
        >
          <font-awesome-icon :icon="item.icon" class="text-xl mb-1" />
          <span class="text-xs font-medium">{{ item.label }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>
