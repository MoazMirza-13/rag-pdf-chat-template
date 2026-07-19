import { loadPDFBuffer } from "../../../rag.js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || file.type !== "application/pdf") {
      return Response.json({ error: "A PDF file is required." }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: "Please upload a PDF smaller than 20 MB." }, { status: 400 });
    }
    const documentId = crypto.randomUUID();
    const result = await loadPDFBuffer(
      Buffer.from(await file.arrayBuffer()),
      `pdf-${documentId}`,
    );
    return Response.json({ message: "PDF processed", chunks: result.chunks, documentId });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: error.message || "Unable to process that PDF." }, { status: 500 });
  }
}
