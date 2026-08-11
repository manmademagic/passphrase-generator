// MakeMeAPassword — Cloudflare Worker port
// API: /api/v1/<style>/<format>?<params>
// Formats: plain, json, xml, combinations
// Styles: pin, hex, alphanumeric, unicode, pronounceable, passphrase, readablepassphrase, pattern

// ---------- CSPRNG helpers (unbiased, via Web Crypto) ----------
function randUint32() {
    const b = new Uint32Array(1);
    crypto.getRandomValues(b);
    return b[0];
}
// Unbiased integer in [0, max) using rejection sampling
function randInt(max) {
    if (max <= 1) return 0;
    const limit = Math.floor(0x100000000 / max) * max;
    let r;
    do {
        r = randUint32();
    } while (r >= limit);
    return r % max;
}
const pick = (arr) => arr[randInt(arr.length)];

// ---------- Param parsing ----------
const toBool = (v, def) => (v == null ? def : /^(y|t|1|true|yes)$/i.test(v));
function toInt(v, def, min, max) {
    const n = parseInt(v, 10);
    if (isNaN(n)) return def;
    return Math.min(max, Math.max(min, n));
}

// ---------- Character sets ----------
const DIGITS = "0123456789";
const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?";
const HEX = "0123456789abcdef";
const CONSONANTS = [
    "b",
    "c",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    "m",
    "n",
    "p",
    "qu",
    "r",
    "s",
    "t",
    "v",
    "w",
    "x",
    "z",
    "ch",
    "sh",
    "th",
    "ph",
    "st",
    "br",
    "tr",
];
const VOWELS = ["a", "e", "i", "o", "u", "ai", "ee", "oo", "ou", "ie", "ea"];

