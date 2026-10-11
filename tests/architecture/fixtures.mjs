export function minimalDocument() {
  return {
    formatVersion: 1, id: 'doc-main', title: 'Original rectangle fixture',
    stage: { width: 1920, height: 1080, background: [1, 1, 1, 1], units: 'px', perspectiveDegrees: 55, vanishingPoint: [960, 540] },
    fps: { numerator: 24, denominator: 1 }, scenes: [{ id: 'scene-main', name: 'Scene 1', timelineId: 'timeline-main' }],
    timelines: [{ id: 'timeline-main', duration: 24, layerIds: ['layer-main'] }],
    layers: [{ id: 'layer-main', name: 'Artwork', kind: 'normal', parentFolderId: null, maskLayerId: null, guideLayerId: null, armatureId: null,
      visible: true, locked: false, outline: false, color: [0.2, 0.6, 0.8, 1], exposures: [{ id: 'exposure-main', start: 0, end: 24, contentId: 'content-main', label: null }], tweens: [], sounds: [] }],
    contents: [{ id: 'content-main', mergeGraphId: 'graph-main', elementIds: [] }], elements: [],
    graphs: [{ id: 'graph-main', exteriorFaceId: 'face-outside',
      vertices: [[0, 0], [100, 0], [100, 80], [0, 80]].map((position, i) => ({ id: `vertex-${i}`, position })),
      edges: Array.from({ length: 4 }, (_, i) => ({ id: `edge-main-${i}`, startVertexId: `vertex-${i}`, endVertexId: `vertex-${(i + 1) % 4}`, segment: { kind: 'line' }, strokeId: null, forwardHalfEdgeId: `half-forward-${i}`, reverseHalfEdgeId: `half-reverse-${i}` })),
      halfEdges: Array.from({ length: 4 }, (_, i) => [
        { id: `half-forward-${i}`, edgeId: `edge-main-${i}`, originVertexId: `vertex-${i}`, twinId: `half-reverse-${i}`, nextId: `half-forward-${(i + 1) % 4}`, previousId: `half-forward-${(i + 3) % 4}`, faceId: 'face-inside' },
        { id: `half-reverse-${i}`, edgeId: `edge-main-${i}`, originVertexId: `vertex-${(i + 1) % 4}`, twinId: `half-forward-${i}`, nextId: `half-reverse-${(i + 3) % 4}`, previousId: `half-reverse-${(i + 1) % 4}`, faceId: 'face-outside' },
      ]).flat(),
      contours: [{ id: 'contour-inside', halfEdgeId: 'half-forward-0', role: 'outer' }, { id: 'contour-outside', halfEdgeId: 'half-reverse-0', role: 'exterior' }],
      faces: [{ id: 'face-inside', fillId: 'fill-main', contourIds: ['contour-inside'] }, { id: 'face-outside', fillId: null, contourIds: ['contour-outside'] }],
    }],
    fills: [{ id: 'fill-main', kind: 'solid', color: [0.1, 0.4, 0.8, 1] }], strokes: [], symbols: [], libraryFolders: [], assets: [], armatures: [], scripts: [], swatches: ['fill-main'],
    metadata: { author: '', description: 'Original public-domain test geometry; generated for VibeAnimate.', tags: [] },
  };
}
export function manifest() {
  return { format: 'VibeAnimate', formatVersion: 1, appVersion: '0.0.0', documentId: 'doc-main',
    createdAt: '2026-10-11T00:00:00.000Z', modifiedAt: '2026-10-11T00:00:00.000Z',
    entries: [{ path: 'document.json', byteLength: 0, sha256: 'a'.repeat(64), required: true }] };
}
export const elementBase = { id: 'element-main', name: '', transform: [1, 0, 0, 1, 0, 0], transform3D: null, opacity: 1, blend: 'normal', filters: [] };
export const sample = { kind: 'confirmed', position: [10, 20], timeMs: 0, pressure: 0.5, tiltX: null, tiltY: null, twist: null, tangentialPressure: null, contactWidth: null, contactHeight: null };
export const brush = { size: 12, spacing: 0.1, opacity: 1, flow: 1, hardness: 1, angleDegrees: 0, aspectRatio: 1, nib: 'round', sizePolicy: 'stage', captureZoom: 1,
  pressureSize: [[0, 0], [1, 1]], pressureOpacity: [[0, 1], [1, 1]], pressureFlow: [[0, 1], [1, 1]], tiltSize: [[0, 1], [1, 1]], twistRotation: false, stabilization: 0, smoothing: 0, pressureSmoothing: 0, cornerPreservation: 1, fittingTolerance: 0.1 };
