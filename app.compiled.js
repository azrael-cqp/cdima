const {
  useState,
  useEffect,
  useRef
} = React;

/* ═══════════════════════════════════════════════════
   SISTEM ANTRENAMENT — CRISTI · Lower/Upper 4 zile · forta + recompozitie
   ═══════════════════════════════════════════════════ */

/* ─── SCARA DE FONTURI (totul mare, pentru citit fara ochelari) ─── */
const F = {
  xs: 16,
  sm: 18,
  md: 21,
  lg: 24,
  xl: 28,
  xxl: 34,
  huge: 46
};

/* ─── STOCARE INDEXEDDB ─── */
const DB_NAME = "AntrenamentCristi_DB";
const STORE = "gamedata";
const DATA_KEY = "save";
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveToIDB(data) {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, DATA_KEY);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  } catch (e) {
    console.error("Salvare esuata", e);
    return false;
  }
}
async function loadFromIDB() {
  try {
    const db = await openDB();
    return new Promise(res => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(DATA_KEY);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
  } catch (e) {
    return null;
  }
}
const SAVE_FIELDS = ["level", "xp", "stats", "done", "doneEx", "doneW", "totalXp", "qC", "streak", "weightLog", "muscleXp", "lastDailyReset", "lastWeeklyReset", "penaltyLog", "liftLog", "vacation", "sleepLog", "workoutCalendar", "exerciseSwaps", "targetWeight", "startDate", "v2"];
const DEFAULT_STATE = {
  level: 1,
  xp: 0,
  stats: {
    STR: 5,
    VIT: 3,
    AGI: 3,
    INT: 2,
    PER: 2
  },
  done: [],
  doneEx: [],
  doneW: [],
  totalXp: 0,
  qC: 0,
  streak: 0,
  weightLog: [],
  muscleXp: {
    piept: 0,
    spate: 0,
    umeri: 0,
    biceps: 0,
    triceps: 0,
    cvadriceps: 0,
    ischio: 0,
    fesieri: 0,
    gambe: 0,
    abdomen: 0,
    cardio: 0
  },
  lastDailyReset: null,
  lastWeeklyReset: null,
  penaltyLog: [],
  liftLog: {},
  vacation: false,
  sleepLog: [],
  workoutCalendar: {},
  exerciseSwaps: {},
  targetWeight: null,
  startDate: null,
  v2: true
};

/* ─── RANGURI ─── */
const RANKS = [{
  name: "RANG E",
  min: 1,
  max: 5,
  color: "#94a3b8",
  desc: "Inceput. Fiecare zi conteaza."
}, {
  name: "RANG D",
  min: 6,
  max: 15,
  color: "#22d3ee",
  desc: "Corpul incepe sa se obisnuiasca."
}, {
  name: "RANG C",
  min: 16,
  max: 30,
  color: "#34d399",
  desc: "Obiceiul e format. Se vede."
}, {
  name: "RANG B",
  min: 31,
  max: 50,
  color: "#a78bfa",
  desc: "Mai puternic si mai usor."
}, {
  name: "RANG A",
  min: 51,
  max: 75,
  color: "#f59e0b",
  desc: "Alt om fata de ziua 1."
}, {
  name: "RANG S",
  min: 76,
  max: 100,
  color: "#ef4444",
  desc: "Disciplina de fier."
}, {
  name: "LEGENDA",
  min: 101,
  max: 999,
  color: "#ec4899",
  desc: "Nimic nu te mai opreste."
}];
function getRank(l) {
  for (let i = RANKS.length - 1; i >= 0; i--) if (l >= RANKS[i].min) return RANKS[i];
  return RANKS[0];
}
function getXp(l) {
  return Math.floor(100 * Math.pow(1.15, l - 1));
}
function getRankMultiplier(level) {
  if (level >= 101) return 4.0;
  if (level >= 76) return 3.0;
  if (level >= 51) return 2.5;
  if (level >= 31) return 2.0;
  if (level >= 16) return 1.5;
  if (level >= 6) return 1.2;
  return 1.0;
}
function getStreakMultiplier(streak) {
  if (streak >= 90) return 3.0;
  if (streak >= 30) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
}

/* ─── RANGURI PE GRUPA MUSCULARA ─── */
const MUSCLE_RANKS = [{
  name: "BRONZ",
  min: 0,
  color: "#d97706"
}, {
  name: "ARGINT",
  min: 30,
  color: "#cbd5e1"
}, {
  name: "AUR",
  min: 75,
  color: "#fbbf24"
}, {
  name: "PLATINA",
  min: 150,
  color: "#22d3ee"
}, {
  name: "DIAMANT",
  min: 250,
  color: "#a78bfa"
}, {
  name: "MAESTRU",
  min: 400,
  color: "#f472b6"
}, {
  name: "LEGENDA",
  min: 600,
  color: "#ef4444"
}];
function getMuscleRank(xp) {
  for (let i = MUSCLE_RANKS.length - 1; i >= 0; i--) if (xp >= MUSCLE_RANKS[i].min) return MUSCLE_RANKS[i];
  return MUSCLE_RANKS[0];
}
function getNextMuscleRank(xp) {
  for (let i = 0; i < MUSCLE_RANKS.length; i++) if (xp < MUSCLE_RANKS[i].min) return MUSCLE_RANKS[i];
  return null;
}
const MUSCLE_GROUPS = [{
  key: "piept",
  name: "Piept",
  icon: "🫁"
}, {
  key: "spate",
  name: "Spate",
  icon: "🔙"
}, {
  key: "umeri",
  name: "Umeri",
  icon: "🔺"
}, {
  key: "biceps",
  name: "Biceps",
  icon: "💪"
}, {
  key: "triceps",
  name: "Triceps",
  icon: "🔱"
}, {
  key: "cvadriceps",
  name: "Cvadriceps",
  icon: "🦵"
}, {
  key: "ischio",
  name: "Ischiogambieri",
  icon: "🦿"
}, {
  key: "fesieri",
  name: "Fesieri",
  icon: "🍑"
}, {
  key: "abdomen",
  name: "Abdomen",
  icon: "🔥"
}, {
  key: "cardio",
  name: "Inima / Cardio",
  icon: "🫀"
}];

/* ─── ZILE ─── */
const DOW_RO = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
const DOW_SHORT = ["D", "L", "Ma", "Mi", "J", "V", "S"];

/* ─── SUNETE ─── */
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur, vol, wave) => {
      const o = ctx.createOscillator();
      const gg = ctx.createGain();
      o.connect(gg);
      gg.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = wave || "sine";
      gg.gain.setValueAtTime(0, ctx.currentTime + start);
      gg.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.04);
      gg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };
    if (type === "bifa") beep(800, 0, 0.2, 0.15);else if (type === "gata") {
      [523, 659, 784].forEach((f, i) => beep(f, i * 0.09, 0.5, 0.13, "triangle"));
    } else if (type === "intarziat") {
      [600, 400].forEach((f, i) => beep(f, i * 0.16, 0.15, 0.11, "square"));
    } else if (type === "nivel") {
      [261, 329, 392, 523].forEach((f, i) => beep(f, i * 0.11, 0.45, 0.15, "triangle"));
    }
  } catch (e) {
    console.warn("Audio indisponibil", e);
  }
}
/* ═══════════════════════════════════════════════════
   PROGRAM LOWER / UPPER — Cristi, 51 de ani, 183 cm, 92 kg,
   24 % grasime, 45 kg muschi scheletic. Obiectiv: forta +
   hipertrofie, recompozitie (grasime de pe trunchi). 4 zile
   (Luni inferior, Marti superior, Joi inferior, Vineri
   superior). Fara gambe, abdomen doar la inferior, nimic
   deasupra capului. 60-70 de minute.
   ═══════════════════════════════════════════════════ */