// Replace/extend with a bigger dictionary for real-world use (see notes below).
const WORDS = [
    "able",
    "acid",
    "aged",
    "also",
    "area",
    "army",
    "away",
    "baby",
    "back",
    "ball",
    "band",
    "bank",
    "base",
    "bath",
    "bear",
    "beat",
    "been",
    "beer",
    "bell",
    "belt",
    "best",
    "bird",
    "blow",
    "blue",
    "boat",
    "body",
    "bomb",
    "bond",
    "bone",
    "book",
    "born",
    "both",
    "bowl",
    "bulk",
    "burn",
    "bush",
    "busy",
    "call",
    "calm",
    "came",
    "camp",
    "card",
    "care",
    "case",
    "cash",
    "cast",
    "cell",
    "chat",
    "chip",
    "city",
    "club",
    "coal",
    "coat",
    "code",
    "cold",
    "come",
    "cook",
    "cool",
    "cope",
    "copy",
    "core",
    "cost",
    "crew",
    "crop",
    "dark",
    "data",
    "date",
    "dawn",
    "days",
    "dead",
    "deal",
    "dean",
    "dear",
    "debt",
    "deep",
    "deny",
    "desk",
    "dial",
    "dick",
    "diet",
    "disc",
    "disk",
    "does",
    "done",
    "door",
    "dose",
    "down",
    "draw",
    "drew",
    "drop",
    "drug",
    "dual",
    "duke",
    "dust",
    "duty",
    "each",
    "earn",
    "ease",
    "east",
    "easy",
    "edge",
    "else",
    "even",
    "ever",
    "evil",
    "exit",
    "face",
    "fact",
    "fail",
    "fair",
    "fall",
    "farm",
    "fast",
    "fate",
    "fear",
    "feed",
    "feel",
    "feet",
    "fell",
    "felt",
    "file",
    "fill",
    "film",
    "find",
    "fine",
    "fire",
    "firm",
    "fish",
    "five",
    "flat",
    "flow",
    "food",
    "foot",
    "ford",
    "form",
    "fort",
    "four",
    "free",
    "from",
    "fuel",
    "full",
    "fund",
    "gain",
    "game",
    "gate",
    "gave",
    "gear",
    "gene",
    "gift",
    "girl",
    "give",
    "glad",
    "goal",
    "goes",
    "gold",
    "golf",
    "gone",
    "good",
    "gray",
    "grew",
    "grey",
    "grow",
    "gulf",
    "hair",
    "half",
    "hall",
    "hand",
    "hang",
    "hard",
    "harm",
    "hate",
    "have",
    "head",
    "hear",
    "heat",
    "held",
    "hell",
    "help",
    "here",
    "hero",
    "high",
    "hill",
    "hire",
    "hold",
    "hole",
    "holy",
    "home",
    "hope",
    "host",
    "hour",
    "huge",
    "hung",
    "hunt",
    "hurt",
    "idea",
    "inch",
    "into",
    "iron",
    "item",
    "jack",
    "jane",
    "jean",
    "john",
    "join",
    "jump",
    "jury",
    "just",
    "keen",
    "keep",
    "kent",
    "kept",
    "kick",
    "kill",
    "kind",
    "king",
    "knee",
    "knew",
    "know",
    "lack",
    "lady",
    "laid",
    "lake",
    "land",
    "lane",
    "last",
    "late",
    "lead",
    "left",
    "less",
    "life",
    "lift",
    "like",
    "line",
    "link",
    "list",
    "live",
    "load",
    "loan",
    "lock",
    "logo",
    "long",
    "look",
    "lord",
    "lose",
    "loss",
    "lost",
    "love",
    "luck",
    "made",
    "mail",
    "main",
    "make",
    "male",
    "many",
    "mark",
    "mass",
    "matt",
    "meal",
    "mean",
    "meat",
    "meet",
    "menu",
    "mere",
    "mike",
    "mile",
    "milk",
    "mill",
    "mind",
    "mine",
    "miss",
    "mode",
    "mood",
    "moon",
    "more",
    "most",
    "move",
    "much",
    "must",
    "name",
    "navy",
    "near",
    "neck",
    "need",
    "news",
    "next",
    "nice",
    "nick",
    "nine",
    "none",
    "nose",
    "note",
    "okay",
    "once",
    "only",
    "onto",
    "open",
    "oral",
    "over",
    "pace",
    "pack",
    "page",
    "paid",
    "pain",
    "pair",
    "palm",
    "park",
    "part",
    "pass",
    "past",
    "path",
    "peak",
    "pick",
    "pink",
    "pipe",
    "plan",
    "play",
    "plot",
    "plug",
    "plus",
    "poll",
    "pool",
    "poor",
    "port",
    "post",
    "pull",
    "pure",
    "push",
    "race",
    "rail",
    "rain",
    "rank",
    "rare",
    "rate",
    "read",
    "real",
    "rear",
    "rely",
    "rent",
    "rest",
    "rice",
    "rich",
    "ride",
    "ring",
    "rise",
    "risk",
    "road",
    "rock",
    "role",
    "roll",
    "roof",
    "room",
    "root",
    "rose",
    "rule",
    "rush",
    "ruth",
    "safe",
    "said",
    "sake",
    "sale",
    "salt",
    "same",
    "sand",
    "save",
    "seat",
    "seed",
    "seek",
    "seem",
    "seen",
    "self",
    "sell",
    "send",
    "sent",
    "sept",
    "ship",
    "shop",
    "shot",
    "show",
    "shut",
    "sick",
    "side",
    "sign",
    "site",
    "size",
    "skin",
    "slip",
    "slow",
    "snow",
    "soft",
    "soil",
    "sold",
    "sole",
    "some",
    "song",
    "soon",
    "sort",
    "soul",
    "spot",
    "star",
    "stay",
    "step",
    "stop",
    "such",
    "suit",
    "sure",
    "take",
    "tale",
    "talk",
    "tall",
    "tank",
    "tape",
    "task",
    "team",
    "tech",
    "tell",
    "tend",
    "term",
    "test",
    "text",
    "than",
    "that",
    "them",
    "then",
    "they",
    "thin",
    "this",
    "thus",
    "till",
    "time",
    "tiny",
    "told",
    "toll",
    "tone",
    "tony",
    "took",
    "tool",
    "tour",
    "town",
    "tree",
    "trip",
    "true",
    "tune",
    "turn",
    "twin",
    "type",
    "unit",
    "upon",
    "used",
    "user",
    "vary",
    "vast",
    "very",
    "vice",
    "view",
    "vote",
    "wage",
    "wait",
    "wake",
    "walk",
    "wall",
    "want",
    "ward",
    "warm",
    "wash",
    "wave",
    "ways",
    "weak",
    "wear",
    "week",
    "well",
    "went",
    "were",
    "west",
    "what",
    "when",
    "whom",
    "wide",
    "wife",
    "wild",
    "will",
    "wind",
    "wine",
    "wing",
    "wire",
    "wise",
    "wish",
    "with",
    "wood",
    "word",
    "wore",
    "work",
    "yard",
    "yeah",
    "year",
    "your",
    "zero",
    "zone",
];

