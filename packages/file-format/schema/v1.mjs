// Source of truth for persisted DTO structure. Runtime objects are separate.
const ref = name => ({ $ref: `#/$defs/${name}` });
const text = maxLength => ({ type: 'string', maxLength });
const number = (minimum = -1e9, maximum = 1e9) => ({ type: 'number', minimum, maximum });
const integer = (minimum = 0, maximum = 1e7) => ({ type: 'integer', minimum, maximum });
const unit = () => number(0, 1);
const bool = { type: 'boolean' };
const literal = value => ({ const: value });
const choice = (...values) => ({ type: 'string', enum: values });
const nullable = schema => ({ oneOf: [schema, { type: 'null' }] });
const array = (items, maxItems = 100000, minItems = 0) => ({ type: 'array', items, minItems, maxItems });
const tuple = (...prefixItems) => ({ type: 'array', prefixItems, items: false, minItems: prefixItems.length, maxItems: prefixItems.length });
const object = (properties, optional = []) => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties).filter(k => !optional.includes(k)) });
const union = (...oneOf) => ({ oneOf });
const id = ref('Id');
const point = ref('Point');
const paint = nullable(id);
const defs = {
  Id: { type: 'string', pattern: '^[A-Za-z][A-Za-z0-9_-]{7,95}$' },
  Point: tuple(number(), number()),
  Point3: tuple(number(), number(), number()),
  Color: tuple(unit(), unit(), unit(), unit()),
  Matrix2D: tuple(number(), number(), number(), number(), number(), number()),
  Transform3D: object({ position: ref('Point3'), rotationDegrees: ref('Point3'), scale: ref('Point3'), pivot: ref('Point3'), rotationOrder: literal('XYZ') }),
  FrameRate: object({ numerator: integer(1, 240000), denominator: integer(1, 10000) }),
  Stage: object({ width: integer(1, 65536), height: integer(1, 65536), background: ref('Color'), units: choice('px', 'mm', 'cm', 'in', 'pt'), perspectiveDegrees: number(1, 180), vanishingPoint: point }),
  GradientStop: object({ offset: unit(), color: ref('Color') }),
  FillStyle: union(
    object({ id, kind: literal('solid'), color: ref('Color') }),
    object({ id, kind: literal('linear'), matrix: ref('Matrix2D'), spread: choice('pad', 'reflect', 'repeat'), interpolation: choice('sRGB', 'linearRGB'), stops: array(ref('GradientStop'), 64, 2) }),
    object({ id, kind: literal('radial'), matrix: ref('Matrix2D'), focalRatio: number(-0.99, 0.99), spread: choice('pad', 'reflect', 'repeat'), interpolation: choice('sRGB', 'linearRGB'), stops: array(ref('GradientStop'), 64, 2) }),
    object({ id, kind: literal('bitmap'), assetId: id, matrix: ref('Matrix2D'), repeat: bool, smoothing: bool })
  ),
  StrokeStyle: object({ id, fillId: id, width: number(0, 65536), cap: choice('butt', 'round', 'square'), join: choice('miter', 'round', 'bevel'), miterLimit: number(1, 1000), scaleMode: choice('normal', 'none', 'horizontal', 'vertical'), dash: array(number(0.000001, 65536), 64), dashOffset: number() }),
  Vertex: object({ id, position: point }),
  Segment: union(object({ kind: literal('line') }), object({ kind: literal('quadratic'), control: point }), object({ kind: literal('cubic'), control1: point, control2: point })),
  Edge: object({ id, startVertexId: id, endVertexId: id, segment: ref('Segment'), strokeId: paint, forwardHalfEdgeId: id, reverseHalfEdgeId: id }),
  HalfEdge: object({ id, edgeId: id, originVertexId: id, twinId: id, nextId: nullable(id), previousId: nullable(id), faceId: id }),
  Contour: object({ id, halfEdgeId: id, role: choice('outer', 'hole', 'exterior') }),
  Face: object({ id, fillId: paint, contourIds: array(id) }),
  ShapeGraph: object({ id, exteriorFaceId: id, vertices: array(ref('Vertex')), edges: array(ref('Edge')), halfEdges: array(ref('HalfEdge'), 200000), contours: array(ref('Contour')), faces: array(ref('Face')) }),
  BrushCurve: array(tuple(unit(), unit()), 64, 2),
  BrushParameters: object({ size: number(0.01, 65536), spacing: number(0.01, 10), opacity: unit(), flow: unit(), hardness: unit(), angleDegrees: number(-360, 360), aspectRatio: number(0.01, 100), nib: choice('round', 'ellipse', 'square'), sizePolicy: choice('stage', 'classic-screen'), captureZoom: number(0.0001, 10000), pressureSize: ref('BrushCurve'), pressureOpacity: ref('BrushCurve'), pressureFlow: ref('BrushCurve'), tiltSize: ref('BrushCurve'), twistRotation: bool, stabilization: unit(), smoothing: unit(), pressureSmoothing: unit(), cornerPreservation: unit(), fittingTolerance: number(1e-8, 100) }),
  ConfirmedInkSample: object({ kind: literal('confirmed'), position: point, timeMs: number(0, 86400000), pressure: nullable(unit()), tiltX: nullable(number(-90, 90)), tiltY: nullable(number(-90, 90)), twist: nullable(number(0, 359.999999)), tangentialPressure: nullable(number(-1, 1)), contactWidth: nullable(number(0, 65536)), contactHeight: nullable(number(0, 65536)) }),
  Filter: union(
    object({ id, kind: literal('blur'), x: number(0, 2048), y: number(0, 2048), quality: choice('low', 'medium', 'high'), enabled: bool }),
    object({ id, kind: literal('shadow'), color: ref('Color'), blurX: number(0, 2048), blurY: number(0, 2048), angleDegrees: number(-360, 360), distance: number(-65536, 65536), strength: number(0, 255), inner: bool, knockout: bool, hideObject: bool, enabled: bool }),
    object({ id, kind: literal('glow'), color: ref('Color'), blurX: number(0, 2048), blurY: number(0, 2048), strength: number(0, 255), inner: bool, knockout: bool, enabled: bool }),
    object({ id, kind: literal('bevel'), highlight: ref('Color'), shadow: ref('Color'), blurX: number(0, 2048), blurY: number(0, 2048), angleDegrees: number(-360, 360), distance: number(-65536, 65536), strength: number(0, 255), mode: choice('inner', 'outer', 'full'), knockout: bool, enabled: bool }),
    object({ id, kind: choice('gradient-glow', 'gradient-bevel'), stops: array(ref('GradientStop'), 64, 2), blurX: number(0, 2048), blurY: number(0, 2048), angleDegrees: number(-360, 360), distance: number(-65536, 65536), strength: number(0, 255), mode: choice('inner', 'outer', 'full'), knockout: bool, enabled: bool }),
    object({ id, kind: literal('color-adjust'), brightness: number(-100, 100), contrast: number(-100, 100), saturation: number(-100, 100), hueDegrees: number(-180, 180), enabled: bool })
  ),
  BlendMode: choice('normal', 'layer', 'darken', 'multiply', 'lighten', 'screen', 'overlay', 'hard-light', 'difference', 'add', 'subtract', 'invert', 'alpha', 'erase'),
  TextRun: object({ text: text(1000000), fontFamily: text(256), fontStyle: text(128), fontAssetId: nullable(id), size: number(0.1, 4096), color: ref('Color'), tracking: number(-1000, 1000), kerning: bool, baseline: choice('normal', 'superscript', 'subscript'), underline: bool, link: nullable(text(4096)) }),
  TextLayout: object({ mode: choice('static', 'dynamic', 'input'), orientation: choice('horizontal', 'vertical-ltr', 'vertical-rtl'), width: number(0, 65536), height: number(0, 65536), autoSize: choice('none', 'width', 'height'), alignment: choice('left', 'center', 'right', 'justify'), lineHeight: number(0, 65536), leftMargin: number(0, 65536), rightMargin: number(0, 65536), indent: number(-65536, 65536), wrap: bool, multiline: bool, selectable: bool, scrollable: bool, maxCharacters: integer(0, 1000000) }),
  Primitive: union(
    object({ kind: literal('rectangle'), width: number(0, 65536), height: number(0, 65536), radii: tuple(number(), number(), number(), number()) }),
    object({ kind: literal('oval'), width: number(0, 65536), height: number(0, 65536), startDegrees: number(-360, 360), endDegrees: number(-360, 360), innerRadius: number(0, 0.99), closed: bool }),
    object({ kind: literal('polystar'), radius: number(0, 65536), sides: integer(3, 32), starDepth: unit(), rotationDegrees: number(-360, 360) })
  ),
  ColorEffect: object({ multiplier: tuple(number(-10, 10), number(-10, 10), number(-10, 10), number(-10, 10)), offset: tuple(number(-1, 1), number(-1, 1), number(-1, 1), number(-1, 1)) }),
  SymbolPlayback: object({ mode: choice('loop', 'once', 'single'), firstFrame: integer(), epochFrame: integer(), buttonEnabled: bool }),
  Generator: union(
    object({ kind: literal('spray'), symbolId: nullable(id), seed: integer(0, 4294967295), path: array(point, 100000, 1), radius: number(0.01, 65536), density: number(0.001, 10000), scaleRange: tuple(number(0.001, 1000), number(0.001, 1000)), rotationRange: tuple(number(-360, 360), number(-360, 360)) }),
    object({ kind: literal('symmetry'), sourceElementIds: array(id, 1000, 1), center: point, axisDegrees: number(-360, 360), mode: choice('mirror', 'rotate', 'translate'), copies: integer(1, 10000), step: point }),
    object({ kind: literal('grid'), symbolId: id, seed: integer(0, 4294967295), columns: integer(1, 1000), rows: integer(1, 1000), spacing: point, stagger: unit(), clipGraphId: nullable(id) }),
    object({ kind: literal('vine'), leafSymbolId: nullable(id), flowerSymbolId: nullable(id), seed: integer(0, 4294967295), origin: point, clipGraphId: id, branchLength: number(0.01, 65536), branchAngle: number(-180, 180), growthSteps: integer(1, 10000), collision: bool })
  ),
  Element: null,
  FrameContent: object({ id, mergeGraphId: nullable(id), elementIds: array(id) }),
  Exposure: object({ id, start: integer(), end: integer(1), contentId: nullable(id), label: nullable(object({ name: text(256), kind: choice('label', 'anchor') })) }),
  Ease: union(object({ kind: literal('linear') }), object({ kind: literal('bezier'), x1: unit(), y1: number(-100, 100), x2: unit(), y2: number(-100, 100) }), object({ kind: literal('steps'), steps: integer(1, 10000), position: choice('start', 'end') }), object({ kind: literal('preset'), family: choice('classic', 'sine', 'quadratic', 'cubic', 'quartic', 'quintic', 'bounce', 'elastic', 'back'), direction: choice('in', 'out', 'in-out'), strength: number(-100, 100), amplitude: number(0, 100), period: number(0.0001, 100) })),
  PropertyKey: object({ id, frame: integer(), value: number(), ease: ref('Ease'), tangent: choice('corner', 'smooth'), incoming: nullable(point), outgoing: nullable(point), roving: bool }),
  PropertyTrack: object({ id, property: choice('x', 'y', 'z', 'scaleX', 'scaleY', 'scaleZ', 'rotationX', 'rotationY', 'rotationZ', 'skewX', 'skewY', 'opacity', 'color.rMultiplier', 'color.gMultiplier', 'color.bMultiplier', 'color.aMultiplier', 'color.rOffset', 'color.gOffset', 'color.bOffset', 'color.aOffset', 'filter.blurX', 'filter.blurY', 'filter.strength', 'filter.distance', 'filter.angle'), filterId: nullable(id), keys: array(ref('PropertyKey'), 100000, 1) }),
  ShapeHint: object({ label: { type: 'string', pattern: '^[a-z]$' }, startEdgeId: id, startParameter: unit(), endEdgeId: id, endParameter: unit() }),
  BonePose: object({ boneId: id, rotationDegrees: number(), translation: point }),
  PoseKey: object({ id, frame: integer(), bones: array(ref('BonePose'), 10000), ease: ref('Ease') }),
  Tween: union(
    object({ id, kind: literal('motion'), start: integer(), end: integer(1), targetElementId: id, tracks: array(ref('PropertyTrack'), 256, 1), pathGraphId: nullable(id), orientToPath: bool, rotationTurns: integer(-10000, 10000) }),
    object({ id, kind: literal('classic'), start: integer(), end: integer(1), startElementId: id, endElementId: id, ease: ref('Ease'), guideLayerId: nullable(id), orientToPath: bool, rotationTurns: integer(-10000, 10000), synchronize: bool }),
    object({ id, kind: literal('shape'), start: integer(), end: integer(1), startGraphId: id, endGraphId: id, ease: ref('Ease'), hints: array(ref('ShapeHint'), 26), blend: choice('distributive', 'angular') }),
    object({ id, kind: literal('pose'), start: integer(), end: integer(1), armatureId: id, keys: array(ref('PoseKey'), 100000, 1) })
  ),
  SoundCue: object({ id, frame: integer(), assetId: id, sync: choice('event', 'start', 'stop', 'stream'), inSeconds: number(0, 86400), outSeconds: number(0, 86400), repeat: integer(1, 100000), envelope: array(tuple(number(0, 86400), unit(), unit()), 100000) }),
  Layer: object({ id, name: text(256), kind: choice('normal', 'folder', 'guide', 'guided', 'mask', 'masked', 'pose'), parentFolderId: nullable(id), maskLayerId: nullable(id), guideLayerId: nullable(id), armatureId: nullable(id), visible: bool, locked: bool, outline: bool, color: ref('Color'), exposures: array(ref('Exposure')), tweens: array(ref('Tween')), sounds: array(ref('SoundCue')) }),
  Timeline: object({ id, duration: integer(1), layerIds: array(id, 10000) }),
  Scene: object({ id, name: text(256), timelineId: id }),
  SymbolDefinition: object({ id, name: text(256), folderId: nullable(id), kind: choice('graphic', 'movieclip', 'button'), timelineId: id, registration: point, buttonFrames: nullable(object({ up: integer(), over: integer(), down: integer(), hit: integer() })) }),
  LibraryFolder: object({ id, name: text(256), parentId: nullable(id) }),
  Asset: object({ id, name: text(256), folderId: nullable(id), kind: choice('bitmap', 'audio', 'video', 'font'), sha256: ref('Sha256'), mediaType: text(128), byteLength: integer(0, 536870912), width: nullable(integer(1, 65536)), height: nullable(integer(1, 65536)), durationSeconds: nullable(number(0, 86400)), provenance: text(4096) }),
  JointLimits: object({ rotationEnabled: bool, rotationMin: number(-360, 360), rotationMax: number(-360, 360), translationXEnabled: bool, translationYEnabled: bool, translationMin: point, translationMax: point }),
  Bone: object({ id, parentBoneId: nullable(id), length: number(1e-8, 1e9), restTransform: ref('Matrix2D'), limits: ref('JointLimits'), preferredBend: choice('positive', 'negative'), elementId: nullable(id) }),
  VertexBinding: object({ graphId: id, vertexId: id, influences: array(object({ boneId: id, weight: unit() }), 32, 1) }),
  Armature: object({ id, rootBoneIds: array(id, 1000, 1), bones: array(ref('Bone'), 10000, 1), bindings: array(ref('VertexBinding')), maxIterations: integer(1, 1000), tolerance: number(1e-8, 100) }),
  Script: object({ id, name: text(256), sha256: ref('Sha256'), language: literal('javascript'), apiVersion: literal(1), requestedCapabilities: array(choice('document.read', 'document.write', 'selection.read', 'timeline.control', 'library.read', 'library.write', 'export.request'), 7), binding: union(object({ kind: literal('command') }), object({ kind: literal('frame'), timelineId: id, frame: integer() }), object({ kind: literal('symbol'), symbolId: id })) }),
  Sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
  DocumentDTO: null,
  PackageEntry: object({ path: { type: 'string', pattern: '^(document\\.json|library/[A-Za-z0-9_-]+\\.json|assets/[a-f0-9]{64}|scripts/[a-f0-9]{64}\\.js|thumbnails/[a-f0-9]{64}\\.png|metadata/[A-Za-z0-9_-]+\\.json|recovery/[A-Za-z0-9_-]+\\.json)$', maxLength: 160 }, byteLength: integer(0, 536870912), sha256: ref('Sha256'), required: bool }),
  ManifestDTO: object({ format: literal('VibeAnimate'), formatVersion: literal(1), appVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+(?:-[A-Za-z0-9.-]+)?$' }, documentId: id, createdAt: { type: 'string', format: 'utc-date-time' }, modifiedAt: { type: 'string', format: 'utc-date-time' }, entries: array(ref('PackageEntry'), 10000, 1) }),
};
const elementBase = { id, name: text(256), transform: ref('Matrix2D'), transform3D: nullable(ref('Transform3D')), opacity: unit(), blend: ref('BlendMode'), filters: array(ref('Filter'), 64) };
defs.Element = union(
  object({ ...elementBase, kind: literal('drawing'), graphId: id }),
  object({ ...elementBase, kind: literal('group'), children: array(id) }),
  object({ ...elementBase, kind: literal('primitive'), primitive: ref('Primitive'), fillId: paint, strokeId: paint }),
  object({ ...elementBase, kind: literal('ink'), samples: array(ref('ConfirmedInkSample'), 1000000, 1), brush: ref('BrushParameters'), fillId: id, paintMode: choice('normal', 'fills', 'behind', 'selection', 'inside'), fitGraphId: nullable(id) }),
  object({ ...elementBase, kind: literal('text'), runs: array(ref('TextRun'), 100000), layout: ref('TextLayout'), instanceName: text(256) }),
  object({ ...elementBase, kind: literal('symbol'), symbolId: id, playback: ref('SymbolPlayback'), colorEffect: ref('ColorEffect'), instanceName: text(256) }),
  object({ ...elementBase, kind: literal('bitmap'), assetId: id, smoothing: bool }),
  object({ ...elementBase, kind: literal('procedural'), generator: ref('Generator'), generatedElementIds: array(id) })
);
defs.DocumentDTO = object({ formatVersion: literal(1), id, title: text(1024), stage: ref('Stage'), fps: ref('FrameRate'),
  scenes: array(ref('Scene'), 1000, 1), timelines: array(ref('Timeline'), 100000, 1), layers: array(ref('Layer')),
  contents: array(ref('FrameContent')), elements: array(ref('Element')), graphs: array(ref('ShapeGraph')),
  fills: array(ref('FillStyle')), strokes: array(ref('StrokeStyle')), symbols: array(ref('SymbolDefinition')),
  libraryFolders: array(ref('LibraryFolder')), assets: array(ref('Asset')), armatures: array(ref('Armature')),
  scripts: array(ref('Script'), 10000), swatches: array(id, 10000), metadata: object({ author: text(1024), description: text(65536), tags: array(text(128), 256) }) });
export const schema = { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'urn:vibeanimate:format:1',
  title: 'VibeAnimate native document v1', $ref: '#/$defs/DocumentDTO', $defs: defs };