const REGULI = [
  "Incalzire OBLIGATORIE: 5 minute bicicleta de aer + 2-3 serii progresive la primul exercitiu (bara goala, 50 %, 75 %). La 51 de ani incalzirea e cea mai ieftina asigurare impotriva accidentarilor. Niciodata direct la greutatea de lucru.",
  "Izolare: opreste setul cand mai poti face 1-2 repetari corecte. Compuse (genuflexiuni, indreptari, press-uri, hack squat): te opresti cu 2-3 repetari in rezerva. NICIODATA pana la esec la indreptari si genuflexiuni.",
  "Pauzele sunt parte din antrenament: 3 minute la genuflexiuni, indreptari si press-uri grele, 2-2,5 minute la celelalte compuse, 60-90 de secunde la izolare si abdomen. Nu le scurta - fara ele nu lucrezi forta, lucrezi oboseala.",
  "Nu tine respiratia pe durata setului. Inspiri la coborare, expiri cand impingi sau tragi. La genuflexiuni si indreptari: aer in burta inainte de repetare, il scoti la final.",
  "Tempo: 1-2 secunde la efort, 2-3 secunde la revenire. Fara smucituri, fara balans din corp.",
  "Progresie dubla: cand faci numarul MAXIM de repetari la TOATE seturile, urci greutatea cu pasul exercitiului (butonul +). Daca nu faci minimul la ultima serie, scazi 5 %. Kilogramele pe bara sunt motorul programului.",
  "Primele 2 saptamani: greutati la care raman 3 repetari in rezerva, ca sa gasesti greutatile de lucru si sa inveti miscarile noi (indreptari, hack squat, tractiuni). Progresia reala incepe din saptamana 3.",
  "Deload o saptamana la fiecare 6 saptamani: jumatate din serii, aceleasi greutati. Refacerea dupa 50 de ani e mai lenta si saptamana usoara previne accidentarile.",
  "Umerii se protejeaza, nu se incarca: nimic deasupra capului, nimic dupa ceafa, priza neutra unde se poate, coatele aproape de corp la press si triceps, pec deck fara coatele in spatele corpului.",
  "Durere ascutita in articulatie sau in zona lombara = oprire imediata. Arsura si oboseala in muschi = normal si dorit.",
  "Recompozitie, nu slabire agresiva: 2300-2400 kcal pe zi (deficit mic de 300-400 fata de mentinere). Proteina 150-170 g pe zi, la fiecare masa. Ritmul corect: 0,3-0,5 kg pe saptamana. Cantarul coboara lent - progresul se vede la procentul de grasime, in talie si la greutatile de pe bara.",
  "Mers alert 30-40 de minute miercuri si in weekend (sau 15-20 de minute pe banda dupa zilele de superior). Optional si nepenalizat, dar e cea mai buna arma pentru grasimea viscerala si talie. Niciodata dupa picioare.",
  "Somn 7-8 ore. Muschiul creste cand dormi, nu cand ridici - si fara somn grasimea de pe burta nu pleaca."
];
const STOP_SEMNE = ["Durere sau apasare in piept", "Ameteala, vedere in ceata, greata", "Respiratie foarte grea care nu se linisteste", "Batai neregulate ale inimii", "Durere ascutita in articulatie sau in zona lombara"];
const PPL = {
  "1": {
    "day": "Luni",
    "type": "INFERIOR",
    "short": "PICIOARE · GENUFLEXIUNE · ABDOMEN",
    "color": "#22c55e",
    "icon": "🟢",
    "nota": "Prima zi de picioare, accent pe genuflexiune. Pauze de 3 minute la genuflexiuni - nu e lene, e parte din antrenamentul de forta. Opreste-te cu 2-3 repetari in rezerva: maine ai indreptari si spatele jos trebuie sa fie proaspat.",
    "exercises": [
      {
        "name": "Bicicleta de aer 5 minute",
        "sets": "1 serie × 5 minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "stat": "VIT",
        "repsOnly": true,
        "cardio": true,
        "cum": "PRIMUL lucru la sala. 5 minute in ritm usor spre mediu, bratele si picioarele lucreaza impreuna. Ultimul minut putin mai tare. Dupa ea, 2-3 serii de incalzire la primul exercitiu: bara goala, apoi 50 %, apoi 75 % din greutatea de lucru.",
        "lucreaza": "Inima, circulatia si temperatura muschilor. Pregateste umerii, genunchii si spatele pentru greutati.",
        "atentie": "Nu e antrenament de cardio - nu te epuiza aici. Daca termini bicicleta obosit, ai mers prea tare.",
        "usor": "3 minute daca esti grabit, dar niciodata zero. La 51 de ani incalzirea e cea mai ieftina asigurare impotriva accidentarilor."
      },
      {
        "name": "Genuflexiuni la aparatul Smith",
        "sets": "4 seturi × 5-8 repetari",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps",
          "fesieri",
          "abdomen"
        ],
        "rest": 180,
        "inc": 5,
        "cum": "Bara pe trapez (nu pe gat), picioarele la latimea umerilor si cu 10-15 cm in fata barei, varfurile usor in afara. Deblochezi bara, tragi aer in burta, abdomenul strans, cobori lent impingand genunchii in directia varfurilor pana coapsele sunt paralele cu podeaua. Impingi prin toata talpa in sus, fara sa blochezi genunchii. Expiri sus.",
        "lucreaza": "Cvadricepsul si fesierii, plus ischiogambierii si trunchiul. Cel mai important exercitiu de forta pentru picioare.",
        "atentie": "Genunchii NU intra spre interior. Calcaiele raman pe podea. Spatele drept, pieptul sus. Sigurantele aparatului puse la nivelul de jos. Niciodata pana la esec - cu 2-3 repetari in rezerva.",
        "usor": "Primele 2 saptamani: bara goala a aparatului, 8 repetari lente, forma perfecta. Apoi adaugi 5 kg pe saptamana cat timp forma ramane curata. Daca genunchii deranjeaza, nu cobori sub paralel."
      },
      {
        "name": "Presa de picioare",
        "sets": "3 seturi × 10-12 repetari",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 120,
        "inc": 10,
        "cum": "Talpile pe platforma la latimea umerilor, la mijloc. Cobori lent pana genunchii fac 90 de grade sau putin mai mult, fara ca bazinul sa se ridice de pe spatar. Impingi inapoi pana aproape de intindere, NU blochezi genunchii.",
        "lucreaza": "Cvadricepsul si fesierii, cu spatele protejat de spatar.",
        "atentie": "Bazinul lipit de spatar - daca se ridica, cobori prea mult. Genunchii in directia varfurilor. Nu bloca niciodata genunchii sus.",
        "usor": "Greutate mai mica, 12 repetari lente. Talpile mai sus pe platforma muta efortul pe fesieri si ia presiunea de pe genunchi."
      },
      {
        "name": "Flexii femurali sezand la aparat",
        "sets": "3 seturi × 10-12 repetari",
        "muscle": "Ischiogambieri",
        "groups": [
          "ischio"
        ],
        "rest": 75,
        "inc": 2.5,
        "cum": "Sezand, perna deasupra calcaielor, coapsele fixate de perna de sus. Indoi genunchii tragand calcaiele sub scaun cat de mult poti, strangi o secunda, revii lent in 3 secunde.",
        "lucreaza": "Ischiogambierii izolat - echilibreaza cvadricepsul si protejeaza genunchiul.",
        "atentie": "Spatele lipit de spatar, nu te apleci in fata ca sa tragi. Fara smucitura la inceputul miscarii.",
        "usor": "Greutate mica, 12 repetari foarte controlate, cu coborare lenta."
      },
      {
        "name": "Extensii de genunchi la aparat",
        "sets": "3 seturi × 12-15 repetari",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps"
        ],
        "rest": 75,
        "inc": 2.5,
        "cum": "Sezand, spatele lipit, perna deasupra gleznelor. Intinzi picioarele complet, strangi cvadricepsul o secunda sus, cobori lent, 3 secunde.",
        "lucreaza": "Cvadricepsul izolat, mai ales partea de deasupra genunchiului.",
        "atentie": "Fara smucitura la inceput si fara lasat greutatea sa cada. Nu ridica fundul de pe scaun.",
        "usor": "Greutate mica, 15 repetari, pauza de o secunda sus la fiecare."
      },
      {
        "name": "Crunch la aparat",
        "sets": "3 seturi × 12-15 repetari",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "inc": 2.5,
        "finisher": true,
        "cum": "Sezand la aparatul de abdomen, spatele pe spatar, pernele pe piept sau manerele in maini, talpile fixate. Rulezi trunchiul in fata si in jos ca si cum ai vrea sa apropii coastele de bazin, strangi abdomenul 1 secunda jos, revii lent in 2-3 secunde fara sa lasi greutatea sa cada.",
        "lucreaza": "Abdomenul drept, pe toata lungimea, cu greutate progresiva - singurul mod in care abdomenul creste ca orice alt muschi.",
        "atentie": "Miscarea vine din rotunjirea trunchiului, nu din tras cu bratele sau din indoit soldurile. Nu smuci. Expiri cand cobori, inspiri cand revii.",
        "usor": "Greutate la care faci 15 repetari curate. Urci cu 2,5-5 kg cand faci 15 la toate seriile. Daca sala nu are aparat: crunch la cablu, in genunchi, cu franghia la ceafa."
      },
      {
        "name": "Presa Pallof la cablu",
        "sets": "3 seturi × 12 repetari pe parte",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "inc": 1,
        "finisher": true,
        "cum": "Cablul la nivelul pieptului, stai lateral fata de aparat, manerul tinut cu ambele maini la piept, picioarele la latimea umerilor. Intinzi bratele in fata, drept, si tii 2 secunde fara sa lasi cablul sa te roteasca. Revii la piept lent. Termini o parte, apoi te intorci cu cealalta.",
        "lucreaza": "Abdomenul lateral (oblicii) si abdomenul profund, ca anti-rotatie - exact muschii care tin coloana stabila la indreptari.",
        "atentie": "Trunchiul nu se roteste si nu se apleaca deloc. Fesele stranse, genunchii usor indoiti. Greutate mica - aici controlul conteaza, nu kilogramele.",
        "usor": "Mai aproape de aparat pentru mai putina tensiune. Daca nu ai cablu liber: plank lateral, 3 × 30 secunde pe parte."
      }
    ]
  },
  "2": {
    "day": "Marti",
    "type": "SUPERIOR",
    "short": "INDREPTARI · PIEPT · SPATE · TRICEPS",
    "color": "#ef4444",
    "icon": "🔴",
    "nota": "Prima zi de partea superioara, cu indreptarile la inceput, cand esti odihnit. Incalzirea la indreptari e obligatorie: 3 serii progresive inainte de greutatea de lucru. Fara nici un exercitiu deasupra capului - umerii se protejeaza, nu se incarca.",
    "exercises": [
      {
        "name": "Bicicleta de aer 5 minute",
        "sets": "1 serie × 5 minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "stat": "VIT",
        "repsOnly": true,
        "cardio": true,
        "cum": "PRIMUL lucru la sala. 5 minute in ritm usor spre mediu, bratele si picioarele lucreaza impreuna. Ultimul minut putin mai tare. Dupa ea, 2-3 serii de incalzire la primul exercitiu: bara goala, apoi 50 %, apoi 75 % din greutatea de lucru.",
        "lucreaza": "Inima, circulatia si temperatura muschilor. Pregateste umerii, genunchii si spatele pentru greutati.",
        "atentie": "Nu e antrenament de cardio - nu te epuiza aici. Daca termini bicicleta obosit, ai mers prea tare.",
        "usor": "3 minute daca esti grabit, dar niciodata zero. La 51 de ani incalzirea e cea mai ieftina asigurare impotriva accidentarilor."
      },
      {
        "name": "Indreptari cu bara",
        "sets": "4 seturi × 4-6 repetari",
        "muscle": "Ischiogambieri",
        "groups": [
          "ischio",
          "fesieri",
          "spate",
          "cvadriceps"
        ],
        "rest": 180,
        "inc": 5,
        "cum": "Bara pe podea, picioarele la latimea soldurilor, tibia aproape de bara. Cobori din solduri si genunchi, priza la latimea umerilor, pieptul sus, spatele drept, bratele intinse. Tragi aer in burta si impingi podeaua cu picioarele pana stai drept, strangand fesele sus. Cobori controlat, bara jos complet intre repetari. Daca sala are trap bar (bara hexagonala), o folosesti - e mai prietenoasa cu spatele.",
        "lucreaza": "Tot lantul posterior: ischiogambieri, fesieri, lombari, trapez, antebrate, plus cvadricepsul. Cel mai puternic exercitiu de forta din program.",
        "atentie": "Spatele drept de la inceput pana la final - daca se rotunjeste, opresti seria. Nu smuci bara de pe podea, impingi podeaua. Nu te lasa pe spate sus. NICIODATA pana la esec: te opresti cu 2-3 repetari in rezerva.",
        "usor": "Primele 2 saptamani: 40-60 kg, 6 repetari lente, concentrat pe spatele drept. Apoi adaugi 5 kg pe saptamana cat timp forma ramane curata. Daca lombarul e obosit dupa genuflexiunile de luni, scazi 10 % in ziua aia."
      },
      {
        "name": "Presa inclinata la aparatul Smith",
        "sets": "4 seturi × 5-8 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 180,
        "inc": 2.5,
        "cum": "Banca la 30 de grade (inclinare MICA), sub bara aparatului Smith. Omoplatii stransi si lipiti de banca, talpile pe podea. Bara la nivelul partii de sus a pieptului. Cobori lent, 2-3 secunde, coatele la 45 de grade fata de corp, pana bara atinge usor pieptul. Impingi in sus fara sa blochezi coatele. Expiri cand impingi.",
        "lucreaza": "Partea de sus a pieptului, tricepsul si umarul din fata.",
        "atentie": "Nu ridica banca peste 30 de grade - devine exercitiu de umeri si pune presiune pe articulatie. Coatele NU ies larg la 90 de grade. Omoplatii raman stransi tot setul. Sigurantele aparatului puse.",
        "usor": "Greutate la care faci 8 repetari curate. Daca umarul intepa, cobori doar pana bara e la 5 cm de piept si micsorezi inclinarea la 15 grade."
      },
      {
        "name": "Tractiuni la helcometru, priza neutra",
        "sets": "3 seturi × 8-10 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 120,
        "inc": 2.5,
        "cum": "Sezand, genunchii fixati sub perne. Manerele paralele (priza neutra, palmele fata in fata), la latimea umerilor. Te lasi putin pe spate, tragi manerele spre partea de sus a pieptului coborand coatele spre podea si strangand omoplatii. Lasi lent sus, pana bratele sunt aproape intinse si simti intinderea in lat.",
        "lucreaza": "Latul (latimea spatelui), mijlocul spatelui si bicepsul. Priza neutra e cea mai sigura pentru umeri.",
        "atentie": "Miscarea vine din coate, nu din maini. Nu te legana ca sa tragi. Nu trage niciodata in spatele cefei.",
        "usor": "Greutate la care faci 10 repetari curate. Daca nu are maner cu priza neutra, priza supinata (palmele spre tine), la latimea umerilor."
      },
      {
        "name": "Fluturari la aparat (Pec Deck)",
        "sets": "3 seturi × 10-12 repetari",
        "muscle": "Piept",
        "groups": [
          "piept"
        ],
        "rest": 75,
        "inc": 2.5,
        "cum": "Sezand, spatele lipit de spatar, manerele reglate la nivelul pieptului, coatele usor indoite si fixate asa. Aduci manerele in fata pieptului ca o imbratisare, strangi pieptul o secunda, revii lent in 2-3 secunde pana bratele ajung in linie cu umerii - NU mai in spate.",
        "lucreaza": "Pieptul izolat, cu tensiune constanta pe tot parcursul.",
        "atentie": "Coatele nu se duc in spatele corpului - acolo apare presiunea pe umar. Amplitudinea se opreste cand bratele sunt in linie cu trunchiul. Fara smucituri, fara greutate mare.",
        "usor": "Greutate mica, 12 repetari. Aici cauti senzatia in muschi, nu greutatea. Daca umarul deranjeaza, amplitudine si mai mica."
      },
      {
        "name": "Face pull la cablu",
        "sets": "3 seturi × 15 repetari",
        "muscle": "Umeri",
        "groups": [
          "umeri",
          "spate"
        ],
        "rest": 60,
        "inc": 1,
        "cum": "Cablul la nivelul fetei, cu franghia. Tragi franghia spre fata, desfacand mainile pe langa urechi, coatele sus si in spate. Strangi omoplatii o secunda, revii lent.",
        "lucreaza": "Partea din spate a umarului si muschii dintre omoplati - cei care te tin drept si care protejeaza umarul la presa.",
        "atentie": "Coatele raman la nivelul umerilor. Nu te lasa pe spate ca sa tragi. Greutate mica si control, aici nu se face forta.",
        "usor": "Cel mai important exercitiu de sanatate a umarului din tot programul. Greutate mica, 15 repetari curate, fiecare set."
      },
      {
        "name": "Extensii de triceps la cablu",
        "sets": "3 seturi × 10-12 repetari",
        "muscle": "Triceps",
        "groups": [
          "triceps"
        ],
        "rest": 75,
        "inc": 2.5,
        "cum": "La cablul de sus, cu franghia. Coatele lipite de corp si fixe. Impingi in jos pana intinzi complet bratele si desfaci franghia la final, strangi tricepsul o secunda, revii lent.",
        "lucreaza": "Tricepsul - partea din spate a bratului, doua treimi din grosimea lui.",
        "atentie": "Coatele nu se misca inainte si inapoi si nu se departeaza de corp. Nu te apleca peste cablu si nu impingi cu umerii.",
        "usor": "Greutate mica, 12 repetari, concentrat pe strangerea de jos."
      }
    ]
  },
  "3": {
    "day": "Miercuri",
    "type": "ODIHNA",
    "short": "PAUZA DE MIJLOC",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera in mijlocul saptamanii. Muschii cresc acum, nu la sala. Proteina, somn si, daca vrei, 30-40 de minute de mers alert - e cea mai buna arma pentru grasimea de pe trunchi. Fara penalizari.",
    "exercises": []
  },
  "4": {
    "day": "Joi",
    "type": "INFERIOR",
    "short": "FESIERI · CVADRICEPS · ABDOMEN",
    "color": "#a78bfa",
    "icon": "🟣",
    "nota": "A doua zi de picioare, spatele sprijinit la ambele compuse: hip thrust si hack squat. Lombarii se odihnesc, picioarele si fesierii lucreaza greu. Fara indreptari romanesti - hinge-ul greu a fost marti.",
    "exercises": [
      {
        "name": "Bicicleta de aer 5 minute",
        "sets": "1 serie × 5 minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "stat": "VIT",
        "repsOnly": true,
        "cardio": true,
        "cum": "PRIMUL lucru la sala. 5 minute in ritm usor spre mediu, bratele si picioarele lucreaza impreuna. Ultimul minut putin mai tare. Dupa ea, 2-3 serii de incalzire la primul exercitiu: bara goala, apoi 50 %, apoi 75 % din greutatea de lucru.",
        "lucreaza": "Inima, circulatia si temperatura muschilor. Pregateste umerii, genunchii si spatele pentru greutati.",
        "atentie": "Nu e antrenament de cardio - nu te epuiza aici. Daca termini bicicleta obosit, ai mers prea tare.",
        "usor": "3 minute daca esti grabit, dar niciodata zero. La 51 de ani incalzirea e cea mai ieftina asigurare impotriva accidentarilor."
      },
      {
        "name": "Hip thrust la aparat",
        "sets": "4 seturi × 8-10 repetari",
        "muscle": "Fesieri",
        "groups": [
          "fesieri",
          "ischio"
        ],
        "rest": 120,
        "inc": 10,
        "cum": "Spatele sprijinit pe pernita aparatului la nivelul omoplatilor, centura sau perna peste solduri, talpile pe platforma la latimea umerilor. Impingi prin calcaie si ridici bazinul pana corpul e in linie dreapta de la genunchi la umeri, strangi fesele tare 1-2 secunde sus. Cobori lent.",
        "lucreaza": "Fesierii - cel mai direct exercitiu pentru ei - plus ischiogambierii.",
        "atentie": "Sus, barbia in piept si privirea inainte, nu arcui salele. Genunchii la 90 de grade in pozitia de sus. Nu impinge cu lombarul, impinge cu fesele.",
        "usor": "Greutate la care faci 10 repetari cu strangere clara sus. Daca sala nu are aparat: hip thrust cu bara pe banca, cu perna de protectie."
      },
      {
        "name": "Hack squat la aparat",
        "sets": "3 seturi × 8-10 repetari",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 150,
        "inc": 5,
        "cum": "Spatele si umerii lipiti de pernite, picioarele la mijlocul platformei, la latimea umerilor, varfurile usor in afara. Deblochezi, cobori lent in 2-3 secunde pana coapsa trece putin sub paralel, genunchii in directia varfurilor. Impingi prin toata talpa in sus, fara sa blochezi genunchii.",
        "lucreaza": "Cvadricepsul (toate cele 4 capete) in principal, fesierii si adductorii secundar. Spatele e complet sprijinit - lombarii nu lucreaza.",
        "atentie": "Genunchii nu intra spre interior. Calcaiele raman pe platforma. Nu bloca genunchii sus. Sigurantele puse.",
        "usor": "Greutate la care faci 10 repetari curate. Daca il doare genunchiul la coborare adanca: picioarele mai sus pe platforma (muta efortul pe fesieri si ia presiunea de pe genunchi) si nu cobori sub paralel."
      },
      {
        "name": "Extensii de genunchi la o pierna",
        "sets": "3 seturi × 12-15 repetari pe picior",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps"
        ],
        "rest": 75,
        "inc": 2.5,
        "cum": "Sezand, spatele lipit, perna deasupra gleznei, un singur picior. Intinzi piciorul complet, strangi cvadricepsul o secunda sus, cobori lent in 3 secunde. Termini un picior, apoi schimbi.",
        "lucreaza": "Cvadricepsul izolat, un picior odata - corecteaza diferentele stanga-dreapta.",
        "atentie": "Fara smucitura si fara lasat greutatea sa cada. Nu ridica fundul de pe scaun. Aceeasi greutate si aceleasi repetari pe ambele picioare.",
        "usor": "Greutate mica, 15 repetari, pauza de o secunda sus la fiecare."
      },
      {
        "name": "Flexii femurali sezand la aparat",
        "sets": "3 seturi × 12-15 repetari",
        "muscle": "Ischiogambieri",
        "groups": [
          "ischio"
        ],
        "rest": 75,
        "inc": 2.5,
        "cum": "Sezand, perna deasupra calcaielor, coapsele fixate de perna de sus. Indoi genunchii tragand calcaiele sub scaun cat de mult poti, strangi o secunda, revii lent.",
        "lucreaza": "Ischiogambierii, cu repetari mai multe decat luni - azi e volum, nu forta.",
        "atentie": "Spatele lipit de spatar, nu te apleci in fata ca sa tragi. Fara smucitura.",
        "usor": "Greutate mica, 15 repetari foarte controlate."
      },
      {
        "name": "Crunch la aparat",
        "sets": "3 seturi × 12-15 repetari",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "inc": 2.5,
        "finisher": true,
        "cum": "Sezand la aparatul de abdomen, spatele pe spatar, pernele pe piept sau manerele in maini, talpile fixate. Rulezi trunchiul in fata si in jos ca si cum ai vrea sa apropii coastele de bazin, strangi abdomenul 1 secunda jos, revii lent in 2-3 secunde fara sa lasi greutatea sa cada.",
        "lucreaza": "Abdomenul drept, pe toata lungimea, cu greutate progresiva - singurul mod in care abdomenul creste ca orice alt muschi.",
        "atentie": "Miscarea vine din rotunjirea trunchiului, nu din tras cu bratele sau din indoit soldurile. Nu smuci. Expiri cand cobori, inspiri cand revii.",
        "usor": "Greutate la care faci 15 repetari curate. Urci cu 2,5-5 kg cand faci 15 la toate seriile. Daca sala nu are aparat: crunch la cablu, in genunchi, cu franghia la ceafa."
      },
      {
        "name": "Plank",
        "sets": "3 seturi × 45-60 secunde",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "repsOnly": true,
        "finisher": true,
        "cum": "Sprijin pe antebrate si pe varfuri. Corpul in linie dreapta de la cap la calcaie. Strangi abdomenul si fesele tot timpul, ca si cum te-ar lovi cineva in burta. Respiri normal. Tinta: 60 de secunde pe serie.",
        "lucreaza": "Abdomenul profund si zona lombara - stabilitatea de care ai nevoie la genuflexiuni si indreptari.",
        "atentie": "Fara fund ridicat si fara sale lasate. Cand salele incep sa cada, opresti seria.",
        "usor": "Daca nu ajungi la 45 de secunde, 3 serii de 30 si cresti cate 5 secunde pe saptamana. Cand 60 de secunde devin usoare, pui un disc pe spate."
      }
    ]
  },
  "5": {
    "day": "Vineri",
    "type": "SUPERIOR",
    "short": "TRAGERE · PIEPT PLAT · BICEPS",
    "color": "#3b82f6",
    "icon": "🔵",
    "nota": "A doua zi de partea superioara, accent pe tragere: tractiuni, helcometru, ramat. Spatele puternic inseamna postura dreapta si umeri protejati. Dupa ziua asta ai doua zile libere - da tot, cu forma curata.",
    "exercises": [
      {
        "name": "Bicicleta de aer 5 minute",
        "sets": "1 serie × 5 minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "stat": "VIT",
        "repsOnly": true,
        "cardio": true,
        "cum": "PRIMUL lucru la sala. 5 minute in ritm usor spre mediu, bratele si picioarele lucreaza impreuna. Ultimul minut putin mai tare. Dupa ea, 2-3 serii de incalzire la primul exercitiu: bara goala, apoi 50 %, apoi 75 % din greutatea de lucru.",
        "lucreaza": "Inima, circulatia si temperatura muschilor. Pregateste umerii, genunchii si spatele pentru greutati.",
        "atentie": "Nu e antrenament de cardio - nu te epuiza aici. Daca termini bicicleta obosit, ai mers prea tare.",
        "usor": "3 minute daca esti grabit, dar niciodata zero. La 51 de ani incalzirea e cea mai ieftina asigurare impotriva accidentarilor."
      },
      {
        "name": "Presa cu gantere pe banca dreapta, priza neutra",
        "sets": "4 seturi × 6-10 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 180,
        "inc": 2.5,
        "cum": "Culcat pe banca, talpile ferm pe podea, omoplatii stransi si lipiti de banca. Ganterele deasupra pieptului cu palmele fata in fata (priza neutra), bratele intinse. Cobori lent, 2-3 secunde, pana ganterele ajung la nivelul pieptului, coatele la 45 de grade fata de corp. Impingi in sus si aduci usor ganterele spre interior la final. Expiri cand impingi.",
        "lucreaza": "Pieptul in principal, plus tricepsul si umarul din fata. Priza neutra ia presiunea de pe articulatia umarului.",
        "atentie": "Nu lasa coatele sa iasa larg, la 90 de grade - obosesc umerii. Omoplatii raman stransi tot setul. Nu ridica fundul de pe banca. Nu cobori ganterele sub nivelul pieptului.",
        "usor": "Gantere cu 2-4 kg mai usoare decat crezi, 10 repetari curate. Daca umarul deranjeaza, banca usor inclinata la 15 grade."
      },
      {
        "name": "Tractiuni asistate la aparat",
        "sets": "4 seturi × 6-10 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 150,
        "inc": 2.5,
        "cum": "La aparatul de tractiuni asistate (gravitron): genunchii pe platforma, mainile pe manerele cu priza neutra (palmele fata in fata) sau pronata la latimea umerilor. Pornesti din brate intinse, tragi coatele in jos si spre spate pana barbia ajunge la nivelul manerelor. Cobori lent, 3 secunde, pana la intindere completa.",
        "lucreaza": "Latul, mijlocul spatelui, bicepsul si antebratele. Cel mai complet exercitiu de tragere verticala.",
        "atentie": "Fara balans si fara impins din genunchi pe platforma. Bratele se intind complet jos. Umerii coborati, nu ridicati spre urechi.",
        "usor": "Alegi o asistenta la care faci 8 repetari curate. Aici progresia e INVERS: cand faci 10 la toate seturile, scazi asistenta cu 2,5 kg (noteaza in aplicatie greutatea de asistenta). Cand ajungi la 0, treci la tractiuni libere. Daca sala nu are aparat asistat: helcometru priza neutra apropiata, 4 × 6-10."
      },
      {
        "name": "Tractiuni la helcometru, priza larga",
        "sets": "3 seturi × 8-10 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 120,
        "inc": 2.5,
        "cum": "Sezand, genunchii fixati sub perne. Priza pronata, mai larga decat umerii. Te lasi putin pe spate, tragi bara spre partea de sus a pieptului coborand coatele spre podea si strangand omoplatii. Lasi bara sus lent, pana bratele sunt aproape intinse.",
        "lucreaza": "Latul, mai ales partea de sus care da latimea spatelui.",
        "atentie": "Miscarea vine din coate, nu din maini. Nu te legana. NU trage bara in spatele cefei - niciodata. Nu mai larg decat te lasa umarul fara disconfort.",
        "usor": "Greutate la care faci 10 repetari curate. Daca umarul deranjeaza la priza larga, strangi priza la putin peste latimea umerilor."
      },
      {
        "name": "Ramat sezand la aparat",
        "sets": "3 seturi × 10-12 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 90,
        "inc": 2.5,
        "cum": "Sezand, pieptul sprijinit pe pernita (daca aparatul are), manerele in priza neutra. Tragi manerele spre abdomen, coatele pe langa corp, strangi omoplatii o secunda, revii lent pana bratele sunt intinse si simti intinderea in spate.",
        "lucreaza": "Mijlocul spatelui, romboizii, latul si bicepsul. Tragerea orizontala care tine umerii trasi in spate.",
        "atentie": "Trunchiul nu se leagana inainte-inapoi. Tragi cu coatele, nu cu mainile. Umerii coborati.",
        "usor": "Greutate la care faci 12 repetari cu strangere clara a omoplatilor."
      },
      {
        "name": "Fluturari inverse la aparat (deltoizi posteriori)",
        "sets": "3 seturi × 15 repetari",
        "muscle": "Umeri",
        "groups": [
          "umeri",
          "spate"
        ],
        "rest": 60,
        "inc": 2.5,
        "cum": "La pec deck, intors cu pieptul spre spatar, manerele reglate in fata, bratele intinse cu coatele usor indoite. Desfaci bratele in lateral si in spate pana sunt in linie cu umerii, strangi omoplatii o secunda, revii lent.",
        "lucreaza": "Partea din spate a umarului si muschii dintre omoplati - echilibreaza press-urile si protejeaza umarul.",
        "atentie": "Bratele raman la nivelul umerilor, nu mai sus. Nu te lasa in fata ca sa tragi. Greutate mica.",
        "usor": "Greutate mica, 15 repetari curate. Alternativa: fluturari inverse cu gantere, aplecat cu pieptul pe banca inclinata."
      },
      {
        "name": "Flexii la banca Scott (curl predicator la aparat)",
        "sets": "3 seturi × 8-12 repetari",
        "muscle": "Biceps",
        "groups": [
          "biceps"
        ],
        "rest": 75,
        "inc": 1,
        "cum": "Sezand la aparat, bratele pe perna inclinata, axilele lipite de marginea de sus a pernei. Ridici manerele pana la nivelul umerilor, strangi bicepsul o secunda sus, cobori lent in 3 secunde pana aproape de intindere completa.",
        "lucreaza": "Bicepsul, izolat complet - perna elimina orice balans.",
        "atentie": "Nu intinzi complet coatele jos cu greutate mare - lasa 10 grade. Bratele lipite de perna tot setul. Fara smucituri.",
        "usor": "Greutate la care faci 12 repetari curate. Urci cu 1 kg cand faci 12 la toate seturile."
      }
    ]
  },
  "6": {
    "day": "Sambata",
    "type": "ODIHNA",
    "short": "ZI LIBERA",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera. Fara sala, fara penalizari. Odihna e parte din program - acum cresc muschii lucrati toata saptamana. Mersul alert de 30-40 de minute e binevenit.",
    "exercises": []
  },
  "0": {
    "day": "Duminica",
    "type": "ODIHNA",
    "short": "ZI LIBERA",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera. Mancare buna, proteina la fiecare masa, somn si maine o luam de la capat cu greutati mai mari.",
    "exercises": []
  }
};

