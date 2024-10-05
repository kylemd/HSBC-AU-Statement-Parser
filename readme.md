# HSBC AU Statement Parser

## About

HSBC Australia Statement Parser is a collection of js scripts that leverages the [pdf2json](https://github.com/modesty/pdf2json) node.js module to parse transaction data from pdfs.
This collection only works on HSBC Australia debit-like account statements (home loans, offset accounts, etc).  
\
This **DOES NOT**  work for credit card statements.  
\
I do not have HSBC statements in other regions to test against, so your mileage may vary.

## Installation

Clone this repository.

## Dependencies

- pdf2json
- write-excel-file

## Usage

### Converting PDF statements to JSON

```shell
node statements2json.js
```

 ```statements2json.js``` is used to convert PDF statements in a chosen folder into a single ```JSON``` object file, sorted by statement date (based on metadata). PDF data is not manipulated in any way in this step. See [pdf2json](https://github.com/modesty/pdf2json) for more information on the data structure.  
The source folder path can be configured in the script via the ```folderPath``` variable.

### Converting ```JSON``` to an MS Excel file

```shell
node parseJSONStatements.cjs
```

 ```parseJSONStatements.cjs``` is used to convert the ```JSON``` statements into a single MS Excel object file.  
The source and output paths can be configured in the script via the ```sourceFilePath``` and ```destFilePath``` variables.

## No Tests?

No, I do not provide any tests as...you guessed it! I'm not prepared to upload any of my personal bank statements to a public repository.  
This code is also pretty hacked together anyway, so does not function as a module and lacks CLI features.
