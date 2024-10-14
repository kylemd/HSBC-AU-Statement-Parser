import parser from "./statementsParserModule.mjs";
import { parseArgs } from "node:util";

const options = {
  input: {
    type: "string",
    short: "i",
  },
  output: {
    type: "string",
    short: "o",
  },
};

const { values, positionals } = parseArgs({ options, allowPositionals: true });

const argsCheckDict = {
  "Source folder not defined": !("input" in values),
  "Destination file not defined": !("output" in values),
};

const argsCheckResult = Object.keys(
  Object.assign(
    {},
    ...Object.entries(argsCheckDict)
      .filter(([k, v]) => v)
      .map(([k, v]) => ({ [k]: v }))
  )
);

if (argsCheckResult.length) {
  argsCheckResult.forEach((x) => {
    console.log(x);
  });
  process.exit(1);
}

parser.statementsPDFtoXLSX(values.input, values.output);
