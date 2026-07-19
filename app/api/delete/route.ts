import { deleteDocumentNamespace } from "../../../rag";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { documentIds } = await request.json();

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return Response.json({ ok: true, deleted: 0 });
    }

    const deleted = await deleteDocumentNamespace(documentIds);
    return Response.json({ ok: true, deleted });
  } catch (error) {
    console.error("Delete error:", error);
    return Response.json(
      { error: error.message || "Unable to delete documents." },
      { status: 500 },
    );
  }
}
