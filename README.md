# RAG PDF Chat Template

Open-source RAG (Retrieval-Augmented Generation) PDF chat application with private sessions and zero data storage. Built with modern AI/ML technologies for seamless document interaction.

**Live Demo:** [https://private-pdf-chat.vercel.app](https://private-pdf-chat.vercel.app)

## ✨ Features

- 📄 **PDF Chat Interface** - Upload and chat with PDF documents in real-time
- 🔐 **Private Sessions** - All conversations are ephemeral with no data persistence
- 🤖 **AI-Powered** - Integrated with Google Gemini for intelligent responses
- 🧠 **Smart Embeddings** - Gemini embeddings (`gemini-embedding-001`) for semantic understanding
- 📊 **Vector Database** - Pinecone for fast, scalable semantic search
- ⚡ **Fast & Responsive** - Built with Next.js for optimal performance
- 🎨 **Modern UI** - Clean, intuitive interface with React 19
- 🗑️ **Automatic Cleanup** - Session data automatically purged from Pinecone when the tab closes

## 🛠️ Tech Stack

- **Frontend**: React 19, Next.js 15, TypeScript, React Markdown
- **Backend**: Next.js API routes
- **AI/ML**: 
  - Google Gemini API (`@google/genai`) for chat and embeddings
  - LangChain (Core & Text Splitters)
- **Vector Database**: Pinecone
- **Document Processing**: pdf2json

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API Keys for:
  - Google Gemini
  - Pinecone

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MoazMirza-13/rag-pdf-chat-template.git
   cd rag-pdf-chat-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   ```

4. **Pinecone Index Name**

   Create a new index in your Pinecone dashboard with the name:
   
   ```bash

   pdf-chat

   ```
   
   > ⚠️ **Important:** The index name must exactly match the one used in the code.

   > You can verify it [here](https://github.com/MoazMirza-13/rag-pdf-chat-template/blob/333b1a66882c985436ec28a2354983d7e774c4e5/rag.ts#L14).   

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.


## 💡 How It Works

1. **PDF Upload** - Users upload a PDF document
2. **Text Extraction** - PDF is parsed using pdf2json
3. **Embedding Generation** - Document text is split and embedded using Gemini (`gemini-embedding-001`)
4. **Vector Storage** - Embeddings are stored in Pinecone for retrieval
5. **Query Processing** - User questions are embedded and compared against document embeddings
6. **Response Generation** - Relevant context is passed to Gemini API for intelligent responses
7. **Session Privacy** - No data is persisted; sessions are ephemeral

## 🔒 Privacy & Security

- ✅ No user data is stored on servers
- ✅ Sessions are completely private and ephemeral
- ✅ PDF content is only processed for the current session
- ✅ All communication uses secure HTTPS

### Automatic Session Cleanup

When a user closes the browser tab or ends their session, the application uses the **`sendBeacon()` API** to ensure all vector embeddings associated with that session are automatically deleted from Pinecone:

```javascript
// Triggered on page unload/tab close
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/api/cleanup', JSON.stringify({
    sessionId: currentSessionId
  }));
});
```

This guarantees that:
- ✅ Sensitive embeddings are purged immediately when the session ends
- ✅ No residual data remains in Pinecone after the user leaves
- ✅ Complete privacy is maintained even if a session is interrupted
- ✅ The browser's native `sendBeacon()` ensures delivery even during page navigation

## 📚 Topics

`ai` • `chat-with-pdf` • `embeddings` • `gemini` • `llm` • `pdf` • `pdf-chat` • `pinecone` • `rag` • `rag-template`

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
