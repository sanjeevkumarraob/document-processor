// server/index.js
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto-js");
const { processDocumentWithLlama, extractTextFromImage } = require("./utils");
const { Document, Block } = require("./models");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });


app.use(
  cors({
    origin: "http://localhost:3001",
  })
);
app.use(express.json());

mongoose.connect("mongodb://localhost/mortgage_poc", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.post("/api/upload", upload.single("document"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ status: "error", message: "No file uploaded" });
  }

  try {
    const applicantId = req.body.applicantId;

    if (!applicantId) {
      return res
        .status(400)
        .json({ status: "error", message: "No applicantId provided" });
    }

    let text;
    if (req.file.mimetype.startsWith("image/")) {
      text = await extractTextFromImage(req.file);
    } else if (req.file.mimetype === "application/pdf") {
      return res
        .status(400)
        .json({
          status: "error",
          message: "PDF processing not implemented yet",
        });
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "Unsupported file type" });
    }

    const analysis = await processDocumentWithLlama(text);

    const docHash = crypto.SHA256(req.file.buffer).toString();

    const document = new Document({
      type: analysis.documentType,
      hash: docHash,
      extractedInfo: analysis.extractedInfo,
      applicantId: applicantId,
    });
    await document.save();

    const block = new Block({
      docType: analysis.documentType,
      docHash: docHash,
      applicantId: applicantId,
      timestamp: new Date().getTime(),
    });

    res.json({
      status: "success",
      data: {
        document: {
          type: analysis.documentType,
          extractedInfo: analysis.extractedInfo,
          hash: docHash,
        },
        blockchain: {
          transactionHash: block.hash,
        },
        metadata: {
          processedAt: new Date().toISOString(),
          applicantId: applicantId,
        },
      },
    });
  } catch (error) {
    console.error("Processing error:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: "Error processing document: " + error.message,
      });
  }
});

app.get("/application/:applicantId", async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    const documents = await Document.find({ applicantId: applicantId });

    const applicationStatus = {
      applicantId: applicantId,
      documents: documents.map((doc) => ({
        type: doc.type,
        hash: doc.hash,
        extractedInfo: doc.extractedInfo,
      })),
      complete: documents.length >= 4, // Assuming we need all 4 document types
    };

    res.json(applicationStatus);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
