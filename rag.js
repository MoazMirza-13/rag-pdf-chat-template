import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline } from "@xenova/transformers";

// embedding model
const embedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);

export async function loadPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdf = await new PDFParse({ data: dataBuffer }).getText();

  const text = pdf.text;

  // chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const docs = await splitter.createDocuments([text]);

  // embeddings
  const embeddedDocs = [];
  for (const doc of docs) {
    const embedding = await embedder(doc.pageContent, {
      pooling: "mean",
      normalize: true,
    });

    embeddedDocs.push({
      text: doc.pageContent,
      embedding: Array.from(embedding.data),
    });
  }

  console.log("✅ Embedded docs:", embeddedDocs.length);

  return embeddedDocs;
}
