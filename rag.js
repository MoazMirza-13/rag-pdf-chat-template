import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function loadPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdf = await new PDFParse({ data: dataBuffer }).getText();

  const text = pdf.text;

  // 🔹 Step 1: Split text
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([text]);
  console.log("🚀 ~ loadPDF ~ docs:", docs);

  return docs;
}
