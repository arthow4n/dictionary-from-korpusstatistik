import cheerio from "cheerio";

export const transformFolketsLexiconToEnglishTranslationLookup = (
  xml: string
): Record<string, string[]> => {
  const result: Record<string, string[]> = Object.create(null);
  const $ = cheerio.load(xml);

  const toValue = (x: Parameters<typeof $>[0]) => $(x).attr("value") || "";

  $("word")
    .toArray()
    .forEach((word) => {
      const baseform = $(word)
        .attr("value")
        // TODO: Further clean up the baseform
        ?.replace(/\|/g, "");
      if (!baseform) throw new Error();

      const $translations = $(word).find("translation").toArray();
      const baseFormTranslations = $translations
        .filter((x) => $(x).parent()[0].name === "word")
        .map(toValue);

      result[baseform] = baseFormTranslations;
      $(word)
        .find("inflection")
        .toArray()
        .map(toValue)
        .forEach((inflection) => (result[inflection] = baseFormTranslations));

      // Handle <definition>/<example>
      $translations
        .filter((x) => $(x).parent()[0].name !== "word")
        .forEach((t) => {
          const parent = $(t).parent();
          const parentValue = parent.attr("value");
          if (!parentValue) throw new Error();

          const translations = parent
            .find("translation")
            .toArray()
            .map(toValue);

          result[parentValue] = translations;
        });
    });

  return result;
};
