const fs = require("fs");
const PDFParser = require("pdf2json");

var sourceFolderPath = ".\\test statements\\";
var outputFilePath = ".\\statements.json";

const files = fs.readdirSync(sourceFolderPath);

// All of the parse statements
let statements = [];

// Define custom function parse date field in metadata
const metadataDateStringToDate = (x) => {
  return Date.parse(x.substring(0, 10));
};

// Make a IIFE so we can run asynchronous code
(async (sourceFolderPath, outputFilePath) => {
  // Await all of the statements to be passed
  // For each file in the statement folder
  await Promise.all(
    files.map(async (file) => {
      // Set up the pdf parser
      let pdfParser = new PDFParser(this, 1);

      // Load the pdf document
      pdfParser.loadPDF(`${sourceFolderPath}${file}`);

      // Parsed the statement
      let statement = await new Promise(async (resolve, reject) => {
        // On data ready
        pdfParser.on("pdfParser_dataReady", (pdfData) => resolve(pdfData));
        pdfParser.on("pdfParser_dataError", reject);
      });

      // Add the statement to the statements array
      statements.push(statement);
    })
  );

  // Save the extracted information to a json file
  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(
      statements.sort((a, b) => {
        return (
          metadataDateStringToDate(a.Meta.Metadata["xmp:metadatadate"]) -
          metadataDateStringToDate(b.Meta.Metadata["xmp:metadatadate"])
        );
      }),
      null,
      2
    )
  );
  console.log("JSON successfully generated from PDF statements");
})(sourceFolderPath, outputFilePath);
