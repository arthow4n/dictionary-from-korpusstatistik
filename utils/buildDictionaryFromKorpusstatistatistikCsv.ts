import { DictionaryTemplate } from "./dictionary";

export const buildDictionaryFromKorpusstatistatistikCsv = (
  { dictionary }: DictionaryTemplate,
  csv: string
) => {
  [
    ...csv.matchAll(
      /^(?<formSrc>\S+)(?=\s+).*(?<=\s+)(?<compoundSrc>[^_\s]+?\.\.[a-z]{2,3}\.[0-9])\s+[0-9]+$/gm
    ),
  ].forEach((match) => {
    // const { formSrc, compoundSrc } = match.groups as {
    //   formSrc: string;
    //   compoundSrc: string;
    // };
    // dictionary[formSrc] ??= {
    //   baseforms: new Set(),
    //   compoundParts: new Set(),
    // };
    // const form = formSrc.replace(/\P{L}/g, "");
    // const entry = dictionary[form];
    // const compoundParts = compoundSrc
    //   .split("+")
    //   .map((part) => part.split("..")[0]);
    // entry.compoundParts.add(compoundParts.join("+"));
  });
};
