import brotliDecompress from 'brotli/decompress';
import { Buffer } from "buffer";

self.addEventListener('message', ({ data }) => {
  const buffer = Buffer.from(data, 'binary');
  const decompressed = brotliDecompress(buffer);
  self.postMessage(Buffer.from(decompressed).toString("utf-8"));
});
