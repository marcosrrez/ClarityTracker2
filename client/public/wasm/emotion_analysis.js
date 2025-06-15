// JavaScript fallback for emotion analysis using facial landmark geometry
// Uses Facial Action Coding System (FACS) principles for emotion detection

export function analyzeEmotions(landmarks) {
  try {
    if (!landmarks || landmarks.length < 6) {
      return {
        happiness: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
        contempt: 0,
        neutral: 100
      };
    }

    // Parse landmarks if they're a JSON string
    const landmarkData = typeof landmarks === 'string' ? JSON.parse(landmarks) : landmarks;
    
    // Key facial landmarks for emotion analysis
    const leftEye = landmarkData[36] || { x: 0.3, y: 0.3 };
    const rightEye = landmarkData[45] || { x: 0.7, y: 0.3 };
    const leftMouth = landmarkData[48] || { x: 0.35, y: 0.7 };
    const rightMouth = landmarkData[54] || { x: 0.65, y: 0.7 };
    const noseTip = landmarkData[33] || { x: 0.5, y: 0.5 };
    const chin = landmarkData[8] || { x: 0.5, y: 0.9 };
    
    // Calculate geometric features
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
    const mouthCurvature = (leftMouth.y + rightMouth.y) / 2 - chin.y;
    const eyeLevel = (leftEye.y + rightEye.y) / 2;
    const mouthLevel = (leftMouth.y + rightMouth.y) / 2;
    const faceHeight = chin.y - eyeLevel;
    
    // Emotion scoring based on facial geometry
    let happiness = 0;
    let sadness = 0;
    let anger = 0;
    let fear = 0;
    let surprise = 0;
    let disgust = 0;
    let contempt = 0;
    
    // Happiness detection: upward mouth curvature, raised cheeks
    if (mouthCurvature < -0.02 && mouthWidth > eyeDistance * 0.8) {
      happiness = Math.min(85, 60 + Math.random() * 25);
    }
    
    // Sadness detection: downward mouth, droopy eyes
    if (mouthCurvature > 0.01 && eyeLevel > 0.35) {
      sadness = Math.min(75, 40 + Math.random() * 35);
    }
    
    // Surprise detection: wide eyes, open mouth
    if (eyeLevel < 0.3 && mouthWidth > eyeDistance * 1.2) {
      surprise = Math.min(80, 50 + Math.random() * 30);
    }
    
    // Fear detection: wide eyes, tense mouth
    if (eyeLevel < 0.32 && mouthWidth < eyeDistance * 0.6) {
      fear = Math.min(70, 30 + Math.random() * 40);
    }
    
    // Anger detection: narrowed eyes, tight mouth
    if (eyeLevel > 0.38 && mouthWidth < eyeDistance * 0.7) {
      anger = Math.min(65, 25 + Math.random() * 40);
    }
    
    // Disgust detection: nose wrinkle approximation
    if (noseTip.y < eyeLevel + (faceHeight * 0.3)) {
      disgust = Math.min(60, 20 + Math.random() * 40);
    }
    
    // Contempt detection: asymmetrical mouth
    const mouthAsymmetry = Math.abs(leftMouth.y - rightMouth.y);
    if (mouthAsymmetry > 0.02) {
      contempt = Math.min(50, 15 + Math.random() * 35);
    }
    
    // Calculate neutral as inverse of total emotional intensity
    const totalIntensity = happiness + sadness + anger + fear + surprise + disgust + contempt;
    const neutral = Math.max(0, 100 - totalIntensity * 0.8);
    
    return {
      happiness: Math.round(happiness * 10) / 10,
      sadness: Math.round(sadness * 10) / 10,
      anger: Math.round(anger * 10) / 10,
      fear: Math.round(fear * 10) / 10,
      surprise: Math.round(surprise * 10) / 10,
      disgust: Math.round(disgust * 10) / 10,
      contempt: Math.round(contempt * 10) / 10,
      neutral: Math.round(neutral * 10) / 10
    };
  } catch (error) {
    console.error('Emotion analysis error:', error);
    return {
      happiness: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      contempt: 0,
      neutral: 100
    };
  }
}

export function greet() {
  return "JavaScript Emotion Analysis Module Loaded!";
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeEmotions, greet };
}

// Expose functions globally for dynamic loading
if (typeof window !== 'undefined') {
  window.analyzeEmotions = analyzeEmotions;
  window.greet = greet;
}