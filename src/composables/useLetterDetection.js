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

  // Patrones base y variantes tolerantes para mejorar robustez ante ruido.
  const LETTER_PATTERNS = {
    A: ["10000", "00000", "10010"],
    B: ["11111", "01111", "11110"],
    C: ["10111", "00111"],
    D: ["01000", "11000"],
    E: ["11001", "10001"],
    F: ["01101", "01100"],
    G: ["00100", "10100"],
    H: ["00010", "00110"],
    I: ["00001"],
    J: ["01001", "00001"],
    K: ["01100", "01110"],
    L: ["11000", "10000"],
    M: ["11101", "11100"],
    N: ["11110", "11101"],
    O: ["00000", "10000"],
    P: ["01011", "01111"],
    Q: ["00110", "00100"],
    R: ["10100", "01100"],
    S: ["00000", "10000"],
    T: ["00101", "00111"],
    U: ["01010", "01100"],
    V: ["01111", "01110"],
    W: ["01110", "01111"],
    X: ["11011", "01011"],
    Y: ["10001", "10011"],
    Z: ["11100", "01100"],
  };

  const distance2D = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getPalmScale = (hand) => {
    const palmWidth = distance2D(hand[5], hand[17]);
    const palmHeight = distance2D(hand[0], hand[9]);
    return Math.max(0.06, (palmWidth + palmHeight) / 2);
  };

  const detectFingers = (handLandmarks, handedness) => {
    if (!handLandmarks || handLandmarks.length === 0) {
      return [0, 0, 0, 0, 0];
    }

    const hand = handLandmarks;
    const fingers = [0, 0, 0, 0, 0];
    const palmScale = getPalmScale(hand);
    const nonThumbExtensionThreshold = Math.max(0.012, palmScale * 0.2);

    const TIP_IDS = [4, 8, 12, 16, 20];
    const PIP_IDS = [3, 6, 10, 14, 18];

    for (let i = 0; i < 5; i++) {
      const tipY = hand[TIP_IDS[i]].y;
      const pipY = hand[PIP_IDS[i]].y;

      if (i === 0) {
        const wrist = hand[0];
        const thumbTip = hand[TIP_IDS[i]];
        const thumbIp = hand[PIP_IDS[i]];
        const thumbMcp = hand[2];
        const thumbSpread = Math.abs(thumbTip.x - thumbIp.x);
        const thumbSpreadThreshold = Math.max(0.015, palmScale * 0.16);

        if (handedness === "Left" || handedness === "Right") {
          const expectedThumbSign = handedness === "Right" ? -1 : 1;
          const thumbDirectionScore =
            (thumbTip.x - thumbIp.x) * expectedThumbSign;
          const directionThreshold = Math.max(0.012, palmScale * 0.14);

          const tipToWrist = distance2D(thumbTip, wrist);
          const mcpToWrist = distance2D(thumbMcp, wrist);
          const thumbIsFarFromPalm =
            tipToWrist - mcpToWrist > Math.max(0.01, palmScale * 0.08);

          fingers[i] =
            thumbDirectionScore > directionThreshold &&
            thumbSpread > thumbSpreadThreshold &&
            thumbIsFarFromPalm
              ? 1
              : 0;
        } else {
          const tipToWrist = distance2D(thumbTip, wrist);
          const mcpToWrist = distance2D(thumbMcp, wrist);
          fingers[i] =
            thumbSpread > thumbSpreadThreshold &&
            tipToWrist - mcpToWrist > Math.max(0.01, palmScale * 0.08)
              ? 1
              : 0;
        }
      } else {
        const extensionAmount = pipY - tipY;
        const tipToWrist = distance2D(hand[TIP_IDS[i]], hand[0]);
        const pipToWrist = distance2D(hand[PIP_IDS[i]], hand[0]);
        const isForwardEnough =
          tipToWrist - pipToWrist > Math.max(0.006, palmScale * 0.04);

        fingers[i] =
          extensionAmount > nonThumbExtensionThreshold && isForwardEnough
            ? 1
            : 0;
      }
    }

    return fingers;
  };

  const hammingDistance = (a, b) => {
    let distance = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) distance += 1;
    }
    return distance;
  };

  const recognizeLetterBinary = (fingers) => {
    const pattern = fingers.join("");

    let bestLetter = "";
    let bestDistance = Number.POSITIVE_INFINITY;

    Object.entries(LETTER_PATTERNS).forEach(([letter, variants]) => {
      variants.forEach((variant) => {
        const dist = hammingDistance(pattern, variant);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestLetter = letter;
        }
      });
    });

    if (bestDistance > 1) {
      return { letter: "", confidencePercent: 0 };
    }

    const confidencePercent = bestDistance === 0 ? 92 : 74;
    return { letter: bestLetter, confidencePercent };
  };

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

    return {
      letter: topLetter,
      ratio: topCount / predictionHistory.length,
    };
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
    const binaryMatch = recognizeLetterBinary(
      detectFingers(handLandmarks, handedness),
    );

    if (!useLandmarkDetector) {
      return binaryMatch;
    }

    const modelResult = signDetector.predict(handLandmarks);
    const bothAgree = modelResult.letter &&
      binaryMatch.letter &&
      modelResult.letter === binaryMatch.letter;

    if (bothAgree) {
      return {
        letter: modelResult.letter,
        confidencePercent: Math.max(modelResult.confidence, 90),
      };
    }

    if (modelResult.letter) {
      return {
        letter: modelResult.letter,
        confidencePercent: modelResult.confidence,
      };
    }

    if (binaryMatch.letter) {
      return binaryMatch;
    }

    return { letter: "", confidencePercent: 0 };
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