/* ─── VARIANTE (cand aparatul e ocupat sau ceva doare) ─── */
const ALT = {
  "Bicicleta de aer 5 minute": [
    "Bicicleta stationara 5 minute",
    "Mers pe banda 5 minute, inclinatie 3 %",
    "Vaslit 5 minute usor"
  ],
  "Genuflexiuni la aparatul Smith": [
    "Hack squat la aparat",
    "Presa de picioare",
    "Goblet squat cu gantera"
  ],
  "Presa de picioare": [
    "Hack squat la aparat",
    "Genuflexiuni la aparatul Smith",
    "Goblet squat"
  ],
  "Flexii femurali sezand la aparat": [
    "Flexii femurali culcat la aparat",
    "Indreptari romanesti cu gantere",
    "Punte de fese cu un picior"
  ],
  "Extensii de genunchi la aparat": [
    "Extensii de genunchi la o pierna",
    "Presa de picioare cu talpile jos pe platforma"
  ],
  "Crunch la aparat": [
    "Crunch la cablu, in genunchi",
    "Crunch cu disc pe piept",
    "Rulou abdominal (ab wheel)"
  ],
  "Presa Pallof la cablu": [
    "Plank lateral",
    "Dead bug",
    "Mers cu gantera intr-o mana"
  ],
  "Plank": [
    "Dead bug",
    "Presa Pallof la cablu",
    "Plank lateral"
  ],
  "Indreptari cu bara": [
    "Indreptari cu trap bar",
    "Indreptari sumo cu bara",
    "Indreptari romanesti cu bara",
    "Indreptari la aparatul Smith"
  ],
  "Presa inclinata la aparatul Smith": [
    "Presa cu gantere pe banca inclinata, priza neutra",
    "Presa inclinata la aparat",
    "Presa de piept la aparat"
  ],
  "Tractiuni la helcometru, priza neutra": [
    "Helcometru priza supinata",
    "Tractiuni asistate la aparat",
    "Pulldown cu un brat la cablu"
  ],
  "Fluturari la aparat (Pec Deck)": [
    "Fluturari la cablu, amplitudine mica",
    "Fluturari cu gantere pe banca",
    "Presa de piept la aparat"
  ],
  "Face pull la cablu": [
    "Fluturari inverse la aparat (deltoizi posteriori)",
    "Fluturari inverse cu gantere, aplecat",
    "Desfacere banda elastica in fata"
  ],
  "Extensii de triceps la cablu": [
    "Extensii la aparat",
    "Extensii cu bara EZ culcat (skull crusher)",
    "Flotari cu priza ingusta"
  ],
  "Hip thrust la aparat": [
    "Hip thrust cu bara pe banca",
    "Punte de fese cu disc",
    "Extensii de bazin la aparat"
  ],
  "Hack squat la aparat": [
    "Presa de picioare",
    "Genuflexiuni la aparatul Smith",
    "Goblet squat cu gantera"
  ],
  "Extensii de genunchi la o pierna": [
    "Extensii de genunchi la aparat",
    "Presa de picioare cu un picior"
  ],
  "Presa cu gantere pe banca dreapta, priza neutra": [
    "Presa de piept la aparat",
    "Presa la aparatul Smith pe banca dreapta",
    "Flotari cu picioarele pe banca"
  ],
  "Tractiuni asistate la aparat": [
    "Helcometru priza neutra apropiata",
    "Tractiuni cu banda elastica",
    "Ramat inversat sub bara"
  ],
  "Tractiuni la helcometru, priza larga": [
    "Helcometru cu priza neutra",
    "Tractiuni asistate la aparat",
    "Pulldown cu un brat la cablu"
  ],
  "Ramat sezand la aparat": [
    "Ramat la cablu sezand",
    "Ramat la aparat cu sprijin pe piept",
    "Ramat cu un brat la cablu"
  ],
  "Fluturari inverse la aparat (deltoizi posteriori)": [
    "Face pull la cablu",
    "Fluturari inverse cu gantere, aplecat",
    "Desfacere banda elastica in fata"
  ],
  "Flexii la banca Scott (curl predicator la aparat)": [
    "Flexii cu bara EZ la banca Scott",
    "Flexii la cablu",
    "Flexii ciocan cu gantere"
  ],
  "Dead bug": [
    "Plank",
    "Presa Pallof la cablu",
    "Plank lateral"
  ],
  "Plank lateral": [
    "Plank",
    "Dead bug",
    "Presa Pallof la cablu"
  ]
};

