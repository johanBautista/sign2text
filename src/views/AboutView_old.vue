<script setup>
// No se requiere lógica especial para esta vista estática
</script>

<template>
  <div class="min-h-full bg-background">
    <!-- Header -->
    <header class="safe-area-inset-top bg-surface shadow-sm">
      <div class="px-6 py-4">
        <h1 class="text-xl font-bold text-center text-primary">
          About Sign2Text
        </h1>
      </div>
    </header>

    <main class="p-6">
      <div class="max-w-2xl mx-auto space-y-8">
        <!-- Our Mission Section -->
        <section class="card">
          <h2 class="text-2xl font-bold text-text mb-4 flex items-center">
            <span class="mr-3">🎯</span>
            Our Mission
          </h2>
          <p class="text-gray-600 leading-relaxed">
            Sign2Text is dedicated to breaking down communication barriers and
            creating an inclusive world where everyone can connect seamlessly.
            We believe that technology should empower people with hearing
            disabilities and promote understanding between deaf and hearing
            communities.
          </p>
        </section>

        <!-- Key Features Section -->
        <section>
          <h2 class="text-2xl font-bold text-text mb-6 text-center">
            Key Features
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Real-Time Recognition -->
            <div class="card text-center">
              <div
                class="w-16 h-16 mx-auto bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4"
              >
                <span class="text-2xl">⚡</span>
              </div>
              <h3 class="font-bold text-text mb-2">Real-Time</h3>
              <p class="text-sm text-gray-600">
                Instant recognition and translation of sign language gestures
                using advanced computer vision.
              </p>
            </div>

            <!-- Accessibility First -->
            <div class="card text-center">
              <div
                class="w-16 h-16 mx-auto bg-secondary bg-opacity-10 rounded-full flex items-center justify-center mb-4"
              >
                <span class="text-2xl">♿</span>
              </div>
              <h3 class="font-bold text-text mb-2">Accessibility First</h3>
              <p class="text-sm text-gray-600">
                Built with universal design principles, supporting screen
                readers and assistive technologies.
              </p>
            </div>

            <!-- Community Driven -->
            <div class="card text-center">
              <div
                class="w-16 h-16 mx-auto bg-success bg-opacity-10 rounded-full flex items-center justify-center mb-4"
              >
                <span class="text-2xl">🌍</span>
              </div>
              <h3 class="font-bold text-text mb-2">Community Driven</h3>
              <p class="text-sm text-gray-600">
                Developed with input from the deaf community to ensure authentic
                and respectful representation.
              </p>
            </div>
          </div>
        </section>

        <!-- Technology Stack -->
        <section class="card">
          <h2 class="text-2xl font-bold text-text mb-4 flex items-center">
            <span class="mr-3">🔧</span>
            Technology
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="p-4 bg-background rounded-lg">
              <div class="text-2xl mb-2">📱</div>
              <div class="font-medium text-sm">Vue.js</div>
            </div>
            <div class="p-4 bg-background rounded-lg">
              <div class="text-2xl mb-2">⚡</div>
              <div class="font-medium text-sm">Capacitor</div>
            </div>
            <div class="p-4 bg-background rounded-lg">
              <div class="text-2xl mb-2">🎨</div>
              <div class="font-medium text-sm">Tailwind CSS</div>
            </div>
            <div class="p-4 bg-background rounded-lg">
              <div class="text-2xl mb-2">🤖</div>
              <div class="font-medium text-sm">AI/ML</div>
            </div>
          </div>
        </section>

        <!-- Team Section -->
        <section class="card">
          <h2 class="text-2xl font-bold text-text mb-4 flex items-center">
            <span class="mr-3">👥</span>
            Development Team
          </h2>
          <p class="text-gray-600 mb-4">
            This application was created as part of a university project focused
            on inclusive technology and accessibility.
          </p>
          <div class="bg-background rounded-lg p-4">
            <h3 class="font-medium text-text mb-2">Special Thanks To:</h3>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Local deaf community advisors</li>
              <li>• Accessibility testing volunteers</li>
              <li>• Sign language instructors</li>
              <li>• Open source contributors</li>
            </ul>
          </div>
        </section>

        <!-- Contact & Support -->
        <section class="card">
          <h2 class="text-2xl font-bold text-text mb-4 flex items-center">
            <span class="mr-3">📞</span>
            Contact & Support
          </h2>
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <span class="text-xl">📧</span>
              <div>
                <div class="font-medium text-text">Email Support</div>
                <div class="text-sm text-gray-600">support@sign2text.app</div>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-xl">🐛</span>
              <div>
                <div class="font-medium text-text">Report Issues</div>
                <div class="text-sm text-gray-600">Help us improve the app</div>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-xl">💡</span>
              <div>
                <div class="font-medium text-text">Feedback</div>
                <div class="text-sm text-gray-600">Share your suggestions</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Privacy & Terms -->
        <section class="card bg-gray-50">
          <h2 class="text-xl font-bold text-text mb-4">Privacy & Terms</h2>
          <p class="text-sm text-gray-600 mb-3">
            We are committed to protecting your privacy. This app processes data
            locally on your device whenever possible.
          </p>
          <div class="flex flex-wrap gap-4 text-sm">
            <button class="text-primary hover:underline">Privacy Policy</button>
            <button class="text-primary hover:underline">
              Terms of Service
            </button>
            <button class="text-primary hover:underline">
              Accessibility Statement
            </button>
          </div>
        </section>
      </div>
    </main>

    <!-- Credits Footer -->
    <footer class="bg-surface border-t border-gray-200 p-6">
      <div class="text-center text-gray-500">
        <div class="text-sm mb-2">Sign2Text MVP © 2026</div>
        <div class="text-xs">
          Made with ❤️ for the deaf and hard of hearing community
        </div>
      </div>
    </footer>
  </div>
</template>
