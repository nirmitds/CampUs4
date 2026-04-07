const express = require("express");
const path = require("path");
const app = express();

// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, "dist"), {
  setHeaders(res, filePath) {
    if (filePath.endsWith(".js"))  res.setHeader("Content-Type", "application/javascript");
    if (filePath.endsWith(".css")) res.setHeader("Content-Type", "text/css");
    if (filePath.endsWith(".svg")) res.setHeader("Content-Type", "image/svg+xml");
  }
}));

// SPA fallback — all routes serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Frontend on port ${PORT}`));