/* ─── INCALZIRE ─── */
const INCALZIRE = {
  SUPERIOR: {
  "titlu": "Incalzire 8-10 minute — zi de partea superioara",
  "pasi": [
    "5 minute bicicleta de aer, ritm usor spre mediu",
    "10 rotatii lente de umeri in fata, 10 in spate, 10 cercuri mici cu bratele intinse in lateral",
    "15 desfaceri de banda elastica in fata si 10 face pull foarte usoare la cablu",
    "Marti, la indreptari: 3 serii progresive - bara goala 8 repetari, 50 % x 5, 75 % x 3. Vineri, la presa cu gantere: 12 repetari cu jumatate din greutate, apoi 6 cu 75 %"
  ]
},
  INFERIOR: {
  "titlu": "Incalzire 10 minute — zi de picioare",
  "pasi": [
    "5 minute bicicleta de aer, ritm usor spre mediu",
    "10 genuflexiuni cu greutatea corpului, lente, cat de jos poti",
    "10 rotatii de bazin in fiecare directie si 10 leganari de picior in fata-spate pe fiecare parte",
    "15 punti de fese pe podea",
    "Serii progresive la primul exercitiu: bara goala (sau greutate mica) 10 repetari, apoi 5 repetari cu 70 % din greutatea de lucru"
  ]
},
  IMPINGERE: {
    titlu: "Incalzire 8-10 minute — zi de impingere",
    pasi: ["5 minute bicicleta usoara sau mers pe banda", "10 rotatii lente de umeri in fata, 10 in spate", "10 cercuri cu bratele intinse, in fiecare directie", "15 desfaceri de banda elastica in fata", "Un set de 15 repetari cu greutate mica la primul exercitiu"]
  },
  TRAGERE: {
    titlu: "Incalzire 8-10 minute — zi de tragere",
    pasi: ["5 minute bicicleta usoara sau mers pe banda", "10 rotatii de umeri in fiecare directie", "15 desfaceri de banda elastica in fata", "10 ridicari si coborari de omoplati atarnat de bara", "Un set de 15 repetari usoare la primul exercitiu"]
  },
  PICIOARE: {
    titlu: "Incalzire 10 minute — zi de picioare",
    pasi: ["5 minute bicicleta cu rezistenta mica", "10 genuflexiuni cu greutatea corpului", "15 ridicari pe varfuri", "10 rotatii de bazin in fiecare directie", "Un set cu greutate mica la primul exercitiu"]
  }
};
const RELAXARE = {
  titlu: "Relaxare 5-7 minute — dupa fiecare antrenament",
  pasi: ["3-5 minute mers usor pe banda sau pe loc, pana se linisteste respiratia", "Intindere piept la tocul usii: 30 secunde pe fiecare parte", "Intindere lat: te prinzi de o bara si lasi greutatea sa te intinda, 30 secunde", "Intindere spate coapsa: piciorul pe o banca joasa, te apleci lent, 30 secunde pe picior", "Intindere cvadriceps: calcaiul la fund, 30 secunde pe picior, si intindere fesier: glezna pe genunchiul opus, sezand, 30 secunde pe parte", "10 respiratii adanci, pe nas, cu expiratie lunga"]
};

