(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ConverterCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const limits = { maxBytes: 8 * 1024 * 1024, maxPixels: 16000000, maxSide: 4096, maxInputSide: 8192 };
  const defaults = {
    image: { width: 960, height: 720, lock: true, rotation: 0, format: 'png', caption: '' },
    pdf: { operation: 'split', selected: [1, 2, 3], appendix: true },
    video: { start: 2, end: 8, fps: 12, width: 480 }
  };
  function validateImage(s) {
    if (![s.width, s.height].every(v => Number.isInteger(v) && v >= 1 && v <= limits.maxSide)) return 'Width and height must be whole numbers from 1 to 4096.';
    if (s.width * s.height > limits.maxPixels) return 'Keep the output within 16 million pixels.';
    if (!['png', 'jpeg'].includes(s.format)) return 'Choose PNG or JPEG for this prototype.';
    return '';
  }
  function validateVideo(s) {
    if (![s.start, s.end].every(Number.isFinite) || s.start < 0 || s.end > 12 || s.end <= s.start) return 'Choose a start and end between 0 and 12 seconds. End must be after start.';
    if (![6, 12, 24].includes(s.fps)) return 'Choose 6, 12 or 24 frames per second.';
    if (![320, 480, 640].includes(s.width)) return 'Choose a supported preview width.';
    return '';
  }
  function validatePdf(s) {
    if (!['split', 'merge'].includes(s.operation)) return 'Choose extract or merge.';
    if (s.operation === 'split' && (!s.selected.length || s.selected.some(n => !Number.isInteger(n) || n < 1 || n > 6))) return 'Select at least one of the six sample pages.';
    if (s.operation === 'merge' && !s.appendix) return 'Include the two-page appendix to plan a merge.';
    return '';
  }
  function plan(type, settings) {
    const error = type === 'pdf' ? validatePdf(settings) : validateVideo(settings);
    if (error) throw new Error(error);
    const base = { schema: 'converter-prototype-plan-v1', prototype: true, simulation: true, mediaFileCreated: false, processing: 'Local planning only; no conversion engine connected', sampleData: true };
    if (type === 'pdf') return { ...base, input: 'Field-notes (synthetic six-page layout)', operation: settings.operation, pages: settings.operation === 'split' ? [...new Set(settings.selected)].sort((a,b) => a-b) : [1,2,3,4,5,6,'appendix-1','appendix-2'], outputRequested: 'PDF', limitation: 'No PDF bytes parsed or produced. Order and page selection only.' };
    return { ...base, input: 'Studio-loop (synthetic 12-second storyboard; no video file)', operation: 'trim-and-gif', startSeconds: settings.start, endSeconds: settings.end, durationSeconds: Number((settings.end-settings.start).toFixed(2)), fps: settings.fps, estimatedFrames: estimatedFrames(settings), width: settings.width, outputRequested: 'GIF', audio: 'GIF output has no audio', limitation: 'No video decoded or GIF encoded. Timing and output recipe only.' };
  }
  function estimatedFrames(s) { return Math.ceil(Number(((s.end-s.start)*s.fps).toFixed(8))); }
  function classifyFile(file) {
    if (file.size > limits.maxBytes) return 'This prototype accepts images up to 8 MiB. Try a smaller PNG, JPEG or WebP.';
    if (!/\.(png|jpe?g|webp)$/i.test(file.name) || (file.type && !['image/png','image/jpeg','image/webp'].includes(file.type))) return 'Only PNG, JPEG and WebP image imports work here. Use the labelled samples to explore PDF and video plans.';
    return '';
  }
  function outputName(name, ext) {
    return (name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{M}\p{N}._-]+/gu, '-').slice(0,80) || 'image') + '-edited.' + ext;
  }
  return { limits, defaults, validateImage, validatePdf, validateVideo, plan, classifyFile, outputName, estimatedFrames };
});
