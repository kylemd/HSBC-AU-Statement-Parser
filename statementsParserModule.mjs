import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";
import writeXlsxFile from "write-excel-file/node";
import readline from "readline";
import moment from "moment";

// Define exportable function to convert PDF statements to JSON
const statementsPDFtoJSON = async (sourceFolderPath) => {
  // Define custom function parse date field in metadata
  const metadataDateStringToDate = (x) => Date.parse(x.substring(0, 10));
  const EXTENSION = ".pdf";
  console.log(`Searching source folder: ${sourceFolderPath}`);
  try {
    const files = fs.readdirSync(sourceFolderPath).filter((file) => {
      return path.extname(file).toLowerCase() === EXTENSION;
    });
    console.log(`PDF files found: ${files.length}`);
    console.log("Generating JSON from PDF statements...");
    let statements = [];
    process.stdout.write(
      `Converted ${statements.length} of ${files.length} to JSON`
    );

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
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(
          `Converted ${statements.length} of ${files.length} to JSON`
        );
      })
    );
    process.stdout.write("\n");
    // Return the extracted information to a JSON string
    return JSON.stringify(
      statements.sort((a, b) => {
        return (
          metadataDateStringToDate(a.Meta.Metadata["xmp:metadatadate"]) -
          metadataDateStringToDate(b.Meta.Metadata["xmp:metadatadate"])
        );
      }),
      null,
      2
    );
  } catch (error) {
    console.error("Error processing PDF statements:\n", error);
  }
};