// Simplified grammar for "readable passphrase" (the real project uses a full
// NLP grammar + ~15k word dictionary — see notes).
const RP = {
    article: ["the", "a", "my", "their", "some", "every"],
    adjective: ["red", "quiet", "brave", "shiny", "hungry", "gentle", "sneaky", "ancient", "purple", "clever", "frozen", "golden"],
    noun: ["milk", "engine", "wizard", "puppy", "harbor", "statue", "goblin", "teacher", "planet", "hammer", "walrus", "lantern"],
    verb: ["eats", "builds", "paints", "chases", "admires", "borrows", "juggles", "repairs", "ignores", "punches"],
    adverb: ["quickly", "sadly", "rarely", "boldly", "quietly", "eagerly"],
};
const RP_TEMPLATES = {
    short: [["article", "noun", "verb", "article", "noun"]],
    normal: [
        ["article", "adjective", "noun", "verb", "article", "noun"],
        ["article", "noun", "adverb", "verb", "article", "adjective", "noun"],
    ],
    long: [["article", "adjective", "noun", "adverb", "verb", "article", "adjective", "noun"]],
    insane: [["article", "adjective", "adjective", "noun", "adverb", "verb", "article", "adjective", "adjective", "noun"]],
};

// ---------- Mutators (numbers / uppercase) ----------
function addNumbers(words, when, count) {
    if (when === "never" || count <= 0) return words;
    for (let i = 0; i < count; i++) {
        const d = DIGITS[randInt(10)];
        const w = randInt(words.length);
        switch (when) {
            case "startofword":
                words[w] = d + words[w];
                break;
            case "endofword":
                words[w] = words[w] + d;
                break;
            case "startorendofword":
                words[w] = randInt(2) ? d + words[w] : words[w] + d;
                break;
            case "endofphrase":
                words[words.length - 1] += d;
                break;
            case "anywhere": {
                const p = randInt(words[w].length + 1);
                words[w] = words[w].slice(0, p) + d + words[w].slice(p);
                break;
            }
        }
    }
    return words;
}
function addUppercase(words, when, count) {
    if (when === "never" || count <= 0) return words;
    for (let i = 0; i < count; i++) {
        const w = randInt(words.length);
        switch (when) {
            case "startofword":
                words[w] = words[w][0].toUpperCase() + words[w].slice(1);
                break;
            case "wholeword":
                words[w] = words[w].toUpperCase();
                break;
            case "runofletters": {
                const s = randInt(words[w].length);
                const e = Math.min(words[w].length, s + 1 + randInt(3));
                words[w] = words[w].slice(0, s) + words[w].slice(s, e).toUpperCase() + words[w].slice(e);
                break;
            }
            case "anywhere": {
                const p = randInt(words[w].length);
                words[w] = words[w].slice(0, p) + words[w][p].toUpperCase() + words[w].slice(p + 1);
                break;
            }
        }
    }
    return words;
}
function applyLengthFilter(genFn, minCh, maxCh) {
    for (let attempt = 0; attempt < 100; attempt++) {
        const s = genFn();
        if (s.length >= minCh && s.length <= maxCh) return s;
    }
    return genFn(); // give up on filter rather than loop forever
}

