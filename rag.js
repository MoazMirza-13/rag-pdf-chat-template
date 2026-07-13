import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline } from "@xenova/transformers";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

// Pinecone setup
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pc.index("pdf-chat");

//  embedding model
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
  let vectors = [];

  for (let i = 0; i < docs.length; i++) {
    const chunk = docs[i].pageContent;

    const embedding = await embedder(chunk, {
      pooling: "mean",
      normalize: true,
    });

    vectors.push({
      id: `chunk-${i}`,
      values: Array.from(embedding.data),
      metadata: {
        text: chunk,
      },
    });
  }

  // upload to Pinecone
  try {
    const pine_res = await index.namespace("pdf-chat").upsert({
      records: vectors,
    });

    console.log("🚀 ~ loadPDF ~ pine_res:", pine_res);
    return { message: pine_res };
  } catch (error) {
    console.log("🚀 ~ loadPDF ~ error:", error);
    return { error: error };
  }
}
