// Simplified grammar for the "readablepassphrase" style.
// The original uses a full NLP grammar + ~15k word dictionary:
// https://github.com/ligos/readablepassphrasegenerator

import articles from "/grammar/articles.js";
import adjectives from "/grammar/adjectives.js";
import nouns from "/grammar/nouns.js";
import verbs from "/grammar/verbs.js";
import adverbs from "/grammar/adverbs.js";

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
    adjective: adjectives,
    noun: nouns,
    verb: verbs,
    adverb: adverbs,
};

export const RP_TEMPLATES = {
    short: [["article", "noun", "verb", "article", "noun"]],
    normal: [
        ["article", "adjective", "noun", "verb", "article", "noun"],
        ["article", "noun", "adverb", "verb", "article", "adjective", "noun"],
    ],
    long: [["article", "adjective", "noun", "adverb", "verb", "article", "adjective", "noun"]],
    insane: [["article", "adjective", "adjective", "noun", "adverb", "verb", "article", "adjective", "adjective", "noun"]],
};
