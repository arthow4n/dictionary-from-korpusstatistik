type Dictionary = Record<
  string,
  {
    baseforms: Set<string>;
    compounds: Set<string>;
  }
>;

const example: Dictionary = {
  anden: {
    baseforms: new Set(["ande", "and"]),
    compounds: new Set(),
  },
  partiledarskapet: {
    baseforms: new Set(["partiledarskap"]),
    compounds: new Set(["parti+ledarskap"]),
  },
};

export type DictionaryTemplate = ReturnType<typeof getDictionaryTemplate>;

export const getDictionaryTemplate = () => {
  return {
    meta: {
      dataSources: [
        {
          name: "Språkbanken Text Korpusstatistik",
          link: "https://spraakbanken.gu.se/verktyg/korp/korpusstatistik",
          license: {
            name: "CC BY 4.0",
            link: "https://creativecommons.org/licenses/by/4.0/deed",
          },
          fileNames: ["stats_all.txt"],
        },
        {
          name: "sparv-pipeline",
          link: "https://github.com/spraakbanken/sparv-pipeline",
          license: {
            name: "The MIT License",
            link: "https://opensource.org/licenses/MIT",
          },
        },
        {
          name: "sparv-wsd",
          link: "https://github.com/spraakbanken/sparv-wsd",
          license: {
            name: "The MIT License",
            link: "https://opensource.org/licenses/MIT",
          },
        },
      ],
    },
    dictionaryEntries: [] as [
      string,
      {
        baseforms: string[];
        compounds: string[];
      }
    ][],
  };
};
