// zones.ts
// Zone typing & helper predicates.

export interface LoadZones {
  floorMaxZ: number;
  wallLeftMaxY: number;
  wallRightMinY: number;
  width: number;
  height: number;
  length: number;
  wallBand: number;
}

export function isInFloor(anchorZ: number, sizeZ: number, zones: LoadZones): boolean {
  const midZ = anchorZ + sizeZ / 2;
  return midZ <= zones.floorMaxZ;
}

export function isTouchingLeftWall(anchorY: number, zones: LoadZones): boolean {
  return anchorY <= zones.wallLeftMaxY;
}

export function isTouchingRightWall(anchorY: number, sizeY: number, zones: LoadZones): boolean {
  return anchorY + sizeY >= zones.wallRightMinY;
}

export function wallAdjacency(anchorY: number, sizeY: number, zones: LoadZones): boolean {
  return isTouchingLeftWall(anchorY, zones) || isTouchingRightWall(anchorY, sizeY, zones);
}
