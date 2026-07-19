"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

const Spark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z" />
  </svg>
);
const Upload = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 16V3m0 0L7.5 7.5M12 3l4.5 4.5M4 15.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5" />
  </svg>
);
const FileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z M14 2v6h6" />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.202 2.393.1 2.646.64.698 1.029 1.591 1.029 2.682 0 3.841-2.337 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

export default function Home() {
  const inputRef = useRef(null);
  const documentIdsRef = useRef([]);
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const persistDocumentIds = (ids = []) => {
    const nextIds = Array.from(new Set(ids.filter(Boolean)));
    documentIdsRef.current = nextIds;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("documentIds", JSON.stringify(nextIds));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedIds = JSON.parse(
        sessionStorage.getItem("documentIds") || "[]",
      );
      if (Array.isArray(storedIds)) {
        persistDocumentIds(storedIds);
      }
    } catch {
      persistDocumentIds([]);
    }
  }, []);

  useEffect(() => {
    const handleCleanup = () => {
      if (
        !documentIdsRef.current.length ||
        typeof navigator === "undefined" ||
        typeof navigator.sendBeacon !== "function"
      ) {
        return;
      }

      navigator.sendBeacon(
        "/api/delete",
        new Blob([JSON.stringify({ documentIds: documentIdsRef.current })], {
          type: "application/json",
        }),
      );
    };

    window.addEventListener("pagehide", handleCleanup);
    window.addEventListener("beforeunload", handleCleanup);

    return () => {
      window.removeEventListener("pagehide", handleCleanup);
      window.removeEventListener("beforeunload", handleCleanup);
    };
  }, []);

  const uploadFile = async (selectedFile) => {
    if (!selectedFile || selectedFile.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    setFile(selectedFile);
    setStatus("uploading");
    setAnswer("");
    setError("");
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setDocumentId(data.documentId);
      const storedIds =
        typeof window !== "undefined"
          ? JSON.parse(sessionStorage.getItem("documentIds") || "[]")
          : [];
      const nextIds = storedIds.includes(data.documentId)
        ? storedIds
        : [...storedIds, data.documentId];
      persistDocumentIds(nextIds);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  };

  const ask = async (event) => {
    event.preventDefault();
    if (!question.trim() || status !== "ready") return;
    setStatus("asking");
    setAnswer("");
    setError("");
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, documentId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Couldn't get an answer.");
      setAnswer(data.answer);
      setStatus("ready");
    } catch (err) {
      setStatus("ready");
      setError(err.message);
    }
  };

  const isBusy = status === "uploading" || status === "asking";
  const canAsk = status === "ready" && question.trim().length > 0;

  return (
    <main className="shell">
      <nav>
        <a className="brand">
          <span>
            <Spark />
          </span>
          Private PDF Chat
        </a>
        <div className="secure">
          <i /> Private session
        </div>
      </nav>
      <section className="hero" id="top">
        <div className="eyebrow">
          <Spark /> RAG TEMPLATE
        </div>
        <h1>
          Understand your PDFs
          <br />
          <em>instantly.</em>
        </h1>
        <p>
          Upload a document. Maps its meaning, so you can get grounded answers
          in seconds.
        </p>
      </section>
      <section className="workspace">
        <div className="step-line">
          <span className="active">
            01 <b>Prepare</b>
          </span>
          <i />
          <span
            className={
              status === "ready" || status === "asking" ? "active" : ""
            }
          >
            02 <b>Explore</b>
          </span>
        </div>
        <div className="panels">
          <article className={`upload-card ${file ? "has-file" : ""}`}>
            <div className="card-label">SOURCE DOCUMENT</div>
            {!file || status === "error" ? (
              <button
                className="dropzone"
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
              >
                <span className="upload-mark">
                  <Upload />
                </span>
                <strong>Drop your PDF here</strong>
                <small>or browse from your device</small>
                <small className="limit">PDF · up to 20 MB</small>
              </button>
            ) : (
              <div className="file-ready">
                <span className="file-icon">
                  <FileIcon />
                </span>
                <div>
                  <strong>{file.name}</strong>
                  <small>{(file.size / 1024 / 1024).toFixed(1)} MB · PDF</small>
                </div>
                <span className={`state ${status}`}>
                  {status === "uploading" ? "Reading" : "Ready"}
                </span>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => uploadFile(e.target.files?.[0])}
            />
            {file && status !== "uploading" && (
              <button
                className="replace"
                onClick={() => inputRef.current?.click()}
              >
                Replace document
              </button>
            )}
          </article>
          <article className="ask-card">
            <div className="card-label">CONVERSATION</div>
            <form onSubmit={ask}>
              <label htmlFor="question">What would you like to know?</label>
              <div className="question-row">
                <textarea
                  id="question"
                  placeholder={
                    status === "ready"
                      ? "Ask anything about this document…"
                      : "Upload a document to start asking"
                  }
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={status !== "ready"}
                  rows={2}
                />
                <button
                  className="ask-button"
                  type="submit"
                  disabled={!canAsk || isBusy}
                >
                  {" "}
                  {status === "asking" ? "Thinking…" : "Ask AI"} <span>→</span>
                </button>
              </div>
            </form>
            <div className="answer-area">
              {answer ? (
                <>
                  <span className="answer-kicker">
                    <Spark />
                    ANSWER
                  </span>
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </>
              ) : (
                <p className="placeholder">
                  {status === "uploading"
                    ? "Your document is being read and indexed…"
                    : "Answers stay grounded in the document you upload."}
                </p>
              )}
            </div>
          </article>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <footer>
        <span>Private by design · No data stored</span>
        <a
          href="https://github.com/MoazMirza-13/rag-pdf-chat-template"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          title="View on GitHub"
        >
          <GithubIcon />
          <span className="github-text">Open-source template</span>
        </a>
      </footer>
    </main>
  );
}
