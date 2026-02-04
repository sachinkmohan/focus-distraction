// SVG data for the tree growth animation within viewBox="0 0 200 300"

// Ground / soil
export const groundY = 275;

// Seed position
export const seedCx = 100;
export const seedCy = 272;

// Sprout: stem path and leaf positions
export const stemPath = 'M100 270 C100 250, 100 230, 100 200 C100 180, 100 170, 100 160';

export const sproutLeaves = [
  { cx: 90, cy: 210, rx: 10, ry: 6, rotate: -30, threshold: 0.4 },
  { cx: 110, cy: 195, rx: 11, ry: 6, rotate: 25, threshold: 0.6 },
  { cx: 88, cy: 180, rx: 9, ry: 5, rotate: -20, threshold: 0.8 },
];

// Tree: trunk, branches, and canopy
export const trunkPath = 'M100 160 C100 140, 100 120, 100 100 C100 85, 100 75, 100 65';

export const branches = [
  { d: 'M100 130 C85 120, 70 115, 55 110', threshold: 0.1 },
  { d: 'M100 130 C115 120, 130 115, 145 110', threshold: 0.15 },
  { d: 'M100 100 C80 90, 65 80, 50 75', threshold: 0.25 },
  { d: 'M100 100 C120 90, 135 80, 150 75', threshold: 0.3 },
  { d: 'M100 80 C85 70, 70 65, 60 55', threshold: 0.4 },
  { d: 'M100 80 C115 70, 130 65, 140 55', threshold: 0.45 },
];

export const canopyLeaves = [
  { cx: 55, cy: 105, r: 18, threshold: 0.2 },
  { cx: 145, cy: 105, r: 18, threshold: 0.25 },
  { cx: 50, cy: 72, r: 16, threshold: 0.35 },
  { cx: 150, cy: 72, r: 16, threshold: 0.4 },
  { cx: 60, cy: 50, r: 15, threshold: 0.5 },
  { cx: 140, cy: 50, r: 15, threshold: 0.55 },
  { cx: 80, cy: 38, r: 18, threshold: 0.6 },
  { cx: 120, cy: 38, r: 18, threshold: 0.65 },
  { cx: 100, cy: 30, r: 20, threshold: 0.7 },
  { cx: 70, cy: 60, r: 14, threshold: 0.75 },
  { cx: 130, cy: 60, r: 14, threshold: 0.8 },
  { cx: 100, cy: 48, r: 16, threshold: 0.85 },
];
