export function markToAPS(percentage) {
  if (percentage >= 90) return 7;
  if (percentage >= 80) return 6;
  if (percentage >= 70) return 5;
  if (percentage >= 60) return 4;
  if (percentage >= 50) return 3;
  if (percentage >= 40) return 2;
  if (percentage >= 30) return 1;
  return 0;
}

export function calculateAPS(results) {
  // Life Orientation counts as half — exclude or halve it
  return results.reduce((total, r) => {
    const pts = markToAPS(r.percentage);
    return (
      total + (r.subject === "Life Orientation" ? Math.round(pts / 2) : pts)
    );
  }, 0);
}
