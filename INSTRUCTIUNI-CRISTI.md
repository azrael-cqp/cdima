# Sistem Antrenament — CRISTI DIMA (30 octombrie 2026, v1 dupa bioimpedanta)

Aceeasi aplicatie si acelasi format ca la Daniel (cum / lucreaza / atentie / daca e prea greu),
doar programul si regulile sunt schimbate. Pentru Cristi: 51 de ani, 183 cm, 91,85 kg,
24,2 % grasime, 69,7 kg masa slaba, 45 kg muschi scheletic (mult peste rang), grasime
viscerala 10, talie/sold 0,99 -> strategie de RECOMPOZITIE cu deficit mic. Obiectiv: forta
la compuse + hipertrofie la izolare.

## Fisiere
1. **app.compiled.js** — aplicatia cu programul lui Cristi
2. **index.html** — acelasi ca la Daniel, nu se schimba
3. **INSTRUCTIUNI-CRISTI.md** — acest fisier
4. **Program-Antrenament-Cristi-Dima.pdf** — programul complet, de dat lui Cristi

## Deploy
Repo SEPARAT (alt deploy, alt link), ca sa nu se amestece datele cu ale tale sau ale lui Daniel.
1. Copiezi `index.html` din repo-ul tau in repo-ul nou.
2. Pui `app.compiled.js` langa el (numele cu PUNCT, exact asa).
3. Commit, astepti 2-3 minute, deschizi pe telefonul lui Cristi.
4. Baza de date locala are alt nume (`AntrenamentCristi_DB`), deci nu se suprascrie cu
   celelalte aplicatii daca le deschide pe acelasi telefon.
5. La prima deschidere NU apare notificarea de nivel recalculat — porneste curat de la nivelul 1.

## Programul (Lower / Upper / Lower / Upper)

| Zi | Antrenament | Exercitii | Serii | Durata |
|---|---|---|---|---|
| Luni | INFERIOR A — genuflexiune + abdomen | 5 + 2 abd | 19 | ~65 min |
| Marti | SUPERIOR A — indreptari + impingere | 6 | 20 | ~70 min |
| Miercuri | PAUZA (optional mers 30-40 min) | — | — | — |
| Joi | INFERIOR B — fesieri + cvadriceps + abdomen | 5 + 2 abd | 19 | ~65 min |
| Vineri | SUPERIOR B — tragere + piept plat | 6 | 20 | ~65 min |
| Sambata, Duminica | PAUZA | — | — | — |

Bicicleta de aer 5 min e primul "exercitiu" in fiecare zi de sala (obligatoriu, se bifeaza).

**Luni:** Bicicleta de aer 5 min · Genuflexiuni la Smith 4×5-8 (3 min) · Presa de picioare 3×10-12 ·
Flexii femurali sezand 3×10-12 · Extensii de genunchi 3×12-15 · Crunch la aparat 3×12-15 ·
Presa Pallof la cablu 3×12/parte

**Marti:** Bicicleta de aer 5 min · Indreptari cu bara (trap bar daca are) 4×4-6 (3 min) ·
Presa inclinata la Smith 30° 4×5-8 (3 min) · Helcometru priza neutra 3×8-10 · Pec deck 3×10-12 ·
Face pull 3×15 · Extensii triceps la cablu 3×10-12

**Joi:** Bicicleta de aer 5 min · Hip thrust la aparat 4×8-10 · Hack squat 3×8-10 (2,5 min) ·
Extensii de genunchi la o pierna 3×12-15 · Flexii femurali sezand 3×12-15 · Crunch la aparat 3×12-15 ·
Plank 3×45-60 s

**Vineri:** Bicicleta de aer 5 min · Presa cu gantere pe banca dreapta, priza neutra 4×6-10 (3 min) ·
Tractiuni asistate la aparat 4×6-10 (2,5 min) · Helcometru priza larga 3×8-10 · Ramat sezand la aparat 3×10-12 ·
Fluturari inverse la aparat 3×15 · Curl predicator la aparat 3×8-12

## Ce e diferit fata de programul lui Daniel
- Ordinea e Lower / Upper / Lower / Upper (Daniel are Upper / Lower).
- Forta la compuse: 4-8 repetari, pauze 3 minute. Izolare 8-15. Compusele cu 2-3 repetari in
  rezerva, niciodata esec la indreptari si genuflexiuni.
- Fara gambe deloc (scos si din lista de grupe musculare din PROGRES).
- Abdomen doar luni si joi, ca finisher (nepenalizat): crunch la aparat + Pallof / plank. Nimic atarnat.
- Fara presiune pe umeri: scos press de umeri, fluturari laterale, extensii deasupra capului.
  Press-uri cu priza neutra, inclinare mica 30°, pec deck cu amplitudine limitata. Face pull si
  deltoizi posteriori raman (protejeaza umarul).
- Indreptarile sunt marti (superior A), primul exercitiu. Joi nu are RDL, ca sa nu se bata cu ele.
- Pasii butonului `+`: 1 kg face pull / Pallof / biceps, 2,5 kg press-uri, helcometru, ramat,
  triceps, izolari de picioare si crunch, 5 kg genuflexiuni, indreptari, hack squat, 10 kg presa si
  hip thrust. La tractiunile asistate progresia e inversa (scade asistenta) — scris in text.
- Deload o saptamana la fiecare 6 saptamani (scris in reguli).
- Nutritie = recompozitie: 2300-2400 kcal (deficit mic), proteina 150-170 g, ritm 0,3-0,5 kg/sapt.
- Cardio: mers 30-40 min miercuri si weekend, optional, nepenalizat. Niciodata dupa picioare.
- Incalzirea din aplicatie e refacuta: bicicleta de aer + serii progresive, text separat pentru
  superior / inferior. Relaxarea nu mai are intindere de gamba.

## Penalizari
Neschimbate: 10 XP pe exercitiu sarit intr-o zi de antrenament (inclusiv bicicleta de aer).
Abdomenul (finisher) nu se penalizeaza. Miercuri, sambata si duminica nu se penalizeaza.
Modul plecare ramane fara penalizari.

## Modul plecare (acasa)
Refacut pe aceeasi impartire Inferior / Superior, 4 zile, cu greutatea corpului, banda elastica,
rucsac cu carti si o masa solida. Fara gambe, abdomen doar la inferior, nimic deasupra capului.

## De verificat dupa deploy
- Jos sunt trei butoane: SALA, PROGRES, SETARI.
- Luni scrie INFERIOR, primul exercitiu "Bicicleta de aer 5 minute", al doilea "Genuflexiuni la aparatul Smith".
- Marti scrie SUPERIOR, al doilea exercitiu "Indreptari cu bara".
- Miercuri apare ca PAUZA DE MIJLOC, fara exercitii.
- Joi al doilea exercitiu e "Hip thrust la aparat", al treilea "Hack squat la aparat".
- Vineri al treilea exercitiu e "Tractiuni asistate la aparat".
- In PROGRES nu apare grupa "Gambe".
- Nu apare nicio notificare de nivel recalculat la prima deschidere.

## Cum se masoara progresul
La 4 saptamani, acelasi aparat, dimineata, pe nemancate: grasime % (tinta sub 22 % la 3 luni,
sub 20 % la 5-6), muschi scheletic (nu sub 44 kg), grasime viscerala (sub 9), talie/sold
(sub 0,92), greutatile de pe bara (in crestere). Plus poze fata / profil / spate.

## De ajustat
Daca in saptamanile 3-4 simte spatele jos obosit marti (genuflexiuni luni + indreptari marti),
inversam luni cu joi. Programul de baza ramane acelasi.
