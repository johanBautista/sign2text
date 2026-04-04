<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div class="min-h-full bg-background">
    <!-- Header -->
    <header class="safe-area-inset-top bg-surface shadow-sm">
      <div class="px-6 py-4">
        <h1 class="text-xl font-bold text-center text-primary">
          {{ t("about.title") }}
        </h1>
      </div>
    </header>

    <main class="p-6">
      <div class="max-w-2xl mx-auto space-y-8">
        <!-- Our Mission Section -->
        <section class="card">
          <h2 class="text-2xl font-bold text-text mb-4 flex items-center">
            <font-awesome-icon icon="bullseye" class="mr-3 text-primary" />
            {{ t("about.mission.title") }}
          </h2>
          <p class="text-gray-600 leading-relaxed">
            {{ t("about.mission.description") }}
          </p>
        </section>

        <!-- Key Features Section -->
        <section>
          <h2 class="text-2xl font-bold text-text mb-6 text-center">
            {{ t("about.keyFeatures") }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Real-Time Recognition -->
            <div class="card text-center">
              <div
                class="w-16 h-16 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4"
              >
                <font-awesome-icon icon="bolt" class="text-2xl text-warning" />
              </div>
              <h3 class="font-bold text-text mb-2">
                {{ t("about.features.realTime.title") }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ t("about.features.realTime.description") }}
              </p>
            </div>

            <!-- Accessibility First -->
            <div class="card text-center">
              <div
                class="w-16 h-16 mx-auto bg-secondary bg-opacity-10 rounded-full flex items-center justify-center mb-4"
              >
                <font-awesome-icon
                  icon="universal-access"
                  class="text-2xl text-secondary"
                />
              </div>
              <h3 class="font-bold text-text mb-2">
                {{ t("about.features.accessibility.title") }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ t("about.features.accessibility.description") }}
              </p>
            </div>

            <!-- Community Driven -->
            <div class="card text-center">
              <div
                class="w-16 h-16 mx-auto bg-success bg-opacity-10 rounded-full flex items-center justify-center mb-4"
              >
                <font-awesome-icon icon="globe" class="text-2xl text-success" />
              </div>
              <h3 class="font-bold text-text mb-2">
                {{ t("about.features.community.title") }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ t("about.features.community.description") }}
              </p>
            </div>
          </div>
        </section>

        <!-- Technology Stack -->
        <section class="card">
          <h2 class="text-2xl font-bold text-text mb-4 flex items-center">
            <font-awesome-icon icon="tools" class="mr-3 text-primary" />
            {{ t("about.technology.title") }}
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="p-4 bg-background rounded-lg">
              <font-awesome-icon
                icon="mobile"
                class="text-2xl mb-2 text-primary"
              />
              <div class="font-medium text-sm">Vue.js</div>
            </div>
            <div class="p-4 bg-background rounded-lg">
              <font-awesome-icon
                icon="bolt"
                class="text-2xl mb-2 text-warning"
              />
              <div class="font-medium text-sm">Capacitor</div>
            </div>
            <div class="p-4 bg-background rounded-lg">
              <font-awesome-icon
                icon="palette"
                class="text-2xl mb-2 text-info"
              />
              <div class="font-medium text-sm">Tailwind CSS</div>
            </div>
            <div class="p-4 bg-background rounded-lg">
              <font-awesome-icon
                icon="robot"
                class="text-2xl mb-2 text-secondary"
              />
              <div class="font-medium text-sm">AI/ML</div>
            </div>
          </div>
        </section>

        <!-- Team Section -->
        <section class="card">
          <h2 class="text-2xl font-bold text-text mb-4 flex items-center">
            <font-awesome-icon icon="users" class="mr-3 text-primary" />
            {{ t("about.team.title") }}
          </h2>
          <p class="text-gray-600 mb-4">
            {{ t("about.team.description") }}
          </p>
          <div class="bg-background rounded-lg p-4">
            <h3 class="font-medium text-text mb-2">
              {{ t("about.team.specialThanks") }}
            </h3>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>{{ t("about.team.thanks.advisors") }}</li>
              <li>{{ t("about.team.thanks.volunteers") }}</li>
              <li>{{ t("about.team.thanks.instructors") }}</li>
              <li>{{ t("about.team.thanks.contributors") }}</li>
            </ul>
          </div>
        </section>

        <!-- Contact & Support -->
        <section class="card">
          <h2 class="text-2xl font-bold text-text mb-4 flex items-center">
            <font-awesome-icon icon="phone" class="mr-3 text-primary" />
            {{ t("about.contact.title") }}
          </h2>
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <font-awesome-icon icon="envelope" class="text-xl text-primary" />
              <div>
                <div class="font-medium text-text">
                  {{ t("about.contact.email.title") }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ t("about.contact.email.address") }}
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <font-awesome-icon icon="bug" class="text-xl text-danger" />
              <div>
                <div class="font-medium text-text">
                  {{ t("about.contact.issues.title") }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ t("about.contact.issues.description") }}
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <font-awesome-icon
                icon="lightbulb"
                class="text-xl text-warning"
              />
              <div>
                <div class="font-medium text-text">
                  {{ t("about.contact.feedback.title") }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ t("about.contact.feedback.description") }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Privacy & Terms -->
        <section class="card bg-gray-50">
          <h2 class="text-xl font-bold text-text mb-4">
            {{ t("about.privacy.title") }}
          </h2>
          <p class="text-sm text-gray-600 mb-3">
            {{ t("about.privacy.description") }}
          </p>
          <div class="flex flex-wrap gap-4 text-sm">
            <button class="text-primary hover:underline">
              {{ t("about.privacy.privacyPolicy") }}
            </button>
            <button class="text-primary hover:underline">
              {{ t("about.privacy.termsOfService") }}
            </button>
            <button class="text-primary hover:underline">
              {{ t("about.privacy.accessibilityStatement") }}
            </button>
          </div>
        </section>
      </div>
    </main>

    <!-- Credits Footer -->
    <footer class="bg-surface border-t border-gray-200 p-6">
      <div class="text-center text-gray-500">
        <div class="text-sm mb-2">{{ t("about.credits.copyright") }}</div>
        <div class="text-xs">
          {{ t("about.credits.madeWith") }}
        </div>
      </div>
    </footer>
  </div>
</template>
