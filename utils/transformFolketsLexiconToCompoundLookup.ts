import cheerio from "cheerio";

export const transformFolketsLexiconToCompoundLookup = (
  xml: string
): Set<string> => {
  // TODO: Consider Kelly-list https://spraakbanken.gu.se/en/projects/kelly
  // TODO: Consider common names
  const result = new Set<string>();
  const $ = cheerio.load(xml);

  const splitToResult = (v: string | undefined) => {
    if (!v) return;

    v.split(/\P{L}/gu)
      .filter((x) => x)
      .map((v) => v.toLocaleLowerCase())
      .forEach((vv) => result.add(vv));
  };

  $("word")
    .toArray()
    .forEach((w) => {
      const value = $(w).attr("value");
      [value, value?.replace(/\p{L}\((\p{L}+)\)\p{L}*?/gu, "$1")].forEach(
        splitToResult
      );
    });

  $("inflection")
    .toArray()
    .forEach((inf) => {
      splitToResult($(inf).attr("value"));
    });

  $("compound")
    .toArray()
    .forEach((c) => {
      splitToResult($(c).attr("value"));
    });

  $("saldo")
    .toArray()
    .forEach((c) => {
      splitToResult($(c).attr("value"));
    });

  return result;
};
