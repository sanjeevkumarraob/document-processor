// server/utils.js
const axios = require("axios");
const { createWorker } = require("tesseract.js");

async function processDocumentWithLlama(text) {
  const prompt = `
    You are an AI assistant specialized in analyzing mortgage application documents. Given the following document text, please:
    1. Classify the document type (e.g., address proof, payslip, bank statement, property document)
    2. Extract relevant information based on the document type
    3. Return the results in a JSON format with keys for 'documentType' and 'extractedInfo'

    Document text:
    ${text}

    Please provide your analysis in JSON format.
  `;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.1",
      prompt: prompt,
      stream: false,
    });

    console.log("Ollama API Response:", response.data);

    if (response.data && response.data.response) {
      const jsonStart = response.data.response.indexOf("{");
      const jsonEnd = response.data.response.lastIndexOf("}") + 1;
      const jsonString = response.data.response.slice(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    } else {
      throw new Error("Unexpected response format from Ollama API");
    }
  } catch (error) {
    console.error(
      "Error calling Ollama API:",
      error.response ? error.response.data : error.message
    );
    throw new Error(`Error calling Ollama API: ${error.message}`);
  }
}

async function extractTextFromImage(file) {
  if (!file || !file.buffer) {
    throw new Error("Invalid file or file buffer is undefined");
  }

  console.log("Extracting text from image:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    bufferLength: file.buffer.length,
  });

  const worker = await createWorker();
  try {
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    const {
      data: { text },
    } = await worker.recognize(file.buffer);
    return text;
  } catch (error) {
    console.error("Tesseract error:", error);
    throw new Error("Failed to extract text from image: " + error.message);
  } finally {
    await worker.terminate();
  }
}

module.exports = {
  processDocumentWithLlama,
  extractTextFromImage,
};
