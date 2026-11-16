import type { Item, Module, Unit } from "@/types";

/**
 * The built-in Dutch module. Plain data on purpose: the same shape an imported
 * module has, so nothing in the app can depend on "built-in" behaviour.
 *
 * Row order: [id, text, translation, literal?, tags?, tip?, image?]
 * `image` is a bundled picture cue for concrete sentences; most rows have none, and the
 * app is designed to be complete without any of them.
 * `literal` is a deliberately clumsy word-for-word gloss — "how goes it with you"
 * next to "How are you?" is how Dutch word order stops being a surprise.
 */
type Row = [string, string, string, string?, string[]?, string?, string?];

function items(rows: Row[]): Item[] {
  return rows.map(([id, text, translation, literal, tags, tip, image]) => ({
    id,
    text,
    translation,
    literal,
    tags: tags ?? [],
    tip,
    image,
  }));
}

function unit(
  id: string,
  title: string,
  blurb: string,
  level: Unit["level"],
  tip: string,
  rows: Row[],
): Unit {
  return { id, title, blurb, level, tip, items: items(rows) };
}

export const NL_BASIS: Module = {
  schemaVersion: 1,
  id: "nl-basis",
  language: "nl",
  title: "Nederlands voor Delft",
  description:
    "Survival Dutch for living in the Netherlands, weighted towards the inburgering exam: gemeente, wonen, huisarts, werk, boodschappen, bellen, KNM.",
  author: "Taal",
  units: [
    unit("kennismaking", "Kennismaking", "Say who you are and survive the first conversation.", "A1",
      "The verb goes second. In *Ik woon in Delft* the verb follows the subject; in *Nu woon ik in Delft* it swaps with *nu* to keep the second slot.",
      [
        ["s001", "Ik heet Anna.", "My name is Anna.", "I am-called Anna.", ["v2"]],
        ["s002", "Hoe gaat het met je?", "How are you?", "How goes it with you?", ["inversion", "question"]],
        ["s003", "Ik kom uit India.", "I come from India.", "I come out India.", ["v2"]],
        ["s004", "Ik woon nu in Delft.", "I live in Delft now.", "I live now in Delft.", ["v2", "inversion"]],
        ["s005", "Ik spreek een beetje Nederlands.", "I speak a little Dutch.", "I speak a little Dutch.", ["v2"]],
        ["s006", "Kunt u dat alstublieft herhalen?", "Could you repeat that, please?", "Can you that please repeat?", ["modal", "formal", "inversion"]],
        ["s007", "Ik begrijp het niet.", "I don't understand it.", "I understand it not.", ["negation", "v2"]],
        ["s008", "Spreekt u Engels?", "Do you speak English?", "Speak you English?", ["question", "formal"]],
        ["s009", "Ik leer Nederlands voor mijn werk.", "I am learning Dutch for my work.", "I learn Dutch for my work.", ["v2"]],
        ["s010", "Hoe heet jij?", "What is your name?", "How are-called you?", ["question"]],
      ]),

    unit("boodschappen", "Boodschappen", "The supermarket, the till, and asking what things cost.", "A1",
      "*Graag* is the politeness dial: *Ik wil koffie* is blunt, *Ik wil graag koffie* is normal, and *Alstublieft* finishes the job.",
      [
        ["s011", "Ik wil graag een kilo appels.", "I would like a kilo of apples.", "I want gladly a kilo apples.", ["modal"], undefined, "img/s011.jpg"],
        ["s012", "Hoeveel kost dat?", "How much does that cost?", "How-much costs that?", ["question"]],
        ["s013", "Heeft u ook verse melk?", "Do you also have fresh milk?", "Have you also fresh milk?", ["question", "formal"], undefined, "img/s013.jpg"],
        ["s014", "Ik doe boodschappen bij de supermarkt.", "I do my shopping at the supermarket.", "I do groceries at the supermarket.", ["v2"]],
        ["s015", "Waar kan ik de kassa vinden?", "Where can I find the checkout?", "Where can I the till find?", ["modal", "question"]],
        ["s016", "Mag ik met de kaart betalen?", "May I pay by card?", "May I with the card pay?", ["modal", "inversion"], undefined, "img/s016.jpg"],
        ["s017", "Dat is te duur.", "That is too expensive.", "That is too expensive."],
        ["s018", "Ik neem deze twee.", "I will take these two.", "I take these two."],
        ["s019", "De appels zijn in de aanbieding.", "The apples are on offer.", "The apples are in the offer.", ["de/het"]],
      ]),

    unit("wonen", "Wonen", "Your flat, the landlord, and things that stop working.", "A1",
      "Two-thirds of Dutch nouns take *de*; the *het* words are a smaller list you learn by ear — *het huis, het raam, het centrum*.",
      [
        ["s020", "Ik huur een klein appartement.", "I rent a small apartment.", "I rent a small apartment."],
        ["s021", "Het huis heeft twee slaapkamers.", "The house has two bedrooms.", "The house has two sleep-rooms.", ["de/het"]],
        ["s022", "De keuken is naast de woonkamer.", "The kitchen is next to the living room.", "The kitchen is next-to the living-room.", ["de/het"]],
        ["s023", "Mijn fiets staat in de schuur.", "My bike is in the shed.", "My bike stands in the shed.", ["de/het"], undefined, "img/s023.jpg"],
        ["s024", "De verwarming werkt niet.", "The heating is not working.", "The heating works not.", ["negation", "de/het"]],
        ["s025", "Ik zoek een kamer in de buurt van het centrum.", "I am looking for a room near the centre.", "I search a room in the neighbourhood of the centre.", ["de/het"]],
        ["s026", "Het raam staat open.", "The window is open.", "The window stands open.", ["de/het"]],
        ["s027", "Wij hebben een afspraak met de huisbaas.", "We have an appointment with the landlord.", "We have an appointment with the house-boss.", ["de/het"]],
      ]),

    unit("gemeente", "Gemeente", "Appointments, forms and the counter: the paperwork of arriving.", "A1",
      "*U* is formal, *je* is normal. At the gemeente, stay on *u* until they offer otherwise.",
      [
        ["s028", "Ik heb een afspraak gemaakt.", "I have made an appointment.", "I have an appointment made.", ["participle"]],
        ["s029", "U moet zich inschrijven bij de gemeente.", "You have to register with the municipality.", "You must yourself in-write at the municipality.", ["modal", "separable", "formal"]],
        ["s030", "Neem uw paspoort mee.", "Bring your passport.", "Take your passport with.", ["separable", "formal"]],
        ["s031", "De afspraak is om tien uur.", "The appointment is at ten o'clock.", "The appointment is at ten hour.", ["de/het", "time"]],
        ["s032", "Waar is het loket?", "Where is the counter?", "Where is the counter?", ["de/het", "question"]],
        ["s033", "Ik kom mijn verblijfsvergunning ophalen.", "I am coming to collect my residence permit.", "I come my stay-permission up-fetch.", ["separable"]],
        ["s034", "Kunt u mij helpen?", "Can you help me?", "Can you me help?", ["modal", "inversion", "formal"]],
        ["s035", "Het formulier is nog niet klaar.", "The form is not ready yet.", "The form is yet not ready.", ["negation", "de/het"]],
      ]),

    unit("gezondheid", "Gezondheid", "The GP, the pharmacy, and saying what hurts.", "A1",
      "Two ways to say it hurts: *Ik heb hoofdpijn* (a noun you have) or *Mijn keel doet pijn* (the body part does the hurting).",
      [
        ["s036", "Ik voel me niet lekker.", "I don't feel well.", "I feel me not nice.", ["negation"]],
        ["s037", "Ik wil graag een afspraak met de huisarts.", "I would like an appointment with the GP.", "I want gladly an appointment with the house-doctor.", ["modal", "de/het"]],
        ["s038", "Ik heb hoofdpijn.", "I have a headache.", "I have head-pain."],
        ["s039", "Mijn keel doet pijn.", "My throat hurts.", "My throat does pain."],
        ["s040", "Moet ik dit medicijn elke dag innemen?", "Do I have to take this medicine every day?", "Must I this medicine every day in-take?", ["modal", "separable", "inversion"]],
        ["s041", "Ik ben allergisch voor noten.", "I am allergic to nuts.", "I am allergic for nuts."],
        ["s042", "De apotheek is naast de supermarkt.", "The pharmacy is next to the supermarket.", "The pharmacy is next-to the supermarket.", ["de/het"]],
        ["s043", "Bel de huisartsenpost als het erger wordt.", "Call the out-of-hours GP service if it gets worse.", "Call the house-doctors-post when it worse becomes.", ["subordinate"]],
      ]),

    unit("werk", "Werk", "Colleagues, meetings and asking people to slow down.", "A1",
      "Separable verbs split in a main clause: *uitleggen* becomes *Ik leg het uit*. The prefix waits at the end of the sentence.",
      [
        ["s044", "Ik werk bij een technisch bedrijf.", "I work at a technical company.", "I work at a technical company."],
        ["s045", "Ik begin om negen uur.", "I start at nine o'clock.", "I begin at nine hour.", ["time"]],
        ["s046", "Mijn collega's zijn vriendelijk.", "My colleagues are friendly."],
        ["s047", "We hebben elke maandag een overleg.", "We have a meeting every Monday.", "We have every Monday a meeting.", ["inversion", "time"]],
        ["s048", "Ik werk vandaag thuis.", "I am working from home today.", "I work today home.", ["time"]],
        ["s049", "Kunt u dat in het Nederlands uitleggen?", "Can you explain that in Dutch?", "Can you that in the Dutch out-lay?", ["modal", "separable", "formal"]],
        ["s050", "Ik heb een vraag over het project.", "I have a question about the project.", "I have a question over the project.", ["de/het"]],
        ["s051", "De deadline is volgende week vrijdag.", "The deadline is next Friday.", "The deadline is next week Friday.", ["time"]],
      ]),

    unit("vervoer", "Vervoer", "Trains, bikes, delays and the words that show direction.", "A1",
      "The prefix carries the direction: *instappen*, *uitstappen*, *overstappen* — in, out, over.",
      [
        ["s052", "Ik ga met de fiets naar het station.", "I go to the station by bike.", "I go with the bike to the station.", ["de/het"]],
        ["s053", "De trein naar Rotterdam is vertraagd.", "The train to Rotterdam is delayed."],
        ["s054", "Waar is de tramhalte?", "Where is the tram stop?", "Where is the tram-stop?", ["question", "de/het"]],
        ["s055", "Ik moet overstappen in Leiden.", "I have to change trains in Leiden.", "I must over-step in Leiden.", ["modal", "separable"]],
        ["s056", "Hoe lang duurt de reis?", "How long does the journey take?", "How long lasts the journey?", ["question", "de/het"]],
        ["s057", "Mag ik hier parkeren?", "May I park here?", "May I here park?", ["modal", "inversion"]],
        ["s058", "De bus komt over vijf minuten.", "The bus arrives in five minutes.", "The bus comes over five minutes.", ["time"]],
        ["s059", "Ik heb een ov-chipkaart nodig.", "I need an OV chip card.", "I have an OV-chip-card necessary.", ["modal"]],
      ]),

    unit("familie", "Familie", "Who is who, and how to talk about them.", "A1",
      "Possessives: *mijn, jouw, zijn, haar*. Then choose *onze* with de-words and *ons* with het-words.",
      [
        ["s060", "Ik ben getrouwd.", "I am married."],
        ["s061", "We hebben twee kinderen.", "We have two children."],
        ["s062", "Mijn broer woont in Amsterdam.", "My brother lives in Amsterdam."],
        ["s063", "Mijn ouders komen volgende maand op bezoek.", "My parents are visiting next month.", "My parents come next month on visit.", ["time", "separable"]],
        ["s064", "Hoe oud is je dochter?", "How old is your daughter?", "How old is your daughter?", ["question"]],
        ["s065", "We eten samen met de familie.", "We eat together with the family.", "We eat together with the family.", ["de/het"]],
        ["s066", "Zij is de zus van mijn vrouw.", "She is my wife's sister.", "She is the sister of my wife.", ["de/het"]],
        ["s067", "Ik bel mijn moeder elke zondag.", "I call my mother every Sunday.", "I call my mother every Sunday.", ["time"]],
      ]),

    unit("eten", "Eten", "Cafés, restaurants and the bill.", "A1",
      "After a modal the second verb goes to the end: *Kunnen we buiten zitten?* — not *Kunnen we zitten buiten?*",
      [
        ["s068", "Ik wil graag een kop koffie.", "I would like a cup of coffee.", "I want gladly a cup coffee.", ["modal"]],
        ["s069", "Wat is het dagmenu?", "What is the menu of the day?", "What is the day-menu?", ["question", "de/het"]],
        ["s070", "De rekening, alstublieft.", "The bill, please.", "The bill, please.", ["de/het"]],
        ["s071", "Ik eet geen vlees.", "I don't eat meat.", "I eat no meat.", ["negation"]],
        ["s072", "Het eten is heerlijk.", "The food is delicious.", "The food is delicious.", ["de/het"]],
        ["s073", "Kunnen we buiten zitten?", "Can we sit outside?", "Can we outside sit?", ["modal", "inversion", "question"]],
        ["s074", "Ik maak vanavond pasta.", "I am making pasta tonight.", "I make tonight pasta.", ["time"]],
        ["s075", "Wil je nog iets drinken?", "Would you like something to drink?", "Want you still something drink?", ["modal", "question"]],
      ]),

    unit("tijd", "Tijd en weer", "Telling the time, the weather, and planning ahead.", "A1",
      "Dutch time is offset by half an hour: *half acht* is 7:30, not 8:30. *Kwart voor acht* is 7:45.",
      [
        ["s076", "Het is vandaag koud en nat.", "It is cold and wet today.", "It is today cold and wet.", ["time"]],
        ["s077", "Morgen wordt het zonnig.", "It will be sunny tomorrow.", "Tomorrow becomes it sunny.", ["inversion", "time"]],
        ["s078", "Ik ben om half acht thuis.", "I am home at half past seven.", "I am at half eight home.", ["time"]],
        ["s079", "Het regent al de hele dag.", "It has been raining all day.", "It rains already the whole day.", ["time"]],
        ["s080", "Volgende week heb ik vakantie.", "Next week I have holidays.", "Next week have I holiday.", ["inversion", "time"]],
        ["s081", "De zomer is hier kort.", "The summer is short here.", "The summer is here short.", ["de/het"]],
        ["s082", "Het waait hard vandaag.", "It is very windy today.", "It blows hard today.", ["time"]],
        ["s083", "Ik ga vanavond vroeg slapen.", "I am going to bed early tonight.", "I go tonight early sleep.", ["time"]],
      ]),

    unit("taal", "Taal leren", "Talking about learning Dutch — the sentences you need in class.", "A1",
      "For requests, the modal leads the question: *Kunt u langzamer praten?* — the verb you change is the one that moves.",
      [
        ["s084", "Ik volg een cursus Nederlands.", "I am taking a Dutch course.", "I follow a course Dutch."],
        ["s085", "De les begint om zeven uur.", "The lesson starts at seven o'clock.", "The lesson begins at seven hour.", ["time", "de/het"]],
        ["s086", "Ik maak elke dag mijn huiswerk.", "I do my homework every day.", "I make every day my house-work.", ["time"]],
        ["s087", "Ik oefen elke dag een beetje Nederlands.", "I practise a little Dutch every day.", "I practise every day a little Dutch.", ["time"]],
        ["s088", "Kunt u langzamer praten?", "Could you speak more slowly?", "Can you slower talk?", ["modal", "formal", "inversion"]],
        ["s089", "Ik moet nog veel woorden leren.", "I still have to learn many words.", "I must yet many words learn.", ["modal"]],
      ]),

    unit("knm", "Hoe het hier werkt", "KNM: the unwritten rules of Dutch daily life.", "A2",
      "Directness is not rudeness. *Nee* is a complete answer, and an appointment is how almost everything gets done.",
      [
        ["s090", "Je moet je fiets op slot zetten.", "You must lock your bike.", "You must your bike on lock set.", ["modal"]],
        ["s091", "Nederlanders maken vaak een afspraak.", "Dutch people often make an appointment."],
        ["s092", "Op zondag zijn veel winkels dicht.", "On Sundays many shops are closed.", "On Sunday are many shops closed.", ["inversion", "time"]],
        ["s093", "Je mag hier niet roken.", "You are not allowed to smoke here.", "You may here not smoke.", ["negation", "modal"]],
        ["s094", "Wij scheiden thuis ons afval.", "We separate our waste at home.", "We separate at-home our waste.", ["separable"]],
        ["s095", "Je moet op tijd komen.", "You must arrive on time.", "You must on time come.", ["modal"]],
        ["s096", "De gemeente regelt veel zaken.", "The municipality handles many matters.", "The municipality arranges many matters.", ["de/het"]],
        ["s097", "Als je op bezoek gaat, breng je bloemen mee.", "When you visit someone, you bring flowers.", "When you on visit go, bring you flowers with.", ["subordinate", "separable"]],
      ]),

    unit("bellen", "Bellen en afspraken", "Phone calls, moving appointments, and being understood.", "A2",
      "On the phone you announce yourself: *Met Anna* when you answer, *U spreekt met …* when you call.",
      [
        ["s098", "Met Anna.", "Anna speaking.", "With Anna.", ["telefoon"]],
        ["s099", "U spreekt met de huisartsenpraktijk.", "You are speaking with the GP practice.", "You speak with the doctor-practice.", ["telefoon", "formal"]],
        ["s100", "Kan ik een afspraak maken voor morgen?", "Can I make an appointment for tomorrow?", "Can I an appointment make for tomorrow?", ["telefoon", "modal"]],
        ["s101", "Ik bel later terug.", "I will call back later.", "I call later back.", ["separable", "telefoon"]],
        ["s102", "Kunt u mij doorverbinden?", "Could you put me through?", "Can you me through-connect?", ["separable", "formal", "telefoon"]],
        ["s103", "Ik heb een afspraak om drie uur.", "I have an appointment at three o'clock.", "I have an appointment at three hour.", ["time"]],
        ["s104", "Kunt u dat per e-mail sturen?", "Could you send that by email?", "Can you that by e-mail send?", ["modal", "formal"]],
        ["s105", "Sorry, ik heb me vergist.", "Sorry, I made a mistake.", "Sorry, I have myself mistaken.", ["participle"]],
      ]),

    unit("vrijetijd", "Vrije tijd", "Making plans, and the very Dutch *zin hebben in*.", "A1",
      "*Zin hebben in* is how you say you feel like something: *Ik heb zin in koffie* — literally \"I have sense in coffee\".",
      [
        ["s106", "Ik heb zin in koffie.", "I feel like a coffee.", "I have sense in coffee."],
        ["s107", "Wat doe je in het weekend?", "What do you do at the weekend?", "What do you in the weekend?", ["question"]],
        ["s108", "Ik ga vaak wandelen in het park.", "I often go for a walk in the park.", "I go often walking in the park.", ["de/het"]],
        ["s109", "We gaan zaterdag naar de film.", "We are going to the cinema on Saturday.", "We go Saturday to the film.", ["time"]],
        ["s110", "Heb je zin om mee te gaan?", "Do you feel like coming along?", "Have you sense for with to go?", ["question"]],
        ["s111", "Ik speel graag voetbal.", "I like playing football.", "I play gladly football."],
        ["s112", "Zullen we samen koken?", "Shall we cook together?", "Shall we together cook?", ["question"]],
        ["s113", "Het is te druk vandaag.", "It is too busy today.", "It is too busy today.", ["time"]],
      ]),

    unit("klachten", "Klachten", "When something is wrong and you need it fixed.", "A2",
      "A Dutch complaint states the problem, then the request: *Dit werkt niet — kunt u dat oplossen?*",
      [
        ["s114", "Sorry, maar dit werkt niet.", "Sorry, but this is not working."],
        ["s115", "Er is iets mis met de verwarming.", "There is something wrong with the heating.", "There is something wrong with the heating."],
        ["s116", "Ik wil een klacht indienen.", "I want to file a complaint.", "I want a complaint in-serve.", ["separable"]],
        ["s117", "Kunt u dat oplossen?", "Can you solve that?", "Can you that solve?", ["modal", "formal"]],
        ["s118", "Ik heb al drie keer gebeld.", "I have already called three times.", "I have already three times called.", ["participle", "time"]],
        ["s119", "Het geld is nog niet terug.", "The money has not come back yet.", "The money is yet not back.", ["negation"]],
        ["s120", "Dat klopt niet.", "That is not right.", "That is-correct not.", ["negation"]],
        ["s121", "Ik wacht nog op een antwoord.", "I am still waiting for an answer.", "I wait still on an answer."],
      ]),
  ],

  stories: [
    {
      id: "gemeente-balie",
      title: "Bij de gemeente",
      situation: "You are registering at the town hall with an appointment.",
      lines: [
        { speaker: "Ambtenaar", text: "Goedemorgen, waarmee kan ik u helpen?", translation: "Good morning, what can I help you with?" },
        { speaker: "Jij", text: "Ik wil me inschrijven bij de gemeente.", translation: "I want to register with the municipality." },
        { speaker: "Ambtenaar", text: "Heeft u een afspraak?", translation: "Do you have an appointment?" },
        { speaker: "Jij", text: "Ja, om tien uur.", translation: "Yes, at ten o'clock." },
        { speaker: "Ambtenaar", text: "Mag ik uw paspoort en huurcontract zien?", translation: "May I see your passport and rental contract?" },
        { speaker: "Jij", text: "Alstublieft, hier is alles.", translation: "Here you are, that is everything." },
        { speaker: "Ambtenaar", text: "Dank u. Over vijf werkdagen krijgt u bericht.", translation: "Thank you. You will hear from us within five working days." },
      ],
    },
    {
      id: "huisarts",
      title: "Bij de huisarts",
      situation: "You are ill and the assistant gives you an appointment the same day.",
      lines: [
        { speaker: "Jij", text: "Ik voel me niet lekker. Ik heb hoofdpijn en koorts.", translation: "I don't feel well. I have a headache and a fever." },
        { speaker: "Dokter", text: "Hoe lang heeft u al klachten?", translation: "How long have you had these symptoms?" },
        { speaker: "Jij", text: "Sinds maandag.", translation: "Since Monday." },
        { speaker: "Dokter", text: "Ik schrijf u een recept. Neem twee keer per dag een tablet.", translation: "I will write you a prescription. Take one tablet twice a day." },
        { speaker: "Jij", text: "Moet ik nog terugkomen?", translation: "Do I need to come back?" },
        { speaker: "Dokter", text: "Als het over een week niet beter is, belt u mij.", translation: "If it is not better in a week, call me." },
      ],
    },
    {
      id: "markt",
      title: "Op de markt",
      situation: "Saturday market: prices are shouted, cards are accepted.",
      lines: [
        { speaker: "Marktkoopman", text: "Mooie appels vandaag! Een kilo voor twee euro.", translation: "Lovely apples today! A kilo for two euros." },
        { speaker: "Jij", text: "Dat is goedkoop. Ik neem een kilo.", translation: "That is cheap. I'll take a kilo." },
        { speaker: "Marktkoopman", text: "Nog iets anders?", translation: "Anything else?" },
        { speaker: "Jij", text: "Nee, dank u. Kan ik pinnen?", translation: "No, thank you. Can I pay by card?" },
        { speaker: "Marktkoopman", text: "Ja hoor, dat kan.", translation: "Sure, that's possible." },
      ],
    },
  ],
};