/* ─── ANTRENAMENT ACASA / IN VACANTA (fara sala) ─── */
const ACASA = {
  "1": {
    "day": "Luni",
    "type": "INFERIOR",
    "short": "ACASA · PICIOARE · ABDOMEN",
    "color": "#22c55e",
    "icon": "🟢",
    "nota": "Fara sala: picioarele se lucreaza bine cu greutatea corpului daca mergi pe un picior si cu rucsac incarcat. Repetari multe, aproape de epuizare. Fara gambe.",
    "exercises": [
      {
        "name": "Genuflexiuni cu rucsac",
        "sets": "4 seturi × 15-20 repetari",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 120,
        "repsOnly": true,
        "cum": "Un rucsac incarcat cu carti sau sticle de apa in spate, picioarele la latimea umerilor. Cobori lent, 3 secunde, cat de jos poti cu calcaiele pe podea, impingi inapoi sus.",
        "lucreaza": "Cvadricepsul si fesierii.",
        "atentie": "Genunchii in directia varfurilor. Pieptul sus, spatele drept.",
        "usor": "Fara rucsac, 25 de repetari lente. Mai greu: pauza de 2 secunde jos la fiecare repetare."
      },
      {
        "name": "Genuflexiuni bulgaresti",
        "sets": "3 seturi × 10-12 repetari pe picior",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 90,
        "repsOnly": true,
        "cum": "Un picior in spate, cu laba pe un scaun sau pe pat, celalalt in fata la un pas mare. Cobori pana coapsa din fata e paralela cu podeaua, impingi prin calcai inapoi sus. Termini un picior, apoi schimbi.",
        "lucreaza": "Cvadricepsul si fesierii, un picior odata.",
        "atentie": "Genunchiul din fata nu intra spre interior. Trunchiul drept. Daca te doare genunchiul, pasul e prea mic.",
        "usor": "Tinandu-te cu o mana de perete pentru echilibru. Mai greu: cu rucsacul in spate."
      },
      {
        "name": "Indreptari romanesti pe un picior",
        "sets": "3 seturi × 10-12 repetari pe picior",
        "muscle": "Ischiogambieri",
        "groups": [
          "ischio",
          "fesieri"
        ],
        "rest": 90,
        "repsOnly": true,
        "cum": "In picioare pe un picior, genunchiul usor indoit. Te apleci din sold, piciorul liber se intinde in spate, trunchiul coboara pana e paralel cu podeaua, spatele drept. Revii strangand fesa.",
        "lucreaza": "Ischiogambierii si fesierii, plus echilibrul.",
        "atentie": "Spatele drept tot timpul. Soldurile raman paralele cu podeaua.",
        "usor": "Tinandu-te cu o mana de perete. Mai greu: rucsacul in mana opusa."
      },
      {
        "name": "Flexii femurali cu banda, culcat",
        "sets": "3 seturi × 15 repetari",
        "muscle": "Ischiogambieri",
        "groups": [
          "ischio"
        ],
        "rest": 60,
        "repsOnly": true,
        "cum": "Culcat pe burta, banda prinsa jos de un punct fix (picior de pat) si de glezne. Indoi genunchii tragand calcaiele spre fese, strangi o secunda, revii lent.",
        "lucreaza": "Ischiogambierii izolat.",
        "atentie": "Bazinul lipit de podea. Fara smucitura.",
        "usor": "Banda mai lunga. Alternativa: punte de fese cu calcaiele pe scaun si alunecare lenta a picioarelor (pe prosop), 3 × 10."
      },
      {
        "name": "Crunch cu rucsac pe piept",
        "sets": "3 seturi × 15-20 repetari",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "repsOnly": true,
        "finisher": true,
        "cum": "Culcat pe spate, genunchii indoiti, talpile pe podea, rucsacul (sau un disc / o sticla) tinut pe piept cu ambele maini. Rulezi umerii si partea de sus a spatelui de pe podea apropiind coastele de bazin, strangi 1 secunda sus, cobori lent.",
        "lucreaza": "Abdomenul drept, cu sarcina - echivalentul crunch-ului la aparat.",
        "atentie": "Lombarul ramane lipit de podea. Nu tragi de gat. Expiri cand urci.",
        "usor": "Fara greutate, 25 de repetari lente. Mai greu: rucsac mai plin sau pauza de 2 secunde sus."
      },
      {
        "name": "Presa Pallof cu banda",
        "sets": "3 seturi × 12 repetari pe parte",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "repsOnly": true,
        "finisher": true,
        "cum": "Banda prinsa de clanta la nivelul pieptului, stai lateral, capatul tinut cu ambele maini la piept. Intinzi bratele in fata si tii 2 secunde fara sa te lasi rotit, revii lent. Apoi cealalta parte.",
        "lucreaza": "Oblicii si abdomenul profund, anti-rotatie.",
        "atentie": "Trunchiul nu se roteste si nu se apleaca. Fesele stranse.",
        "usor": "Mai aproape de punctul fix pentru mai putina tensiune. Alternativa: plank lateral, 3 × 30 secunde pe parte."
      }
    ]
  },
  "2": {
    "day": "Marti",
    "type": "SUPERIOR",
    "short": "ACASA · SPATE · PIEPT · TRICEPS",
    "color": "#ef4444",
    "icon": "🔴",
    "nota": "Fara sala: greutatea corpului, banda elastica si rucsacul. Nimic deasupra capului - umerii se protejeaza. Mergi aproape de epuizare la fiecare set, pentru ca greutatea e mica.",
    "exercises": [
      {
        "name": "Indreptari romanesti cu rucsac",
        "sets": "4 seturi × 12-15 repetari",
        "muscle": "Ischiogambieri",
        "groups": [
          "ischio",
          "fesieri",
          "spate"
        ],
        "rest": 120,
        "repsOnly": true,
        "cum": "Rucsacul greu tinut in maini in fata coapselor, genunchii usor indoiti. Impingi soldurile inapoi si cobori rucsacul pe langa picioare, spatele perfect drept, pana simti intinderea in spatele coapsei. Revii strangand fesele.",
        "lucreaza": "Lantul posterior: ischiogambieri, fesieri, lombari - inlocuitorul indreptarilor.",
        "atentie": "Spatele nu se rotunjeste niciodata. Rucsacul sta aproape de picioare.",
        "usor": "Fara rucsac, 20 de repetari lente. Mai greu: pauza de 2 secunde jos."
      },
      {
        "name": "Flotari",
        "sets": "4 seturi × 10-20 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 90,
        "repsOnly": true,
        "cum": "Mainile putin mai larg decat umerii, corpul in linie dreapta, abdomenul strans. Cobori pieptul pana la 3-4 cm de podea in 2-3 secunde, impingi inapoi. Coatele la 45 de grade fata de corp.",
        "lucreaza": "Pieptul, tricepsul si umarul din fata.",
        "atentie": "Coatele NU ies larg la 90 de grade - obosesc umerii. Fundul nu se ridica, salele nu se lasa.",
        "usor": "Mainile pe marginea unei mese daca nu faci 10 curate. Mai greu: rucsacul pe spate."
      },
      {
        "name": "Ramat inversat sub masa",
        "sets": "4 seturi × 8-15 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 90,
        "repsOnly": true,
        "cum": "Culcat sub o masa solida, te prinzi de margine cu ambele maini, corpul drept, calcaiele pe podea. Tragi pieptul spre masa strangand omoplatii, cobori lent pana bratele sunt intinse.",
        "lucreaza": "Tot spatele si bicepsul.",
        "atentie": "Corpul ramane drept ca o scandura. Verifica masa sa fie stabila.",
        "usor": "Genunchii indoiti si talpile pe podea - mai usor. Alternativa: ramat cu banda elastica prinsa de usa, 4 × 15."
      },
      {
        "name": "Fluturari cu banda in fata",
        "sets": "3 seturi × 15 repetari",
        "muscle": "Piept",
        "groups": [
          "piept"
        ],
        "rest": 60,
        "repsOnly": true,
        "cum": "Banda trecuta pe la spate, pe sub omoplati, capetele in maini. Aduci mainile in fata pieptului ca o imbratisare, strangi o secunda, revii lent doar pana bratele sunt in linie cu umerii.",
        "lucreaza": "Pieptul izolat.",
        "atentie": "Coatele usor indoite si fixe. Nu lasa banda sa iti traga bratele in spatele corpului.",
        "usor": "Banda mai lunga."
      },
      {
        "name": "Desfacere banda in fata (face pull)",
        "sets": "3 seturi × 15-20 repetari",
        "muscle": "Umeri",
        "groups": [
          "umeri",
          "spate"
        ],
        "rest": 60,
        "repsOnly": true,
        "cum": "Banda tinuta in fata cu bratele intinse la nivelul umerilor. O desfaci tragand mainile in lateral si in spate pana banda atinge pieptul, strangi omoplatii, revii lent.",
        "lucreaza": "Partea din spate a umarului si muschii dintre omoplati.",
        "atentie": "Bratele raman la nivelul umerilor. Nu te lasa pe spate.",
        "usor": "Prinzi banda mai lung."
      },
      {
        "name": "Flotari cu priza ingusta",
        "sets": "3 seturi × 8-12 repetari",
        "muscle": "Triceps",
        "groups": [
          "triceps",
          "piept"
        ],
        "rest": 60,
        "repsOnly": true,
        "cum": "Flotari cu mainile sub umeri, la latimea umerilor sau putin mai ingust, coatele lipite de corp. Cobori pieptul spre maini, impingi inapoi.",
        "lucreaza": "Tricepsul, cu pieptul ca ajutor.",
        "atentie": "Coatele raman lipite de corp. Corpul drept.",
        "usor": "Pe genunchi, sau cu mainile pe marginea unei mese."
      },
      {
        "name": "Mers alert afara 30-40 de minute",
        "sets": "1 serie × 30-40 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true,
        "cum": "Mers alert, ritm sustinut, la care inca poti vorbi dar nu ai putea canta. Fara alergare.",
        "lucreaza": "Grasimea de pe trunchi si grasimea viscerala. Plus inima si pofta de mancare mai controlata.",
        "atentie": "Optional si fara penalizare. Ultimele 3 minute lent.",
        "usor": "Se poate imparti in doua plimbari de 20 de minute."
      }
    ]
  },
  "3": {
    "day": "Miercuri",
    "type": "ODIHNA",
    "short": "PAUZA DE MIJLOC",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera in mijlocul saptamanii. Fara penalizari.",
    "exercises": []
  },
  "4": {
    "day": "Joi",
    "type": "INFERIOR",
    "short": "ACASA · FESIERI · PICIOARE · ABDOMEN",
    "color": "#a78bfa",
    "icon": "🟣",
    "nota": "A doua zi de picioare acasa, accent pe fesieri. Repetari multe, control, fara gambe.",
    "exercises": [
      {
        "name": "Punte de fese cu picioarele pe scaun",
        "sets": "4 seturi × 15 repetari",
        "muscle": "Fesieri",
        "groups": [
          "fesieri",
          "ischio"
        ],
        "rest": 90,
        "repsOnly": true,
        "cum": "Culcat pe spate, calcaiele pe marginea unui scaun, genunchii indoiti, rucsacul pe solduri. Impingi prin calcaie si ridici bazinul pana corpul e drept, strangi fesele o secunda sus, cobori lent.",
        "lucreaza": "Fesierii si ischiogambierii - echivalentul hip thrust-ului.",
        "atentie": "Nu arcui salele. Impingi cu fesele.",
        "usor": "Fara rucsac. Mai greu: pe un picior."
      },
      {
        "name": "Fandari inverse cu rucsac",
        "sets": "3 seturi × 12 repetari pe picior",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps",
          "fesieri",
          "ischio"
        ],
        "rest": 90,
        "repsOnly": true,
        "cum": "Rucsacul in spate. Faci un pas mare IN SPATE si cobori pana genunchiul din spate aproape atinge podeaua. Impingi prin calcaiul din fata si revii. Termini un picior, apoi schimbi.",
        "lucreaza": "Cvadricepsul si fesierii - inlocuitorul hack squat-ului.",
        "atentie": "Trunchiul drept. Genunchiul din fata stabil, nu intra spre interior.",
        "usor": "Fara rucsac, tinandu-te de perete."
      },
      {
        "name": "Genuflexiuni la perete (izometric) + extensii",
        "sets": "3 seturi × 45 secunde + 15 repetari",
        "muscle": "Cvadriceps",
        "groups": [
          "cvadriceps"
        ],
        "rest": 75,
        "repsOnly": true,
        "cum": "Spatele lipit de perete, cobori pana coapsele sunt paralele cu podeaua si tii 45 de secunde. Imediat dupa, sezand pe un scaun, intinzi lent un picior pana e drept, strangi cvadricepsul 2 secunde, cobori - 15 pe fiecare picior, cu banda prinsa de glezna si de piciorul scaunului.",
        "lucreaza": "Cvadricepsul izolat.",
        "atentie": "Genunchii la 90 de grade la perete, nu mai jos. Fara smucituri la extensii.",
        "usor": "30 de secunde la perete si extensii fara banda."
      },
      {
        "name": "Flexii nordice asistate",
        "sets": "3 seturi × 6-8 repetari",
        "muscle": "Ischiogambieri",
        "groups": [
          "ischio"
        ],
        "rest": 90,
        "repsOnly": true,
        "cum": "In genunchi, calcaiele fixate sub pat sau canapea. Te lasi lent in fata, corpul drept de la genunchi la cap, franand cu spatele coapsei cat poti, apoi te prinzi in maini pe podea si impingi usor inapoi.",
        "lucreaza": "Ischiogambierii, cel mai puternic exercitiu pentru ei fara aparate.",
        "atentie": "Soldurile raman intinse. Cobori LENT. Daca simti crampa, te opresti.",
        "usor": "Amplitudine mica la inceput. Alternativa: indreptari romanesti pe un picior, 3 × 12."
      },
      {
        "name": "Crunch cu rucsac pe piept",
        "sets": "3 seturi × 15-20 repetari",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "repsOnly": true,
        "finisher": true,
        "cum": "Culcat pe spate, genunchii indoiti, talpile pe podea, rucsacul (sau un disc / o sticla) tinut pe piept cu ambele maini. Rulezi umerii si partea de sus a spatelui de pe podea apropiind coastele de bazin, strangi 1 secunda sus, cobori lent.",
        "lucreaza": "Abdomenul drept, cu sarcina - echivalentul crunch-ului la aparat.",
        "atentie": "Lombarul ramane lipit de podea. Nu tragi de gat. Expiri cand urci.",
        "usor": "Fara greutate, 25 de repetari lente. Mai greu: rucsac mai plin sau pauza de 2 secunde sus."
      },
      {
        "name": "Plank",
        "sets": "3 seturi × 45-60 secunde",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "repsOnly": true,
        "finisher": true,
        "cum": "Sprijin pe antebrate si pe varfuri, corpul in linie dreapta. Strangi abdomenul si fesele tot timpul. Respiri normal.",
        "lucreaza": "Abdomenul profund si zona lombara.",
        "atentie": "Fara fund ridicat si fara sale lasate. Cand salele cad, opresti seria.",
        "usor": "3 serii de 30 de secunde si cresti cate 5 secunde pe saptamana."
      }
    ]
  },
  "5": {
    "day": "Vineri",
    "type": "SUPERIOR",
    "short": "ACASA · TRAGERE · PIEPT · BICEPS",
    "color": "#3b82f6",
    "icon": "🔵",
    "nota": "A doua zi de partea superioara acasa, accent pe tragere. Daca ai o bara de tractiuni la usa, e ziua ei. Dupa ea, doua zile libere.",
    "exercises": [
      {
        "name": "Tractiuni la bara sau ramat cu banda",
        "sets": "4 seturi × 6-12 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 120,
        "repsOnly": true,
        "cum": "Daca ai bara de tractiuni: din brate intinse, priza neutra sau la latimea umerilor, tragi pana barbia ajunge la bara, cobori lent. Daca nu: banda prinsa de clanta sau de un stalp, sezand cu picioarele intinse, tragi capetele spre abdomen strangand omoplatii.",
        "lucreaza": "Latul, mijlocul spatelui si bicepsul.",
        "atentie": "Fara balans. Amplitudine completa. Verifica bara sa fie fixata bine.",
        "usor": "Tractiuni cu banda elastica sub genunchi pentru ajutor, sau tractiuni negative: sari sus si cobori in 5 secunde."
      },
      {
        "name": "Flotari cu rucsac",
        "sets": "4 seturi × 8-15 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 90,
        "repsOnly": true,
        "cum": "Rucsacul greu pe spate, mainile putin mai larg decat umerii. Cobori pieptul spre podea in 2-3 secunde, impingi inapoi. Corpul drept.",
        "lucreaza": "Pieptul, tricepsul si umarul din fata - echivalentul presei cu gantere.",
        "atentie": "Coatele la 45 de grade, nu larg. Salele nu se lasa.",
        "usor": "Flotari clasice fara rucsac. Mai greu: rucsac mai plin."
      },
      {
        "name": "Ramat cu banda, un brat",
        "sets": "3 seturi × 12-15 repetari pe brat",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 75,
        "repsOnly": true,
        "cum": "Banda prinsa jos de un punct fix. Pozitie de fandare, o mana sprijinita pe genunchi. Cu cealalta tragi capatul benzii spre sold, cotul pe langa corp, strangi omoplatul o secunda sus.",
        "lucreaza": "Latul si mijlocul spatelui, pe o parte.",
        "atentie": "Trunchiul nu se roteste. Tragi cu cotul.",
        "usor": "Banda mai lunga pentru mai putina tensiune."
      },
      {
        "name": "Ramat cu banda, priza larga",
        "sets": "3 seturi × 15 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 60,
        "repsOnly": true,
        "cum": "Banda prinsa de clanta la nivelul pieptului, sezand sau in picioare. Priza larga, tragi capetele spre piept cu coatele in lateral la nivelul umerilor, strangi omoplatii, revii lent.",
        "lucreaza": "Mijlocul spatelui si partea din spate a umarului.",
        "atentie": "Coatele nu urca peste nivelul umerilor. Fara balans.",
        "usor": "Banda mai lunga."
      },
      {
        "name": "Fluturari inverse cu banda, aplecat",
        "sets": "3 seturi × 15 repetari",
        "muscle": "Umeri",
        "groups": [
          "umeri",
          "spate"
        ],
        "rest": 60,
        "repsOnly": true,
        "cum": "Aplecat din sold cu spatele drept, calci pe mijlocul benzii, capetele in maini incrucisate. Desfaci bratele in lateral pana la nivelul umerilor, strangi omoplatii, revii lent.",
        "lucreaza": "Partea din spate a umarului si muschii dintre omoplati.",
        "atentie": "Bratele raman la nivelul umerilor. Spatele drept.",
        "usor": "Cu doua sticle de apa in loc de banda."
      },
      {
        "name": "Flexii de biceps cu banda, priza ciocan",
        "sets": "3 seturi × 12-15 repetari",
        "muscle": "Biceps",
        "groups": [
          "biceps"
        ],
        "rest": 60,
        "repsOnly": true,
        "cum": "Calci pe banda, capetele in maini cu palmele fata in fata. Ridici pana la umeri, cobori lent, 3 secunde.",
        "lucreaza": "Bicepsul si brahialul.",
        "atentie": "Coatele fixe, fara balans.",
        "usor": "Picioarele mai apropiate pe banda. Alternativa: flexii cu rucsacul tinut de manere."
      },
      {
        "name": "Mers alert afara 30-40 de minute",
        "sets": "1 serie × 30-40 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true,
        "cum": "Mers alert, ritm sustinut, la care inca poti vorbi dar nu ai putea canta. Fara alergare.",
        "lucreaza": "Grasimea de pe trunchi si grasimea viscerala. Plus inima si pofta de mancare mai controlata.",
        "atentie": "Optional si fara penalizare. Ultimele 3 minute lent.",
        "usor": "Se poate imparti in doua plimbari de 20 de minute."
      }
    ]
  },
  "6": {
    "day": "Sambata",
    "type": "ODIHNA",
    "short": "ZI LIBERA",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera. Odihna completa, fara penalizari.",
    "exercises": []
  },
  "0": {
    "day": "Duminica",
    "type": "ODIHNA",
    "short": "ZI LIBERA",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera. Odihna completa, fara penalizari.",
    "exercises": []
  }
};
const BANDA_NOTA = "Benzile elastice plate au rezistenta mica. Ca sa fie mai greu: dublezi banda, o prinzi mai scurt (mai aproape de punctul fix) sau treci pe o banda mai tare.";
/* ═══════════════════════════════════════════════════
   MISIUNI ZILNICE SI SAPTAMANALE
   ═══════════════════════════════════════════════════ */

const CITATE = [{
  text: "Nu trebuie sa fii cel mai bun. Trebuie doar sa fii mai bun decat ieri.",
  color: "#3b82f6"
}, {
  text: "Un pas mic, facut zilnic, bate un pas mare facut o data.",
  color: "#22c55e"
}, {
  text: "Corpul urmeaza acolo unde merge disciplina.",
  color: "#a78bfa"
}, {
  text: "Ai facut ce trebuia astazi. Asta conteaza.",
  color: "#f59e0b"
}, {
  text: "Puterea nu vine din ce poti face o data, ci din ce faci in fiecare zi.",
  color: "#22d3ee"
}, {
  text: "Sistemul a inregistrat efortul tau.",
  color: "#3b82f6"
}, {
  text: "Ai devenit mai puternic.",
  color: "#22c55e"
}, {
  text: "Cine se prezinta la antrenament castiga, chiar si in zilele slabe.",
  color: "#f97316"
}, {
  text: "Varsta e un numar. Constanta e o alegere.",
  color: "#ec4899"
}, {
  text: "Astazi nu ai gasit scuze. Asta e victoria.",
  color: "#ef4444"
}, {
  text: "Fiecare repetare corecta e o investitie in urmatorii ani.",
  color: "#a78bfa"
}, {
  text: "Incet e bine. Incet si constant e imbatabil.",
  color: "#34d399"
}, {
  text: "Nu conteaza cat de greu, conteaza ca ai inceput.",
  color: "#3b82f6"
}, {
  text: "Muschii cresc in repaus, dar se cheama la antrenament.",
  color: "#f59e0b"
}, {
  text: "Un antrenament facut e un antrenament castigat.",
  color: "#22c55e"
}];
/* ═══════════════════════════════════════════════════
   COMPONENTE DE INTERFATA — totul cu text mare
   ═══════════════════════════════════════════════════ */

