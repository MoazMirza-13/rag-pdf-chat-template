"use client";

import { useEffect, useRef, useState } from "react";

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
          <Spark /> YOUR KNOWLEDGE, UNLOCKED
        </div>
        <h1>
          Ask more from
          <br />
          <em>every page.</em>
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
                  rows="2"
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
                  <p>{answer}</p>
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
        <span>BUILT FOR CLEARER THINKING</span>
        <span>YOUR DOCUMENT · YOUR QUESTIONS · YOUR ANSWERS</span>
      </footer>
    </main>
  );
}
