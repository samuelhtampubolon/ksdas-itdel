// Pembungkus pra-proses untuk benchmark: bitmap -> ImageData -> KSDASPrep -> bitmap
window.KSPrep = {
  PRESETS: {
    gray: {},
    binary: { mode: "binary" },
    noskew: { deskew: false },
    noflat: { flatten: false },
    t24: { targetLine: 24 },
    t36: { targetLine: 36 },
    t42: { targetLine: 42 },
  },
  async run(bitmap, name) {
    const c = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bitmap, 0, 0);
    const id = ctx.getImageData(0, 0, c.width, c.height);
    const r = KSDASPrep.prepare(id.data, id.width, id.height, this.PRESETS[name] || {});
    const out = new ImageData(KSDASPrep.toRGBA(r.gray, r.width, r.height), r.width, r.height);
    window.__lastInfo = r.info;
    return await createImageBitmap(out);
  }
};