// ---------- Generators: return { list, combinations } ----------
const GENERATORS = {
    pin(q) {
        const l = toInt(q.get("l"), 4, 1, 128),
            c = toInt(q.get("c"), 1, 1, 50);
        const gen = () => Array.from({ length: l }, () => DIGITS[randInt(10)]).join("");
        return { list: Array.from({ length: c }, gen), combinations: Math.pow(10, l) };
    },
    hex(q) {
        const l = toInt(q.get("l"), 8, 1, 128),
            c = toInt(q.get("c"), 1, 1, 50);
        const gen = () => Array.from({ length: l }, () => HEX[randInt(16)]).join("");
        return { list: Array.from({ length: c }, gen), combinations: Math.pow(16, l) };
    },
    alphanumeric(q) {
        const l = toInt(q.get("l"), 8, 1, 128),
            c = toInt(q.get("c"), 1, 1, 50);
        const chars = toBool(q.get("sym"), false) ? ALPHANUM + SYMBOLS : ALPHANUM;
        const gen = () => Array.from({ length: l }, () => chars[randInt(chars.length)]).join("");
        return { list: Array.from({ length: c }, gen), combinations: Math.pow(chars.length, l) };
    },
    unicode(q) {
        const l = toInt(q.get("l"), 8, 1, 64),
            c = toInt(q.get("c"), 1, 1, 50);
        const bmpOnly = toBool(q.get("bmp"), true);
        const asian = toBool(q.get("asian"), false);
        const max = bmpOnly ? 0xffff : 0x10ffff;
        const ok = (cp) => {
            if (cp >= 0xd800 && cp <= 0xdfff) return false; // surrogates
            if (cp < 0x20 || (cp >= 0x7f && cp <= 0xa0)) return false; // controls
            if (
                !asian &&
                ((cp >= 0x2e80 && cp <= 0x9fff) || (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x20000 && cp <= 0x2fa1f))
            )
                return false;
            // require an assigned, printable-ish char
            const s = String.fromCodePoint(cp);
            return !/\p{C}|\p{Z}/u.test(s) || s === " ";
        };
        const randCp = () => {
            let cp;
            do {
                cp = randInt(max + 1);
            } while (!ok(cp));
            return cp;
        };
        const gen = () => Array.from({ length: l }, () => String.fromCodePoint(randCp())).join("");
        return { list: Array.from({ length: c }, gen), combinations: Math.pow(bmpOnly ? 50000 : 130000, l) };
    },
    pronounceable(q) {
        const sc = toInt(q.get("sc"), 4, 1, 32),
            c = toInt(q.get("c"), 1, 1, 50);
        const dash = toBool(q.get("dsh"), true);
        const syll = () => pick(CONSONANTS) + pick(VOWELS) + (randInt(3) === 0 ? pick(CONSONANTS) : "");
        const gen = () => Array.from({ length: sc }, syll).join(dash ? "-" : "");
        return { list: Array.from({ length: c }, gen), combinations: Math.pow(CONSONANTS.length * VOWELS.length * (1 + CONSONANTS.length / 3), sc) };
    },
    passphrase(q) {
        const wc = toInt(q.get("wc"), 4, 1, 16),
            pc = toInt(q.get("pc"), 1, 1, 50);
        const sp = toBool(q.get("sp"), true);
        const minCh = toInt(q.get("minCh"), 1, 1, 9999),
            maxCh = toInt(q.get("maxCh"), 9999, 1, 9999);
        const whenNum = (q.get("whenNum") || "never").toLowerCase();
        const nums = toInt(q.get("nums"), 0, 0, 9999);
        const whenUp = (q.get("whenUp") || "never").toLowerCase();
        const ups = toInt(q.get("ups"), 0, 0, 9999);
        const gen = () => {
            let words = Array.from({ length: wc }, () => pick(WORDS));
            words = addUppercase(addNumbers(words, whenNum, nums), whenUp, ups);
            return words.join(sp ? " " : "");
        };
        return { list: Array.from({ length: pc }, () => applyLengthFilter(gen, minCh, maxCh)), combinations: Math.pow(WORDS.length, wc) };
    },
    readablepassphrase(q) {
        const s = (q.get("s") || "random").toLowerCase();
        const pc = toInt(q.get("pc"), 1, 1, 50);
        const sp = toBool(q.get("sp"), true);
        const minCh = toInt(q.get("minCh"), 1, 1, 9999),
            maxCh = toInt(q.get("maxCh"), 9999, 1, 9999);
        const whenNum = (q.get("whenNum") || "never").toLowerCase();
        const nums = toInt(q.get("nums"), 0, 0, 9999);
        const whenUp = (q.get("whenUp") || "never").toLowerCase();
        const ups = toInt(q.get("ups"), 0, 0, 9999);
        const bank =
            { randomshort: "short", normal: "normal", strong: "long", randomlong: "long", insane: "insane", randomforever: "insane" }[s] ||
            pick(["short", "normal", "long"]); // "random"
        const tmpl = pick(RP_TEMPLATES[bank]);
        const gen = () => {
            let words = tmpl.map((pos) => pick(RP[pos]));
            words = addUppercase(addNumbers(words, whenNum, nums), whenUp, ups);
            return words.join(sp ? " " : "");
        };
        const combos = tmpl.reduce((acc, pos) => acc * RP[pos].length, 1);
        return { list: Array.from({ length: pc }, () => applyLengthFilter(gen, minCh, maxCh)), combinations: combos };
    },
    pattern(q) {
        const ps = toInt(q.get("ps"), 5, 1, 64),
            c = toInt(q.get("c"), 1, 1, 50);
        const gs = toInt(q.get("gs"), 3, 1, 8);
        const cells = gs * gs;
        const n = Math.min(ps, cells); // no repeated points
        const gen = () => {
            const avail = Array.from({ length: cells }, (_, i) => i + 1);
            const path = [];
            for (let i = 0; i < n; i++) path.push(avail.splice(randInt(avail.length), 1)[0]);
            return path.join(",");
        };
        let combos = 1;
        for (let i = 0; i < n; i++) combos *= cells - i;
        return { list: Array.from({ length: c }, gen), combinations: combos };
    },
};