const statementsJSONtoXLSX = (jsonFile, outputFilePath) => {
  const jsonObj = JSON.parse(jsonFile);
  const pageUnitsScale = 0.0625038430794052; // scaling factor for text box width added to x position
  const minRowSpacing = 0.9; // min increase in y position to count as a new table row

  console.log("Parsing JSON...");

  // Define custom rouding function to X decimal places
  const decRound = (num, decimals) => {
    if (!Number.isInteger(decimals) || decimals < 0) {
      return null;
    }
    let scalar = Math.pow(10, decimals);
    return Math.round(num * scalar) / scalar;
  };

  // Define custom function to get Parent key in dict by value
  const getParentKeybyValue = (obj, val) => {
    if (typeof obj === "object") {
      for (const key in obj) {
        if (obj[key] === val) {
          return key;
        } else {
          const result = getParentKeybyValue(obj[key], val);
          if (result !== null) return obj[key];
        }
      }
    }
    return null;
  };

  // Define custom function to get key in dict by value
  const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  // Deifne custom funtion to get unique column values
  const uniqueCol = (arr, col) => [...new Set(arr.map((row) => row[col]))];

  // Define where each column starts in PDF statements
  const statementColumnsXDict = {
    date: { x: decRound(2.629, 2), col: 1 },
    transactionDetails: { x: decRound(5.906, 2), col: 2 },
    debits: { x: decRound(18.852 + 73.503 * pageUnitsScale, 2), col: 3 },
    credits: { x: decRound(25.511 + 60.498 * pageUnitsScale, 2), col: 3 },
    // balance: { x: decRound(32.258 + 30.501 * pageUnitsScale, 2), col: 5 },
    accountNumber: { x: 19.542, col: 0 },
    // accountNameX: { x: 2.629, col: 1},
  };

  let transactionData = [];
  let row = -1;
  let currentStatement = 0;
  let maxYonRow = 0;
  let statementPeriodTextY = -1;

  for (const statement of jsonObj) {
    let statementPeriod = { start: 0, end: 0 };
    for (const page of statement.Pages) {
      for (const textBox of page.Texts) {
        const decodedText = decodeURIComponent(textBox.R[0].T);
        if (decodedText.includes("STATEMENT PERIOD")) {
          statementPeriodTextY = textBox.y;
        } else if (textBox.y === statementPeriodTextY) {
          if (Date.parse(decodedText)) {
            let d = new Date(decodedText);
            if (statementPeriod.start === 0) {
              statementPeriod.start = d;
            } else {
              statementPeriod.end = d;
              transactionData.push(statementPeriod);
            }
          }
          continue;
        }

        if (textBox.x === statementColumnsXDict.accountNumber.x) {
          transactionData.push(textBox);
        }

        const adjustedX = decRound(
          textBox.x +
            (textBox.x > statementColumnsXDict.transactionDetails.x + 1
              ? textBox.w * pageUnitsScale
              : 0),
          2
        );

        if (
          getParentKeybyValue(statementColumnsXDict, adjustedX) &&
          textBox.R[0].TS[2] !== 1 &&
          !("oc" in textBox)
        ) {
          transactionData.push(textBox);
        }
      }
      transactionData.push("ENDPAGE");
      statementPeriodTextY = -1;
    }
  }

  var transactionTableArray = Array.from(
    { length: transactionData.length },
    () => Array(5).fill(null)
  );

  var statementPeriod = { start: 0, end: 0 };

  transactionData.forEach((transactionItem, i, arr) => {
    if (transactionItem === "ENDPAGE") {
      row++;
      maxYonRow = 0;
      return;
    }

    if ("start" in transactionItem && "end" in transactionItem) {
      statementPeriod.start = transactionItem.start;
      statementPeriod.end = transactionItem.end;
      return;
    }

    if (i !== 0 && transactionItem.y - maxYonRow > minRowSpacing) {
      row++;
      maxYonRow = 0;
      transactionTableArray[row][statementColumnsXDict.accountNumber.col] =
        currentStatement;
    }

    if (transactionItem.x === statementColumnsXDict.accountNumber.x) {
      currentStatement = decodeURIComponent(transactionItem.R[0].T);
      return;
    }

    const adjustedX = decRound(
      transactionItem.x +
        (transactionItem.x > statementColumnsXDict.transactionDetails.x + 1
          ? transactionItem.w * pageUnitsScale
          : 0),
      2
    );

    const colObject = getParentKeybyValue(statementColumnsXDict, adjustedX);
    const col = colObject ? colObject.col : null;

    if (col !== null) {
      let colKey = getKeyByValue(statementColumnsXDict, colObject);
      maxYonRow = Math.max(maxYonRow, transactionItem.y);
      let itemValue = decodeURIComponent(transactionItem.R[0].T).replace(
        ",",
        ""
      );

      if (colKey === "date" && Date.parse([itemValue, 1900].join(" "))) {
        const d = [itemValue, statementPeriod.end.getFullYear()].join(" ");
        itemValue =
          d <= statementPeriod.end
            ? d
            : [itemValue, statementPeriod.start.getFullYear()].join(" ");
      } else if (colKey === "debits") {
        itemValue = parseFloat(itemValue) * -1;
      }

      transactionTableArray[row][col] = [
        transactionTableArray[row][col],
        itemValue,
      ]
        .join(" ")
        .trim();
    }
  });

  var transactionTableArray = transactionTableArray.filter(
    (row) =>
      row[2] != "Transaction Total" &&
      row[2] != "Transaction Number" &&
      row[2] != "BALANCE BROUGHT FORWARD" &&
      row[2] != "CLOSING BALANCE" &&
      row[2] !== null &&
      row[3] !== null
  );

  // Write dates into empty cells where there are multiple same day transactions
  transactionTableArray.forEach((transaction, i, arr) => {
    if (transaction[1] == null) {
      transaction[1] = arr[i - 1][1];
    }
  });
  console.log("Tables generated. Writing XLSX...");
  console.log(`Number of transactions: ${transactionTableArray.length}`);
  console.log("Writing XLSX...");
  const excelData = [];
  const accountNumbers = uniqueCol(transactionTableArray, 0);

  accountNumbers.forEach((account) => {
    let excelSheetArr = transactionTableArray.filter(
      (row) => row[0] === account
    );
    excelSheetArr.forEach((transaction) => {
      transaction[0] = {
        type: String,
        value: transaction[0],
      };
      transaction[1] = {
        type: Date,
        // Excel has no concept of time zones, so must treat current date/time
        // as UTC+00 regardless of user locale
        value: new Date(moment.utc(transaction[1], "DD MMM YYYY").toString()),
        format: "dd-mmm-yy",
      };
      transaction[2] = {
        type: String,
        value: transaction[2],
      };
      transaction[3] = {
        type: Number,
        value: Number.parseFloat(transaction[3]),
        format: "#,##0.00",
      };
    });
    excelSheetArr.splice(0, 0, [
      { type: String, value: "Account No." },
      { type: String, value: "Date" },
      { type: String, value: "Transaction Details" },
      { type: String, value: "Transaction Amount" },
    ]);
    excelData.push(excelSheetArr);
  });

  writeXlsxFile(excelData, {
    fontSize: 11,
    fontFamily: "Aptos Narrow",
    sheets: accountNumbers,
    filePath: outputFilePath,
  });

  console.log("Writing complete.");
};

const statementsPDFtoXLSX = async (sourceFolderPath, outputFilePath) => {
  const jsonFile = await statementsPDFtoJSON(sourceFolderPath);
  statementsJSONtoXLSX(jsonFile, outputFilePath);
};

export default { statementsPDFtoXLSX };
