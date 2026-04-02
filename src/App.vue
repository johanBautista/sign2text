<script setup>
import { ref } from "vue";

// Componentes de vistas
import HomeView from "./views/HomeView.vue";
import CameraView from "./views/CameraView.vue";
import GuideView from "./views/GuideView.vue";
import AboutView from "./views/AboutView.vue";

// Estado de navegación
const currentView = ref("home");

// Datos de navegación
const navItems = [
  {
    id: "home",
    label: "Home",
    icon: "🏠",
    component: HomeView,
  },
  {
    id: "camera",
    label: "Camera",
    icon: "📷",
    component: CameraView,
  },
  {
    id: "guide",
    label: "Guide",
    icon: "📖",
    component: GuideView,
  },
  {
    id: "about",
    label: "About",
    icon: "ℹ️",
    component: AboutView,
  },
];

// Funciones de navegación
const setActiveView = (viewId) => {
  currentView.value = viewId;
};

const getCurrentComponent = () => {
  const activeItem = navItems.find((item) => item.id === currentView.value);
  return activeItem ? activeItem.component : HomeView;
};
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col safe-area-inset-top">
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
          <span class="text-2xl mb-1">{{ item.icon }}</span>
          <span class="text-xs font-medium">{{ item.label }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>