const cardStyle = accent => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid " + (accent || "rgba(255,255,255,0.09)"),
  borderRadius: 14,
  padding: 16,
  marginBottom: 14
});
function Sect({
  title,
  right,
  children,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      paddingBottom: 8,
      borderBottom: "2px solid rgba(255,255,255,.08)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: color || "#e2e8f0",
      letterSpacing: 0.5
    }
  }, title), right ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, right) : null), children);
}
function BigBtn({
  onClick,
  children,
  color,
  bg,
  border,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      width: "100%",
      padding: "18px 16px",
      background: bg || "rgba(59,130,246,.14)",
      border: "2px solid " + (border || "rgba(59,130,246,.4)"),
      borderRadius: 12,
      color: color || "#bfdbfe",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer",
      lineHeight: 1.3,
      ...(style || {})
    }
  }, children);
}
function StatBar({
  label,
  value,
  max,
  color
}) {
  const m = max || 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 5,
      fontSize: F.md,
      color: "#cbd5e1",
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: color,
      fontWeight: 900
    }
  }, value)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12,
      background: "rgba(255,255,255,0.07)",
      borderRadius: 6,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: Math.min(value / m * 100, 100) + "%",
      background: "linear-gradient(90deg," + color + "," + color + "99)",
      borderRadius: 6,
      transition: "width .6s ease"
    }
  })));
}
function Notif({
  msg,
  onDone
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: "calc(110px + env(safe-area-inset-bottom))",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      padding: "16px 22px",
      maxWidth: "94vw",
      background: "linear-gradient(135deg,rgba(15,23,42,.98),rgba(30,41,59,.98))",
      border: "2px solid rgba(59,130,246,.55)",
      borderRadius: 12,
      color: "#bfdbfe",
      fontSize: F.md,
      fontWeight: 700,
      textAlign: "center",
      boxShadow: "0 0 30px rgba(0,0,0,.6)",
      lineHeight: 1.4
    }
  }, msg);
}
function LvlModal({
  level,
  rank,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.9)",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      letterSpacing: 3,
      color: "#3b82f6",
      marginBottom: 16,
      fontWeight: 800
    }
  }, "NIVEL NOU"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.huge,
      fontWeight: 900,
      color: "#e2e8f0",
      marginBottom: 12,
      textShadow: "0 0 40px " + rank.color
    }
  }, "NIVELUL ", level), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xl,
      color: rank.color,
      fontWeight: 800,
      marginBottom: 20
    }
  }, rank.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8"
    }
  }, "Atinge ecranul ca sa continui")));
}
function QuestPopup({
  quote,
  xpGain,
  multiplier,
  onClose
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.82)",
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 52,
      marginBottom: 14
    }
  }, "✅"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      color: quote.color,
      fontStyle: "italic",
      lineHeight: 1.5,
      marginBottom: 18
    }
  }, "„", quote.text, "”"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#4ade80"
    }
  }, "+", xpGain, " XP"), multiplier > 1 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#f59e0b",
      marginTop: 8,
      fontWeight: 700
    }
  }, "bonus ", multiplier, "x activ") : null));
}

/* ─── FEREASTRA OBLIGATORIE: SOMN ─── */
function PasiLista({
  data,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: cardStyle("rgba(255,255,255,.1)")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: color,
      marginBottom: 12
    }
  }, data.titlu), data.pasi.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 12,
      marginBottom: 12,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 30,
      height: 30,
      borderRadius: 15,
      background: "rgba(255,255,255,.08)",
      color: color,
      fontSize: F.sm,
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.5
    }
  }, p))));
}
/* ═══════════════ TAB: AZI ═══════════════ */

function nrSeturi(txt) {
  const m = (txt || "").match(/^(\d+)/);
  return m ? parseInt(m[1]) : 3;
}
function ExCard({
  ex,
  idx,
  ctx
}) {
  const {
    doneEx,
    openEx,
    setOpenEx,
    toggleEx,
    logSets,
    stergeAzi,
    getLast,
    getRecomandare,
    startRest,
    loggerSets,
    setLoggerSets,
    setSwapModal,
    S,
    todayStr,
    ziSel,
    todayDow,
    selDay
  } = ctx;
  const swapped = (S.exerciseSwaps || {})[todayStr + "_" + ex.name];
  const gata = doneEx.includes(ex.name);
  const deschis = openEx === ex.name;
  const n = nrSeturi(ex.sets);
  const last = getLast(ex.name);
  const esteAzi = selDay === todayDow;
  const sets = loggerSets[ex.name] || Array.from({
    length: n
  }, () => ({
    kg: "",
    reps: ""
  }));
  const setSets = s => setLoggerSets({
    ...loggerSets,
    [ex.name]: s
  });
  const setCell = (i, key, val) => {
    const c = sets.map(x => ({
      ...x
    }));
    c[i][key] = val;
    setSets(c);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: gata ? "rgba(34,197,94,.08)" : "rgba(255,255,255,.03)",
      border: "2px solid " + (gata ? "rgba(34,197,94,.4)" : "rgba(255,255,255,.1)"),
      borderRadius: 14,
      marginBottom: 14,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenEx(deschis ? null : ex.name),
    style: {
      width: "100%",
      display: "flex",
      gap: 12,
      alignItems: "center",
      padding: 16,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 38,
      height: 38,
      borderRadius: 19,
      background: gata ? "#22c55e" : "rgba(255,255,255,.08)",
      color: gata ? "#052e16" : "#94a3b8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: F.md,
      fontWeight: 900
    }
  }, gata ? "✓" : idx + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      fontWeight: 800,
      color: gata ? "#86efac" : "#e2e8f0",
      lineHeight: 1.3
    }
  }, swapped || ex.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 4
    }
  }, ex.sets), swapped ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: "#fbbf24",
      marginTop: 4
    }
  }, "schimbat astazi (initial: ", ex.name, ")") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      color: "#64748b"
    }
  }, deschis ? "▾" : "▸")), deschis ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(0,0,0,.25)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#60a5fa",
      marginBottom: 6
    }
  }, "CUM SE FACE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.cum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#4ade80",
      marginBottom: 6
    }
  }, "CE LUCREAZA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.lucreaza), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#f87171",
      marginBottom: 6
    }
  }, "ATENTIE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.atentie), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#fbbf24",
      marginBottom: 6
    }
  }, "DACA E PREA GREU"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55
    }
  }, ex.usor)), last ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(59,130,246,.1)",
      border: "1px solid rgba(59,130,246,.3)",
      borderRadius: 10,
      padding: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#93c5fd",
      fontWeight: 800,
      marginBottom: 6
    }
  }, "ULTIMA DATA (", last.date, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.5
    }
  }, last.sets.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, s.kg ? s.kg + " kg × " : "", s.reps, " rep", i < last.sets.length - 1 ? "  ·  " : "")))) : null, esteAzi ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#cbd5e1",
      marginBottom: 10
    }
  }, "SCRIE SETURILE DE AZI"), sets.map((s, i) => {
    const rec = getRecomandare(ex.name, i, ex);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 34,
        fontSize: F.md,
        color: "#64748b",
        fontWeight: 900
      }
    }, i + 1, "."), ex.repsOnly ? null : /*#__PURE__*/React.createElement("input", {
      type: "number",
      inputMode: "decimal",
      step: "0.5",
      placeholder: "kg",
      value: s.kg,
      onChange: e => setCell(i, "kg", e.target.value),
      style: {
        flex: 1,
        minWidth: 0,
        padding: "14px 8px",
        background: "rgba(0,0,0,.35)",
        border: "2px solid rgba(255,255,255,.14)",
        borderRadius: 10,
        color: "#e2e8f0",
        fontSize: F.lg,
        fontWeight: 800,
        textAlign: "center",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box"
      }
    }), /*#__PURE__*/React.createElement("input", {
      type: "number",
      inputMode: "numeric",
      placeholder: ex.repsOnly ? "sec / rep" : "rep",
      value: s.reps,
      onChange: e => setCell(i, "reps", e.target.value),
      style: {
        flex: 1,
        minWidth: 0,
        padding: "14px 8px",
        background: "rgba(0,0,0,.35)",
        border: "2px solid rgba(255,255,255,.14)",
        borderRadius: 10,
        color: "#e2e8f0",
        fontSize: F.lg,
        fontWeight: 800,
        textAlign: "center",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box"
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => startRest(ex.name, i + 1, ex.rest || 90, ziSel.color),
      style: {
        padding: "14px 12px",
        background: "rgba(59,130,246,.16)",
        border: "2px solid rgba(59,130,246,.4)",
        borderRadius: 10,
        color: "#93c5fd",
        fontSize: F.sm,
        fontWeight: 900,
        fontFamily: "inherit",
        cursor: "pointer"
      }
    }, "PAUZA")), rec ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.xs,
        color: "#fbbf24",
        marginTop: 4,
        marginLeft: 42
      }
    }, "tinta: ", rec.kg ? rec.kg + " kg × " : "", rec.reps, " — ", rec.nota) : null);
  }), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      const curate = sets.filter(s => s.reps !== "");
      if (!curate.length) {
        alert("Scrie macar un set.");
        return;
      }
      logSets(ex, curate);
    },
    bg: "rgba(34,197,94,.18)",
    border: "rgba(34,197,94,.5)",
    color: "#86efac",
    style: {
      marginBottom: 10
    }
  }, "✓ GATA — SALVEAZA EXERCITIUL")) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#64748b",
      marginBottom: 14,
      lineHeight: 1.5
    }
  }, "Seturile se scriu doar in ziua antrenamentului."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSwapModal(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(168,85,247,.14)",
      border: "2px solid rgba(168,85,247,.35)",
      borderRadius: 10,
      color: "#d8b4fe",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🔄 SCHIMBA"), gata ? /*#__PURE__*/React.createElement("button", {
    onClick: () => stergeAzi(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(239,68,68,.12)",
      border: "2px solid rgba(239,68,68,.35)",
      borderRadius: 10,
      color: "#fca5a5",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "↩ ANULEAZA") : /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleEx(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(34,197,94,.12)",
      border: "2px solid rgba(34,197,94,.35)",
      borderRadius: 10,
      color: "#86efac",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "✓ BIFEAZA"))) : null);
}
function SwapModal({
  ctx
}) {
  const {
    swapModal,
    setSwapModal,
    swapEx,
    revertSwap,
    S,
    todayStr
  } = ctx;
  const ex = swapModal;
  const lista = ALT[ex.name] || [];
  const swapped = (S.exerciseSwaps || {})[todayStr + "_" + ex.name];
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => setSwapModal(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 9000,
      background: "rgba(2,6,23,.95)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xl,
      fontWeight: 900,
      color: "#d8b4fe",
      marginBottom: 8
    }
  }, "SCHIMBA EXERCITIUL"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      marginBottom: 18,
      lineHeight: 1.5
    }
  }, "In locul lui ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#e2e8f0"
    }
  }, ex.name), ", doar pentru astazi. Foloseste asta daca aparatul e ocupat sau daca te doare ceva."), lista.map(alt => /*#__PURE__*/React.createElement(BigBtn, {
    key: alt,
    onClick: () => swapEx(ex.name, alt),
    bg: "rgba(168,85,247,.14)",
    border: "rgba(168,85,247,.35)",
    color: "#e9d5ff",
    style: {
      marginBottom: 10,
      textAlign: "left"
    }
  }, alt)), swapped ? /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      revertSwap(ex.name);
      setSwapModal(null);
    },
    bg: "rgba(239,68,68,.12)",
    border: "rgba(239,68,68,.35)",
    color: "#fca5a5",
    style: {
      marginBottom: 10
    }
  }, "↩ INAPOI LA EXERCITIUL INITIAL") : null, /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setSwapModal(null),
    bg: "rgba(255,255,255,.06)",
    border: "rgba(255,255,255,.2)",
    color: "#cbd5e1"
  }, "INCHIDE")));
}
function TabSala({
  ctx
}) {
  const {
    PROG,
    ziSel,
    selDay,
    setSelDay,
    doneEx,
    vacation,
    showIncalzire,
    setShowIncalzire,
    showRelaxare,
    setShowRelaxare,
    todayDow
  } = ctx;
  const [showReguli, setShowReguli] = useState(false);
  const ex = ziSel.exercises || [];
  const facute = ex.filter(e => doneEx.includes(e.name)).length;
  const inc = INCALZIRE[ziSel.type];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 18
    }
  }, [1, 2, 3, 4, 5, 6, 0].map(d => {
    const z = PROG[d];
    const activ = selDay === d;
    return /*#__PURE__*/React.createElement("button", {
      key: d,
      onClick: () => setSelDay(d),
      style: {
        flex: 1,
        padding: "12px 0",
        borderRadius: 10,
        background: activ ? z.color + "33" : "rgba(255,255,255,.04)",
        border: "2px solid " + (activ ? z.color : d === todayDow ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.08)"),
        color: activ ? "#fff" : "#94a3b8",
        fontFamily: "inherit",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.md,
        fontWeight: 900
      }
    }, DOW_SHORT[d]));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,.04)",
      border: "2px solid " + ziSel.color,
      borderRadius: 14,
      padding: 18,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, ziSel.day.toUpperCase(), selDay === todayDow ? " — ASTAZI" : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: ziSel.color,
      lineHeight: 1.1,
      marginTop: 4
    }
  }, ziSel.icon, " ", ziSel.type), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      marginTop: 6
    }
  }, ziSel.short), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 10,
      lineHeight: 1.5
    }
  }, ziSel.nota), ex.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: facute === ex.length ? "#4ade80" : "#f59e0b",
      marginTop: 12,
      fontWeight: 900
    }
  }, facute, " din ", ex.length, " exercitii") : null), vacation ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(245,158,11,.1)",
      border: "2px solid rgba(245,158,11,.3)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#fcd34d",
      marginBottom: 6
    }
  }, "BANDA ELASTICA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55
    }
  }, BANDA_NOTA)) : null, ex.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      textAlign: "center",
      padding: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 54,
      marginBottom: 12
    }
  }, "😌"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: "#cbd5e1",
      marginBottom: 8
    }
  }, "Zi de odihna"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      lineHeight: 1.5
    }
  }, "Muschiul creste in zilele de pauza, nu la sala. Astazi nu ai nimic de facut.")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowReguli(!showReguli),
    style: {
      width: "100%",
      padding: 16,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(239,68,68,.1)",
      border: "2px solid rgba(239,68,68,.3)",
      borderRadius: 12,
      color: "#fca5a5",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "⚠️ REGULI DE SIGURANTA ", showReguli ? "▾" : "▸"), showReguli ? /*#__PURE__*/React.createElement("div", {
    style: cardStyle("rgba(239,68,68,.25)")
  }, REGULI.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.55,
      marginBottom: 12
    }
  }, "• ", r)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 14,
      borderTop: "2px solid rgba(239,68,68,.3)",
      fontSize: F.md,
      fontWeight: 900,
      color: "#f87171",
      marginBottom: 10
    }
  }, "OPRESTE-TE IMEDIAT DACA APARE:"), STOP_SEMNE.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: F.md,
      color: "#fecaca",
      lineHeight: 1.5,
      marginBottom: 8
    }
  }, "• ", s)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 14,
      lineHeight: 1.5
    }
  }, "Inainte de a incepe programul, mergi o data la medic pentru un control de rutina — mai ales pentru tensiune si inima.")) : null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowIncalzire(!showIncalzire),
    style: {
      width: "100%",
      padding: 16,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(249,115,22,.1)",
      border: "2px solid rgba(249,115,22,.3)",
      borderRadius: 12,
      color: "#fdba74",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🔥 INCALZIRE (obligatorie) ", showIncalzire ? "▾" : "▸"), showIncalzire && inc ? /*#__PURE__*/React.createElement(PasiLista, {
    data: inc,
    color: "#fdba74"
  }) : null, ex.map((e, i) => /*#__PURE__*/React.createElement(ExCard, {
    key: e.name,
    ex: e,
    idx: i,
    ctx: ctx
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowRelaxare(!showRelaxare),
    style: {
      width: "100%",
      padding: 16,
      marginTop: 6,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(34,211,238,.1)",
      border: "2px solid rgba(34,211,238,.3)",
      borderRadius: 12,
      color: "#67e8f9",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🧊 RELAXARE DUPA ANTRENAMENT ", showRelaxare ? "▾" : "▸"), showRelaxare ? /*#__PURE__*/React.createElement(PasiLista, {
    data: RELAXARE,
    color: "#67e8f9"
  }) : null));
}
/* ═══════════════ TAB: PROGRES ═══════════════ */

