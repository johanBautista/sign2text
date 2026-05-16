/**
 * SignDetector Corregido - LSE
 */
export class SignDetector {
  constructor(options = {}) {
    // AJUSTE DE THRESHOLDS para mayor precisión
    this.THRESHOLD_EXTENDED = options.extendedThreshold || 0.8;
    this.THRESHOLD_CURVED = options.curvedThreshold || 0.4;
    this.THRESHOLD_ANGLE_CURVED = options.curvedAngleThreshold || 155; // Un poco más estricto
    this.THRESHOLD_HORIZONTAL = options.horizontalThreshold || 0.05;
    this.THRESHOLD_THUMB_OPEN = options.thumbOpenThreshold || 0.25; // Aumentado para evitar falsos "crossed"
    this.THRESHOLD_FINGER_SEPARATION = options.separationThreshold || 0.07;

    this.LANDMARKS = {
      WRIST: 0,
      THUMB_CMC: 1,
      THUMB_MCP: 2,
      THUMB_IP: 3,
      THUMB_TIP: 4,
      INDEX_MCP: 5,
      INDEX_PIP: 6,
      INDEX_DIP: 7,
      INDEX_TIP: 8,
      MIDDLE_MCP: 9,
      MIDDLE_PIP: 10,
      MIDDLE_DIP: 11,
      MIDDLE_TIP: 12,
      RING_MCP: 13,
      RING_PIP: 14,
      RING_DIP: 15,
      RING_TIP: 16,
      PINKY_MCP: 17,
      PINKY_PIP: 18,
      PINKY_DIP: 19,
      PINKY_TIP: 20,
    };
  }

  detectLetter(landmarks) {
    if (!landmarks || landmarks.length < 21) return "";
    const lm = this.LANDMARKS;

    const wrist = landmarks[lm.WRIST];
    const middleMCP = landmarks[lm.MIDDLE_MCP];
    const pinkyMCP = landmarks[lm.PINKY_MCP];

    const refDistance = this._distance(wrist, middleMCP);
    if (refDistance === 0) return "";

    // Analizar estados
    const thumbState = this._analyzeThumb(landmarks, refDistance, pinkyMCP);
    const indexState = this._analyzeFinger(
      landmarks,
      lm.INDEX_MCP,
      lm.INDEX_PIP,
      lm.INDEX_TIP,
      wrist,
      refDistance,
    );
    const middleState = this._analyzeFinger(
      landmarks,
      lm.MIDDLE_MCP,
      lm.MIDDLE_PIP,
      lm.MIDDLE_TIP,
      wrist,
      refDistance,
    );
    const ringState = this._analyzeFinger(
      landmarks,
      lm.RING_MCP,
      lm.RING_PIP,
      lm.RING_TIP,
      wrist,
      refDistance,
    );
    const pinkyState = this._analyzeFinger(
      landmarks,
      lm.PINKY_MCP,
      lm.PINKY_PIP,
      lm.PINKY_TIP,
      wrist,
      refDistance,
    );

    const indexHorizontal = this._isFingerHorizontal(
      landmarks[lm.INDEX_MCP],
      landmarks[lm.INDEX_TIP],
    );
    const middleHorizontal = this._isFingerHorizontal(
      landmarks[lm.MIDDLE_MCP],
      landmarks[lm.MIDDLE_TIP],
    );
    const indexMiddleSeparation =
      this._distance(landmarks[lm.INDEX_TIP], landmarks[lm.MIDDLE_TIP]) /
      refDistance;
    const handCurvature = this._analyzeHandCurvature(landmarks);

    return this._recognizeLSELetter({
      thumbState,
      indexState,
      middleState,
      ringState,
      pinkyState,
      indexHorizontal,
      middleHorizontal,
      indexMiddleSeparation,
      handCurvature,
      landmarks,
      refDistance,
    });
  }

  // --- MÉTODOS DE APOYO CORREGIDOS ---

  _analyzeThumb(landmarks, refDistance, pinkyMCP) {
    const tip = landmarks[this.LANDMARKS.THUMB_TIP];
    const ip = landmarks[this.LANDMARKS.THUMB_IP];
    const mcp = landmarks[this.LANDMARKS.THUMB_MCP];

    const distToPinky = this._distance(tip, pinkyMCP) / refDistance;
    const angle = this._calculateAngle(mcp, ip, tip);

    if (distToPinky < 0.4) return "crossed";
    if (angle > 160) return "extended";
    return "folded";
  }

