import type { Level, Sentence, Skill } from "@/types";

/**
 * The M1 seed: 97 sentences that a person living in the Netherlands meets in the
 * first months, deliberately weighted towards the inburgering exam skills
 * (lezen / luisteren / spreken / schrijven / KNM) rather than towards grammar
 * chapters. Every sentence is something you could actually have to say or hear.
 *
 * `lit` is a word-for-word English rendering. It is meant to look clumsy: seeing
 * "how goes it with you" next to "How are you?" is how Dutch word order stops
 * being a surprise.
 *
 * Tuple order: [nl, en, lit, level, theme, tags]
 */
type Row = [string, string, string, Level, string, string[]];

const ROWS: Row[] = [
  // — kennismaking ————————————————————————————————————————————————
  ["Ik heet Anna.", "My name is Anna.", "I am-called Anna.", "A1", "kennismaking", ["v2"]],
  ["Hoe gaat het met je?", "How are you?", "How goes it with you?", "A1", "kennismaking", ["inversion", "question"]],
  ["Ik kom uit India.", "I come from India.", "I come out India.", "A1", "kennismaking", ["v2"]],
  ["Ik woon nu in Delft.", "I live in Delft now.", "I live now in Delft.", "A1", "kennismaking", ["v2", "time"]],
  ["Ik spreek een beetje Nederlands.", "I speak a little Dutch.", "I speak a little Dutch.", "A1", "kennismaking", ["v2"]],
  ["Kunt u dat alstublieft herhalen?", "Could you repeat that, please?", "Can you that please repeat?", "A1", "kennismaking", ["modal", "formal", "inversion"]],
  ["Ik begrijp het niet.", "I don't understand it.", "I understand it not.", "A1", "kennismaking", ["negation", "v2"]],
  ["Spreekt u Engels?", "Do you speak English?", "Speak you English?", "A1", "kennismaking", ["question", "formal"]],
  ["Ik leer Nederlands voor mijn werk.", "I am learning Dutch for my work.", "I learn Dutch for my work.", "A1", "kennismaking", ["v2"]],
  ["Hoe heet jij?", "What is your name?", "How are-called you?", "A1", "kennismaking", ["question"]],

  // — boodschappen ————————————————————————————————————————————————
  ["Ik wil graag een kilo appels.", "I would like a kilo of apples.", "I want gladly a kilo apples.", "A1", "boodschappen", ["modal"]],
  ["Hoeveel kost dat?", "How much does that cost?", "How-much costs that?", "A1", "boodschappen", ["question"]],
  ["Heeft u ook verse melk?", "Do you also have fresh milk?", "Have you also fresh milk?", "A1", "boodschappen", ["question", "formal"]],
  ["Ik doe boodschappen bij de supermarkt.", "I do my shopping at the supermarket.", "I do groceries at the supermarket.", "A1", "boodschappen", ["de/het", "v2"]],
  ["Waar kan ik de kassa vinden?", "Where can I find the checkout?", "Where can I the checkout find?", "A1", "boodschappen", ["modal", "question"]],
  ["Mag ik met de kaart betalen?", "May I pay by card?", "May I with the card pay?", "A1", "boodschappen", ["modal", "inversion"]],
  ["Dat is te duur.", "That is too expensive.", "That is too expensive.", "A1", "boodschappen", ["v2"]],
  ["Ik neem deze twee.", "I will take these two.", "I take these two.", "A1", "boodschappen", ["v2"]],
  ["De appels zijn in de aanbieding.", "The apples are on offer.", "The apples are in the offer.", "A2", "boodschappen", ["de/het"]],

  // — wonen ————————————————————————————————————————————————————
  ["Ik huur een klein appartement.", "I rent a small apartment.", "I rent a small apartment.", "A1", "wonen", ["v2"]],
  ["Het huis heeft twee slaapkamers.", "The house has two bedrooms.", "The house has two sleep-rooms.", "A1", "wonen", ["de/het"]],
  ["De keuken is naast de woonkamer.", "The kitchen is next to the living room.", "The kitchen is next-to the living-room.", "A1", "wonen", ["de/het"]],
  ["Mijn fiets staat in de schuur.", "My bike is in the shed.", "My bike stands in the shed.", "A1", "wonen", ["de/het", "v2"]],
  ["De verwarming werkt niet.", "The heating is not working.", "The heating works not.", "A1", "wonen", ["negation", "de/het"]],
  ["Ik zoek een kamer in de buurt van het centrum.", "I am looking for a room near the centre.", "I search a room in the neighbourhood of the centre.", "A2", "wonen", ["de/het"]],
  ["Het raam staat open.", "The window is open.", "The window stands open.", "A1", "wonen", ["de/het"]],
  ["Wij hebben een afspraak met de huisbaas.", "We have an appointment with the landlord.", "We have an appointment with the house-boss.", "A2", "wonen", ["de/het"]],

  // — gemeente ————————————————————————————————————————————————
  ["Ik heb een afspraak gemaakt.", "I have made an appointment.", "I have an appointment made.", "A1", "gemeente", ["participle"]],
  ["U moet zich inschrijven bij de gemeente.", "You have to register with the municipality.", "You must yourself in-write at the municipality.", "A2", "gemeente", ["modal", "separable", "formal"]],
  ["Neem uw paspoort mee.", "Bring your passport.", "Take your passport with.", "A1", "gemeente", ["separable", "formal"]],
  ["De afspraak is om tien uur.", "The appointment is at ten o'clock.", "The appointment is at ten hour.", "A1", "gemeente", ["de/het", "time"]],
  ["Waar is het loket?", "Where is the counter?", "Where is the counter?", "A1", "gemeente", ["de/het", "question"]],
  ["Ik kom mijn verblijfsvergunning ophalen.", "I am coming to collect my residence permit.", "I come my stay-permission up-fetch.", "A2", "gemeente", ["separable"]],
  ["Kunt u mij helpen?", "Can you help me?", "Can you me help?", "A1", "gemeente", ["modal", "inversion", "formal"]],
  ["Het formulier is nog niet klaar.", "The form is not ready yet.", "The form is yet not ready.", "A1", "gemeente", ["negation", "de/het"]],

  // — gezondheid ————————————————————————————————————————————————
  ["Ik voel me niet lekker.", "I don't feel well.", "I feel me not nice.", "A1", "gezondheid", ["negation"]],
  ["Ik wil graag een afspraak met de huisarts.", "I would like an appointment with the GP.", "I want gladly an appointment with the house-doctor.", "A2", "gezondheid", ["modal", "de/het"]],
  ["Ik heb hoofdpijn.", "I have a headache.", "I have head-pain.", "A1", "gezondheid", ["v2"]],
  ["Mijn keel doet pijn.", "My throat hurts.", "My throat does pain.", "A1", "gezondheid", []],
  ["Moet ik dit medicijn elke dag innemen?", "Do I have to take this medicine every day?", "Must I this medicine every day in-take?", "A2", "gezondheid", ["modal", "separable", "inversion"]],
  ["Ik ben allergisch voor noten.", "I am allergic to nuts.", "I am allergic for nuts.", "A1", "gezondheid", ["v2"]],
  ["De apotheek is naast de supermarkt.", "The pharmacy is next to the supermarket.", "The pharmacy is next-to the supermarket.", "A1", "gezondheid", ["de/het"]],
  ["Bel de huisartsenpost als het erger wordt.", "Call the out-of-hours GP service if it gets worse.", "Call the house-doctors-post when it worse becomes.", "A2", "gezondheid", ["subordinate"]],

  // — werk ————————————————————————————————————————————————————
  ["Ik werk bij een technisch bedrijf.", "I work at a technical company.", "I work at a technical company.", "A1", "werk", ["v2"]],
  ["Ik begin om negen uur.", "I start at nine o'clock.", "I begin at nine hour.", "A1", "werk", ["time", "v2"]],
  ["Mijn collega's zijn vriendelijk.", "My colleagues are friendly.", "My colleagues are friendly.", "A1", "werk", []],
  ["We hebben elke maandag een overleg.", "We have a meeting every Monday.", "We have every Monday an over-leg.", "A2", "werk", ["time"]],
  ["Ik werk vandaag thuis.", "I am working from home today.", "I work today home.", "A1", "werk", ["v2", "time"]],
  ["Kunt u dat in het Nederlands uitleggen?", "Can you explain that in Dutch?", "Can you that in the Dutch out-lay?", "A2", "werk", ["modal", "separable", "formal"]],
  ["Ik heb een vraag over het project.", "I have a question about the project.", "I have a question over the project.", "A1", "werk", ["de/het"]],
  ["De deadline is volgende week vrijdag.", "The deadline is next Friday.", "The deadline is next week Friday.", "A2", "werk", ["time"]],

  // — vervoer ————————————————————————————————————————————————
  ["Ik ga met de fiets naar het station.", "I go to the station by bike.", "I go with the bike to the station.", "A1", "vervoer", ["de/het"]],
  ["De trein naar Rotterdam is vertraagd.", "The train to Rotterdam is delayed.", "The train to Rotterdam is delayed.", "A1", "vervoer", ["de/het"]],
  ["Waar is de tramhalte?", "Where is the tram stop?", "Where is the tram-stop?", "A1", "vervoer", ["question", "de/het"]],
  ["Ik moet overstappen in Leiden.", "I have to change trains in Leiden.", "I must over-step in Leiden.", "A2", "vervoer", ["modal", "separable"]],
  ["Hoe lang duurt de reis?", "How long does the journey take?", "How long lasts the journey?", "A1", "vervoer", ["question", "de/het"]],
  ["Mag ik hier parkeren?", "May I park here?", "May I here park?", "A1", "vervoer", ["modal", "inversion"]],
  ["De bus komt over vijf minuten.", "The bus arrives in five minutes.", "The bus comes over five minutes.", "A1", "vervoer", ["time", "de/het"]],
  ["Ik heb een ov-chipkaart nodig.", "I need an OV chip card.", "I have an OV-chip-card need.", "A2", "vervoer", ["modal"]],

  // — familie ————————————————————————————————————————————————
  ["Ik ben getrouwd.", "I am married.", "I am married.", "A1", "familie", []],
  ["We hebben twee kinderen.", "We have two children.", "We have two children.", "A1", "familie", []],
  ["Mijn broer woont in Amsterdam.", "My brother lives in Amsterdam.", "My brother lives in Amsterdam.", "A1", "familie", []],
  ["Mijn ouders komen volgende maand op bezoek.", "My parents are visiting next month.", "My parents come next month on visit.", "A2", "familie", ["time", "separable"]],
  ["Hoe oud is je dochter?", "How old is your daughter?", "How old is your daughter?", "A1", "familie", ["question"]],
  ["We eten samen met de familie.", "We eat together with the family.", "We eat together with the family.", "A1", "familie", ["de/het"]],
  ["Zij is de zus van mijn vrouw.", "She is my wife's sister.", "She is the sister of my wife.", "A1", "familie", ["de/het"]],
  ["Ik bel mijn moeder elke zondag.", "I call my mother every Sunday.", "I call my mother every Sunday.", "A1", "familie", ["time"]],

  // — eten ————————————————————————————————————————————————————
  ["Ik wil graag een kop koffie.", "I would like a cup of coffee.", "I want gladly a cup coffee.", "A1", "eten", ["modal"]],
  ["Wat is het dagmenu?", "What is the menu of the day?", "What is the day-menu?", "A1", "eten", ["question", "de/het"]],
  ["De rekening, alstublieft.", "The bill, please.", "The bill, please.", "A1", "eten", ["de/het"]],
  ["Ik eet geen vlees.", "I don't eat meat.", "I eat no meat.", "A1", "eten", ["negation"]],
  ["Het eten is heerlijk.", "The food is delicious.", "The food is delicious.", "A1", "eten", ["de/het"]],
  ["Kunnen we buiten zitten?", "Can we sit outside?", "Can we outside sit?", "A2", "eten", ["modal", "question"]],
  ["Ik maak vanavond pasta.", "I am making pasta tonight.", "I make tonight pasta.", "A1", "eten", ["time"]],
  ["Wil je nog iets drinken?", "Would you like something to drink?", "Want you still something drink?", "A1", "eten", ["modal", "question"]],

  // — tijd en weer ————————————————————————————————————————————
  ["Het is vandaag koud en nat.", "It is cold and wet today.", "It is today cold and wet.", "A1", "tijd", ["time"]],
  ["Morgen wordt het zonnig.", "It will be sunny tomorrow.", "Tomorrow becomes it sunny.", "A2", "tijd", ["inversion", "time"]],
  ["Ik ben om half acht thuis.", "I am home at half past seven.", "I am at half eight home.", "A2", "tijd", ["time"]],
  ["Het regent al de hele dag.", "It has been raining all day.", "It rains already the whole day.", "A2", "tijd", ["time"]],
  ["Volgende week heb ik vakantie.", "Next week I have holidays.", "Next week have I holiday.", "A1", "tijd", ["inversion", "time"]],
  ["De zomer is hier kort.", "The summer is short here.", "The summer is here short.", "A1", "tijd", ["de/het"]],
  ["Het waait hard vandaag.", "It is very windy today.", "It blows hard today.", "A1", "tijd", ["time"]],
  ["Ik ga vanavond vroeg slapen.", "I am going to bed early tonight.", "I go tonight early sleep.", "A1", "tijd", ["time"]],

  // — taal en cursus ——————————————————————————————————————————
  ["Ik volg een cursus Nederlands.", "I am taking a Dutch course.", "I follow a course Dutch.", "A1", "taal", ["v2"]],
  ["De les begint om zeven uur.", "The lesson starts at seven o'clock.", "The lesson begins at seven hour.", "A1", "taal", ["time", "de/het"]],
  ["Ik maak elke dag mijn huiswerk.", "I do my homework every day.", "I make every day my house-work.", "A1", "taal", ["time"]],
  ["Ik oefen met spreken in de supermarkt.", "I practise speaking in the supermarket.", "I practise with speak in the supermarket.", "A2", "taal", ["de/het"]],
  ["Kunt u langzamer praten?", "Could you speak more slowly?", "Can you slower talk?", "A1", "taal", ["modal", "formal", "inversion"]],
  ["Ik moet nog veel woorden leren.", "I still have to learn many words.", "I must yet many words learn.", "A2", "taal", ["modal"]],

  // — KNM: hoe het hier werkt —————————————————————————————————
  ["Je moet je fiets op slot zetten.", "You must lock your bike.", "You must your bike on lock set.", "A1", "knm", ["modal"]],
  ["Nederlanders maken vaak een afspraak.", "Dutch people often make an appointment.", "Dutch-people make often an appointment.", "A2", "knm", ["time"]],
  ["Op zondag zijn veel winkels dicht.", "On Sundays many shops are closed.", "On Sunday are many shops closed.", "A1", "knm", ["inversion", "time"]],
  ["Je mag hier niet roken.", "You are not allowed to smoke here.", "You may here not smoke.", "A1", "knm", ["negation", "modal"]],
  ["We scheiden het afval in huis.", "We separate the waste at home.", "We separate the waste in house.", "A2", "knm", ["de/het"]],
  ["Je moet op tijd komen.", "You must arrive on time.", "You must on time come.", "A1", "knm", ["modal"]],
  ["De gemeente regelt veel zaken.", "The municipality handles many matters.", "The municipality arranges many matters.", "A2", "knm", ["de/het"]],
  ["Bij een bezoek breng je bloemen mee.", "When visiting, you bring flowers.", "At a visit bring you flowers with.", "A2", "knm", ["separable", "inversion"]],
];

