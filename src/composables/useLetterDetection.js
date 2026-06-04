import { SignDetector } from "../signDetector";

export function createLetterDetectionEngine(options = {}) {
  const {
    useLandmarkDetector = true,
    onAutoSave = null,
    predictionWindowSize = 12,
    stabilityDurationMs = 200,
    minMajorityRatio = 0.6,
    autoSaveConfidenceThreshold = 75,
    autoSaveHoldMs = 3000,
  } = options;

  const signDetector = new SignDetector();
  signDetector.load();

  const predictionHistory = [];
  let candidateLetter = "";
  let candidateSince = 0;
  let autoSaveCandidateLetter = "";
  let autoSaveCandidateSince = 0;
  let autoSaveTriggeredForCandidate = false;

  const resetPredictionStabilizer = () => {
    predictionHistory.length = 0;
    candidateLetter = "";
    candidateSince = 0;
  };

  const resetAutoSaveTracking = () => {
    autoSaveCandidateLetter = "";
    autoSaveCandidateSince = 0;
    autoSaveTriggeredForCandidate = false;
  };

  const getMajorityPrediction = () => {
    if (!predictionHistory.length) {
      return { letter: "", ratio: 0 };
    }
    const counts = new Map();
    predictionHistory.forEach((letter) => {
      counts.set(letter, (counts.get(letter) || 0) + 1);
    });
    let topLetter = "";
    let topCount = 0;
    counts.forEach((count, letter) => {
      if (count > topCount) {
        topLetter = letter;
        topCount = count;
      }
    });
    return { letter: topLetter, ratio: topCount / predictionHistory.length };
  };

  const processStablePrediction = (rawLetter) => {
    const normalizedLetter = rawLetter || "";
    predictionHistory.push(normalizedLetter);
    if (predictionHistory.length > predictionWindowSize) {
      predictionHistory.shift();
    }
    const majority = getMajorityPrediction();
    if (!majority.letter) {
      candidateLetter = "";
      candidateSince = 0;
      return "";
    }
    if (majority.letter !== candidateLetter) {
      candidateLetter = majority.letter;
      candidateSince = Date.now();
    }
    const isStableByTime = Date.now() - candidateSince >= stabilityDurationMs;
    const isStableByMajority = majority.ratio >= minMajorityRatio;
    return isStableByTime && isStableByMajority ? majority.letter : "";
  };

  const processAutoSave = (stableLetter, confidencePercent, isCameraActive) => {
    if (
      !stableLetter ||
      confidencePercent <= autoSaveConfidenceThreshold ||
      !isCameraActive
    ) {
      resetAutoSaveTracking();
      return;
    }
    if (stableLetter !== autoSaveCandidateLetter) {
      autoSaveCandidateLetter = stableLetter;
      autoSaveCandidateSince = Date.now();
      autoSaveTriggeredForCandidate = false;
      return;
    }
    if (autoSaveTriggeredForCandidate) return;
    const heldDurationMs = Date.now() - autoSaveCandidateSince;
    if (heldDurationMs >= autoSaveHoldMs) {
      if (typeof onAutoSave === "function") {
        onAutoSave(stableLetter);
      }
      autoSaveTriggeredForCandidate = true;
    }
  };

  const inferRawDetection = ({ handLandmarks, handedness }) => {
    try {
      if (useLandmarkDetector) {
        const result = signDetector.predict(handLandmarks);
        if (result.letter) {
          return { letter: result.letter, confidencePercent: result.confidence };
        }
        const fallback = signDetector.detectLetter(handLandmarks);
        if (fallback) {
          return { letter: fallback, confidencePercent: 75 };
        }
        return { letter: "", confidencePercent: 0 };
      }
      const fallback = signDetector.detectLetter(handLandmarks);
      return fallback
        ? { letter: fallback, confidencePercent: 75 }
        : { letter: "", confidencePercent: 0 };
    } catch (err) {
      console.warn("[LetterDetection] Error en detección:", err);
      return { letter: "", confidencePercent: 0 };
    }
  };

  const emptyState = () => ({
    detectedLetter: "",
    recognizedText: "",
    gestureConfidence: 0,
  });

  const onHandDetected = ({ handLandmarks, handedness, isCameraActive }) => {
    const { letter, confidencePercent } = inferRawDetection({
      handLandmarks,
      handedness,
    });
    const stableLetter = processStablePrediction(letter);
    processAutoSave(stableLetter, confidencePercent, isCameraActive);
    return {
      detectedLetter: stableLetter,
      recognizedText: stableLetter,
      gestureConfidence: confidencePercent,
    };
  };

  const onNoHandDetected = () => {
    resetPredictionStabilizer();
    resetAutoSaveTracking();
    return emptyState();
  };

  return {
    onHandDetected,
    onNoHandDetected,
    resetAutoSaveTracking,
  };
}
