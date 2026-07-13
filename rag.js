import fs from "fs";
import { PDFParse } from "pdf-parse";

export async function loadPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdf = await new PDFParse({ data: dataBuffer }).getText();
  return pdf.text;
}
