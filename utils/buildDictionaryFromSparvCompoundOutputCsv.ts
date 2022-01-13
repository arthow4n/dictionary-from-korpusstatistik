import { DictionaryTemplate } from "./dictionary";

export const buildDictionaryFromSparvCompoundOutputCsv = (
  dictionaryEntries: DictionaryTemplate["dictionaryEntries"],
  csv: string,
  logDetails = false
) => {
  csv.split("\n").forEach((line, lineIndex) => {
    if (logDetails) {
      console.log(`Processing line: ${lineIndex + 1}`);
    }
    const columns = line.split("\t");
    if (columns.length !== 4) {
      return;
    }

    if (columns[2] === "|" && columns[3] === "|") {
      return;
    }

    const form = columns[0];
    const baseforms = columns[3]
      .split("|")
      .filter((x) => x)
      .slice(0, 3);
    const compounds = columns[2]
      .split("|")
      .filter((x) => x)
      // Drop potentially unuseful results
      .filter((x) => x.split("+").length <= 3)
      .slice(0, 3);

    if (!compounds.length && baseforms.length === 1 && form === baseforms[0]) {
      return;
    }

    dictionaryEntries.push([
      form,
      {
        baseforms,
        compounds,
      },
    ]);
  });
};
