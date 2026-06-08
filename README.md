# Sign2Text

Una aplicación web responsiva que traduce lenguaje de señas a texto en tiempo real, desarrollada con Vue.js, ML y optimizada para dispositivos móviles usando Capacitor.

---

## 📑 Índice

1. [Características de Diseño](#1-características-de-diseño)
2. [Navegación y Vistas](#2-navegación-y-vistas)
3. [Internacionalización](#3-internacionalización)
4. [Características Principales](#4-características-principales)
5. [Stack Tecnológico](#5-stack-tecnológico)
6. [Arquitectura del Sistema](#6-arquitectura-del-sistema)
7. [Pipeline de Visión por Computador](#7-pipeline-de-visión-por-computador)
8. [Modelo de Machine Learning](#8-modelo-de-machine-learning)
9. [Entrenamiento y Dataset](#9-entrenamiento-y-dataset)
10. [Robustez Temporal y UX](#10-robustez-temporal-y-ux-de-reconocimiento)
11. [Instalación y Desarrollo](#11-instalación-y-desarrollo)
12. [Compilación Móvil (Capacitor)](#12-compilación-móvil-capacitor)
13. [Permisos Requeridos](#13-permisos-requeridos)
14. [Optimizaciones de Accesibilidad](#14-optimizaciones-de-accesibilidad)
15. [Estructura de Archivos](#15-estructura-de-archivos)
16. [Próximas Características](#16-próximas-características)
17. [Limitaciones Conocidas](#17-limitaciones-conocidas)
18. [Uso de IA en el Desarrollo](#18-uso-de-ia-en-el-desarrollo)
19. [Repositorio y Código Fuente](#19-repositorio-y-código-fuente)
20. [Licencia](#20-licencia)

---

## 1. Características de Diseño

- **Paleta de colores de salud/accesibilidad:**
  - Primary: `#2D7A5F` (Verde esmeralda profundo)
  - Secondary: `#55B491` (Verde menta)
  - Background: `#F8FAF9` (Blanco roto)
  - Success: `#28A745` (Indicador de detección)

- **Tipografía:** Inter/Roboto optimizada para legibilidad
- **Safe Area Insets** para dispositivos iOS/Android

## 2. Navegación y Vistas

### Bottom Tab Navigation

| Vista         | Descripción                                           |
| ------------- | ----------------------------------------------------- |
| **🏠 Home**   | Pantalla principal con hero section y características |
| **📷 Camera** | Reconocimiento de gestos en tiempo real               |
| **📖 Guide**  | Alfabeto de lenguaje de señas interactivo             |
| **ℹ️ About**  | Información del proyecto y equipo                     |

> **Nota:** Existe una vista `DatasetView` para recolección de muestras, actualmente comentada en la navegación principal.

## 3. Internacionalización

La aplicación soporta **español e inglés** mediante `vue-i18n`, con selector de idioma disponible en la cabecera.

## 4. Características Principales

### Vista Inicio

- Logo y branding de Sign2Text
- Hero section con icono central y descripción
- Botones principales: "Start Recognition" y "Learn Sign Alphabet"
- Tarjetas de características (Real-Time, Accessible, Inclusive)
- Footer de accesibilidad

### Vista Camara

- Indicador LED "Hand Detected" en tiempo real
- Área de visualización de cámara tipo fullscreen
- Visualización de landmarks y conexiones de la mano (valor didáctico)
- Controles para iniciar/detener cámara
- Resultado del texto reconocido
- Tips de uso para mejor reconocimiento

### Vista Guia

- Grid responsivo 3x3 del alfabeto de señas
- Tarjetas interactivas con letras y gestos (emojis)
- Vista detallada al seleccionar cada letra
- Tips de práctica y errores comunes
- Navegación directa a la cámara

### Vista Acerca de

- Sección "Our Mission" sobre inclusión
- Características clave del proyecto
- Stack tecnológico
- Información del equipo de desarrollo
- Contacto y soporte
- Footer con créditos "Sign2Text MVP © 2026"

## 5. Stack Tecnológico

| Capa             | Tecnologías                                        |
| ---------------- | -------------------------------------------------- |
| **Frontend**     | Vue.js 3 (Composition API), Vite                   |
| **UI/Styling**   | Tailwind CSS + CSS custom                          |
| **CV Runtime**   | MediaPipe Hands (carga dinámica por CDN)           |
| **ML Inference** | Modelo JSON propio (pesos MLP) cargado con `fetch` |
| **Mobile**       | Capacitor para iOS/Android                         |
| **i18n**         | `vue-i18n`                                         |
| **Fuentes**      | Google Fonts (Inter)                               |

### Dependencias Principales

```bash
{
  "dependencies": {
    "@mediapipe/hands": "^0.4.0",
    "@mediapipe/camera_utils": "^0.3.0",
    "@capacitor/*": "^5.0.0",
    "vue": "^3.3.0",
    "vue-i18n": "^9.0.0"
  }
}
```

### 5.1 Dependencias y scripts observados

- Scripts npm: `dev`, `build`, `preview`.
- Dependencias relevantes: `@mediapipe/hands`, `@mediapipe/camera_utils`, `@capacitor/*`, `vue`, `vue-i18n`.

### 5.2 Artefactos de ML y datos

- Dataset local: `src/assets/dataset.json`.
- Muestras etiquetadas contabilizadas: 242 aprox por cada letra.
- Modelo exportado: `public/model/model.json`.
- Clases en modelo: `A, B, C, D, E, F, G, I, L, M, N, O, P, Q, R, S, T, U, W, Z, _`.
- Archivo auxiliar: `public/model/label_encoder.pkl`.

---

---

---

## 6. Arquitectura del Sistema

A continuación se muestra cómo interactúan el hardware, el motor de Inteligencia Artificial en local (Edge Computing) y la reactividad de Vue 3 en el dispositivo móvil:

<img width="512" height="768" alt="ChatGPT Image 15 may 2026, 23_21_23" src="https://github.com/user-attachments/assets/be34bf77-66ef-435f-beb5-546ad0263bee" />

## 7. Pipeline de Visión por Computador

### 7.1 Captura y Preprocesamiento

- **Fuente**: Cámara frontal del dispositivo
- **Resolución objetivo**: 640×700 píxeles
- **Feature engineering**:
  - Centro de referencia: muñeca (landmark 0)
  - Escala: distancia muñeca → MCP del dedo medio (landmark 9)
  - Resultado: 63 features normalizadas (21 puntos × 3 ejes)

Este esquema reduce sensibilidad a traslación y escala, manteniendo información espacial relativa.

### 7.2 Landmarks 3D de MediaPipe Hands

MediaPipe entrega 21 puntos por mano con coordenadas (x, y, z). El proyecto aprovecha los tres ejes.

| ID  | Landmark   | Zona          |
| --- | ---------- | ------------- |
| 0   | WRIST      | Muñeca        |
| 1   | THUMB_CMC  | Pulgar base   |
| 2   | THUMB_MCP  | Pulgar        |
| 3   | THUMB_IP   | Pulgar        |
| 4   | THUMB_TIP  | Pulgar punta  |
| 5   | INDEX_MCP  | Índice base   |
| 6   | INDEX_PIP  | Índice        |
| 7   | INDEX_DIP  | Índice        |
| 8   | INDEX_TIP  | Índice punta  |
| 9   | MIDDLE_MCP | Medio base    |
| 10  | MIDDLE_PIP | Medio         |
| 11  | MIDDLE_DIP | Medio         |
| 12  | MIDDLE_TIP | Medio punta   |
| 13  | RING_MCP   | Anular base   |
| 14  | RING_PIP   | Anular        |
| 15  | RING_DIP   | Anular        |
| 16  | RING_TIP   | Anular punta  |
| 17  | PINKY_MCP  | Meñique base  |
| 18  | PINKY_PIP  | Meñique       |
| 19  | PINKY_DIP  | Meñique       |
| 20  | PINKY_TIP  | Meñique punta |

### 7.3 Flujo Operacional Completo

1. Usuario abre la vista Camera
2. getUserMedia inicia el stream de video
3. Se cargan scripts de MediaPipe Hands y Camera Utils
4. Cada frame se envía a hands.send({image})
5. **Si no hay mano**: se limpia letra detectada, se reinician estabilizador y auto-save
6. **Si hay mano**: se obtienen landmarks + handedness, se infiere letra/confianza, se aplica filtro temporal, se evalúa auto-save y se actualiza UI + canvas

## 8. Modelo de Machine Learning

### 8.1 Arquitectura del Clasificador

El sistema utiliza una **Red Neuronal Multicapa (MLP)** implementada desde cero en JavaScript:

- **Capa de entrada:** 63 neuronas (21 landmarks × 3 coordenadas)
- **Capas ocultas:** 64 y 32 neuronas con activación ReLU
- **Capa de salida:** 26 neuronas (abecedario completo) con activación Softmax
- **Total de parámetros:** ~7,034 pesos entrenables

### 8.2 Flujo de Procesamiento

1. **Captura:** MediaPipe Hands detecta 21 landmarks de la mano (x, y, z)
2. **Normalización:** Características centradas en la muñeca y escaladas
3. **Inferencia:** Propagación hacia adelante en la red neuronal
4. **Estabilización:** Ventana temporal de 12 frames con mayoría (60%)
5. **Auto-guardado:** 3 segundos de detección estable para guardar letra

### 8.3 Algoritmos de Identificación

El sistema implementa **dos capas de reconocimiento**:

#### Capa 1: Modelo ML (Primario)

- Red neuronal entrenada con dataset propio de 242 muestras por letra
- Accuracy alcanzado: 96.8% en pruebas (ver sección Resultados)

#### Capa 2: Reglas Heurísticas (Fallback)

- Reconocimiento basado en geometría de la mano
- Útil cuando el modelo ML no está disponible
- Soporte limitado a letras básicas (A, B, C, D, E, L, V, Y)

### 8.4 Clases soportadas por el modelo

```
A, B, C, D, E, F, G, I, L, M, N, O, P, Q, R, S, T, U, W, Z, _
```

## 9. Entrenamiento y Dataset

### 9.1 Dataset

- **Total de muestras:** 6,292 (242 por letra del abecedario)
- **Características por muestra:** 63 valores (landmarks normalizados)
- **Formato:** JSON con estructura {features: [], label: "A"}

### 9.2 Proceso de Entrenamiento

El script `entrenar.py` implementa el pipeline completo:

```bash
python3 entrenar.py
```

### 9.3 Pasos del entrenamiento

1. Carga `src/assets/dataset.json`.
2. Construye la matriz `X` (features) y las etiquetas `y`.
3. Codifica las etiquetas mediante `LabelEncoder`.
4. Realiza una partición estratificada entrenamiento/prueba (80/20).
5. Entrena dos modelos:
   - Random Forest (benchmark).
   - MLP (modelo final exportado).
6. Evalúa el rendimiento mediante:
   - Accuracy global.
   - Matriz de confusión por letra.
7. Exporta:
   - Modelo neuronal a `public/model/model.json`.
   - Codificador de etiquetas a `public/model/label_encoder.pkl`.

### 9.4 Hiperparámetros de la Red Neuronal

```bash
MLPClassifier(
    hidden_layer_sizes=(64, 32),  # Dos capas ocultas
    activation='relu',             # Función de activación
    max_iter=500,                  # Máximo de épocas
    early_stopping=True,           # Detiene si no mejora
    validation_fraction=0.1        # 10% para validación
)
```

### 9.5 Estructura del model.json

```json
{
  "samples": [
    {
      "features": [
        0,
        0,
        0,
        0.279607,
        -0.1603,
        -0.117668,
        0.53439,
        ....
            -0.819518,
        -0.021105
      ],
      "label": "A"
    },
    ...
}
```

## 10. Robustez Temporal y UX de Reconocimiento

### 10.1 Estabilización de Predicciones

En `useLetterDetection` se aplica una ventana temporal:

| Parámetro            | Valor           | Descripción                           |
| :------------------- | :-------------- | :------------------------------------ |
| Tamaño de ventana    | 12 predicciones | Frames considerados para la decisión  |
| Mayoría mínima       | 60%             | Porcentaje necesario para estabilidad |
| Estabilidad temporal | 200 ms          | Tiempo mínimo de consistencia         |

Solo se publica letra estable cuando cumple ambos criterios.

### 10.2 Auto-guardado

| Requisito         | Valor   | Propósito                       |
| :---------------- | :------ | :------------------------------ |
| Letra estable     | Sí      | Evita detecciones espurias      |
| Confianza mínima  | > 75%   | Solo guarda detecciones seguras |
| Duración continua | 3000 ms | Evita escritura impulsiva       |

Esto reduce falsos positivos y evita escritura impulsiva por jitter de landmarks.

### 10.3 Comportamiento sin Mano Detectada

Cuando no hay landmarks detectados:

- La letra detectada se vacía
- La confianza baja a 0
- Se reinician estabilizador y temporizador de auto-save

Esto evita insertar letras "fantasma".

## 11. Instalación y Desarrollo

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

## 12. Compilación Móvil (Capacitor)

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

## 13. Permisos requeridos

La aplicación solicita los siguientes permisos (Android):

| Permiso  | Propósito                                | Justificación                        |
| :------- | :--------------------------------------- | :----------------------------------- |
| CAMERA   | Acceso a cámara para captura de video    | ✅ Esencial para reconocimiento      |
| INTERNET | Comunicación con CDNs y carga de modelos | ✅ Necesario para MediaPipe y modelo |

## 14. Optimizaciones de Accesibilidad

- Soporte para lectores de pantalla
- Esquema de colores de alto contraste
- Navegación por teclado
- Textos alternativos en imágenes
- Safe areas para dispositivos con notch
- Indicadores visuales claros

## 15. Estructura de Archivos

```
sign2text/
├── public/
│   └── model/
│       ├── model.json            # Pesos del MLP
│       └── label_encoder.pkl     # Codificador de etiquetas
├── src/
│   ├── assets/
│   │   └── dataset.json          # Dataset de entrenamiento
│   ├── composables/
│   │   ├── useCameraDetection.js # Lógica de cámara y MediaPipe
│   │   └── useLetterDetection.js # Estabilización y auto-guardado
│   ├── views/
│   │   ├── HomeView.vue          # Pantalla principal
│   │   ├── CameraView.vue        # Reconocimiento de cámara
│   │   ├── GuideView.vue         # Alfabeto de señas
│   │   └── AboutView.vue         # Información y about
│   ├── App.vue                   # Componente principal
│   ├── main.js                   # Entry point
│   └── style.css                 # Estilos globales
├── entrenar.py                   # Script de entrenamiento
├── package.json
├── vite.config.js
└── README.md
```

## 16. Próximas Características

- [ ] Modo práctica con feedback
- [ ] Múltiples idiomas de señas
- [ ] Guardado de progreso
- [ ] Modo offline
- [ ]Versionado formal de datasets
- [ ]Separación explícita entre validación interna y externa
- [ ] Soporte para dos manos simultáneamente
- [ ] Reconocimiento de palabras completas

## 17. Limitaciones conocidas

| Limitación         | Descripción                                              |
| :----------------- | :------------------------------------------------------- |
| Iluminación        | Requiere buena iluminación para detección precisa        |
| Obstáculos físicos | Manos con anillos o pulseras pueden afectar detección    |
| Mano única         | Solo soporta una mano a la vez                           |
| Fallback limitado  | El fallback heurístico solo reconoce 13 letras básicas   |
| Ambigüedad         | Posibles conflictos en posturas similares (ej. M/N, U/V) |
| Dependencia CDN    | Requiere conexión a internet para cargar MediaPipe       |

## 18. Uso de IA en el Desarrollo

Este proyecto ha utilizado herramientas de IA Generativa como asistentes tecnológicos:

| Herramienta    | Uso principal                                                                                              |
| :------------- | :--------------------------------------------------------------------------------------------------------- |
| **Gemini**     | Investigación sobre dactilología, diseño de arquitectura, generación de esquemas(Nano Banana)              |
| **OpenCode**   | Desarrollo de `entrenar.py`, refinamiento de la implementación manual de la red neuronal `signDetector.js` |
| **NotebookLM** | Síntesis de documentación técnica y mejora de redacción académica                                          |

### 18.1 Áreas de asistencia:

- Investigación sobre lenguaje de señas y tecnologías de visión por computadora
- Generación inicial del código de entrenamiento y red neuronal
- Optimización del algoritmo de forward propagation
- Estructura base de la documentación

### 18.2 Verificación humana:

Todo el código generado por IA ha sido **revisado línea por línea, testeado, modificado y comprendido** por el autor. El dataset (242 muestras por letra), la arquitectura del sistema y las decisiones de diseño son **trabajo original**.

Declaración: La IA se ha utilizado como herramienta de apoyo, no como sustituto del trabajo académico personal, siguiendo las recomendaciones de la UOC.

## 19. Repositorio y Código Fuente

El código fuente de este proyecto es público, accesible y se encuentra alojado en el repositorio oficial de GitHub:

- **Enlace al Repositorio:** [https://github.com/johanBautista/sign2text](https://github.com/johanBautista/sign2text)

## 20. Licencia

Este proyecto está bajo la **Licencia MIT**. Esto significa que es software libre y permite a cualquier estudiante, desarrollador o investigador reutilizar, modificar y distribuir el código, fomentando la colaboración en herramientas de accesibilidad tecnológica.

Consulta el archivo `LICENSE` en el repositorio para obtener más detalles.

---

Sign2Text MVP © 2026 - Proyecto desarrollado con ❤️ para la comunidad

**Empowering Communication. Building Bridges. Creating Inclusion.**
