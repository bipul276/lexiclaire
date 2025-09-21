/// <reference types="vite/client" />

// allow importing the worker file as a URL string
declare module "pdfjs-dist/build/pdf.worker.min.js?url" {
  const src: string;
  export default src;
}