function TabProgres({
  ctx
}) {
  const {
    stats,
    muscleXp,
    S,
    level,
    rank,
    streak
  } = ctx;
  const statCol = {
    STR: "#ef4444",
    VIT: "#22c55e",
    AGI: "#22d3ee",
    INT: "#a78bfa",
    PER: "#f59e0b"
  };
  const statNume = {
    STR: "STR — Forta",
    VIT: "VIT — Rezistenta",
    AGI: "AGI — Mobilitate",
    INT: "INT — Minte",
    PER: "PER — Vointa"
  };
  const maxStat = Math.max(20, ...Object.values(stats));
  const zileAntrenate = Object.keys(S.workoutCalendar || {}).length;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Sect, {
    title: "STATISTICI"
  }, /*#__PURE__*/React.createElement("div", {
    style: cardStyle()
  }, Object.keys(stats).map(k => /*#__PURE__*/React.createElement(StatBar, {
    key: k,
    label: statNume[k],
    value: stats[k],
    max: maxStat,
    color: statCol[k]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      flex: 1,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#93c5fd"
    }
  }, S.totalXp), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, "XP total")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      flex: 1,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#4ade80"
    }
  }, zileAntrenate), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, "zile de sala")))), /*#__PURE__*/React.createElement(Sect, {
    title: "GRUPE MUSCULARE"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "Fiecare exercitiu facut adauga puncte grupei lucrate. Asa vezi ce ai neglijat."), MUSCLE_GROUPS.map(mg => {
    const xp = muscleXp[mg.key] || 0;
    const r = getMuscleRank(xp);
    const nx = getNextMuscleRank(xp);
    return /*#__PURE__*/React.createElement("div", {
      key: mg.key,
      style: {
        ...cardStyle(),
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.md,
        fontWeight: 800,
        color: "#e2e8f0"
      }
    }, mg.icon, " ", mg.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.sm,
        fontWeight: 900,
        color: r.color
      }
    }, r.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 10,
        background: "rgba(255,255,255,.07)",
        borderRadius: 5,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        borderRadius: 5,
        background: r.color,
        width: Math.min(100, nx ? xp / nx.min * 100 : 100) + "%"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.xs,
        color: "#64748b",
        marginTop: 6
      }
    }, xp, " puncte", nx ? " · urmatorul rang la " + nx.min : " · rang maxim"));
  })), /*#__PURE__*/React.createElement(Sect, {
    title: "RANGURI"
  }, RANKS.map(r => {
    const activ = r.name === rank.name;
    const atins = level >= r.min;
    return /*#__PURE__*/React.createElement("div", {
      key: r.name,
      style: {
        ...cardStyle(activ ? r.color : "rgba(255,255,255,.08)"),
        opacity: atins ? 1 : 0.5,
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.lg,
        fontWeight: 900,
        color: r.color
      }
    }, r.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.sm,
        color: "#94a3b8",
        fontWeight: 700
      }
    }, "nivel ", r.min, "-", r.max)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.sm,
        color: "#cbd5e1",
        marginTop: 6,
        lineHeight: 1.5
      }
    }, r.desc), activ ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.sm,
        color: r.color,
        marginTop: 8,
        fontWeight: 900
      }
    }, "◀ aici esti acum") : null);
  })), (S.penaltyLog || []).length ? /*#__PURE__*/React.createElement(Sect, {
    title: "PENALIZARI",
    color: "#f87171"
  }, [...S.penaltyLog].reverse().slice(0, 8).map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...cardStyle("rgba(239,68,68,.25)"),
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#fca5a5",
      fontWeight: 800
    }
  }, p.date, " · -", p.penalty, " XP"), p.det ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 4
    }
  }, p.det) : null))) : null);
}

/* ═══════════════ TAB: CORP ═══════════════ */

function TabSetari({
  ctx
}) {
  const {
    S,
    g,
    update,
    vacation,
    soundOn,
    setSoundOn,
    setNotif,
    exportStr,
    setExportStr,
    importStr,
    setImportStr,
    lastSaved
  } = ctx;
  const [confirmReset, setConfirmReset] = useState(false);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Sect, {
    title: "MOD PLECARE / VACANTA",
    color: "#fcd34d"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      marginBottom: 14,
      lineHeight: 1.55
    }
  }, "Cand esti plecat de acasa: antrenamentele de sala sunt inlocuite cu antrenamente cu banda elastica si greutatea corpului, pe aceeasi impartire Superior / Inferior. Penalizarile se opresc complet."), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      update({
        vacation: !vacation
      });
      setNotif(!vacation ? "🏖️ Mod plecare pornit" : "🏋️ Inapoi la programul de sala");
    },
    bg: vacation ? "rgba(245,158,11,.22)" : "rgba(255,255,255,.05)",
    border: vacation ? "rgba(245,158,11,.55)" : "rgba(255,255,255,.18)",
    color: vacation ? "#fcd34d" : "#cbd5e1"
  }, vacation ? "🏖️ MOD PLECARE: PORNIT — apasa ca sa opresti" : "🏖️ PORNESTE MODUL PLECARE")), /*#__PURE__*/React.createElement(Sect, {
    title: "SUNET"
  }, /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setSoundOn(!soundOn),
    bg: soundOn ? "rgba(34,197,94,.14)" : "rgba(255,255,255,.05)",
    border: soundOn ? "rgba(34,197,94,.45)" : "rgba(255,255,255,.18)",
    color: soundOn ? "#86efac" : "#94a3b8"
  }, soundOn ? "🔊 SUNET PORNIT" : "🔇 SUNET OPRIT")), /*#__PURE__*/React.createElement(Sect, {
    title: "SALVARE"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "Totul se salveaza singur in telefon, dupa fiecare apasare.", lastSaved ? " Ultima salvare: " + lastSaved + "." : ""), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: async () => {
      const ok = await saveToIDB(g.current);
      setNotif(ok ? "💾 Salvat" : "❌ Salvarea a esuat");
    },
    style: {
      marginBottom: 14
    }
  }, "💾 SALVEAZA ACUM"), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      setExportStr(JSON.stringify(g.current));
      setNotif("📤 Copiaza textul de mai jos");
    },
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1",
    style: {
      marginBottom: 10
    }
  }, "📤 EXPORTA DATELE"), exportStr ? /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: exportStr,
    onFocus: e => e.target.select(),
    style: {
      width: "100%",
      height: 110,
      background: "rgba(0,0,0,.4)",
      color: "#94a3b8",
      border: "2px solid rgba(255,255,255,.14)",
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      fontFamily: "monospace",
      marginBottom: 14,
      boxSizing: "border-box"
    }
  }) : null, /*#__PURE__*/React.createElement("textarea", {
    value: importStr,
    placeholder: "Lipeste aici datele exportate",
    onChange: e => setImportStr(e.target.value),
    style: {
      width: "100%",
      height: 90,
      background: "rgba(0,0,0,.4)",
      color: "#e2e8f0",
      border: "2px solid rgba(255,255,255,.14)",
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      fontFamily: "monospace",
      marginBottom: 10,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      try {
        const d = JSON.parse(importStr);
        const m = {
          ...DEFAULT_STATE
        };
        for (const k of SAVE_FIELDS) if (d[k] !== undefined) m[k] = d[k];
        g.current = m;
        update({});
        setImportStr("");
        setNotif("📥 Date incarcate");
      } catch (e) {
        setNotif("❌ Text invalid");
      }
    },
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1"
  }, "📥 IMPORTA DATELE")), /*#__PURE__*/React.createElement(Sect, {
    title: "STERGE TOT",
    color: "#f87171"
  }, confirmReset ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#fca5a5",
      marginBottom: 14,
      lineHeight: 1.5
    }
  }, "Sigur? Se sterg toate nivelurile, greutatile, somnul si istoricul. Nu se poate reveni."), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      g.current = {
        ...DEFAULT_STATE,
        lastDailyReset: new Date().toISOString().slice(0, 10)
      };
      update({});
      setConfirmReset(false);
      setNotif("Totul a fost sters.");
    },
    bg: "rgba(239,68,68,.22)",
    border: "rgba(239,68,68,.6)",
    color: "#fca5a5",
    style: {
      marginBottom: 10
    }
  }, "DA, STERGE TOT"), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setConfirmReset(false),
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1"
  }, "NU, RENUNTA")) : /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setConfirmReset(true),
    bg: "rgba(239,68,68,.1)",
    border: "rgba(239,68,68,.3)",
    color: "#fca5a5"
  }, "🗑️ STERGE TOATE DATELE")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#475569",
      textAlign: "center",
      marginTop: 20,
      lineHeight: 1.6
    }
  }, "Program de antrenament, nu sfat medical.", /*#__PURE__*/React.createElement("br", null), "La orice durere sau simptom neobisnuit, opreste-te si vorbeste cu medicul."));
}
/* ═══════════════════════════════════════════════════
   APLICATIA PRINCIPALA
   ═══════════════════════════════════════════════════ */

