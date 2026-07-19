import { askQuestion } from "../../../rag";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { question, documentId } = await request.json();
    if (!question?.trim())
      return Response.json(
        { error: "Please enter a question." },
        { status: 400 },
      );
    if (!documentId)
      return Response.json(
        { error: "Upload a document before asking a question." },
        { status: 400 },
      );
    const answer = await askQuestion(question.trim(), `pdf-${documentId}`);
    return Response.json({ question, answer });
  } catch (error) {
    console.error("Question error:", error);
    return Response.json(
      { error: "Unable to answer that question." },
      { status: 500 },
    );
  }
}
