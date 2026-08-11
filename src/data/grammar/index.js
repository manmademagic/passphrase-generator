// Simplified grammar for the "readablepassphrase" style.
// The original uses a full NLP grammar + ~15k word dictionary:
// https://github.com/ligos/readablepassphrasegenerator

import articles from "./articles.js";
import adjectives from "./adjectives.js";
import nouns from "./nouns.js";
import nounsPlural from "./nounsPlural.js";
import properNouns from "./properNouns.js";
import verbs from "./verbs.js";
import verbsBase from "./verbsBase.js";
import verbsPast from "./verbsPast.js";
import speechVerbs from "./speechVerbs.js";
import adverbs from "./adverbs.js";
import demonstratives from "./demonstratives.js";
import personalPronouns from "./personalPronouns.js";
import indefinitePronouns from "./indefinitePronouns.js";
import numbers from "./numbers.js";
import prepositions from "./prepositions.js";
import auxiliaries from "./auxiliaries.js";
import interrogatives from "./interrogatives.js";
import conjunctions from "./conjunctions.js";

// adjective
// adverb
// article
// conjunction
// demonstrative
// indefinite pronoun
// interrogative
// noun
// number
// personal pronoun
// preposition
// proper noun
// speech verb
// tags
// verb
// word

export const RP = {
    article: articles,
    demonstrative: demonstratives,
    personalPronoun: personalPronouns,
    indefinitePronoun: indefinitePronouns,
    number: numbers,
    adjective: adjectives,
    noun: nouns,
    nounPlural: nounsPlural,
    properNoun: properNouns,
    verb: verbs, // 3rd-person singular present ("eats")
    verbBase: verbsBase, // plain form ("eat")
    verbPast: verbsPast, // past tense ("ate")
    speechVerb: speechVerbs,
    adverb: adverbs,
    preposition: prepositions,
    auxiliary: auxiliaries,
    interrogative: interrogatives,
    conjunction: conjunctions,
};

// Sanity check at module load: every template key must exist in RP.
/*for (const [tier, templates] of Object.entries(RP_TEMPLATES)) {
  for (const tmpl of templates) {
    for (const pos of tmpl) {
      if (!RP[pos]) throw new Error(`templates.js: unknown part of speech "${pos}" in tier "${tier}"`);
    }
  }
}*/

export const RP_TEMPLATES = {
    short: [
        ["article", "noun", "verb", "article", "noun"],
        ["demonstrative", "noun", "verbPast", "personalPronoun", "noun"],
        ["properNoun", "verb", "article", "noun"],
        ["indefinitePronoun", "verb", "personalPronoun", "noun"],
    ],
    normal: [
        ["article", "adjective", "noun", "verb", "article", "noun"],
        ["article", "noun", "adverb", "verbPast", "article", "adjective", "noun"],
        ["number", "nounPlural", "verbBase", "preposition", "article", "noun"],
        ["demonstrative", "noun", "verb", "preposition", "personalPronoun", "adjective", "noun"],
    ],
    long: [
        ["article", "adjective", "noun", "adverb", "verb", "preposition", "article", "adjective", "noun"],
        ["interrogative", "auxiliary", "article", "adjective", "noun", "verbBase", "article", "noun"],
        ["properNoun", "speechVerb", "article", "adjective", "noun", "verbPast", "personalPronoun", "noun"],
        ["number", "adjective", "nounPlural", "adverb", "verbBase", "preposition", "article", "noun"],
    ],
    insane: [
        [
            "article",
            "adjective",
            "noun",
            "adverb",
            "verbPast",
            "article",
            "adjective",
            "noun",
            "conjunction",
            "number",
            "nounPlural",
            "verbBase",
            "preposition",
            "personalPronoun",
            "adjective",
            "noun",
        ],
        [
            "properNoun",
            "speechVerb",
            "interrogative",
            "auxiliary",
            "article",
            "adjective",
            "noun",
            "adverb",
            "verbBase",
            "preposition",
            "demonstrative",
            "adjective",
            "noun",
        ],
    ],
};
