# HSBC AU Statement Parser

## About

HSBC Australia Statement Parser is a CLI tool that leverages the [```pdf2json```](https://github.com/modesty/pdf2json) node.js module to parse transaction data from PDFs.
This tool currently works on HSBC Australia debit-like account statements (home loans, offset accounts, etc).  
\
This tool **DOES NOT**  work for credit card statements.  
\
I do not have HSBC statements from other regions to test against, so your mileage may vary.

## How it works

1. ```pdf2json``` is used to first convert PDF statements in a chosen folder into a single ```JSON``` object file, sorted by statement date (based on metadata). PDF data is not manipulated in any way in this step. See [```pdf2json```](https://github.com/modesty/pdf2json) for more information on the data structure.
2. ```JSON``` data is then filtered and parsed based on expected positions of each column that exists in transaction tables.
3. The parsed data is populated into an array and passed onto [```write-excel-file```](https://gitlab.com/catamphetamine/write-excel-file) to generate an MS Excel workbook, with separate sheets per account.

## Installation

Clone this repository.

## Dependencies

- [```pdf2json```](https://github.com/modesty/pdf2json)
- [```write-excel-file```](https://gitlab.com/catamphetamine/write-excel-file)

## Usage

```shell
node index.mjs --input [input directory] --output [destination file]
```

or

```shell
node index.mjs -i [input directory] -o [destination file]
```

## No Tests?

No, I do not provide any tests as you may have guessed...  
I'm not prepared to upload any of my personal bank statements to a public repository.
