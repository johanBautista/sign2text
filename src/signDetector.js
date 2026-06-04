export class SignDetector {
  constructor(options = {}) {
    this.modelUrl = options.modelUrl || "/model/model.json";
    this.confidenceThreshold = options.confidenceThreshold || 0.3;
    this._model = null;
    this._loaded = false;
    this._loadPromise = null;

    this.LANDMARKS = {
      WRIST: 0,
      THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
      INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
      MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
      RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
      PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
    };
  }

  async load() {
    if (this._loadPromise) return this._loadPromise;
    this._loadPromise = this._loadModel();
    return this._loadPromise;
  }

  async _loadModel() {
    try {
      const res = await fetch(this.modelUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._model = await res.json();
      this._loaded = true;
      console.log(`[SignDetector] Cargadas ${this._model.classes.length} clases: ${this._model.classes.join(", ")}`);
    } catch (e) {
      console.warn("[SignDetector] No se pudo cargar el modelo, usando reglas heurísticas:", e.message);
      this._loaded = false;
    }
  }

  detectLetter(landmarks) {
    if (!landmarks || landmarks.length < 21) return "";

    if (this._loaded && this._model) {
      const features = this._get63Features(landmarks);
      if (features) {
        const letter = this._infer(features);
        if (letter) return letter;
      }
    }

    return this._fallbackDetect(landmarks);
  }

  predict(landmarks) {
    if (!landmarks || landmarks.length < 21) return { letter: "", confidence: 0 };

    if (this._loaded && this._model) {
      const features = this._get63Features(landmarks);
      if (features) {
        const result = this._inferWithConfidence(features);
        if (result.letter) return result;
      }
    }

    return { letter: "", confidence: 0 };
  }

  _get63Features(landmarks) {
    const wrist = landmarks[this.LANDMARKS.WRIST];
    const middleMCP = landmarks[this.LANDMARKS.MIDDLE_MCP];
    const dx = middleMCP.x - wrist.x;
    const dy = middleMCP.y - wrist.y;
    const dz = (middleMCP.z || 0) - (wrist.z || 0);
    const scale = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (scale < 1e-8) return null;
    return landmarks.flatMap(lm => [
      (lm.x - wrist.x) / scale,
      (lm.y - wrist.y) / scale,
      ((lm.z || 0) - (wrist.z || 0)) / scale,
    ]);
  }

  _infer(features) {
    let layer = features;
    const { coefs, intercepts, classes } = this._model;

    for (let i = 0; i < coefs.length; i++) {
      const W = coefs[i];
      const b = intercepts[i];
      const next = [];
      for (let j = 0; j < b.length; j++) {
        let sum = b[j];
        for (let k = 0; k < layer.length; k++) {
          sum += layer[k] * W[k][j];
        }
        if (i < coefs.length - 1) {
          next.push(sum > 0 ? sum : 0);
        } else {
          next.push(sum);
        }
      }
      layer = next;
    }

    const max = Math.max(...layer);
    const exp = layer.map(v => Math.exp(v - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    const probs = exp.map(v => v / sum);

    const idx = probs.indexOf(Math.max(...probs));
    return probs[idx] > this.confidenceThreshold ? classes[idx] : "";
  }

  _inferWithConfidence(features) {
    let layer = features;
    const { coefs, intercepts, classes } = this._model;

    for (let i = 0; i < coefs.length; i++) {
      const W = coefs[i];
      const b = intercepts[i];
      const next = [];
      for (let j = 0; j < b.length; j++) {
        let sum = b[j];
        for (let k = 0; k < layer.length; k++) {
          sum += layer[k] * W[k][j];
        }
        if (i < coefs.length - 1) {
          next.push(sum > 0 ? sum : 0);
        } else {
          next.push(sum);
        }
      }
      layer = next;
    }

    const max = Math.max(...layer);
    const exp = layer.map(v => Math.exp(v - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    const probs = exp.map(v => v / sum);

    const idx = probs.indexOf(Math.max(...probs));
    const letter = probs[idx] > this.confidenceThreshold ? classes[idx] : "";
    return { letter, confidence: Math.round(probs[idx] * 100) };
  }

  _fallbackDetect(landmarks) {
    const wrist = landmarks[this.LANDMARKS.WRIST];
    const middleMCP = landmarks[this.LANDMARKS.MIDDLE_MCP];
    const refDistance = this._dist(wrist, middleMCP);
    if (refDistance === 0) return "";

    const pinkyMCP = landmarks[this.LANDMARKS.PINKY_MCP];
    const thumbState = this._analyzeThumb(landmarks, refDistance, pinkyMCP);
    const indexState = this._analyzeFinger(landmarks, this.LANDMARKS.INDEX_MCP, this.LANDMARKS.INDEX_PIP, this.LANDMARKS.INDEX_TIP, wrist, refDistance);
    const middleState = this._analyzeFinger(landmarks, this.LANDMARKS.MIDDLE_MCP, this.LANDMARKS.MIDDLE_PIP, this.LANDMARKS.MIDDLE_TIP, wrist, refDistance);
    const ringState = this._analyzeFinger(landmarks, this.LANDMARKS.RING_MCP, this.LANDMARKS.RING_PIP, this.LANDMARKS.RING_TIP, wrist, refDistance);
    const pinkyState = this._analyzeFinger(landmarks, this.LANDMARKS.PINKY_MCP, this.LANDMARKS.PINKY_PIP, this.LANDMARKS.PINKY_TIP, wrist, refDistance);

    const indexHorizontal = this._isHorizontal(landmarks[this.LANDMARKS.INDEX_MCP], landmarks[this.LANDMARKS.INDEX_TIP]);
    const indexMiddleSeparation = this._dist(landmarks[this.LANDMARKS.INDEX_TIP], landmarks[this.LANDMARKS.MIDDLE_TIP]) / refDistance;
    const handCurvature = this._analyzeCurvature(landmarks);

    return this._recognizeLSELetter({
      thumbState, indexState, middleState, ringState, pinkyState,
      indexHorizontal, indexMiddleSeparation, handCurvature,
    });
  }

  _analyzeThumb(landmarks, refDistance, pinkyMCP) {
    const tip = landmarks[this.LANDMARKS.THUMB_TIP];
    const ip = landmarks[this.LANDMARKS.THUMB_IP];
    const mcp = landmarks[this.LANDMARKS.THUMB_MCP];
    const distToPinky = this._dist(tip, pinkyMCP) / refDistance;
    const angle = this._angle(mcp, ip, tip);
    if (distToPinky < 0.4) return "crossed";
    if (angle > 160) return "extended";
    return "folded";
  }

  _analyzeFinger(landmarks, mcpIdx, pipIdx, tipIdx, wrist, refDistance) {
    const mcp = landmarks[mcpIdx];
    const pip = landmarks[pipIdx];
    const tip = landmarks[tipIdx];
    const distToWrist = this._dist(tip, wrist) / refDistance;
    const angle = this._angle(mcp, pip, tip);
    if (distToWrist > 0.8 && angle > 155) return "extended";
    if (angle < 145) return "curved";
    if (distToWrist < 0.5) return "folded";
    return "partially_extended";
  }

  _isHorizontal(mcp, tip) {
    return Math.abs(tip.x - mcp.x) > Math.abs(tip.y - mcp.y) * 1.5;
  }

  _analyzeCurvature(landmarks) {
    let curvedCount = 0;
    const TIPS = [8, 12, 16, 20];
    const PIPS = [6, 10, 14, 18];
    const MCPS = [5, 9, 13, 17];
    for (let i = 0; i < 4; i++) {
      const angle = this._angle(landmarks[MCPS[i]], landmarks[PIPS[i]], landmarks[TIPS[i]]);
      if (angle < 140) curvedCount++;
    }
    return { isCurved: curvedCount === 4, count: curvedCount };
  }

  _recognizeLSELetter(s) {
    if (s.indexState === "extended" && s.middleState === "folded" && s.ringState === "folded" && s.pinkyState === "folded") return "D";
    if (s.thumbState === "extended" && s.indexState === "extended" && s.middleState === "folded" && !s.indexHorizontal) return "L";
    if (s.pinkyState === "extended" && s.indexState === "folded" && s.middleState === "folded") return "I";
    if (s.thumbState === "extended" && s.pinkyState === "extended" && s.indexState === "folded") return "Y";
    if (s.indexState === "extended" && s.middleState === "extended" && s.ringState === "folded") {
      return s.indexMiddleSeparation > 0.07 ? "V" : "U";
    }
    if (s.indexState === "extended" && s.middleState === "extended" && s.ringState === "extended" && s.pinkyState === "extended") return "B";
    if (s.thumbState === "extended" && s.indexState === "folded" && s.pinkyState === "folded") return "A";
    if (s.indexState === "folded" && s.middleState === "folded" && s.ringState === "folded" && s.pinkyState === "folded") {
      return s.thumbState === "crossed" ? "S" : "E";
    }
    if (s.indexHorizontal && s.indexState === "extended") {
      if (s.middleState === "extended") return "H";
      return "G";
    }
    if (s.handCurvature.isCurved) {
      if (s.thumbState === "extended" || s.thumbState === "folded") return "C";
    }
    return "";
  }

  _dist(a, b) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow((a.z || 0) - (b.z || 0), 2),
    );
  }

  _angle(a, vertex, b) {
    const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
    const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0) return 180;
    return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * 180 / Math.PI;
  }
}