// ---------- Formatters ----------
const xmlEsc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store, no-cache",
};
function respond(format, result) {
    switch (format) {
        case "plain":
            return new Response(result.list.join("\r\n") + "\r\n", { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });
        case "json":
            return Response.json({ pws: result.list }, { headers: CORS });
        case "xml":
            return new Response(
                `<?xml version="1.0" encoding="utf-8"?>\n<ArrayOfString>\n` +
                    result.list.map((p) => `  <string>${xmlEsc(p)}</string>`).join("\n") +
                    `\n</ArrayOfString>`,
                { headers: { ...CORS, "Content-Type": "text/xml; charset=utf-8" } },
            );
        case "combinations": {
            const bits = Math.log2(result.combinations);
            const rating = bits < 32 ? 0 : bits < 48 ? 2 : bits < 64 ? 4 : bits < 80 ? 5 : bits < 112 ? 6 : 7;
            return Response.json(
                {
                    middle: result.combinations,
                    upper: result.combinations,
                    lower: result.combinations,
                    middleText: result.combinations.toExponential(3),
                    bits: Math.round(bits * 100) / 100,
                    rating,
                },
                { headers: CORS },
            );
        }
        default:
            return new Response("Unknown format. Use: plain, json, xml, combinations\n", { status: 400 });
    }
}

// ---------- Router ----------
export default {
    async fetch(request) {
        const url = new URL(request.url);
        const m = url.pathname.match(/^\/api\/v1\/([a-z]+)\/([a-z]+)\/?$/i);
        if (!m) {
            return new Response(
                "MakeMeAPassword (Cloudflare Worker port)\n" +
                    "Usage: /api/v1/<style>/<format>?<params>\n" +
                    `Styles: ${Object.keys(GENERATORS).join(", ")}\n` +
                    "Formats: plain, json, xml, combinations\n",
                { headers: { "Content-Type": "text/plain" }, status: url.pathname === "/" ? 200 : 404 },
            );
        }
        const gen = GENERATORS[m[1].toLowerCase()];
        if (!gen) return new Response("Unknown style\n", { status: 404 });
        try {
            return respond(m[2].toLowerCase(), gen(url.searchParams));
        } catch (e) {
            return new Response("Error: " + e.message + "\n", { status: 500 });
        }
    },
};
