const fs = require("fs");
const PDFParser = require("pdf2json");

// import fs from "fs";
// import PDFParser from "pdf2json";

var folderPath = ".\\test statements\\";

const files = fs.readdirSync(folderPath);

// All of the parse statements
let statements = [];

// Define custom function parse date field in metadata
const metadataDateStringToDate = (x) => {
  return Date.parse(x.substring(0, 10));
};

// Make a IIFE so we can run asynchronous code
(async (folderPath) => {
  // Await all of the statements to be passed
  // For each file in the statement folder
  await Promise.all(
    files.map(async (file) => {
      // Set up the pdf parser
      let pdfParser = new PDFParser(this, 1);

      // Load the pdf document
      pdfParser.loadPDF(`${folderPath}${file}`);

      // Parsed the statement
      let statement = await new Promise(async (resolve, reject) => {
        // On data ready
        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          // The raw PDF data in text form
          const raw = pdfParser.getRawTextContent().replace(/\r\n/g, " ");

          // Return the parsed data
          resolve(pdfData);
        });
      });

      // Add the statement to the statements array
      statements.push(statement);
    })
  );

  // Save the extracted information to a json file
  fs.writeFileSync(
    "statements.json",
    JSON.stringify(
      statements.sort((a, b) => {
        return (
          metadataDateStringToDate(a.Meta.Metadata["xmp:metadatadate"]) -
          metadataDateStringToDate(b.Meta.Metadata["xmp:metadatadate"])
        );
      })
    )
  );
})(folderPath);