function App() {
  const [loaded, setLoaded] = useState(false);
  const [_v, _fv] = useState(0);
  const forceUpdate = () => _fv(v => v + 1);
  const g = useRef({
    ...DEFAULT_STATE
  });
  const S = g.current;
  const [notif, setNotif] = useState(null);
  const [showLvl, setShowLvl] = useState(false);
  const [questPopup, setQuestPopup] = useState(null);
  const [tab, setTab] = useState("sala");
  const [selDay, setSelDay] = useState(new Date().getDay());
  const [openEx, setOpenEx] = useState(null);
  const [swapModal, setSwapModal] = useState(null);
  const [showIncalzire, setShowIncalzire] = useState(false);
  const [showRelaxare, setShowRelaxare] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [restTimer, setRestTimer] = useState(null);
  const [restElapsed, setRestElapsed] = useState(0);
  const [loggerSets, setLoggerSets] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [exportStr, setExportStr] = useState("");
  const [importStr, setImportStr] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay();
  const update = changes => {
    Object.assign(g.current, changes);
    forceUpdate();
    saveToIDB(g.current).then(ok => {
      if (ok) setLastSaved(new Date().toLocaleTimeString("ro-RO"));
    });
  };
  const getWeekId = d => {
    const dt = new Date(d);
    const day = dt.getDay() || 7;
    dt.setDate(dt.getDate() + 4 - day);
    const yr = new Date(dt.getFullYear(), 0, 1);
    return dt.getFullYear() + "-S" + String(Math.ceil(((dt - yr) / 86400000 + 1) / 7)).padStart(2, "0");
  };

  /* ─── INCARCARE + RESETARI ─── */
  useEffect(() => {
    (async () => {
      try {
        const d = await loadFromIDB();
        if (d) {
          const merged = {
            ...DEFAULT_STATE
          };
          for (const k of SAVE_FIELDS) if (d[k] !== undefined) merged[k] = d[k];
          g.current = merged;
        }
        const st = g.current;
        if (!st.startDate) st.startDate = todayStr;

        /* resetare zilnica + penalizari */
        if (st.lastDailyReset && st.lastDailyReset !== todayStr) {
          const yDate = new Date(st.lastDailyReset);
          const yDay = yDate.getDay();
          const wasWeekend = yDay === 0 || yDay === 6;
          const changes = {
            done: [],
            doneEx: [],
            lastDailyReset: todayStr
          };
          if (wasWeekend || st.vacation) {
            changes.streak = st.streak + 1;
            setTimeout(() => setNotif(st.vacation ? "🏖️ Mod plecare — fara penalizari" : "🌙 Weekend — fara penalizari"), 700);
          } else {
            let total = 0,
              missedCount = 0;
            const det = [];
            const yPPL = (st.vacation ? ACASA : PPL)[yDay];
            if (yPPL && yPPL.type !== "ODIHNA") {
              const missedEx = yPPL.exercises.filter(ex => !ex.finisher && !st.doneEx.includes(ex.name));
              if (missedEx.length) {
                const p = missedEx.length * 10;
                total += p;
                missedCount += missedEx.length;
                det.push(missedEx.length + " exercitii (-" + p + ")");
              }
            }
            if (total > 0) {
              const newXp = st.xp - total;
              const newLvl = newXp < 0 ? Math.max(1, st.level - 1) : st.level;
              Object.assign(changes, {
                xp: newXp < 0 ? Math.max(0, getXp(newLvl) + newXp) : newXp,
                level: newLvl,
                totalXp: Math.max(0, st.totalXp - total),
                penaltyLog: [...st.penaltyLog, {
                  date: st.lastDailyReset,
                  missed: missedCount,
                  penalty: total,
                  tip: "zilnic",
                  det: det.join(", ")
                }]
              });
              setTimeout(() => setNotif("⚠️ -" + total + " XP · " + det.join(", ")), 700);
            } else {
              changes.streak = st.streak + 1;
            }
          }
          Object.assign(g.current, changes);
          await saveToIDB(g.current);
        } else if (!st.lastDailyReset) {
          g.current.lastDailyReset = todayStr;
        }

        /* ─── MIGRARE v2: XP recalculat din munca reala ─── */
        if (!g.current.v2) {
          const totalEx = Object.values(g.current.workoutCalendar || {}).reduce((a, b) => a + b, 0);
          let pool = totalEx * 10;
          let lvl = 1;
          while (pool >= getXp(lvl) && lvl < 200) {
            pool -= getXp(lvl);
            lvl++;
          }
          Object.assign(g.current, {
            v2: true,
            level: lvl,
            xp: pool,
            totalXp: totalEx * 10,
            penaltyLog: [],
            done: [],
            doneW: []
          });
          setTimeout(() => setNotif("Nivel recalculat din antrenamentele facute: nivelul " + lvl), 1200);
        }
        await saveToIDB(g.current);
      } catch (e) {
        console.error("Eroare la incarcare", e);
      } finally {
        setLoaded(true);
        forceUpdate();
      }
    })();
  }, []);

  /* ─── CRONOMETRU PAUZA ─── */
  useEffect(() => {
    if (!restTimer) return;
    const iv = setInterval(() => {
      const el = Math.floor((Date.now() - restTimer.startTime) / 1000);
      setRestElapsed(el);
      if (el === restTimer.totalSec) {
        if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
        if (soundOn) playSound("gata");
      }
      if (el === restTimer.totalSec + 30) {
        if (navigator.vibrate) navigator.vibrate([400, 100, 400]);
        if (soundOn) playSound("intarziat");
      }
    }, 250);
    return () => clearInterval(iv);
  }, [restTimer, soundOn]);

  /* ─── XP ─── */
  const level = S.level,
    xp = S.xp,
    stats = S.stats,
    done = S.done,
    doneEx = S.doneEx,
    doneW = S.doneW,
    streak = S.streak,
    muscleXp = S.muscleXp,
    vacation = S.vacation,
    weightLog = S.weightLog,
    liftLog = S.liftLog;
  const rank = getRank(level);
  const xpN = getXp(level);
  const getMult = () => Math.round(getRankMultiplier(level) * getStreakMultiplier(streak) * 10) / 10;
  const calcAdd = (base, stat) => {
    const m = getMult();
    const amt = Math.round(base * m);
    const ns = {
      ...stats,
      [stat]: stats[stat] + 1
    };
    const n = xp + amt;
    if (n >= xpN) return {
      xp: n - xpN,
      level: level + 1,
      stats: ns,
      totalXp: S.totalXp + amt,
      _g: amt,
      _m: m
    };
    return {
      xp: n,
      stats: ns,
      totalXp: S.totalXp + amt,
      _g: amt,
      _m: m
    };
  };
  const calcRem = (base, stat) => {
    const m = getMult();
    const amt = Math.round(base * m);
    const ns = {
      ...stats,
      [stat]: Math.max(0, stats[stat] - 1)
    };
    const n = xp - amt;
    if (n < 0) return {
      xp: Math.max(0, getXp(Math.max(1, level - 1)) + n),
      level: Math.max(1, level - 1),
      stats: ns,
      totalXp: Math.max(0, S.totalXp - amt),
      _g: amt
    };
    return {
      xp: n,
      stats: ns,
      totalXp: Math.max(0, S.totalXp - amt),
      _g: amt
    };
  };
  const popQuest = (amt, m) => {
    const q = CITATE[Math.floor(Math.random() * CITATE.length)];
    setQuestPopup({
      quote: q,
      xpGain: amt,
      multiplier: m
    });
    if (soundOn) playSound("bifa");
  };
  const toggleEx = ex => {
    const nm = {
      ...muscleXp
    };
    if (doneEx.includes(ex.name)) {
      (ex.groups || []).forEach(k => {
        nm[k] = Math.max(0, (nm[k] || 0) - 5);
      });
      const c = calcRem(10, ex.stat || "STR");
      update({
        doneEx: doneEx.filter(x => x !== ex.name),
        muscleXp: nm,
        ...c
      });
      setNotif("↩ Exercitiu anulat · -" + c._g + " XP");
    } else {
      (ex.groups || []).forEach(k => {
        nm[k] = (nm[k] || 0) + 5;
      });
      const c = calcAdd(10, ex.stat || "STR");
      const wc = {
        ...(S.workoutCalendar || {})
      };
      wc[todayStr] = (wc[todayStr] || 0) + 1;
      update({
        doneEx: [...doneEx, ex.name],
        muscleXp: nm,
        workoutCalendar: wc,
        ...c
      });
      if (c.level > level) setShowLvl(true);
      popQuest(c._g, c._m);
    }
  };

  /* ─── JURNAL DE GREUTATI ─── */
  const getLast = name => {
    const e = liftLog[name];
    return e && e.length ? e[e.length - 1] : null;
  };
  const getRecomandare = (name, idx, ex) => {
    const last = getLast(name);
    if (!last || !last.sets || !last.sets[idx]) return null;
    const p = last.sets[idx];
    const kg = parseFloat(p.kg) || 0;
    const reps = parseInt(p.reps) || 0;
    const m = (ex.sets || "").match(/(\d+)\s*-\s*(\d+)\s*repetari/);
    const minR = m ? parseInt(m[1]) : 10;
    const maxR = m ? parseInt(m[2]) : 12;
    const inc = ex.inc || 2.5;
    if (reps >= maxR && kg > 0) return {
      kg: kg + inc,
      reps: minR,
      nota: "creste cu " + inc + " kg"
    };
    return {
      kg: kg,
      reps: reps + 1,
      nota: "o repetare in plus"
    };
  };
  const logSets = (ex, sets) => {
    const name = ex.name;
    const nl = {
      ...liftLog,
      [name]: [...(liftLog[name] || []), {
        date: todayStr,
        sets
      }]
    };
    const changes = {
      liftLog: nl
    };
    if (!doneEx.includes(name)) {
      const nm = {
        ...muscleXp
      };
      (ex.groups || []).forEach(k => {
        nm[k] = (nm[k] || 0) + 5;
      });
      const c = calcAdd(10, ex.stat || "STR");
      const wc = {
        ...(S.workoutCalendar || {})
      };
      wc[todayStr] = (wc[todayStr] || 0) + 1;
      Object.assign(changes, {
        doneEx: [...doneEx, name],
        muscleXp: nm,
        workoutCalendar: wc,
        ...c
      });
      if (c.level > level) setShowLvl(true);
      popQuest(c._g, c._m);
    } else {
      setNotif("💾 Seturi salvate");
    }
    update(changes);
    const ls = {
      ...loggerSets
    };
    delete ls[name];
    setLoggerSets(ls);
  };
  const stergeAzi = ex => {
    const name = ex.name;
    const changes = {};
    if (doneEx.includes(name)) {
      const nm = {
        ...muscleXp
      };
      (ex.groups || []).forEach(k => {
        nm[k] = Math.max(0, (nm[k] || 0) - 5);
      });
      const c = calcRem(10, ex.stat || "STR");
      Object.assign(changes, {
        doneEx: doneEx.filter(x => x !== name),
        muscleXp: nm,
        ...c
      });
    }
    const ll = liftLog || {};
    if (ll[name] && ll[name].some(s => s.date === todayStr)) {
      const f = ll[name].filter(s => s.date !== todayStr);
      const n = {
        ...ll
      };
      if (f.length) n[name] = f;else delete n[name];
      changes.liftLog = n;
    }
    update(changes);
    setNotif("↩ Exercitiul de azi a fost sters");
  };

  /* ─── SCHIMBARE EXERCITIU ─── */
  const swapEx = (orig, nou) => {
    const sw = {
      ...(S.exerciseSwaps || {})
    };
    sw[todayStr + "_" + orig] = nou;
    update({
      exerciseSwaps: sw
    });
    setSwapModal(null);
    setNotif("🔄 Astazi faci: " + nou);
  };
  const revertSwap = orig => {
    const sw = {
      ...(S.exerciseSwaps || {})
    };
    delete sw[todayStr + "_" + orig];
    update({
      exerciseSwaps: sw
    });
  };

  /* ─── CRONOMETRU ─── */
  const startRest = (name, setNum, sec, color) => {
    setRestTimer({
      totalSec: sec,
      name,
      setNum,
      startTime: Date.now(),
      color: color || "#3b82f6"
    });
    setRestElapsed(0);
    if (soundOn) playSound("bifa");
  };
  const stopRest = () => {
    setRestTimer(null);
    setRestElapsed(0);
  };

  /* ─── PROGRAMUL DE AZI ─── */
  const PROG = vacation ? ACASA : PPL;
  const ziSel = PROG[selDay] || PROG[0];
  const ziAzi = PROG[todayDow] || PROG[0];
  const ctx = {
    S,
    g,
    update,
    F,
    level,
    xp,
    xpN,
    rank,
    stats,
    done,
    doneEx,
    doneW,
    streak,
    muscleXp,
    vacation,
    weightLog,
    liftLog,
    todayStr,
    todayDow,
    PROG,
    ziSel,
    ziAzi,
    selDay,
    setSelDay,
    toggleEx,
    logSets,
    stergeAzi,
    getLast,
    getRecomandare,
    swapEx,
    revertSwap,
    swapModal,
    setSwapModal,
    openEx,
    setOpenEx,
    showIncalzire,
    setShowIncalzire,
    showRelaxare,
    setShowRelaxare,
    restTimer,
    restElapsed,
    startRest,
    stopRest,
    setRestTimer,
    loggerSets,
    setLoggerSets,
    soundOn,
    setSoundOn,
    setNotif,
    setTab,
    exportStr,
    setExportStr,
    importStr,
    setImportStr,
    lastSaved,
    setLastSaved,
    getMult
  };
  if (!loaded) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center",
        color: "#a78bfa",
        fontSize: F.xl,
        marginTop: 80
      }
    }, "Se incarca...");
  }
  const tabs = [{
    k: "sala",
    i: "🏋️",
    l: "SALA"
  }, {
    k: "progres",
    i: "📈",
    l: "PROGRES"
  }, {
    k: "setari",
    i: "⚙️",
    l: "SETARI"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "linear-gradient(180deg,#0f172a,#020617)",
      color: "#e2e8f0",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      paddingBottom: "calc(120px + env(safe-area-inset-bottom))"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "calc(14px + env(safe-area-inset-top)) 16px 14px",
      background: "linear-gradient(180deg,rgba(15,23,42,.98),rgba(15,23,42,.85))",
      borderBottom: "2px solid rgba(255,255,255,.08)",
      position: "sticky",
      top: 0,
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      lineHeight: 1
    }
  }, "NIVEL ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: rank.color
    }
  }, level)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: rank.color,
      fontWeight: 800,
      marginTop: 4
    }
  }, rank.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 900,
      color: streak > 0 ? "#f59e0b" : "#475569"
    }
  }, "🔥 ", streak), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: "#64748b",
      fontWeight: 700
    }
  }, "zile la rand"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 16,
      background: "rgba(255,255,255,.07)",
      borderRadius: 8,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: Math.min(xp / xpN * 100, 100) + "%",
      background: "linear-gradient(90deg,#3b82f6,#a78bfa)",
      borderRadius: 8,
      transition: "width .5s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, xp, " / ", xpN, " XP"), getMult() > 1 ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#f59e0b",
      fontWeight: 800
    }
  }, "bonus ", getMult(), "x") : null), vacation ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      background: "rgba(245,158,11,.15)",
      border: "2px solid rgba(245,158,11,.4)",
      borderRadius: 10,
      fontSize: F.sm,
      color: "#fcd34d",
      fontWeight: 800,
      textAlign: "center"
    }
  }, "🏖️ MOD PLECARE ACTIV — antrenamente acasa, fara penalizari") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, tab === "sala" && /*#__PURE__*/React.createElement(TabSala, {
    ctx: ctx
  }), tab === "progres" && /*#__PURE__*/React.createElement(TabProgres, {
    ctx: ctx
  }), tab === "setari" && /*#__PURE__*/React.createElement(TabSetari, {
    ctx: ctx
  })), restTimer ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: "calc(96px + env(safe-area-inset-bottom))",
      left: 12,
      right: 12,
      zIndex: 500,
      padding: 14,
      borderRadius: 14,
      background: restElapsed >= restTimer.totalSec ? "rgba(34,197,94,.95)" : "rgba(15,23,42,.97)",
      border: "2px solid " + (restElapsed >= restTimer.totalSec ? "#4ade80" : restTimer.color),
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#94a3b8",
      fontWeight: 800
    }
  }, restElapsed >= restTimer.totalSec ? "POTI CONTINUA" : "PAUZA · setul " + restTimer.setNum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#e2e8f0",
      lineHeight: 1.1
    }
  }, Math.floor(Math.abs(restTimer.totalSec - restElapsed) / 60), ":", String(Math.abs(restTimer.totalSec - restElapsed) % 60).padStart(2, "0"))), /*#__PURE__*/React.createElement("button", {
    onClick: stopRest,
    style: {
      padding: "16px 20px",
      borderRadius: 12,
      border: "2px solid rgba(255,255,255,.35)",
      background: "rgba(0,0,0,.25)",
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#e2e8f0",
      fontSize: F.md,
      fontWeight: 900,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "GATA")) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 600,
      display: "flex",
      background: "rgba(2,6,23,.98)",
      borderTop: "2px solid rgba(255,255,255,.1)",
      paddingBottom: "env(safe-area-inset-bottom)"
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => setTab(t.k),
    style: {
      flex: 1,
      padding: "12px 2px 14px",
      background: "transparent",
      border: "none",
      borderTop: tab === t.k ? "4px solid #3b82f6" : "4px solid transparent",
      color: tab === t.k ? "#93c5fd" : "#64748b",
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      lineHeight: 1.1
    }
  }, t.i), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      marginTop: 3
    }
  }, t.l)))), notif ? /*#__PURE__*/React.createElement(Notif, {
    msg: notif,
    onDone: () => setNotif(null)
  }) : null, showLvl ? /*#__PURE__*/React.createElement(LvlModal, {
    level: level,
    rank: rank,
    onClose: () => setShowLvl(false)
  }) : null, questPopup ? /*#__PURE__*/React.createElement(QuestPopup, {
    quote: questPopup.quote,
    xpGain: questPopup.xpGain,
    multiplier: questPopup.multiplier,
    onClose: () => setQuestPopup(null)
  }) : null, swapModal ? /*#__PURE__*/React.createElement(SwapModal, {
    ctx: ctx
  }) : null);
}
