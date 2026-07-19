import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline } from "@xenova/transformers";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

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

// gemini model
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function loadPDFBuffer(dataBuffer, namespaceName = "pdf-chat") {
  const pdf = await new PDFParse({ data: dataBuffer }).getText();

  const text = pdf.text;

  // chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([text]);

  // embeddings
  const vectors = [];

  for (let i = 0; i < docs.length; i++) {
    const chunk = docs[i].pageContent;

    const embedding = await embedder(chunk, {
      pooling: "mean",
      normalize: true,
    });

    vectors.push({
      id: `chunk-${Date.now()}-${i}`,
      values: Array.from(embedding.data),
      metadata: {
        text: chunk,
      },
    });
  }

  if (!vectors.length) {
    throw new Error("We couldn't find readable text in that PDF.");
  }

  // Keep each uploaded document in its own namespace.
  try {
    const namespace = index.namespace(namespaceName);
    const pine_res = await namespace.upsert({
      records: vectors,
    });

    return { chunks: vectors.length, result: pine_res };
  } catch (error) {
    throw new Error(
      `Couldn't save the document to the vector database: ${error.message}`,
    );
  }
}

async function embedQuery(text) {
  const embedding = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(embedding.data);
}

export async function askQuestion(question, namespaceName = "pdf-chat") {
  try {
    // 1. embed query
    const queryVector = await embedQuery(question);

    // 2. search Pinecone
    const searchResults = await index.namespace(namespaceName).query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true,
    });

    // 3. build context
    const context = searchResults.matches
      .map((m) => m.metadata.text)
      .join("\n\n");

    // 4. call Gemini
    const interaction = await ai.interactions.create({
      model: "gemini-flash-latest",
      input: `
Answer ONLY from the context.
If not found, say "Not in document".

Context:
${context}

Question:
${question}
`,
    });

    return interaction.output_text;
  } catch (error) {
    return "Error getting answer";
  }
}
