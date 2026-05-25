/** Placeholder GIF paths — replace files under public/assets/cameras/ */
export interface CameraFeedAsset {
  cameraId: number;
  zoneId: number;
  gifPath: string;
  label: string;
}

const zoneCameraLabels: Record<number, [string, string, string]> = {
  0: ['HERB-N-0', 'HERB-N-1', 'HERB-N-2'],
  1: ['HERB-S-0', 'HERB-S-1', 'HERB-S-2'],
  2: ['PRED-E-0', 'PRED-E-1', 'PRED-E-2'],
  3: ['PRED-W-0', 'PRED-W-1', 'PRED-W-2'],
  4: ['RSCH-0', 'RSCH-1', 'RSCH-2'],
  5: ['VIS-0', 'VIS-1', 'VIS-2'],
};

const zoneGifFallback: Record<number, string> = {
  0: 'assets/cameras/cam-herb-n-0.gif',
  1: 'assets/cameras/cam-herb-s-0.gif',
  2: 'assets/cameras/cam-pred-e-0.gif',
  3: 'assets/cameras/cam-pred-w-0.gif',
  4: 'assets/cameras/cam-research.gif',
  5: 'assets/cameras/cam-visitor.gif',
};

function buildCameraAssets(): CameraFeedAsset[] {
  const assets: CameraFeedAsset[] = [];
  let cameraId = 0;
  for (let zoneId = 0; zoneId < 6; zoneId++) {
    const labels = zoneCameraLabels[zoneId]!;
    const gif = zoneGifFallback[zoneId]!;
    for (let slot = 0; slot < 3; slot++) {
      assets.push({
        cameraId,
        zoneId,
        gifPath: gif,
        label: labels[slot]!,
      });
      cameraId++;
    }
  }
  return assets;
}

export const CAMERA_FEED_ASSETS: readonly CameraFeedAsset[] = buildCameraAssets();

export function camerasForZone(zoneId: number): readonly CameraFeedAsset[] {
  return CAMERA_FEED_ASSETS.filter((a) => a.zoneId === zoneId);
}

export function firstCameraPerZone(): readonly CameraFeedAsset[] {
  return [0, 1, 2, 3, 4, 5].map((z) => camerasForZone(z)[0]!);
}

export function cameraAssetFor(id: number): CameraFeedAsset | undefined {
  return CAMERA_FEED_ASSETS.find((a) => a.cameraId === id);
}
