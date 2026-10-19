import PDFParser from "pdf2json";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Pinecone setup
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY ?? "",
});
const index = pc.index("pdf-chat");

// embedding model
async function embedQuery(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_QUERY",
): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: {
      taskType,
      outputDimensionality: 384,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding?.length) {
    throw new Error("Failed to generate embedding");
  }

  return embedding;
}

// gemini model
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export async function loadPDFBuffer(dataBuffer: Buffer, documentId: string) {
  const namespaceName = `pdf-${documentId}`;

  const pdfParser = new PDFParser();
  const text = await new Promise<string>((resolve, reject) => {
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      let fullText = "";
      pdfData.Pages.forEach((page: any) => {
        page.Texts.forEach((textItem: any) => {
          fullText += decodeURIComponent(textItem.R[0].T) + " ";
        });
        fullText += "\n\n";
      });
      resolve(fullText.trim());
    });

    pdfParser.on("pdfParser_dataError", reject);
    pdfParser.parseBuffer(dataBuffer);
  });

  // chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([text]);

  // embeddings
  const vectors: Array<{
    id: string;
    values: number[];
    metadata: { text: string };
  }> = [];

  for (let i = 0; i < docs.length; i++) {
    const chunk = docs[i].pageContent;

    const embedding = await embedQuery(chunk, "RETRIEVAL_DOCUMENT");

    vectors.push({
      id: `${documentId}-chunk-${i}`,
      values: embedding,
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
  } catch (error: unknown) {
    console.log("🚀 ~ loadPDFBuffer ~ error:", error);
    throw new Error(
      `Couldn't save the document to the vector database: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function deleteDocumentNamespace(documentIds: string[] = []) {
  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return 0;
  }

  let deleted = 0;

  for (const documentId of documentIds) {
    const namespaceName = `pdf-${documentId}`;
    try {
      await index.namespace(namespaceName).deleteAll();
      deleted += 1;
    } catch (error) {
      console.error(`Failed to delete namespace ${namespaceName}:`, error);
    }
  }

  return deleted;
}

export async function askQuestion(question: string, documentId: string) {
  const namespaceName = `${documentId}`;
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
      .map((m) => m.metadata?.text ?? "")
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
    console.error("askQuestion error:", error);
    return "Error getting answer";
  }
}
