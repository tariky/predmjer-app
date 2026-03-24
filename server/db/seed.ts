import { Database } from "bun:sqlite";
import { createSchema } from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DB_PATH || "./data/app.db";
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
createSchema(db);

// Create super admin (password: admin123)
const hashedPassword = await Bun.password.hash("admin123", { algorithm: "bcrypt" });

db.query(`
  INSERT OR IGNORE INTO users (username, password_hash, display_name, role, company_id)
  VALUES (?, ?, ?, ?, ?)
`).run("admin", hashedPassword, "Super Admin", "super_admin", null);

// Create test company
db.query(`
  INSERT OR IGNORE INTO companies (name, address, phone, email, subscription_expires_at)
  VALUES (?, ?, ?, ?, ?)
`).run("Test Firma d.o.o.", "Ulica 1, Sarajevo", "033 123 456", "info@testfirma.ba", "2030-01-01T00:00:00.000Z");

// Create test user (password: test123)
const testPassword = await Bun.password.hash("test123", { algorithm: "bcrypt" });
db.query(`
  INSERT OR IGNORE INTO users (username, password_hash, display_name, role, company_id)
  VALUES (?, ?, ?, ?, (SELECT id FROM companies WHERE name = 'Test Firma d.o.o.'))
`).run("test", testPassword, "Test Korisnik", "user");

// Seed system item groups
const groups = [
  "Pripremni radovi",
  "Zemljani radovi",
  "Betonski i armiranobetonski radovi",
  "Zidarski radovi",
  "Tesarski radovi",
  "Armirački radovi",
  "Izolaterski radovi",
  "Krovopokrivački radovi",
  "Limarski radovi",
  "Stolarski radovi",
  "Bravarski radovi",
  "Keramičarski radovi",
  "Podopolagački radovi",
  "Soboslikarski i ličilački radovi",
  "Fasaderski radovi",
  "Instalaterski radovi - vodovod i kanalizacija",
  "Instalaterski radovi - grijanje",
  "Elektroinstalaterski radovi",
];

const insertGroup = db.query(
  "INSERT OR IGNORE INTO item_groups (name, created_by) VALUES (?, NULL)"
);

for (const name of groups) {
  insertGroup.run(name);
}

