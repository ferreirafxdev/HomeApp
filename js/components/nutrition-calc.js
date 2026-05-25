// ============================================
// HOME CARE APP — Nutrition Calculators
// ============================================

const NutritionCalc = (() => {

  // 1. BMI (IMC - Índice de Massa Corporal)
  function calculateBMI(weight, height) { // weight in kg, height in cm
    if (!weight || !height) return 0;
    const h = height / 100;
    return weight / (h * h);
  }

  function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 24.9) return 'Peso normal';
    if (bmi < 29.9) return 'Sobrepeso';
    if (bmi < 34.9) return 'Obesidade Grau I';
    if (bmi < 39.9) return 'Obesidade Grau II';
    return 'Obesidade Grau III';
  }

  // 2. BMR (TMB - Taxa Metabólica Basal)
  // Utilizando a equação de Mifflin-St Jeor
  function calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age || !gender) return 0;
    const s = gender === 'M' ? 5 : -161;
    return (10 * weight) + (6.25 * height) - (5 * age) + s;
  }

  // 3. TEE (GET - Gasto Energético Total)
  function calculateTEE(bmr, activityLevel) {
    // activityLevel: 
    // 1.2 (Sedentary), 1.375 (Light), 1.55 (Moderate), 1.725 (Active), 1.9 (Very Active)
    return bmr * (activityLevel || 1.2);
  }

  // 4. Body Fat Percentage (using US Navy Method for simplicity in this demo, or just basic input)
  function calculateBodyFatNavy(gender, waist, neck, height, hip) {
    // Simplification for the example, expects inputs in cm
    if (!waist || !neck || !height) return 0;
    if (gender === 'M') {
      return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else {
      if (!hip) return 0;
      return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    }
  }

  // 5. Caloric Goal based on Objective
  function calculateCaloricGoal(tee, objective) {
    switch (objective) {
      case 'emagrecimento': return tee - 500; // Deficit de 500 kcal
      case 'hipertrofia': return tee + 300;   // Superavit de 300 kcal
      case 'manutencao': return tee;
      default: return tee;
    }
  }

  // 6. Macros split based on Caloric Goal
  function calculateMacros(caloricGoal, objective) {
    let carbPct, protPct, fatPct;

    if (objective === 'emagrecimento') {
      carbPct = 0.40; protPct = 0.30; fatPct = 0.30;
    } else if (objective === 'hipertrofia') {
      carbPct = 0.50; protPct = 0.30; fatPct = 0.20;
    } else { // manutencao ou geral
      carbPct = 0.45; protPct = 0.25; fatPct = 0.30;
    }

    // 1g Carb = 4kcal, 1g Prot = 4kcal, 1g Fat = 9kcal
    const carbs = (caloricGoal * carbPct) / 4;
    const protein = (caloricGoal * protPct) / 4;
    const fat = (caloricGoal * fatPct) / 9;

    return {
      carbs: Math.round(carbs),
      protein: Math.round(protein),
      fat: Math.round(fat),
      carbPct: Math.round(carbPct * 100),
      protPct: Math.round(protPct * 100),
      fatPct: Math.round(fatPct * 100)
    };
  }

  return {
    calculateBMI,
    getBMICategory,
    calculateBMR,
    calculateTEE,
    calculateBodyFatNavy,
    calculateCaloricGoal,
    calculateMacros
  };
})();

// Export for modules
if (typeof module !== 'undefined') module.exports = NutritionCalc;
