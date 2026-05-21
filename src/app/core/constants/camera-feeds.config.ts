/** Placeholder GIF paths — replace files under public/assets/cameras/ */
export interface CameraFeedAsset {
  cameraId: number;
  zoneId: number;
  gifPath: string;
  label: string;
}

export const CAMERA_FEED_ASSETS: readonly CameraFeedAsset[] = [
  { cameraId: 0, zoneId: 0, gifPath: 'assets/cameras/cam-herb-n-0.gif', label: 'HERB-N-0' },
  { cameraId: 1, zoneId: 0, gifPath: 'assets/cameras/cam-herb-n-1.gif', label: 'HERB-N-1' },
  { cameraId: 2, zoneId: 1, gifPath: 'assets/cameras/cam-herb-s-0.gif', label: 'HERB-S-0' },
  { cameraId: 3, zoneId: 1, gifPath: 'assets/cameras/cam-herb-s-1.gif', label: 'HERB-S-1' },
  { cameraId: 4, zoneId: 2, gifPath: 'assets/cameras/cam-pred-e-0.gif', label: 'PRED-E-0' },
  { cameraId: 5, zoneId: 2, gifPath: 'assets/cameras/cam-pred-e-1.gif', label: 'PRED-E-1' },
  { cameraId: 6, zoneId: 3, gifPath: 'assets/cameras/cam-pred-w-0.gif', label: 'PRED-W-0' },
  { cameraId: 7, zoneId: 4, gifPath: 'assets/cameras/cam-research.gif', label: 'RESEARCH' },
  { cameraId: 8, zoneId: 5, gifPath: 'assets/cameras/cam-visitor.gif', label: 'VISITOR' },
] as const;

export function cameraAssetFor(id: number): CameraFeedAsset | undefined {
  return CAMERA_FEED_ASSETS.find((a) => a.cameraId === id);
}
