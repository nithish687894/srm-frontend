export function calculateRecovery(attended: number, conducted: number, target: number = 75) {
  if (conducted === 0) return { current: 0, needed: 0, status: "safe" };
  
  const current = (attended / conducted) * 100;
  
  if (current >= target) {
    // How many can they miss and stay above target?
    // (attended) / (conducted + miss) >= target / 100
    // 100 * attended >= target * (conducted + miss)
    // 100 * attended / target >= conducted + miss
    // (100 * attended / target) - conducted >= miss
    const safeToMiss = Math.floor((100 * attended / target) - conducted);
    return {
      current: current.toFixed(1),
      needed: 0,
      safeToMiss: Math.max(0, safeToMiss),
      status: "safe"
    };
  } else {
    // How many more must they attend?
    // (attended + x) / (conducted + x) >= target / 100
    // 100 * (attended + x) >= target * (conducted + x)
    // 100*attended + 100x >= target*conducted + target*x
    // (100 - target) * x >= target*conducted - 100*attended
    // x >= (target*conducted - 100*attended) / (100 - target)
    const needed = Math.ceil((target * conducted - 100 * attended) / (100 - target));
    return {
      current: current.toFixed(1),
      needed: Math.max(0, needed),
      status: "at_risk"
    };
  }
}
