const request = require("supertest");
const app = require("../server"); // Make sure to export your app in app.js
const fs = require("fs");
const path = require("path");

describe("Document Upload and Processing", () => {
  test("should upload and process a document successfully", async () => {
    const response = await request(app)
      .post("/upload")
      .field("applicantId", "12345")
      .attach(
        "document",
        path.resolve(__dirname, "./test_documents/bank_statement.png")
      );

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.docType).toBe("bank_statement");
    expect(response.body.extractedInfo).toBeDefined();
    expect(response.body.blockchainHash).toBeDefined();
  });

  test("should retrieve application status", async () => {
    const response = await request(app).get("/application/12345");

    expect(response.statusCode).toBe(200);
    expect(response.body.applicantId).toBe("12345");
    expect(response.body.documents).toBeDefined();
    expect(Array.isArray(response.body.documents)).toBe(true);
  });
});