  _analyzeFinger(landmarks, mcpIdx, pipIdx, tipIdx, wrist, refDistance) {
    const mcp = landmarks[mcpIdx];
    const pip = landmarks[pipIdx];
    const tip = landmarks[tipIdx];

    const distToWrist = this._distance(tip, wrist) / refDistance;
    const angle = this._calculateAngle(mcp, pip, tip);

    if (
      distToWrist > this.THRESHOLD_EXTENDED &&
      angle > this.THRESHOLD_ANGLE_CURVED
    )
      return "extended";
    if (angle < 145) return "curved"; // Umbral más cerrado para evitar detectar C en todo
    if (distToWrist < 0.5) return "folded";
    return "partially_extended";
  }

  _isFingerHorizontal(mcp, tip) {
    const dx = Math.abs(tip.x - mcp.x);
    const dy = Math.abs(tip.y - mcp.y);
    return dx > dy * 1.5; // El eje X debe ser claramente dominante
  }

  _analyzeHandCurvature(landmarks) {
    let curvedCount = 0;
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    const mcps = [5, 9, 13, 17];

    for (let i = 0; i < 4; i++) {
      const angle = this._calculateAngle(
        landmarks[mcps[i]],
        landmarks[pips[i]],
        landmarks[tips[i]],
      );
      if (angle < 140) curvedCount++;
    }
    return { isCurved: curvedCount === 4, count: curvedCount };
  }

  _recognizeLSELetter(s) {
    // 1. PRIORIDAD: LETRAS SIMPLES Y EXTENDIDAS (D, L, I, Y, V)
    // Estas son más fáciles de identificar unívocamente.

    // D: Solo índice arriba
    if (
      s.indexState === "extended" &&
      s.middleState === "folded" &&
      s.ringState === "folded" &&
      s.pinkyState === "folded"
    )
      return "D";

    // L: Pulgar e Índice (forma L)
    if (
      s.thumbState === "extended" &&
      s.indexState === "extended" &&
      s.middleState === "folded" &&
      !s.indexHorizontal
    )
      return "L";

    // I: Solo meñique
    if (
      s.pinkyState === "extended" &&
      s.indexState === "folded" &&
      s.middleState === "folded"
    )
      return "I";

    // Y: Pulgar y meñique
    if (
      s.thumbState === "extended" &&
      s.pinkyState === "extended" &&
      s.indexState === "folded"
    )
      return "Y";

    // V / U: Índice y medio arriba
    if (
      s.indexState === "extended" &&
      s.middleState === "extended" &&
      s.ringState === "folded"
    ) {
      return s.indexMiddleSeparation > this.THRESHOLD_FINGER_SEPARATION
        ? "V"
        : "U";
    }

    // 2. PRIORIDAD: CONFIGURACIONES DE PALMA / PUÑO (B, A, S, E)

    // B: Palma abierta
    if (
      s.indexState === "extended" &&
      s.middleState === "extended" &&
      s.ringState === "extended" &&
      s.pinkyState === "extended"
    )
      return "B";

    // A: Puño con pulgar fuera
    if (
      s.thumbState === "extended" &&
      s.indexState === "folded" &&
      s.pinkyState === "folded"
    )
      return "A";

    // S / E: Puños cerrados
    if (
      s.indexState === "folded" &&
      s.middleState === "folded" &&
      s.ringState === "folded" &&
      s.pinkyState === "folded"
    ) {
      return s.thumbState === "crossed" ? "S" : "E";
    }

    // 3. PRIORIDAD: LETRAS HORIZONTALES (G, H)
    if (s.indexHorizontal && s.indexState === "extended") {
      if (s.middleState === "extended" && s.middleHorizontal) return "H";
      return "G";
    }

    // 4. ÚLTIMA PRIORIDAD: LETRAS CURVAS (C, O)
    // Se dejan al final para que no "roben" la detección de otras letras
    if (s.handCurvature.isCurved) {
      if (s.thumbState === "extended" || s.thumbState === "folded") return "C";
      if (
        s.thumbState === "crossed" ||
        this._distance(s.landmarks[4], s.landmarks[8]) < 0.1
      )
        return "O";
    }

    return "";
  }

  _distance(p1, p2) {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow((p1.z || 0) - (p2.z || 0), 2),
    );
  }

  _calculateAngle(p1, vertex, p2) {
    const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
    const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0) return 180;
    return (
      (Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * 180) /
      Math.PI
    );
  }
}
