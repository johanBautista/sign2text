# 🤟 Sign2Text

Una aplicación web responsiva que traduce lenguaje de señas a texto en tiempo real, desarrollada con Vue.js y optimizada para dispositivos móviles usando Capacitor.

## 🎨 Características de Diseño

- **Paleta de colores de salud/accesibilidad:**
  - Primary: `#2D7A5F` (Verde esmeralda profundo)
  - Secondary: `#55B491` (Verde menta)
  - Background: `#F8FAF9` (Blanco roto)
  - Success: `#28A745` (Indicador de detección)

- **Tipografía:** Inter/Roboto optimizada para legibilidad
- **Safe Area Insets** para dispositivos iOS/Android

## 📱 Navegación y Vistas

### Bottom Tab Navigation

- **🏠 Home:** Pantalla principal con hero section y características
- **📷 Camera:** Reconocimiento de gestos en tiempo real
- **📖 Guide:** Alfabeto de lenguaje de señas interactivo
- **ℹ️ About:** Información del proyecto y equipo

## 🚀 Características Principales

### Vista Home

- Logo y branding de Sign2Text
- Hero section con icono central y descripción
- Botones principales: "Start Recognition" y "Learn Sign Alphabet"
- Tarjetas de características (Real-Time, Accessible, Inclusive)
- Footer de accesibilidad

### Vista Camera

- Indicador LED "Hand Detected" en tiempo real
- Área de visualización de cámara tipo fullscreen
- Controles para iniciar/detener cámara
- Resultado del texto reconocido
- Tips de uso para mejor reconocimiento

### Vista Guide

- Grid responsivo 3x3 del alfabeto de señas
- Tarjetas interactivas con letras y gestos (emojis)
- Vista detallada al seleccionar cada letra
- Tips de práctica y errores comunes
- Navegación directa a la cámara

### Vista About

- Sección "Our Mission" sobre inclusión
- Características clave del proyecto
- Stack tecnológico
- Información del equipo de desarrollo
- Contacto y soporte
- Footer con créditos "Sign2Text MVP © 2026"

## 🛠️ Stack Tecnológico

- **Framework:** Vue.js 3 (Composition API)
- **Build Tool:** Vite
- **Mobile:** Capacitor para iOS/Android
- **Styling:** Tailwind CSS con variables CSS personalizadas
- **Diseño:** Mobile-first responsive design
- **Fuentes:** Google Fonts (Inter)

## 📐 Arquitectura del Sistema y Flujo de Datos (Edge Computing)

A continuación se muestra cómo interactúan el hardware, el motor de Inteligencia Artificial en local y la reactividad de Vue 3 en el dispositivo móvil:

<img width="512" height="768" alt="ChatGPT Image 15 may 2026, 23_21_23" src="https://github.com/user-attachments/assets/be34bf77-66ef-435f-beb5-546ad0263bee" />


## 📦 Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview
```

## 📱 Compilación Móvil (Capacitor)

```bash
# Añadir plataformas
npx cap add ios
npx cap add android

# Sincronizar código web
npx cap sync

# Abrir en Xcode/Android Studio
npx cap open ios
npx cap open android
```

## 🎯 Optimizaciones de Accesibilidad

- Soporte para lectores de pantalla
- Esquema de colores de alto contraste
- Navegación por teclado
- Textos alternativos en imágenes
- Safe areas para dispositivos con notch
- Indicadores visuales claros

## 🔧 Estructura de Archivos

```
src/
├── views/
│   ├── HomeView.vue      # Pantalla principal
│   ├── CameraView.vue    # Reconocimiento de cámara
│   ├── GuideView.vue     # Alfabeto de señas
│   └── AboutView.vue     # Información y about
├── App.vue               # Componente principal con navegación
├── main.js               # Entry point
└── style.css            # Estilos globales y Tailwind
```

## 🌟 Próximas Características

- [ ] Modo práctica con feedback
- [ ] Múltiples idiomas de señas
- [ ] Guardado de progreso
- [ ] Modo offline

## 📦 Repositorio y Código Fuente

El código fuente de este proyecto es público, accesible y se encuentra alojado en el repositorio oficial de GitHub:
- **Enlace al Repositorio:** [https://github.com/johanBautista/sign2text](https://github.com/johanBautista/sign2text)

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Esto significa que es software libre y permite a cualquier estudiante, desarrollador o investigador reutilizar, modificar y distribuir el código, fomentando la colaboración en herramientas de accesibilidad tecnológica.

Consulta el archivo `LICENSE` en el repositorio para obtener más detalles.

---
Sign2Text MVP © 2026 - Proyecto desarrollado con ❤️ para la comunidad

**Empowering Communication. Building Bridges. Creating Inclusion.**
