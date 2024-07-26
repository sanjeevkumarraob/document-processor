// server/models.js
const mongoose = require("mongoose");
const crypto = require("crypto-js");

const DocumentSchema = new mongoose.Schema({
  type: String,
  hash: String,
  extractedInfo: Object,
  applicantId: String,
});

const Document = mongoose.model("Document", DocumentSchema);

class Block {
  constructor(data) {
    this.data = data;
    this.hash = this.calculateHash();
    this.previousHash = "";
  }

  calculateHash() {
    return crypto.SHA256(JSON.stringify(this.data)).toString();
  }
}

module.exports = {
  Document,
  Block,
};