const SKILLS_BY_THEME: Record<string, Skill[]> = {
  knm: ["knm", "lezen", "luisteren"],
  taal: ["lezen", "luisteren", "schrijven", "spreken"],
};

const DEFAULT_SKILLS: Skill[] = ["lezen", "luisteren", "schrijven", "spreken"];

export const SENTENCES: Sentence[] = ROWS.map(([nl, en, lit, level, theme, tags], index) => ({
  id: `s${String(index + 1).padStart(3, "0")}`,
  nl,
  en,
  lit,
  level,
  theme,
  tags,
  skills: SKILLS_BY_THEME[theme] ?? DEFAULT_SKILLS,
}));

export const SENTENCES_BY_ID = new Map(SENTENCES.map((sentence) => [sentence.id, sentence]));

export const THEMES = [...new Set(SENTENCES.map((sentence) => sentence.theme))];

export const KNOWN_TAGS = [
  "v2",
  "inversion",
  "question",
  "negation",
  "modal",
  "de/het",
  "separable",
  "participle",
  "subordinate",
  "time",
  "formal",
];

export const CONTENT_STATS = {
  total: SENTENCES.length,
  a1: SENTENCES.filter((sentence) => sentence.level === "A1").length,
  a2: SENTENCES.filter((sentence) => sentence.level === "A2").length,
  themes: THEMES.length,
};

export function sentenceById(id: string): Sentence | undefined {
  return SENTENCES_BY_ID.get(id);
}
