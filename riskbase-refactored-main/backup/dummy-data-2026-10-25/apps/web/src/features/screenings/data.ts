import type { CellReview, ProspectAssessment, TemplateScreenings } from "./types"

// ─── Mock data ───────────────────────────────────────────────────────────────

export const TEMPLATE_SCREENINGS: Record<string, TemplateScreenings> = {
  "1": {
    id: "1",
    name: "Miljø Screener",
    categories: [
      {
        id: "cat-1",
        name: "Forurening & jordbund",
        fields: [
          { id: "f-1", name: "Forureningsstatus", weight: 0.80, isDealbreakerField: true, extractionPrompt: "Find oplysninger om forureningskortlægning og prøvetagning.", gapInstruction: "Mangler forureningsstatus/afklaring af jord- eller arealforurening." },
          { id: "f-2", name: "Jordbunds­forhold", weight: 0.55, isDealbreakerField: false, extractionPrompt: "Find oplysninger om jordbundsundersøgelser og funderingsforhold.", gapInstruction: "Mangler jordbundsrapport eller funderings­dokumentation." },
          { id: "f-3", name: "Oprensning & afværge", weight: 0.60, isDealbreakerField: true, extractionPrompt: "Find oplysninger om omfang og type af oprensning.", gapInstruction: "Mangler information om oprensningsbehov." },
          { id: "f-4", name: "Omkostninger miljø", weight: 0.45, isDealbreakerField: false, extractionPrompt: "Find estimater for omkostninger til miljøoprensning.", gapInstruction: "" },
          { id: "f-5", name: "Prøvetagning & data", weight: 0.30, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
        ],
      },
      {
        id: "cat-2",
        name: "Støj & vibrationer",
        fields: [
          { id: "f-6", name: "Støj jernbane", weight: 0.75, isDealbreakerField: true, extractionPrompt: "Find støjkortlægning for jernbane og grænseværdier.", gapInstruction: "Mangler dokumentation for jernbanestøj." },
          { id: "f-7", name: "Støj vej", weight: 0.70, isDealbreakerField: true, extractionPrompt: "Find vejstøjkortlægning og grænseværdier.", gapInstruction: "Mangler vejstøj-dokumentation." },
          { id: "f-8", name: "Vibrationer", weight: 0.45, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
          { id: "f-9", name: "Afhjælpning støj", weight: 0.40, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
        ],
      },
      {
        id: "cat-3",
        name: "Klimatilpasning & regnvand",
        fields: [
          { id: "f-10", name: "Oversvømmelsesrisiko", weight: 0.70, isDealbreakerField: true, extractionPrompt: "", gapInstruction: "" },
          { id: "f-11", name: "Regnvandshandtering", weight: 0.60, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
          { id: "f-12", name: "Klimatilpasnings­plan", weight: 0.50, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
          { id: "f-13", name: "Blå-grønne løsninger", weight: 0.40, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
        ],
      },
      {
        id: "cat-4",
        name: "Bæredygtighed & materialer",
        fields: [
          { id: "f-14", name: "Miljøcertificering", weight: 0.60, isDealbreakerField: true, extractionPrompt: "", gapInstruction: "" },
          { id: "f-15", name: "CO2 & livscyklus", weight: 0.55, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
          { id: "f-16", name: "Genanvendelse", weight: 0.45, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
          { id: "f-17", name: "Farlige materialer", weight: 0.50, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
        ],
      },
      {
        id: "cat-5",
        name: "Natur & biodiversitet",
        fields: [
          { id: "f-18", name: "Beskyttede naturtyper", weight: 0.45, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
          { id: "f-19", name: "Arter & habitater", weight: 0.35, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
          { id: "f-20", name: "Grønne korridorer", weight: 0.30, isDealbreakerField: false, extractionPrompt: "", gapInstruction: "" },
        ],
      },
    ],
    screenings: [
      {
        id: "1",
        projectId: "1",
        project: "Strommen 3A",
        status: "Review",
        screenedAt: "2 Jun 2026, 09:45",
        files: ["Strommen_3A_miljorapport.pdf", "Geoteknisk_rapport_2024.pdf"],
        maut: 0.38,
        results: {
          "f-1": { score: -2, confidence: 92, extractedContent: "Kortlægning V2 fra 2023 bekræfter kraftig PAH- og tungmetalforurening i 0–0,5 m dybde. Alle 12 prøvepunkter overskrider klasse 4-grænser.", isGap: false },
          "f-2": { score: -1, confidence: 78, extractedContent: "Geoteknisk rapport mangler opdaterede boringer vest for byggefeltet. Eksisterende data er fra 2009.", isGap: false },
          "f-3": { score: -2, confidence: 88, extractedContent: "Oprensning er estimeret til 18.000 m³ forurenet jord. Afværgeforanstaltning med kapsel vurderes nødvendig.", isGap: false },
          "f-4": { score: -1, confidence: 65, extractedContent: "Foreløbig budgetramme på kr. 42 mio. for oprensning. Endelig pris afventer licitation.", isGap: false },
          "f-5": { score: 0, confidence: 55, extractedContent: "", isGap: true },
          "f-6": { score: -2, confidence: 90, extractedContent: "Jernbanestøj overstiger Miljøstyrelsens vejledende grænseværdi på 64 dB(A) med op til 6 dB ved 3 ejendomme.", isGap: false },
          "f-7": { score: -1, confidence: 82, extractedContent: "Vejstøj fra Strandvejen er 62 dB(A) ved facaden. Kræver facadeisolering iht. planloven.", isGap: false },
          "f-8": { score: 0, confidence: 70, extractedContent: "Vibrationsmålinger ikke udført. Togvibrationsniveauer estimeret til Lv 75 dB, under grænse.", isGap: false },
          "f-9": { score: -1, confidence: 60, extractedContent: "", isGap: true },
          "f-10": { score: 0, confidence: 75, extractedContent: "Området ligger i lavtliggende zone men er ikke KFMA-kortlagt som særlig oversvømmelsesrisikozone.", isGap: false },
          "f-11": { score: 1, confidence: 80, extractedContent: "LAR-løsning med forsinkelsesbassin dimensioneret til 10-årsregn dokumenteret i VVM.", isGap: false },
          "f-12": { score: 0, confidence: 65, extractedContent: "Klimatilpasningsplan er nævnt i kommuneplan 2024 men ikke specifik for projektgrunden.", isGap: false },
          "f-13": { score: 0, confidence: 58, extractedContent: "", isGap: true },
          "f-14": { score: -1, confidence: 72, extractedContent: "DGNB Gold er målsat men ikke kontraktuelt forpligtet. Certificering er ikke påbegyndt.", isGap: false },
          "f-15": { score: 0, confidence: 68, extractedContent: "LCA ikke udført. CO2-mål på 8 kg/m²/år nævnt som ambition i bæredygtighedsstrategi.", isGap: false },
          "f-16": { score: 0, confidence: 62, extractedContent: "Genanvendelse af tegl fra nedrivning planlagt til 40%. Dokumentation mangler.", isGap: false },
          "f-17": { score: -1, confidence: 85, extractedContent: "Asbest fundet i eksisterende kælderetage. Sanering estimeret til kr. 1,2 mio.", isGap: false },
          "f-18": { score: 0, confidence: 75, extractedContent: "Ingen beskyttede naturtyper inden for 50 m. Artssøgning udført med negativt fund.", isGap: false },
          "f-19": { score: 1, confidence: 78, extractedContent: "Ingen rødlistede arter registreret. Flagermusekartlægning viste 2 fourageringsarter.", isGap: false },
          "f-20": { score: 0, confidence: 60, extractedContent: "Grøn korridor langs Strandvejen bevares iht. lokalplan.", isGap: false },
        },
      },
      {
        id: "3",
        projectId: "2",
        project: "Gartnerbyen – Rødovre",
        status: "In progress",
        screenedAt: "28 Jan 2025, 10:00",
        files: ["Gartnerbyen_VVM_2025.pdf"],
        maut: 0.54,
        results: {
          "f-1": { score: -1, confidence: 84, extractedContent: "Kortlægning V1 påvist. Restforurening med oliekulbrinter i afgrænset volumen på ca. 500 m³.", isGap: false },
          "f-2": { score: 0, confidence: 82, extractedContent: "Jordbundsforhold acceptable. Geoteknisk rapport 2024 viser ler/sand til 8 m.", isGap: false },
          "f-3": { score: -1, confidence: 76, extractedContent: "Restforurening håndteres med monitering frem for aktiv oprensning. Godkendt af kommunen.", isGap: false },
          "f-4": { score: 0, confidence: 70, extractedContent: "Overvågningsprogram koster kr. 120.000/år. Engangsomkostning til monitering kr. 800.000.", isGap: false },
          "f-5": { score: 1, confidence: 80, extractedContent: "14 prøvepunkter dokumenteret i fase 2 rapport. Godt datagrundlag.", isGap: false },
          "f-6": { score: -1, confidence: 79, extractedContent: "Jernbanestøj på 62 dB(A). Marginalt under grænsen, men støjskærm anbefales mod vest.", isGap: false },
          "f-7": { score: 0, confidence: 83, extractedContent: "Vejstøj fra Rødovrevej er 59 dB(A) ved facade. Inden for grænseværdi.", isGap: false },
          "f-8": { score: 0, confidence: 72, extractedContent: "Vibrationsmålinger udført. Lv 68 dB målt, under grænse på 75 dB.", isGap: false },
          "f-9": { score: 1, confidence: 75, extractedContent: "Støjskærm 3 m langs jernbane godkendt af Banedanmark. Effekt 4–6 dB.", isGap: false },
          "f-10": { score: 1, confidence: 85, extractedContent: "Området er ikke i KFMA-risikozone. Terræn ligger 3,2 m over HHV.", isGap: false },
          "f-11": { score: 1, confidence: 80, extractedContent: "Regnvandshåndtering via grøft og lokal nedsivning dimensioneret til 100-årsregn.", isGap: false },
          "f-12": { score: 1, confidence: 75, extractedContent: "Klimatilpasningsplan integreret i lokalplan. Grønne tage som standard.", isGap: false },
          "f-13": { score: 0, confidence: 65, extractedContent: "Blå-grønt element planlagt i form af regnbed men ikke dimensioneret.", isGap: false },
          "f-14": { score: 0, confidence: 78, extractedContent: "DGNB Silver overvejes. Ingen formel certificeringsaftale endnu.", isGap: false },
          "f-15": { score: 1, confidence: 74, extractedContent: "LCA udført. CO2-aftryk beregnet til 9,2 kg CO2e/m²/år inkl. drift.", isGap: false },
          "f-16": { score: 1, confidence: 70, extractedContent: "55% genanvendelse planlagt. Aftale med genanvendelsesvirksomhed indgået.", isGap: false },
          "f-17": { score: 0, confidence: 88, extractedContent: "Asbest- og PCB-screening udført. Ingen fund over grænseværdi.", isGap: false },
          "f-18": { score: 1, confidence: 80, extractedContent: "§3-beskyttet overdrev grænser op til projektområde men berøres ikke.", isGap: false },
          "f-19": { score: 0, confidence: 72, extractedContent: "Artssøgning viser markfirben i randzone. Kompenserende tiltag planlagt.", isGap: false },
          "f-20": { score: 1, confidence: 78, extractedContent: "Grøn korridor mod nord bevares og styrkes med 800 m² ny beplantning.", isGap: false },
        },
      },
      {
        id: "6",
        projectId: "3",
        project: "Christiansvej – Glostrup",
        status: "Completed",
        screenedAt: "3 Feb 2025, 11:30",
        files: ["Christiansvej_miljoredegoerelse.pdf", "Notat_geoteknik_2025.pdf", "LAR_rapport.pdf"],
        maut: 0.65,
        results: {
          "f-1": { score: 0, confidence: 90, extractedContent: "Ingen kortlægning. V0-kortlægning er gennemgået og viser ingen historisk industriaktivitet.", isGap: false },
          "f-2": { score: 1, confidence: 92, extractedContent: "Geoteknisk rapport 2024 viser stabilt sandslet ler til 15 m. Egnet til direkte fundering.", isGap: false },
          "f-3": { score: 0, confidence: 80, extractedContent: "Ingen oprensning nødvendig. Grunden er ren iht. historisk kortlægning.", isGap: false },
          "f-4": { score: 1, confidence: 88, extractedContent: "Miljøomkostninger estimeret til kr. 0 (ren grund). Beskeden moniteringsplan.", isGap: false },
          "f-5": { score: 1, confidence: 85, extractedContent: "20 prøvepunkter analyseret. Komplet datasæt foreligger.", isGap: false },
          "f-6": { score: 0, confidence: 87, extractedContent: "Jernbanestøj 58 dB(A). Under grænseværdi. Ingen afhjælpning nødvendig.", isGap: false },
          "f-7": { score: 0, confidence: 89, extractedContent: "Vejstøj 55 dB(A) ved facaden. Ingen overskridelse.", isGap: false },
          "f-8": { score: 1, confidence: 82, extractedContent: "Vibrationsniveau på Lv 62 dB, godt under grænsen. Ingen risiko.", isGap: false },
          "f-9": { score: 1, confidence: 78, extractedContent: "Ingen afhjælpning nødvendig. Eksisterende støjskærm mod jernbane er tilstrækkelig.", isGap: false },
          "f-10": { score: 1, confidence: 90, extractedContent: "Terræn 4,8 m over HHV. Oversvømmelsesrisiko er negligibel.", isGap: false },
          "f-11": { score: 2, confidence: 94, extractedContent: "LAR-løsning med grøft og nedsivning fuldt dimensioneret til skybrud (100-årsregn). Kommunegodkendt.", isGap: false },
          "f-12": { score: 1, confidence: 85, extractedContent: "Detaljeret klimatilpasningsplan udarbejdet og godkendt af kommunen.", isGap: false },
          "f-13": { score: 1, confidence: 80, extractedContent: "Regnbed og grøn tagterrasse integreret i projekt. Opfylder krav til blå-grøn faktor.", isGap: false },
          "f-14": { score: 1, confidence: 88, extractedContent: "DGNB Gold certificering kontraktuelt aftalt. Certificeringsrådgiver engageret.", isGap: false },
          "f-15": { score: 1, confidence: 84, extractedContent: "LCA udført iht. EN 15978. CO2-aftryk på 7,8 kg/m²/år. Under NCC's internt mål.", isGap: false },
          "f-16": { score: 1, confidence: 80, extractedContent: "Genanvendelsesgrad på 65% for nedrivningsmaterialer dokumenteret.", isGap: false },
          "f-17": { score: 1, confidence: 92, extractedContent: "PCB/asbest screening: ingen fund. Bygningen er opført efter 1990.", isGap: false },
          "f-18": { score: 1, confidence: 82, extractedContent: "Ingen §3-natur inden for 100 m. Renset og afgrænset i Natur- og Miljødatabasen.", isGap: false },
          "f-19": { score: 1, confidence: 78, extractedContent: "Artssøgning negativ. Ingen rødlistede eller beskyttede arter registreret.", isGap: false },
          "f-20": { score: 1, confidence: 80, extractedContent: "Grøn korridor styrket med 1.200 m² ny skov i naboområde som kompensation.", isGap: false },
        },
      },
      {
        id: "7",
        projectId: "4",
        project: "Kærmindevej – Glostrup",
        status: "Draft",
        screenedAt: "25 Feb 2025, 10:00",
        files: ["Kaermindevej_foreloebig_vurdering.pdf"],
        maut: 0.21,
        results: {
          "f-1": { score: -2, confidence: 91, extractedContent: "Kraftig V2-forurening med chlorerede opløsningsmidler (TCE). NIRAS rapport 2024: 8 ud af 10 prøver over grænseværdi.", isGap: false },
          "f-2": { score: -2, confidence: 75, extractedContent: "Blød tørveholdig aflejring i 2–5 m dybde. Pælefundering påkrævet. Øger risiko og cost.", isGap: false },
          "f-3": { score: -2, confidence: 86, extractedContent: "Oprensning estimeret til 25 år med aktiv pumping og behandling. Afværge udelukker delvis byggeaktivitet.", isGap: false },
          "f-4": { score: -2, confidence: 70, extractedContent: "Oprensningsbudget kr. 78–120 mio. afhængigt af afværgestrategi. Usikkerhed ±40%.", isGap: false },
          "f-5": { score: -1, confidence: 45, extractedContent: "", isGap: true },
          "f-6": { score: -2, confidence: 88, extractedContent: "Jernbanestøj 71 dB(A) ved facade. Overskrider grænseværdien med 7 dB. Ingen kosteffektiv afhjælpning identificeret.", isGap: false },
          "f-7": { score: -2, confidence: 85, extractedContent: "Vejstøj fra Motorring 3: 69 dB(A). Kræver tunge facadeløsninger. Balkonophold ikke muligt.", isGap: false },
          "f-8": { score: -1, confidence: 68, extractedContent: "", isGap: true },
          "f-9": { score: -1, confidence: 50, extractedContent: "", isGap: true },
          "f-10": { score: -1, confidence: 78, extractedContent: "Lavtliggende terræn. Historisk oversvømmelse registreret i 2014 og 2020.", isGap: false },
          "f-11": { score: -1, confidence: 72, extractedContent: "Eksisterende kloaknet har utilstrækkelig kapacitet. Separation påkrævet.", isGap: false },
          "f-12": { score: 0, confidence: 60, extractedContent: "Klimatilpasningsplan under udarbejdelse. Ingen vedtaget plan foreligger.", isGap: false },
          "f-13": { score: 0, confidence: 55, extractedContent: "", isGap: true },
          "f-14": { score: -2, confidence: 80, extractedContent: "DGNB-mål ikke fastsat. Bæredygtighedsstrategi mangler. Certificering ikke realistisk med nuværende budget.", isGap: false },
          "f-15": { score: -1, confidence: 65, extractedContent: "LCA ikke udført. Estimat viser CO2-aftryk over 13 kg/m²/år pga. pælefundering.", isGap: false },
          "f-16": { score: -1, confidence: 58, extractedContent: "Genanvendelse ikke planlagt. Nedrivningsmateriale deponeres.", isGap: false },
          "f-17": { score: -1, confidence: 84, extractedContent: "PCB fundet i fugemasse fra 1978. Sanering estimeret kr. 3,5 mio.", isGap: false },
          "f-18": { score: 0, confidence: 70, extractedContent: "Ingen §3-natur kortlagt inden for 200 m.", isGap: false },
          "f-19": { score: -1, confidence: 62, extractedContent: "Flagermusekartlægning viser 4 arter inkl. stor vanflagermus (bilag IV). Kræver konsekvensvurdering.", isGap: false },
          "f-20": { score: 0, confidence: 65, extractedContent: "Grøn korridor afbrudt af eksisterende byggeri. Ingen plan for genetablering.", isGap: false },
        },
      },
    ],
  },
}

// Mock-only: attach a source citation to every non-gap result — the most relevant of the
// screening's files by topic, quoting the finding's first sentence on page 2–4.
const TOPIC_FILES: Record<string, string[]> = {
  "cat-1": ["miljo", "forurening", "geotek"],
  "cat-2": ["stoej", "støj", "vvm", "trafik"],
  "cat-3": ["lar", "vvm", "klima", "lokalplan"],
  "cat-4": ["miljo", "vvm", "udbud", "lokalplan"],
  "cat-5": ["miljo", "vvm", "lokalplan"],
}
const FIELD_FILES: Record<string, string[]> = { "f-2": ["geotek"], "f-5": ["miljo", "forurening"] }

for (const template of Object.values(TEMPLATE_SCREENINGS)) {
  const categoryOf = Object.fromEntries(template.categories.flatMap((c) => c.fields.map((f) => [f.id, c.id])))
  for (const screening of template.screenings) {
    for (const [fieldId, result] of Object.entries(screening.results)) {
      if (result.isGap || !result.extractedContent || screening.files.length === 0) continue
      const keywords = FIELD_FILES[fieldId] ?? TOPIC_FILES[categoryOf[fieldId]!] ?? []
      const file =
        screening.files.find((f) => keywords.some((k) => f.toLowerCase().includes(k))) ?? screening.files[0]!
      const fieldNumber = Number(fieldId.replace(/\D/g, ""))
      result.sources = [
        {
          documentName: file,
          page: (fieldNumber % 3) + 2,
          // First sentence; abbreviations like "kr. 42" or "iht. planloven" don't end one.
          quote: result.extractedContent.split(/(?<=[\p{Ll}\d)]\.)\s+(?=\p{Lu})/u)[0]!,
        },
      ]
    }
  }
}

const REVIEWER = "Alfred Steensen"

function accepted(score: CellReview["score"], reviewedAt: string, rationale = ""): CellReview {
  return { status: "accepted", score, rationale, reviewer: REVIEWER, reviewedAt }
}

/** Seeded human reviews, keyed by screening id → field id. */
export const SEED_REVIEWS: Record<string, Record<string, CellReview>> = {
  // Strømmen 3A — review under way: one override and one follow-up on an information gap.
  "1": {
    "f-1": accepted(-2, "3 Jun 2026, 10:02", "Bekræftet i miljørapportens prøveskema, s. 9."),
    "f-2": accepted(-1, "3 Jun 2026, 10:06"),
    "f-3": accepted(-2, "3 Jun 2026, 10:09"),
    "f-4": accepted(-1, "3 Jun 2026, 10:12"),
    "f-5": {
      status: "follow_up",
      score: 0,
      rationale: "Prøvetagningsdata mangler i det modtagne materiale. Anmoder miljørådgiver om fase 2-rapport.",
      reviewer: REVIEWER,
      reviewedAt: "3 Jun 2026, 10:15",
    },
    "f-6": accepted(-2, "3 Jun 2026, 10:20"),
    "f-7": {
      status: "overridden",
      score: -2,
      rationale:
        "Facadeisolering løser ikke støj på udendørs opholdsarealer, som lokalplanen stiller krav om. Vurderes som kritisk frem for moderat.",
      reviewer: REVIEWER,
      reviewedAt: "3 Jun 2026, 10:24",
    },
  },
  // Gartnerbyen — just started.
  "3": {
    "f-1": accepted(-1, "29 Jan 2025, 08:30"),
    "f-2": accepted(0, "29 Jan 2025, 08:34"),
  },
  // Christiansvej — fully reviewed (filled in below).
  "6": {},
}

const christiansvej = TEMPLATE_SCREENINGS["1"]!.screenings.find((s) => s.id === "6")!
for (const [fieldId, result] of Object.entries(christiansvej.results)) {
  SEED_REVIEWS["6"]![fieldId] = accepted(result.score, "4 Feb 2025, 14:00")
}

/** Seeded prospect assessments, keyed by screening id. */
export const SEED_ASSESSMENTS: Record<string, ProspectAssessment> = {
  "6": {
    status: "final",
    conclusion:
      "Christiansvej fremstår som et robust prospect. Grunden er ren uden behov for oprensning, og geoteknikken muliggør direkte fundering. Støj ligger under grænseværdierne, og LAR-løsningen er dimensioneret til skybrud og kommunegodkendt. Der er ingen dealbreakers, og alle kriterier er gennemgået mod kildematerialet. Anbefales videreført til tilbudsfase.",
    recommendation: "go",
    author: REVIEWER,
    updatedAt: "5 Feb 2025, 09:30",
  },
  "1": {
    status: "draft",
    conclusion: "Kraftig PAH-forurening og jernbanestøj over grænseværdi er foreløbig de afgørende risici.",
    recommendation: null,
    author: REVIEWER,
    updatedAt: "3 Jun 2026, 10:30",
  },
}
