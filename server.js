import express from "express";
import dotenv from "dotenv";
import { loadPDF } from "./rag.js";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/upload", async (req, res) => {
  try {
    const text = await loadPDF("sample.pdf");

    res.json({
      message: "PDF processed",
      text: text,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running"));
