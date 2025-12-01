const cargoColors = [
  '#48bb78',
  '#4299e1',
  '#ed8936',
  '#9f7aea',
  '#38b2ac',
  '#ecc94b',
  '#e91e63',
  '#00bcd4',
  '#8bc34a',
  '#ff9800',
  '#673ab7',
  '#06b6d4',
];

const cargoIdColorMap = new Map();
let colorIndex = 0;

export function getCargoColor(cargoId = 'unknown') {
  if (!cargoIdColorMap.has(cargoId)) {
    cargoIdColorMap.set(cargoId, cargoColors[colorIndex % cargoColors.length]);
    colorIndex += 1;
  }
  return cargoIdColorMap.get(cargoId);
}

export function resetCargoColors() {
  cargoIdColorMap.clear();
  colorIndex = 0;
}
