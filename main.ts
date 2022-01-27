import { Command, InvalidArgumentError } from "commander";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import fsx from "fs-extra";
import { createHash } from "crypto";
const { outputFile } = fsx;
import consoleStamp from "console-stamp";
import { getDictionaryTemplate } from "./utils/dictionary.js";
import { buildDictionaryFromSparvCompoundOutputCsv } from "./utils/buildDictionaryFromSparvCompoundOutputCsv.js";
import { transformFolketsLexiconToCompoundLookup } from "./utils/transformFolketsLexiconToCompoundLookup.js";
import { transformFolketsLexiconToEnglishTranslationLookup } from "./utils/transformFolketsLexiconToEnglishTranslationLookup.js";
consoleStamp(console);

const program = new Command();

program
  .command("korpusstatistik <source>")
  .description(
    "Build dictionary from a folder containing CSV files from https://spraakbanken.gu.se/verktyg/korp/korpusstatistik"
  )
  .action(async (source: string) => {
    const timertag = "build";
    console.time(timertag);
    const fileNames = await readdir(source);

    if (fileNames.some((x) => !x.endsWith(".csv"))) {
      throw new InvalidArgumentError(
        `${source} contains non-CSV file. Is the source folder correct?`
      );
    }

    const dictionary = getDictionaryTemplate();
    const dictionaryEntries = dictionary.dictionaryEntries;

    const filesCount = fileNames.length;
    for (let i = 0; i < filesCount; i++) {
      const fileName = fileNames[i];
      const filePath = join(source, fileName);
      console.log(`Processing: ${i + 1}/${filesCount} ${filePath}`);

      const csv = await readFile(filePath, "utf-8");
      buildDictionaryFromSparvCompoundOutputCsv(dictionaryEntries, csv);
    }

    console.log(`dictionaryEntries.length: ${dictionaryEntries.length}`);
    const dictionaryJson = JSON.stringify(dictionary, null, 2);

    await outputFile(join("build", "dictionary.json"), dictionaryJson);

    console.log(`Writing JS modules`);
    const chunksMeta: {
      name: string;
      version: string;
      entriesCount: number;
    }[] = [];
    const chunks: { name: string; entries: typeof dictionaryEntries }[] = [];
    let chunk: typeof dictionaryEntries = [];
    // Sub-chunk size is just magic number, feel free to change and experiment with it.
    const subChunkSize = 10000;
    let charLength = 1;
    let subChunkCounter = 1;
    const flushChunk = () => {
      if (chunk.length) {
        chunks.push({
          name: `${charLength.toString().padStart(3, "0")}.${subChunkCounter
            .toString()
            .padStart(3, "0")}`,
          entries: chunk,
        });
      }
      chunk = [];
    };
    for (let i = 0; i < dictionaryEntries.length; i += 1) {
      const entry = dictionaryEntries[i];
      const key = entry[0];
      if (chunk.length >= subChunkSize) {
        flushChunk();
        subChunkCounter += 1;
      }
      if (key.length > charLength) {
        flushChunk();
        charLength += 1;
        subChunkCounter = 1;
      }
      if (key.length <= charLength) {
        chunk.push(entry);
      }
    }
    flushChunk();

    for (let i = 0; i < chunks.length; i += 1) {
      console.log(`Writing JS modules (${i + 1}/${chunks.length})`);
      const chunk = chunks[i];
      const entriesJson = JSON.stringify(chunk.entries);
      const version = createHash("sha256").update(entriesJson).digest("hex");

      const code = `export const version = ${JSON.stringify(version)};

export const getEntries = () => (${entriesJson});`;

      const chunkName = `dictionary.chunk.${chunk.name}.mjs`;

      await outputFile(join("build", chunkName), code);
      chunksMeta.push({
        name: chunkName,
        version,
        entriesCount: chunk.entries.length,
      });
    }
    const jsMetaModule = `export const getInfo = () => (${JSON.stringify(
      {
        buildTimestamp: new Date().toISOString(),
        dataSources: dictionary.meta.dataSources,
        totalEntriesCount: dictionaryEntries.length,
        chunks: chunksMeta,
      },
      null,
      2
    )});
`;

    await outputFile(join("build", "dictionary.meta.mjs"), jsMetaModule);
    console.timeEnd(timertag);
  });

const getFolketsMetaCommonFields = () => ({
  buildTimestamp: new Date().toISOString(),
  license: {
    name: "CC BY-SA 2.5",
    link: "https://creativecommons.org/licenses/by-sa/2.5/",
  },
  dataSources: [
    {
      name: "Folkets lexikon",
      link: "https://folkets-lexikon.csc.kth.se/folkets/om.html",
      license: {
        name: "CC BY-SA 2.5",
        link: "https://creativecommons.org/licenses/by-sa/2.5/",
      },
      fileNames: [
        "https://folkets-lexikon.csc.kth.se/folkets/folkets_sv_en_public.xml",
      ],
    },
  ],
});

program
  .command("folkets-compound <path-to-xml>")
  .description(
    "Build compound guesser dictionary from a Folkets Lexicon XML file. https://folkets-lexikon.csc.kth.se/folkets/folkets_sv_en_public.xml"
  )
  .action(async (source: string) => {
    const timertag = "build";
    console.time(timertag);
    const file = await readFile(source, "utf-8");
    const set = transformFolketsLexiconToCompoundLookup(file);
    const setJson = JSON.stringify(
      Array.from(set)
        .filter((x) => x.length > 1)
        .sort(),
      null,
      2
    );
    const version = createHash("sha256").update(setJson).digest("hex");
    const code = `export const version = ${JSON.stringify(version)};

export const getCompoundParts = () => (${setJson});`;

    const chunkName = "folkets-compound.chunk.001.mjs";
    await outputFile(join("build", chunkName), code);

    const jsMetaModule = `export const getInfo = () => (${JSON.stringify(
      {
        ...getFolketsMetaCommonFields(),
        totalEntriesCount: set.size,
        chunks: [
          {
            name: chunkName,
            version,
            entriesCount: set.size,
          },
        ],
      },
      null,
      2
    )});`;

    await outputFile(join("build", "folkets-compound.meta.mjs"), jsMetaModule);
    console.timeEnd(timertag);
  });

program
  .command("folkets-sven <path-to-xml>")
  .description(
    "Build Swedish->English dictionary from a Folkets Lexicon XML file. https://folkets-lexikon.csc.kth.se/folkets/folkets_sv_en_public.xml"
  )
  .action(async (source: string) => {
    const timertag = "build";
    console.time(timertag);
    const file = await readFile(source, "utf-8");
    const record = transformFolketsLexiconToEnglishTranslationLookup(file);
    const recordJson = JSON.stringify(record);
    const version = createHash("sha256").update(recordJson).digest("hex");
    const code = `export const version = ${JSON.stringify(version)};

export const getTranslationLookUp = () => (${recordJson});`;

    const chunkName = "folkets-sven.chunk.001.mjs";
    await outputFile(join("build", chunkName), code);

    const entriesCount = Object.keys(record).length;
    const jsMetaModule = `export const getInfo = () => (${JSON.stringify(
      {
        ...getFolketsMetaCommonFields(),
        totalEntriesCount: entriesCount,
        chunks: [
          {
            name: chunkName,
            version,
            entriesCount,
          },
        ],
      },
      null,
      2
    )});`;

    await outputFile(join("build", "folkets-sven.meta.mjs"), jsMetaModule);
    console.timeEnd(timertag);
  });

program.parse(process.argv);