// Seed library items — comprehensive list for all groups
const items: { group: string; name: string; description: string; unit: string; unit_price: number }[] = [
  // ─── Pripremni radovi ───
  { group: "Pripremni radovi", name: "Čišćenje terena", description: "Čišćenje i krčenje građevinskog terena od rastinja, grmlja, korovskog bilja i ostalog materijala. Uključuje utovar i odvoz materijala na deponiju do 5 km udaljenosti.", unit: "m²", unit_price: 0 },
  { group: "Pripremni radovi", name: "Rušenje postojećih objekata", description: "Rušenje postojećih objekata ili dijelova objekata ručnim i mehaničkim putem. Uključuje razvrstavanje materijala, utovar i odvoz šuta na deponiju do 10 km udaljenosti.", unit: "m³", unit_price: 0 },
  { group: "Pripremni radovi", name: "Uklanjanje asfaltnog zastora", description: "Uklanjanje postojećeg asfaltnog zastora debljine do 8 cm pomoću mehanizacije. Uključuje rezanje ivica, utovar i odvoz materijala na deponiju ili reciklažno postrojenje.", unit: "m²", unit_price: 0 },
  { group: "Pripremni radovi", name: "Skidanje humusa", description: "Skidanje i deponovanje humusa prosječne debljine 20-30 cm buldožerom ili grederom. Humus se odlaže na privremenu deponiju u krugu gradilišta radi kasnijeg korišćenja pri uređenju terena.", unit: "m²", unit_price: 0 },
  { group: "Pripremni radovi", name: "Geodetsko obilježavanje", description: "Geodetsko obilježavanje trase, osi objekta i karakterističnih tačaka prema projektu. Izrada geodetskih podloga, postavljanje repera i geodetskih oznaka.", unit: "pauš.", unit_price: 0 },
  { group: "Pripremni radovi", name: "Izgradnja gradilišne ograde", description: "Postavljanje privremene gradilišne ograde visine 2 m od panelnih elemenata ili daske i metalnih stubova. Uključuje montažu, demontažu i odvoz po završetku radova.", unit: "m¹", unit_price: 0 },
  { group: "Pripremni radovi", name: "Gradilišna tabla", description: "Izrada i postavljanje gradilišne table prema zakonskim propisima. Tabla od vodootpornih materijala s potrebnim podacima o investitoru, projektantu i izvođaču.", unit: "kom", unit_price: 0 },
  { group: "Pripremni radovi", name: "Privremeni priključak struje", description: "Izgradnja privremenog elektroenergetskog priključka gradilišta na distributivnu mrežu. Uključuje projektovanje, pribavljanje dozvola i montažu privremene razvodne kutije.", unit: "pauš.", unit_price: 0 },
  { group: "Pripremni radovi", name: "Privremeni priključak vode", description: "Izgradnja privremenog vodovodnog priključka gradilišta na gradsku vodovodnu mrežu. Uključuje postavljanje vodomjera, cijevi i sve montažne radove.", unit: "pauš.", unit_price: 0 },
  { group: "Pripremni radovi", name: "Gradilišni kontejner", description: "Postavljanje, opremanje i uklanjanje gradilišnih kontejnera za upravu gradilišta i sanitarni čvor. Uključuje priključke struje i vode.", unit: "kom", unit_price: 0 },

  // ─── Zemljani radovi ───
  { group: "Zemljani radovi", name: "Široki iskop – mašinski", description: "Mašinski iskop za temelje, podrume i druge građevinske jame u tlu I-III kategorije. Uključuje planiranje dna iskopa, utovar materijala i odvoz iskopine na deponiju do 5 km.", unit: "m³", unit_price: 0 },
  { group: "Zemljani radovi", name: "Iskop u tvrdom tlu – IV kategorija", description: "Mašinski iskop u tlu IV kategorije (čvrsta glina, laporac, mekši kamen) uz upotrebu kompresora i pneumatskih čekića gdje je potrebno.", unit: "m³", unit_price: 0 },
  { group: "Zemljani radovi", name: "Ručni iskop", description: "Ručni iskop u blizini instalacija, u uskim rovovima i mjestima nedostupnim mehanizaciji. Iskop u tlu I-III kategorije, s utovarom materijala u prijevozna sredstva.", unit: "m³", unit_price: 0 },
  { group: "Zemljani radovi", name: "Iskop rovova za instalacije", description: "Mašinski iskop rovova za podzemne instalacije (vodovod, kanalizacija, struja) širine do 1,20 m. Odlaganje materijala pokraj rova za kasniji zatrpaj ili odvoz viška.", unit: "m³", unit_price: 0 },
  { group: "Zemljani radovi", name: "Zatrpavanje i kompaktiranje", description: "Zatrpavanje iskopanih rovova i jama odabranim materijalom u slojevima do 30 cm uz kompaktiranje vibracionim nabijačem do min. 95% Proctorove gustine.", unit: "m³", unit_price: 0 },
  { group: "Zemljani radovi", name: "Nasipanje i planiranje terena", description: "Nasipanje, razastiranje i planiranje terena dovezenim materijalom (šljunak, drobljeni kamen) u slojevima uz kompaktiranje do propisane zbijenosti.", unit: "m³", unit_price: 0 },
  { group: "Zemljani radovi", name: "Planiranje dna iskopa", description: "Fino planiranje i nivelisanje dna iskopa ručno i mašinski s tolerancijom ±2 cm. Uključuje uklanjanje svih neravnina i pripremu podloge za temeljni beton.", unit: "m²", unit_price: 0 },
  { group: "Zemljani radovi", name: "Odvoz viška materijala", description: "Utovar viška iskopnog materijala i odvoz na odobrenu deponiju na udaljenost do 10 km. Cijena uključuje troškove deponiranja.", unit: "m³", unit_price: 0 },
  { group: "Zemljani radovi", name: "Drenažni nasip oko temelja", description: "Izrada drenažnog sloja od drobljenog kamena frakcije 16-32 mm oko temelja i ispod temeljne ploče. Kompaktiranje i profilisanje prema nacrtu.", unit: "m³", unit_price: 0 },
  { group: "Zemljani radovi", name: "Geotekstil separacijski", description: "Polaganje netkane geotekstilne tkanine (200 g/m²) kao separacionog ili filtracionog sloja između tla i drenažnog nasipa. Preklopi min. 30 cm.", unit: "m²", unit_price: 0 },

  // ─── Betonski i armiranobetonski radovi ───
  { group: "Betonski i armiranobetonski radovi", name: "Temeljni beton podloga C12/15", description: "Izrada podložnog betona klase C12/15 u sloju debljine 5-10 cm ispod armirano-betonskih temelja. Uključuje transport, ugradnju i njegovanje betona.", unit: "m³", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "AB temeljna traka C25/30", description: "Izrada armirano-betonskih temeljnih traka od betona klase C25/30. Uključuje postavljanje i skidanje oplate, ugradnju betona vibro-iglom i njegovanje. Armatura posebno.", unit: "m³", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "AB temeljna ploča C25/30", description: "Izrada armirano-betonske temeljne ploče od betona klase C25/30, debljine prema projektu. Uključuje postavljanje oplata, ugradnju betona i njegu. Armatura posebno.", unit: "m³", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "AB stub/stup C30/37", description: "Izrada armirano-betonskih stubova od betona klase C30/37. Uključuje montažu i demontažu metalne oplate, ugradnju betona vibro-iglom, njegu. Armatura posebno.", unit: "m³", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "AB greda i nadvratnik C25/30", description: "Izrada armirano-betonskih greda, preklopnih greda i nadvratnika od betona klase C25/30. Uključuje postavljanje i uklanjanje oplate, ugradnju betona. Armatura posebno.", unit: "m³", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "AB međuspratna ploča C25/30", description: "Izrada armirano-betonske međuspratne ploče od betona klase C25/30, debljine 14-20 cm prema statičkom proračunu. Uključuje punu oplatu, ugradnju betona. Armatura posebno.", unit: "m³", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "AB stepenišna rampa C25/30", description: "Izrada armirano-betonske stepenišne rampe i podesta od betona klase C25/30. Uključuje izradu i skidanje oplate složene geometrije. Armatura posebno.", unit: "m³", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "AB zid podruma C25/30 XC2", description: "Izrada armirano-betonskog zida podruma debljine 20-30 cm od vodononepropusnog betona klase C25/30 XC2. Uključuje obostranu oplatu, ugradnju betona. Armatura posebno.", unit: "m³", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "Betonska podna ploča C20/25", description: "Izrada betonske podne ploče od betona klase C20/25 debljine 10-15 cm s metalnom mrežom Q335. Uključuje podlogu od šljunka, ugradnju betona i zaglađivanje površine.", unit: "m²", unit_price: 0 },
  { group: "Betonski i armiranobetonski radovi", name: "Injektiranje i sanacija betona", description: "Sanacija oštećenog betona: čišćenje oštećenih zona, injektiranje pukotina epoksidnom smolom ili cementnom suspenzijom, reprofilacija CC mortom klase R3.", unit: "m²", unit_price: 0 },

  // ─── Zidarski radovi ───
  { group: "Zidarski radovi", name: "Zidanje blok-opekom 25 cm", description: "Zidanje vanjskih zidova od šuplje blok-opeke dimenzija 25x20x19 cm u produžnom morthu M5. Uključuje materijal i radnu snagu.", unit: "m²", unit_price: 0 },
  { group: "Zidarski radovi", name: "Zidanje pregradnih zidova 12 cm", description: "Zidanje unutarnjih pregradnih zidova od pune ili šuplje opeke debljine 12 cm u produžnom morthu M5.", unit: "m²", unit_price: 0 },
  { group: "Zidarski radovi", name: "Zidanje termoizolirajućim blokom 30 cm", description: "Zidanje vanjskih zidova od termoizolirajućeg poroton/ytong bloka debljine 30 cm u tankom ljepilu debljine 1-3 mm.", unit: "m²", unit_price: 0 },
  { group: "Zidarski radovi", name: "Horizontalni serklaž AB 25/20", description: "Izrada armirano-betonskog horizontalnog serklažnog pojasa dimenzija 25x20 cm od betona C20/25 s armaturom prema projektu.", unit: "m¹", unit_price: 0 },
  { group: "Zidarski radovi", name: "Vertikalni serklaž AB 20/20", description: "Izrada armirano-betonskih vertikalnih serklaža dimenzija 20x20 cm od betona C20/25 na uglovima i uz otvore.", unit: "m¹", unit_price: 0 },
  { group: "Zidarski radovi", name: "Žbukanje produžnim mortom", description: "Jednoslojno žbukanje zidova i stropova produžnim mortom M5 debljine 1,5 cm. Uključuje pripremu podloge, nanošenje i zaglađivanje žbuke.", unit: "m²", unit_price: 0 },
  { group: "Zidarski radovi", name: "Dvoslojno žbukanje fino", description: "Dvoslojno žbukanje zidova grobim slojem produžnog morta i finišom gips-vapnenim gleterom debljine 1-2 mm. Površina gotova za bojanje.", unit: "m²", unit_price: 0 },
  { group: "Zidarski radovi", name: "Zidanje dimnjaka – sistem elementi", description: "Zidanje jednokanalnog dimnjaka od šamotnih sistema-elemenata Ø 180 mm s vanjskim keramičkim oklopom. Uključuje fundament dimnjaka i montažu kape.", unit: "m¹", unit_price: 0 },
  { group: "Zidarski radovi", name: "Ugradnja prozorske klupice", description: "Ugradnja predgotovljene ili kamene prozorske klupice širine 25 cm u cementnom morthu M10. Uključuje pripremu ležišta i fugiranje.", unit: "m¹", unit_price: 0 },
  { group: "Zidarski radovi", name: "Zidanje potpornog zida lomljenim kamenom", description: "Zidanje potpornog zida od lomljenog kamena u cementnom morthu M10. Kamen se slaže s pravilnim vezivanjem, s odušnim otvorima.", unit: "m³", unit_price: 0 },

  // ─── Tesarski radovi ───
  { group: "Tesarski radovi", name: "Oplata temelja – daščana", description: "Izrada i postavljanje jednostrane i dvostrane daščane oplate za temeljne trake i samce od konstruktivne daske debljine 24 mm.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Oplata zidova – sistemska metalna", description: "Postavljanje i skidanje sistemske metalne oplate (Doka, Peri ili sl.) za armirano-betonske zidove visine do 4 m.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Oplata ploče – šperploča na stupcima", description: "Izrada i postavljanje oplate međuspratne ploče od vodootporne šperploče (18 mm) na čeličnim ili drvenim stupcima i poprečnim nosačima.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Oplata stubova – metalna", description: "Postavljanje i skidanje sistemske metalne oplate za armirano-betonske stubove kvadratnog ili pravokutnog presjeka visine do 4 m.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Krovni noseći sistem – gredna krovišta", description: "Izrada i montaža drvenog krovnog nosećeg sistema od suhe rezane grade čet. 14/16 cm po projektu. Uključuje zaštitnu impregnaciju.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Krovni noseći sistem – stolični krov", description: "Izrada i montaža drvene stolične krovne konstrukcije (rožišta, stolice, slemenjača, podrožnice) od suhe četinarske grade.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Oplata za AB stepenice", description: "Izrada složene drvene oplate za armirano-betonske stepenice s gazištima, podgazištem i podestom.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Postavljanje letvi i kontra-letvi", description: "Postavljanje drvenih letvi i kontra-letvi na krovnu konstrukciju radi prozračivanja i kao podloge za krovni pokrov.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Drvena oplata za nadstrešnice", description: "Izrada i postavljanje vidljive drvene oplate od antimonske daske za sofite nadstrešnica, balkona i trijemova.", unit: "m²", unit_price: 0 },
  { group: "Tesarski radovi", name: "Postavljanje OSB ploča na pod", description: "Polaganje OSB ploča debljine 18 mm (klasa 3 – vlago-otporna) kao suhe podloge za pod na drvenim gredama.", unit: "m²", unit_price: 0 },

  // ─── Armirački radovi ───
  { group: "Armirački radovi", name: "Armatura B500B – temelje", description: "Sječenje, savijanje i ugradnja rebrastog armaturnog čelika B500B promjera Ø8-Ø25 mm za armirano-betonske temelje prema armaturnom planu.", unit: "kg", unit_price: 0 },
  { group: "Armirački radovi", name: "Armatura B500B – zidovi", description: "Sječenje, savijanje i ugradnja rebrastog armaturnog čelika B500B promjera Ø8-Ø16 mm za armirano-betonske zidove prema projektu.", unit: "kg", unit_price: 0 },
  { group: "Armirački radovi", name: "Armatura B500B – ploče", description: "Sječenje, savijanje i ugradnja rebrastog armaturnog čelika B500B promjera Ø8-Ø14 mm za međuspratne i temeljne ploče.", unit: "kg", unit_price: 0 },
  { group: "Armirački radovi", name: "Armatura B500B – grede i stubovi", description: "Sječenje, savijanje i ugradnja glavnih nosača i spona od čelika B500B prema armaturnom planu za grede i stubove.", unit: "kg", unit_price: 0 },
  { group: "Armirački radovi", name: "Armaturna mreža Q335", description: "Postavljanje varene armaturne mreže Q335 (Ø7 mm, mreža 15x15 cm) kao jednoslojna armatura betonskih ploča i poda. Preklopi min. 30 cm.", unit: "m²", unit_price: 0 },
  { group: "Armirački radovi", name: "Armaturna mreža Q503", description: "Postavljanje varene armaturne mreže Q503 (Ø8 mm, mreža 15x15 cm) kao pojačana armatura ploča izloženih većim opterećenjima.", unit: "m²", unit_price: 0 },
  { group: "Armirački radovi", name: "Armatura glatka R B240A", description: "Sječenje, savijanje i ugradnja glatkog armaturnog čelika R B240A promjera Ø6-Ø12 mm za konstruktivne elemente.", unit: "kg", unit_price: 0 },
  { group: "Armirački radovi", name: "Postavljanje distancera", description: "Nabavka i postavljanje plastičnih ili betonskih distancera raznih veličina za osiguranje propisanog zaštitnog sloja betona.", unit: "kom", unit_price: 0 },
  { group: "Armirački radovi", name: "Nastavci armature – mehaničko spajanje", description: "Izrada nastavaka armirano-betonskih elemenata mehaničkim spajanjem (mufa spojevi) za šipke Ø16-Ø32 mm.", unit: "kom", unit_price: 0 },

  // ─── Izolaterski radovi ───
  { group: "Izolaterski radovi", name: "Hidroizolacija temelja – bitumenska", description: "Izrada hidroizolacije temelja i podrumskih zidova nanosima bitumenske emulzije u dva sloja s modifikovanim bitumenskim trakom (SBS, debljine min. 4 mm).", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Hidroizolacija ravnog krova – 2x bitumenski trak", description: "Izrada dvostruke hidroizolacije ravnog krova polaganjem dva sloja SBS modifikovanog bitumenskog traka ukupne debljine min. 8 mm.", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Termoizolacija zida – EPS ploče", description: "Postavljanje termoizolacionih ploča od EPS 70 (λ ≤ 0,038 W/mK) debljine prema projektu, lijepljenjem i mehaničkim pričvršćivanjem tiplama (min. 6 kom/m²).", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Termoizolacija zida – mineralna vuna", description: "Postavljanje termoizolacionih ploča od kamene vune (MW, λ ≤ 0,035 W/mK, klasa A1) debljine prema projektu, lijepljenjem i mehaničkim sidrenjem.", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Termoizolacija ravnog krova – XPS ploče", description: "Polaganje termoizolacionih ploča od XPS (λ ≤ 0,034 W/mK, tlačna čvrstoća ≥ 300 kPa) debljine prema projektu na ravni krov.", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Termoizolacija poda – EPS ispod estriha", description: "Postavljanje termoizolacionih ploča od EPS 100 ili EPS 150 debljine prema projektu na konstruktivnu ploču poda prije plovećeg estriha.", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Zvučna izolacija međuspratne ploče", description: "Polaganje akustičnih ploča od mineralne vune ispod plovećeg estriha radi smanjenja udarnog zvuka između etaža.", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Hidroizolacija mokrog čvora – cementna membrana", description: "Izrada vodonepropusne hidroizolacije podnih i zidnih površina mokrog čvora dvokomponentnom cementnom membranom (min. 2 sloja).", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Parozaštitna folija – PE", description: "Polaganje polietilenske parozaštitne folije debljine ≥ 0,2 mm na podlogu krova ili stropa ispred termoizolacije. Preklopi min. 15 cm.", unit: "m²", unit_price: 0 },
  { group: "Izolaterski radovi", name: "Termoizolacija cijevi", description: "Termoizolacija instalacijskih cijevi montažnim cijevnim oblogama od mineralne vune s aluminijskom folijom debljine prema projektu.", unit: "m¹", unit_price: 0 },

  // ─── Krovopokrivački radovi ───
  { group: "Krovopokrivački radovi", name: "Pokrivanje betonskim crijepom", description: "Pokrivanje krovne plohe betonskim crijepom na prethodno postavljene letve. Uključuje rezanje, sljemenjake i zabatni crijep.", unit: "m²", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Pokrivanje keramičkim crijepom", description: "Pokrivanje krovne plohe keramičkim pečenim crijepom prema projektu. Uključuje rezanje pri detaljima, sljemenjake i brtvljenje.", unit: "m²", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Pokrivanje trapeznim limom", description: "Pokrivanje krovne plohe profilisanim trapeznim čeličnim limom debljine ≥ 0,5 mm s poliesterskim premazom, pričvršćivanjem samoureznim vijcima.", unit: "m²", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Pokrivanje bitumenskom šindrom", description: "Pokrivanje krovne plohe bitumenskom šindrom na prethodno postavljenu OSB ili daščanu oplatu. Uključuje startnu šindru i sljemene.", unit: "m²", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Postavljanje kontra-letava i letava", description: "Nabava i postavljanje drvenih kontra-letava (40×60 mm) i poprečnih letava (30×50 mm) za nošenje crjepa. Impregnirano drvo.", unit: "m²", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Postavljanje difuzijske kišne brane", description: "Postavljanje difuzijske paropropusne kišne brane na krovensku konstrukciju ispod kontra-letava. Preklopi min. 15 cm.", unit: "m²", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Izvedba sljemena", description: "Izvedba sljemena kosog krova postavljanjem sljemenjaka u produžnom malteru ili suhim sistemom sidrenja.", unit: "m¹", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Ugradnja krovnih prozora", description: "Ugradnja krovnog prozora u kosi krov, uključujući isjecanje crjepa, montažu ugradnog okvira i brtvljenje.", unit: "kom", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Zaštitni sloj šljunka na ravnom krovu", description: "Polaganje zaštitnog sloja šljunka granulacije 16/32 mm, debljine min. 5 cm, na površinu neprohodnog ravnog krova.", unit: "m²", unit_price: 0 },
  { group: "Krovopokrivački radovi", name: "Ugradnja snježnih hvatača", description: "Nabava i montaža čeličnih snježnih hvatača na krovnu plohu u redovima prema nagibu i opterećenju snijegom.", unit: "m¹", unit_price: 0 },

  // ─── Limarski radovi ───
  { group: "Limarski radovi", name: "Opšav dimnjaka", description: "Izrada i ugradnja opšava dimnjaka na kosinom krovu od pocinčanog čeličnog lima debljine 0,60 mm, uključujući gornji i bočne opšave.", unit: "kom", unit_price: 0 },
  { group: "Limarski radovi", name: "Opšav zida i atike", description: "Izrada i ugradnja horizontalnog i vertikalnog opšava mjesta spoja krova s vertikalnim zidom ili atikom od pocinčanog lima 0,60 mm.", unit: "m¹", unit_price: 0 },
  { group: "Limarski radovi", name: "Okapnica krovišta", description: "Nabava i ugradnja horizontalne okapnice krovne plohe od pocinčanog lima 0,60 mm s kapilarnom barijerom.", unit: "m¹", unit_price: 0 },
  { group: "Limarski radovi", name: "Oluk – viseći polukružni", description: "Nabava i montaža visećeg polukružnog krovnog oluka (ø 125 mm) od pocinčanog lima 0,60 mm, uključujući kuke, lijevke i spojnice.", unit: "m¹", unit_price: 0 },
  { group: "Limarski radovi", name: "Odvodna cijev – okrugla vertikalna", description: "Nabava i montaža okrugle vertikalne odvodne cijevi (ø 87 ili ø 100 mm) od pocinčanog lima, uključujući koljenska i kuke.", unit: "m¹", unit_price: 0 },
  { group: "Limarski radovi", name: "Opšav prozora i vrata – aluminijski", description: "Nabava i ugradnja aluminijskog opšava na donju i bočne strane vanjskih prozora i vrata s kapljičnom lajsnom.", unit: "m¹", unit_price: 0 },
  { group: "Limarski radovi", name: "Pokrivanje atike – dvostruki stojući šav", description: "Pokrivanje gornje plohe i vanjske strane atike pocinčanim limom 0,70 mm u tehnici dvostrukog stojećeg šava.", unit: "m²", unit_price: 0 },
  { group: "Limarski radovi", name: "Oluk – unutrašnji ugrađeni", description: "Nabava i ugradnja unutrašnjeg četverokutnog oborinskog oluka od pocinčanog lima 0,70 mm u krovnoj konstrukciji.", unit: "m¹", unit_price: 0 },
  { group: "Limarski radovi", name: "Krovni prolaz za instalacije", description: "Izrada i ugradnja limenog opšava za prolaz instalacijske cijevi kroz krovnu plohu od pocinčanog lima 0,60 mm.", unit: "kom", unit_price: 0 },

  // ─── Stolarski radovi ───
  { group: "Stolarski radovi", name: "Unutrašnja vrata – puna HDF", description: "Nabava i ugradnja unutrašnjih sobnih vrata s punim HDF krilom, drvenom štokom i bravarskim okovima. Dimenzija prema projektu.", unit: "kom", unit_price: 0 },
  { group: "Stolarski radovi", name: "Unutrašnja vrata – staklena", description: "Nabava i ugradnja unutrašnjih vrata s krilom sa staklenom ispunom (kaljeno sigurnosno staklo), uokvireno MDF ili aluminijskim ramom.", unit: "kom", unit_price: 0 },
  { group: "Stolarski radovi", name: "Klizna vrata – ugrađena u zid", description: "Nabava i ugradnja sistema kliznih vrata koja se uvlače u zidni džep (pocket door sistem), uključujući metalnu konstrukciju i mehanizam.", unit: "kom", unit_price: 0 },
  { group: "Stolarski radovi", name: "Prozor – PVC petokomorni s IZO staklom", description: "Nabava i ugradnja PVC prozora petokomornog profila s IZO dvokomornim staklom (4-16-4 Ar), dimenzija prema projektu.", unit: "kom", unit_price: 0 },
  { group: "Stolarski radovi", name: "Vanjska ulazna vrata – PVC ili ALU", description: "Nabava i ugradnja vanjskih ulaznih vrata od PVC ili aluminijskog profila s toplinskim prekidom i višetočkastim bravnim sistemom.", unit: "kom", unit_price: 0 },
  { group: "Stolarski radovi", name: "Drveni pod – lamelni parket", description: "Nabava i polaganje troslojnog lamelnog parketa (hrast ili bukva, gornji sloj ≥ 3,5 mm) lijepljenjem na estrih.", unit: "m²", unit_price: 0 },
  { group: "Stolarski radovi", name: "Drvena zidna/stropna obloga", description: "Izrada i postavljanje drvene letvičaste zidne ili stropne obloge od profiliranih dasaka na podkonstrukciju.", unit: "m²", unit_price: 0 },
  { group: "Stolarski radovi", name: "Drvena stubišna obloga", description: "Nabava i montaža drvene obloge stepenica i podesta (hrast ili bukva, gazište min. 40 mm) na AB konstrukciju stepenica.", unit: "kom", unit_price: 0 },
  { group: "Stolarski radovi", name: "Drvena ograda stubišta", description: "Izrada i montaža drvene ograde stubišta s tokarenim stupićima i rukohvatom. Uključuje brušenje i lakiranje.", unit: "m¹", unit_price: 0 },
  { group: "Stolarski radovi", name: "Garderobni ormar – ugrađeni", description: "Izrada i ugradnja ugrađenog garderobnog ormara po mjeri od iverice obložene melaminskom folijom, s kliznim ili šarkirnim vratima.", unit: "kom", unit_price: 0 },

  // ─── Bravarski radovi ───
  { group: "Bravarski radovi", name: "Čelična protuprovaljna vrata", description: "Nabava i ugradnja čeličnih protuprovalnih ulaznih vrata klase RC2 s termoizoliranim krilom i višetočkastim bravnim sistemom.", unit: "kom", unit_price: 0 },
  { group: "Bravarski radovi", name: "Garažna vrata – sekcijska automatska", description: "Nabava i ugradnja sekcijskog garažnog panela s elektromotorom, daljinskim upravljanjem i sigurnosnim senzorima.", unit: "kom", unit_price: 0 },
  { group: "Bravarski radovi", name: "Metalna ograda terase/balkona", description: "Izrada i montaža metalne ograde terase ili balkona od čeličnih profila prema projektu, visine min. 100 cm. Antikorozivna obrada.", unit: "m¹", unit_price: 0 },
  { group: "Bravarski radovi", name: "Metalna ograda stubišta – inoks", description: "Izrada i montaža metalne ograde stubišta od nehrđajućeg čelika s inoks rukohvatom Ø 42,4 mm. Visina min. 90 cm.", unit: "m¹", unit_price: 0 },
  { group: "Bravarski radovi", name: "Čelična konstrukcija nadstrešnice", description: "Izrada i montaža čelične konstrukcije nadstrešnice od profila S235 prema statičkom projektu. Antikorozivna obrada.", unit: "kg", unit_price: 0 },
  { group: "Bravarski radovi", name: "Vanjska aluminijska roletna", description: "Nabava i ugradnja vanjske aluminijske navijajuće roletne s lamelama punjenim PUR pjenom, ručni ili motorni pogon.", unit: "kom", unit_price: 0 },
  { group: "Bravarski radovi", name: "Čelična rešetka za prozor", description: "Izrada i ugradnja fiksne zaštitne čelične rešetke za prozore prema projektu. Antikorozivna obrada praškastim lakom.", unit: "m²", unit_price: 0 },
  { group: "Bravarski radovi", name: "Metalni poštanski sandučić", description: "Nabava i ugradnja poštanskog sandučića od nehrđajućeg čelika AISI 304 s bravom, za ugradnju ili fiksiranje na zid.", unit: "kom", unit_price: 0 },
  { group: "Bravarski radovi", name: "Penjačice za pristup krovu", description: "Nabava i montaža zidnih čeličnih penjačica od pocinkovanih prečki za pristup krovu prema sigurnosnim propisima.", unit: "m¹", unit_price: 0 },

  // ─── Keramičarski radovi ───
  { group: "Keramičarski radovi", name: "Keramičke pločice na podu – unutrašnje", description: "Nabava i polaganje glaziranih keramičkih pločica na pod unutrašnjih prostora lijepljenjem fleksibilnim cementnim ljepilom C2TE. Fugiranje.", unit: "m²", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Keramičke pločice na zidu", description: "Nabava i postavljanje glaziranih zidnih keramičkih pločica na zidne površine mokrog čvora ili kuhinje lijepljenjem fleksibilnim ljepilom.", unit: "m²", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Porculanske pločice – gres rektificirane", description: "Nabava i polaganje rektificiranih gres porcellanato pločica visoke gustoće na pod, metodom dvostrukog nanosa ljepila.", unit: "m²", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Terasne pločice – protupliznive R11", description: "Nabava i polaganje vanjskih keramičkih pločica za terase i balkone (R11, mraz-otporne) na hidrizoliran pod s padom.", unit: "m²", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Mozaik pločice – stakleni ili keramički", description: "Nabava i postavljanje mozaik pločica (staklo ili keramika, format 2,5×2,5 cm na mrežici) fleksibilnim bijelim ljepilom.", unit: "m²", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Fugiranje – epoxy", description: "Naknadno fugiranje prethodno postavljenih pločica dvokomponentnom epoxy fugirom. Uključuje čišćenje fuga i poliranje.", unit: "m²", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Keramičke stepenice – gaz i čelnik", description: "Nabava i postavljanje keramičkih pločica na gazišta i čelnike stepenica s ugaonim metalnim profilom na prednjem rubu.", unit: "kom", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Cementni estrih s padovima za odvod", description: "Izrada cementnog estriha s padom prema odvodu (min. 1,5–2%) u kupatilu ili na terasi. Uključuje ugradnju sifona.", unit: "m²", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Ugradnja WC školjke – konzolna", description: "Ugradnja zidno okačenog konzolnog WC uređaja na montažni element (Geberit), spajanje na kanalizaciju i vodu.", unit: "kom", unit_price: 0 },
  { group: "Keramičarski radovi", name: "Ugradnja linearnog tuš kanala", description: "Nabava i ugradnja linearnog tuš kanala od inox čelika s priključkom na kanalizaciju Ø50 mm i dekorativnom rešetkom.", unit: "kom", unit_price: 0 },

  // ─── Podopolagački radovi ───
  { group: "Podopolagački radovi", name: "Priprema podloge pod pod", description: "Priprema i čišćenje betonske podloge prije polaganja podnih obloga. Krpanje manjih oštećenja cementnom špahtelmasom. Tolerancija ravnosti max. 3 mm na 2 m.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Cementni estrih d=5cm", description: "Izrada cementnog estriha debljine 5 cm od cementne mješavine C16/20 s armaturnom mrežom Q131. Polaganje na toplinsku/zvučnu izolaciju.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Polaganje keramičkih pločica na pod", description: "Polaganje keramičkih pločica na pod ljepljenjem fleksibilnim cementnim ljepilom C2TE. Format do 60×60 cm, I. klase kvaliteta.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Polaganje gresnih pločica na pod", description: "Polaganje gresnih rektificiranih pločica na pod ljepljenjem fleksibilnim ljepilom C2TE. Format 60×60 do 120×60 cm.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Polaganje laminatnog poda", description: "Polaganje laminatnog poda klase AC4/AC5, debljine min. 8 mm, plovećom metodom na PE foliju i akustični podložak 3 mm.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Polaganje inženjering parketa", description: "Polaganje višeslojnog inženjering parketa debljine 14–20 mm lijepljenjem elastičnim MS-polimernim ljepilom na izravnan estrih.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Polaganje vinilnih pločica (LVT/SPC)", description: "Polaganje vinilnog poda (LVT/SPC rigid core) plovećom metodom s click sustavom. Debljina min. 5 mm, razred upotrebe 33/34.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Ugradnja podnog grijanja (suhi sistem)", description: "Ugradnja sistema podnog grijanja suhom metodom s reflektirajućom pločom i PE-Xa cijevima Ø16×2 mm. Tlačna proba 6 bar/24h.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Hidroizolacija poda mokrog čvora", description: "Izrada hidroizolacije poda i prijelaza na zid u mokrim čvorovima dvoslojnom fleksibilnom cementnom masom (min. 2 kg/m²).", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Brušenje i lakiranje parketa", description: "Brušenje postojećeg parketa trofaznim strojem. Punjenje fuga kitom. Nanošenje temeljnog laka i dva završna sloja poliuretanskog laka.", unit: "m²", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Postavljanje podnih profila i sokli", description: "Postavljanje podnih prijelaznih profila i MDF ili PVC podnožnih letvi visine 6–10 cm uz zidove.", unit: "m¹", unit_price: 0 },
  { group: "Podopolagački radovi", name: "Demontaža postojeće podne obloge", description: "Mehanička demontaža postojeće podne obloge (keramika, laminat, parket) sa podloge. Uklanjanje ostataka ljepila. Odvoz šuta.", unit: "m²", unit_price: 0 },

  // ─── Soboslikarski i ličilački radovi ───
  { group: "Soboslikarski i ličilački radovi", name: "Gletanje zidova i plafona", description: "Fino gletanje zidnih i stropnih površina glet-masom u dva sloja s međubrušenjem. Postizanje ravnosti ≤2 mm/2 m.", unit: "m²", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Bojanje zidova unutarnjim lateksom", description: "Bojanje unutarnjih zidova i stropova disperzijskom bojom visoke pokrivenosti u dva sloja valjkom ili pištoljem.", unit: "m²", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Bojanje fasade mineralnom bojom", description: "Bojanje vanjskih fasadnih površina silikatnom fasadnom bojom otpornom na UV i vlagu u dva sloja.", unit: "m²", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Tapetiranje zidova", description: "Postavljanje tapete na zidne površine (vinilna, ne-tkana ili strukturna). Priprema podloge, nanošenje ljepila, fugiranje spojeva.", unit: "m²", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Ličenje drva uljnim lakom", description: "Ličenje drvenih površina (vrata, prozori, obloge) poliuretanskim lakom u dva-tri sloja s međubrušenjem.", unit: "m²", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Ličenje metalnih površina", description: "Ličenje metalnih konstrukcija i ograda antikorozivnim temeljnim premazom i dva sloja završne boje prema RAL kartici.", unit: "m²", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Ugradnja dekorativnih profilacija", description: "Ugradnja stropnih i zidnih dekorativnih profilacija od polistirola, gipsa ili poliuretana ljepljenjem. Kitanje i bojanje.", unit: "m¹", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Dekorativna žbuka (marmolit/štuko)", description: "Nanošenje dekorativne završne žbuke tipa marmolit, štuko veneziano ili ribane žbuke na unutarnje ili vanjske površine.", unit: "m²", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Postavljanje gipskartonskih ploča", description: "Montaža gipskartonske obloge stropa ili pregradnog zida na metalnoj potkonstrukciji (CD/UD profili). Kitanje spojeva.", unit: "m²", unit_price: 0 },
  { group: "Soboslikarski i ličilački radovi", name: "Bojanje radijatora i cijevnih instalacija", description: "Bojanje čeličnih radijatora i cijevnih instalacija termoizolacijskim alkidnim lak-bojom otpornom na temperature do 100°C.", unit: "kom", unit_price: 0 },

  // ─── Fasaderski radovi ───
  { group: "Fasaderski radovi", name: "ETICS fasadni sistem - EPS d=10cm", description: "Izrada ETICS sistema s EPS pločama d=10cm (λ≤0.036). Lijepljenje, tiplanje (min. 6 kom/m²), armaturni sloj s mrežicom, završna silikatna ili silikonska žbuka.", unit: "m²", unit_price: 0 },
  { group: "Fasaderski radovi", name: "ETICS fasadni sistem - mineralna vuna d=10cm", description: "Izrada ETICS sistema s mineralnom vunom (gustoća ≥140 kg/m³) d=10cm. Lijepljenje i tiplanje (min. 8 kom/m²), armaturni sloj, završna žbuka.", unit: "m²", unit_price: 0 },
  { group: "Fasaderski radovi", name: "Tradicionalna vapneno-cementna žbuka", description: "Izrada vanjskog fasadnog žbukanja u tri sloja: špricanje, grubi temeljni sloj i fino završno glačanje vapnenom žbukom. Ukupna debljina 2–3 cm.", unit: "m²", unit_price: 0 },
  { group: "Fasaderski radovi", name: "Fasadna obloga - HPL/ALU ploče", description: "Montaža ventilirane fasadne obloge od HPL ili aluminijskih kompozitnih ploča d=6–8 mm na aluminijskoj potkonstrukciji.", unit: "m²", unit_price: 0 },
  { group: "Fasaderski radovi", name: "Fasadna obloga od klinkera", description: "Postavljanje fasadne keramičke obloge (klinker pločice) na cementno ljepilo C2TE. Fugiranje vremenski otpornim fugirmasom.", unit: "m²", unit_price: 0 },
  { group: "Fasaderski radovi", name: "Izrada sokle fasade", description: "Izrada fasadnog sokla od mozaik žbuke ili klinkera visine do 60 cm sa XPS termoizolacijom d=5cm i armaturnim slojem.", unit: "m¹", unit_price: 0 },
  { group: "Fasaderski radovi", name: "Sanacija fasade - injektiranje pukotina", description: "Sanacija pukotina na fasadi: čišćenje, injektiranje epoksidnom smolom ili cementnom masom, krpanje elastičnom špahtelmason.", unit: "m¹", unit_price: 0 },
  { group: "Fasaderski radovi", name: "Postavljanje fasadne skele", description: "Postavljanje i demontaža cijevne fasadne skele nosivosti min. 200 kg/m² prema EN 12811. Uključuje zaštitne mreže.", unit: "m²", unit_price: 0 },
  { group: "Fasaderski radovi", name: "Obrada prozorskih špaleta i niša", description: "Žbukanje i izolacija prozorskih špaleta unutar ETICS sistema s EPS pločama d=2–3 cm, mrežicom i kutnim profilima.", unit: "m¹", unit_price: 0 },
  { group: "Fasaderski radovi", name: "Čišćenje fasade visokotlačnom vodom", description: "Čišćenje fasadnih površina visokotlačnom perilicom (min. 150 bar) od mahovine, algi i prašine. Tretman biocidnim sredstvom.", unit: "m²", unit_price: 0 },

  // ─── Instalaterski radovi - vodovod i kanalizacija ───
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Vodovodni priključak DN32", description: "Izvođenje vodomjernog mjesta i priključka na javni vodovod. Ugradnja vodomjera, zasunskog ventila i filtera. Tlačna proba 10 bar/1h.", unit: "pauš.", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Razvod hladne i tople vode PP-R", description: "Izrada razvoda instalacija hladne i tople vode od PP-R cijevi PN20 (Ø20–32 mm) spojene termofuzijskim zavarivanjem. Toplinska izolacija TV cijevi.", unit: "m¹", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Ugradnja sanitarnog čvora", description: "Montaža kompletnog sanitarnog čvora: konzolna WC šolja s podžbuknim rezervoarom, lavabo s baterijom i sifonom, kada ili tuš kabina.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Kanalizacijski razvod PVC HT Ø110", description: "Izrada internog kanalizacijskog razvoda od PVC HT cijevi Ø110 mm. Padovi min. 1.5%, revizioni otvori. Ispitivanje vodonepropusnosti.", unit: "m¹", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Odvodnja kišnice - horizontalni razvod", description: "Izrada horizontalnog razvoda kišne kanalizacije od PVC KG cijevi Ø110–200 mm. Ugradnja revizionih šahti na spojevima.", unit: "m¹", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Ugradnja bojlera za toplu vodu", description: "Isporuka i ugradnja akumulacijskog bojlera zapremine 80–200 l. Priključak na vodomjernu instalaciju, sigurnosni ventil. Puštanje u rad.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Prolazi i prodori kroz zidove i ploče", description: "Izrada prolaza za cijevi kroz zidove i AB ploče. Bušenje dijamantskom bušilicom, ugradnja zaštitnih cijevi i kitanje.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Ugradnja hidrantskog ormara", description: "Isporuka i ugradnja unutarnjeg hidrantskog ormara DN52 s crijevom 25 m, mlaznicom i ventilom. Ispitivanje tlaka.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Termoizolacija cijevnih instalacija", description: "Izolacija cijevi tople vode i grijanja kaučuk-elastomernom ili mineralnom-vunenom cijevnom ljuskom debljine 13–30 mm.", unit: "m¹", unit_price: 0 },
  { group: "Instalaterski radovi - vodovod i kanalizacija", name: "Ispitivanje vodomjerne instalacije", description: "Tlačna proba kompletne vodomjerne instalacije na 1.5× radnog tlaka tokom 1 sata. Ispiranje i dezinfekcija. Izrada zapisnika.", unit: "pauš.", unit_price: 0 },

  // ─── Instalaterski radovi - grijanje ───
  { group: "Instalaterski radovi - grijanje", name: "Plinski kondenzacijski kotao 24-35 kW", description: "Isporuka i montaža plinskog kondenzacijskog kotla za centralno grijanje i toplu vodu. Priključak na plinski vod i dimovod. Puštanje u rad.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Razvod grijanja – bakrene/čelične cijevi", description: "Izrada razvoda centralnog grijanja od bakarnih ili čeličnih cijevi Ø12–28 mm dvocijevnim sistemom. Toplinska izolacija. Tlačna proba 6 bar/1h.", unit: "m¹", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Čelični pločasti radijator tip 22", description: "Isporuka i ugradnja čeličnog pločastog radijatora tipa 22 s termostatskim ventilom i povratnom armaturom. Dimenzionisanje po proračunu.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Podno grijanje (mokri sistem)", description: "Izrada sistema podnog grijanja mokrim postupkom. EPS ploča d=30–50 mm, PE-Xa cijevi Ø16×2 mm, razmak 10–15 cm. Tlačna proba 6 bar/24h.", unit: "m²", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Razdjelnik/sabirnik grijanja", description: "Isporuka i montaža razdjelnog ormara s razdjelnikom za podno ili radijatorsko grijanje, 4–12 krugova. Uravnoteženje sistema.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Cirkulacijska pumpa", description: "Isporuka i montaža cirkulacijske pumpe s mokrim rotorom, energetske klase A (elektronski regulisana). Priključak i podešavanje.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Ekspanzijska posuda", description: "Isporuka i montaža zatvorene ekspanzijske posude membranskog tipa zapremine 8–50 l. Predpunjavanje na radni tlak. Sigurnosni ventil.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Razvod plinskog priključka", description: "Izrada interne plinske instalacije od čeličnih ili bakarnih cijevi s kuglastim plinskim zasunima. Ispitivanje na propusnost (100 mbar/1h).", unit: "m¹", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Termostatski ventili i glave", description: "Ugradnja termostatskih ventila s termostatskim glavama na radijatore. Kalibracija i podešavanje po prostoriji.", unit: "kom", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Dimovodna instalacija – inox", description: "Izrada dimovodnog sistema od dvostrukih inox cijevi (AISI316L/AISI304) s mineralnom vunom izolacijom d=25 mm, promjera 100–200 mm.", unit: "m¹", unit_price: 0 },
  { group: "Instalaterski radovi - grijanje", name: "Balansiranje i puštanje sistema u rad", description: "Hidraulično balansiranje sistema grijanja: mjerenje i podešavanje protoka, odzračivanje, punjenje sistema i podešavanje kotla.", unit: "pauš.", unit_price: 0 },

  // ─── Elektroinstalaterski radovi ───
  { group: "Elektroinstalaterski radovi", name: "Polaganje kablova NYM", description: "Polaganje kablova NYM-J 3×1.5 mm² ili 3×2.5 mm² u PVC instalacijske cijevi Ø20/25 mm ugrađene u zid ili beton.", unit: "m¹", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Razvodna ploča (elektroormar)", description: "Isporuka i ugradnja razvodnog ormara s glavnim osiguračem, FID sklopkama, automatskim osiguračima. Žičenje i označavanje strujnih krugova.", unit: "kom", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Ugradnja utičnica i prekidača", description: "Ugradnja podžbuknih utičnica (2P+PE, 230V, 16A) i prekidača. Priključak kabla i montaža dekorativnih okvira.", unit: "kom", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Ugradnja LED rasvjetnih tijela", description: "Isporuka i montaža LED rasvjetnih tijela (plafonijeri, downlight, paneli) prema projektu rasvjete. CRI>80, 2700–4000K.", unit: "kom", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Razvod UTP kabel – mrežna instalacija", description: "Polaganje strukturnih kablova CAT6 UTP za LAN instalaciju. Ugradnja mrežnih utičnica (RJ45). Testiranje i certifikacija.", unit: "m¹", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Vatrodojavni sistem", description: "Isporuka i montaža adresabilnog vatrodojavnog sistema prema EN 54. Centrala, detektori dima, ručni javljači, sirene. Programiranje i ovjera.", unit: "pauš.", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Video nadzor (CCTV)", description: "Isporuka i montaža video-nadzornog sistema s IP kamerama min. 4 MP. NVR rekorder, PoE switch. Konfiguracija mobilne aplikacije.", unit: "kom", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Uzemljenje i gromobranska zaštita", description: "Izrada sistema uzemljenja i gromobranske zaštite prema IEC 62305. Horizontalni uzemljivač, hvataljke, odvodi. Mjerenje otpora (cilj <10 Ω).", unit: "pauš.", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Sistem kontrole pristupa", description: "Isporuka i montaža sistema kontrole pristupa s RFID čitačima, elektromagnetnim bravama i upravljačkim softverom. UPS napajanje.", unit: "kom", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Fotonaponski sistem (solarni)", description: "Isporuka i montaža krovnog fotonaponskog sistema 5–20 kWp. Monokristalni PV paneli, string inverter s WiFi monitoringom.", unit: "kom", unit_price: 0 },
  { group: "Elektroinstalaterski radovi", name: "Mjerenje i ispitivanje električne instalacije", description: "Mjerenje i ispitivanje cjelokupne električne instalacije prema IEC 60364-6. Izrada mjernih protokola i certifikacija.", unit: "pauš.", unit_price: 0 },
];

const insertItem = db.query(`
  INSERT OR IGNORE INTO library_items (group_id, name, description, unit, unit_price, created_by)
  VALUES ((SELECT id FROM item_groups WHERE name = ?), ?, ?, ?, ?, NULL)
`);

for (const item of items) {
  insertItem.run(item.group, item.name, item.description, item.unit, item.unit_price);
}

console.log("Seed complete:");
console.log(`- Super admin: admin / admin123`);
console.log(`- Test user: test / test123 (Test Firma d.o.o.)`);
console.log(`- ${groups.length} item groups`);
console.log(`- ${items.length} library items`);

db.close();
