import { mesh, referenceUnionCoverage, coverageError } from './geometry.mjs';
const width = 192, height = 128;
const polygon = [[17.35, 23.65], [151.8, 12.25], [177.4, 99.7], [48.6, 111.35]];
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const scenes = [
  { id: 'single-convex', shapes: [polygon] },
  { id: 'shared-diagonal', shapes: [[polygon[0], polygon[1], polygon[2]], [polygon[0], polygon[2], polygon[3]]] },
  { id: 'rectangular-hole', shapes: [rect(23.4, 16.6, 171.8, 40.2), rect(23.4, 87.4, 171.8, 110.2),
    rect(23.4, 40.2, 59.3, 87.4), rect(137.7, 40.2, 171.8, 87.4)] },
];
const reportElement = document.querySelector('#report'), status = document.querySelector('#status');
let downloadUrl;
function shader(gl, type, source) {
  const result = gl.createShader(type);
  gl.shaderSource(result, source); gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(result); gl.deleteShader(result); throw new Error(message);
  }
  return result;
}
function renderer(mode, dpr, shapes) {
  const canvas = document.createElement('canvas');
  const factor = mode === 'supersample-2x' ? 2 : 1;
  const outputWidth = width * dpr, outputHeight = height * dpr;
  canvas.width = outputWidth * factor; canvas.height = outputHeight * factor;
  const gl = canvas.getContext('webgl2', { antialias: mode === 'native-msaa', alpha: true,
    depth: false, stencil: false, preserveDrawingBuffer: false, premultipliedAlpha: true });
  if (!gl) throw new Error('WebGL2 context unavailable');
  const vertex = shader(gl, gl.VERTEX_SHADER, `#version 300 es
    in vec3 a; uniform vec2 size; out float coverage;
    void main() { gl_Position=vec4(a.x/size.x*2.-1.,1.-a.y/size.y*2.,0.,1.); coverage=a.z; }`);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, `#version 300 es
    precision highp float; in float coverage; out vec4 color;
    void main() { color=vec4(0.,0.,0.,coverage); }`);
  const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment);
  gl.linkProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  const vertices = new Float32Array(shapes.flatMap(polygon => Array.from(mesh(
    polygon.map(p => p.map(v => v * dpr * factor)), mode === 'fringe'))));
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); gl.useProgram(program);
  const attr = gl.getAttribLocation(program, 'a'); gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr, 3, gl.FLOAT, false, 12, 0);
  gl.uniform2f(gl.getUniformLocation(program, 'size'), canvas.width, canvas.height);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const read = new Uint8Array(canvas.width * canvas.height * 4);
  const shown = document.createElement('canvas'); shown.width = outputWidth; shown.height = outputHeight;
  const context = shown.getContext('2d', { willReadFrequently: true });
  // Supersampling uses a specified box average in CPU readback, avoiding browser
  // drawImage kernel differences. Its timing includes that CPU work explicitly.
  function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, read);
    if (gl.getError() !== gl.NO_ERROR) throw new Error('WebGL draw/readback failed');
    const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);
    for (let y = 0; y < outputHeight; y++) for (let x = 0; x < outputWidth; x++) {
      let alpha = 0;
      for (let sy = 0; sy < factor; sy++) for (let sx = 0; sx < factor; sx++) {
        alpha += read[((canvas.height - 1 - y * factor - sy) * canvas.width + x * factor + sx) * 4 + 3];
      }
      output[(y * outputWidth + x) * 4 + 3] = Math.round(alpha / (factor * factor));
    }
    return output;
  }
  const info = { contextAttributes: gl.getContextAttributes(), samples: gl.getParameter(gl.SAMPLES),
    renderer: gl.getParameter(gl.RENDERER), version: gl.getParameter(gl.VERSION),
    triangles: vertices.length / 9, meshBytes: vertices.byteLength,
    backingWidth: canvas.width, backingHeight: canvas.height,
    minimumColorStorageBytes: canvas.width * canvas.height * 4 * Math.max(1, gl.getParameter(gl.SAMPLES)),
    memoryNote: 'Lower bound for color storage only; excludes driver, resolve, readback and compositor allocations' };
  return { draw, info, show(data) { context.putImageData(new ImageData(data, outputWidth, outputHeight), 0, 0); return shown; },
    dispose() { gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.getExtension('WEBGL_lose_context')?.loseContext(); } };
}
function canvasRenderer(dpr, shapes) {
  const canvas = document.createElement('canvas'); canvas.width = width * dpr; canvas.height = height * dpr;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return { info: { context: 'Canvas2D', triangles: null, backingWidth: canvas.width, backingHeight: canvas.height },
    draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const polygon of shapes) {
        ctx.beginPath(); polygon.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0] * dpr, p[1] * dpr));
        ctx.closePath(); ctx.fillStyle = '#000'; ctx.fill();
      }
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    }, show() { return canvas; }, dispose() {} };
}
const yieldFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
document.querySelector('#run').addEventListener('click', async event => {
  event.target.disabled = true; document.querySelector('#images').replaceChildren();
  document.querySelector('#download').hidden = true;
  const report = { kind: 'convex-union-aa-research', createdAt: new Date().toISOString(),
    userAgent: navigator.userAgent, actualDevicePixelRatio: devicePixelRatio,
    logicalSize: [width, height], scenes, reference: '16x16 numerical subpixel union coverage per output pixel',
    timing: '12 samples after 3 warmups; CPU submit + synchronous readback + flip/box resolve; not presentation/GPU-only latency',
    limitations: ['Convex pieces only; rectangle hole is manually decomposed, not a general tessellator',
      'No arbitrary contours, curved edges, filters, complex paint, native WebViews or device input',
      'Software/remote GPU possible; generic renderer string does not certify hardware'], results: [] };
  try {
    for (const scene of scenes) for (const dpr of [1, 2]) {
      status.textContent = `Calculating ${scene.id} coverage reference for DPR ${dpr}…`; await yieldFrame();
      const expected = referenceUnionCoverage(scene.shapes.map(polygon => polygon.map(p => p.map(v => v * dpr))), width * dpr, height * dpr);
      for (const mode of ['aliased', 'native-msaa', 'fringe', 'supersample-2x', 'canvas-2d']) {
        status.textContent = `Measuring ${scene.id}: ${mode}, DPR ${dpr}…`; await yieldFrame();
        let engine;
        try {
          engine = mode === 'canvas-2d' ? canvasRenderer(dpr, scene.shapes) : renderer(mode, dpr, scene.shapes);
          for (let i = 0; i < 3; i++) engine.draw();
          const durations = []; let data;
          for (let i = 0; i < 12; i++) { const start = performance.now(); data = engine.draw(); durations.push(performance.now() - start); }
          durations.sort((a, b) => a - b);
          const result = { scene: scene.id, mode, dpr, status: 'MEASURED', ...engine.info, quality: coverageError(data, expected),
            milliseconds: { min: durations[0], p50: durations[5], p95: durations[11], samples: durations } };
          report.results.push(result);
          const figure = document.createElement('figure'), label = document.createElement('figcaption');
          label.textContent = `${scene.id} · ${mode} · DPR ${dpr} · edge error ${(result.quality.edgeMeanAbsolute * 100).toFixed(2)}%`;
          figure.append(label, engine.show(data)); document.querySelector('#images').append(figure);
        } catch (error) { report.results.push({ scene: scene.id, mode, dpr, status: 'UNAVAILABLE', reason: error.message }); }
        finally { engine?.dispose(); }
      }
    }
    report.status = report.results.every(r => r.status === 'MEASURED') ? 'MEASURED' : 'PARTIAL';
    status.textContent = `${report.status}: ${report.results.filter(r => r.status === 'MEASURED').length}/${scenes.length * 10} cases measured.`;
  } catch (error) { report.status = 'FAILED'; report.error = error.message; status.textContent = `Failed: ${error.message}`; }
  finally {
    reportElement.textContent = JSON.stringify(report, null, 2);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([reportElement.textContent], { type: 'application/json' }));
    const link = document.querySelector('#download'); link.href = downloadUrl; link.download = 'rendering-research.json'; link.hidden = false;
    event.target.disabled = false;
  }
});
