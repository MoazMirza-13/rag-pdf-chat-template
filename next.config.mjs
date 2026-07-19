/** @type {import('next').NextConfig} */
const nextConfig = {
  // These libraries load PDFs and model assets through Node.js at runtime.
  // Bundling them causes PDF.js to fail when an API route is first imported.
  serverExternalPackages: [
    "pdf-parse",
    "@xenova/transformers",
    "@pinecone-database/pinecone",
    "@google/genai",
  ],
};

export default nextConfig;
