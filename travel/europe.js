/* ------------------------------------------------------------------
   Europe side: origin airports, per-country safety sources, currencies.
   Nonstop links are as commonly operated in 2026 — treat as guidance and
   verify on the airline's site before booking.
   ------------------------------------------------------------------ */
window.EUROPE = {
  /* nonstop: gateway code → airlines. hubs: typical one-stop connections. hours: nonstop block time to India. */
  origins: [
    { code: 'LHR', city: 'London Heathrow', country: 'GB', hours: 9.5, nonstop: { DEL: ['British Airways', 'Air India', 'Virgin Atlantic'], BOM: ['British Airways', 'Air India', 'Virgin Atlantic'], BLR: ['British Airways', 'Air India', 'Virgin Atlantic'], HYD: ['British Airways'], MAA: ['British Airways'] }, hubs: ['DOH', 'DXB', 'FRA'] },
    { code: 'MAN', city: 'Manchester', country: 'GB', hours: 10, nonstop: {}, hubs: ['DOH', 'DXB', 'AUH', 'LHR'] },
    { code: 'BHX', city: 'Birmingham', country: 'GB', hours: 9.5, nonstop: { DEL: ['Air India'] }, hubs: ['DXB', 'DOH'] },
    { code: 'DUB', city: 'Dublin', country: 'IE', hours: 10.5, nonstop: {}, hubs: ['LHR', 'DOH', 'AUH', 'IST'] },
    { code: 'CDG', city: 'Paris Charles de Gaulle', country: 'FR', hours: 9, nonstop: { DEL: ['Air France', 'Air India'], BOM: ['Air France'], BLR: ['Air France'] }, hubs: ['DOH', 'DXB', 'FRA'] },
    { code: 'AMS', city: 'Amsterdam', country: 'NL', hours: 9, nonstop: { DEL: ['KLM'], BOM: ['KLM'], BLR: ['KLM'] }, hubs: ['DOH', 'DXB', 'CDG'] },
    { code: 'BRU', city: 'Brussels', country: 'BE', hours: 9, nonstop: {}, hubs: ['FRA', 'DOH', 'DXB', 'AUH'] },
    { code: 'FRA', city: 'Frankfurt', country: 'DE', hours: 9, nonstop: { DEL: ['Lufthansa', 'Air India'], BOM: ['Lufthansa', 'Air India'], BLR: ['Lufthansa'], HYD: ['Lufthansa'] }, hubs: ['MUC', 'DOH', 'DXB'] },
    { code: 'MUC', city: 'Munich', country: 'DE', hours: 8.5, nonstop: { DEL: ['Lufthansa'], BOM: ['Lufthansa'], BLR: ['Lufthansa'] }, hubs: ['FRA', 'DOH', 'DXB'] },
    { code: 'BER', city: 'Berlin', country: 'DE', hours: 8.5, nonstop: {}, hubs: ['FRA', 'MUC', 'DOH', 'IST'] },
    { code: 'DUS', city: 'Düsseldorf', country: 'DE', hours: 9, nonstop: {}, hubs: ['FRA', 'MUC', 'DXB', 'AUH'] },
    { code: 'HAM', city: 'Hamburg', country: 'DE', hours: 9, nonstop: {}, hubs: ['FRA', 'MUC', 'DXB'] },
    { code: 'ZRH', city: 'Zurich', country: 'CH', hours: 8.5, nonstop: { DEL: ['SWISS'], BOM: ['SWISS'] }, hubs: ['FRA', 'MUC', 'DOH', 'DXB', 'AUH'] },
    { code: 'GVA', city: 'Geneva', country: 'CH', hours: 9, nonstop: {}, hubs: ['ZRH', 'FRA', 'DOH', 'DXB'] },
    { code: 'VIE', city: 'Vienna', country: 'AT', hours: 8, nonstop: { DEL: ['Austrian'] }, hubs: ['FRA', 'DOH', 'DXB', 'IST'] },
    { code: 'CPH', city: 'Copenhagen', country: 'DK', hours: 8.5, nonstop: { DEL: ['Air India'] }, hubs: ['FRA', 'DOH', 'DXB'] },
    { code: 'ARN', city: 'Stockholm Arlanda', country: 'SE', hours: 8.5, nonstop: {}, hubs: ['FRA', 'DOH', 'DXB', 'HEL'] },
    { code: 'OSL', city: 'Oslo', country: 'NO', hours: 9, nonstop: {}, hubs: ['FRA', 'DOH', 'DXB', 'CPH'] },
    { code: 'HEL', city: 'Helsinki', country: 'FI', hours: 7.5, nonstop: { DEL: ['Finnair'] }, hubs: ['DOH', 'FRA'] },
    { code: 'WAW', city: 'Warsaw', country: 'PL', hours: 8, nonstop: { DEL: ['LOT'], BOM: ['LOT'] }, hubs: ['FRA', 'DOH', 'IST'] },
    { code: 'PRG', city: 'Prague', country: 'CZ', hours: 8, nonstop: {}, hubs: ['FRA', 'MUC', 'DOH', 'IST'] },
    { code: 'BUD', city: 'Budapest', country: 'HU', hours: 8, nonstop: {}, hubs: ['FRA', 'DOH', 'IST'] },
    { code: 'MXP', city: 'Milan Malpensa', country: 'IT', hours: 8.5, nonstop: { DEL: ['Air India'] }, hubs: ['FRA', 'DOH', 'DXB', 'IST'] },
    { code: 'FCO', city: 'Rome Fiumicino', country: 'IT', hours: 8.5, nonstop: {}, hubs: ['FRA', 'DOH', 'DXB', 'IST'] },
    { code: 'MAD', city: 'Madrid', country: 'ES', hours: 9.5, nonstop: {}, hubs: ['FRA', 'DOH', 'DXB', 'IST'] },
    { code: 'BCN', city: 'Barcelona', country: 'ES', hours: 9, nonstop: {}, hubs: ['FRA', 'DOH', 'DXB', 'IST'] },
    { code: 'LIS', city: 'Lisbon', country: 'PT', hours: 10, nonstop: {}, hubs: ['FRA', 'DOH', 'DXB', 'IST'] },
    { code: 'ATH', city: 'Athens', country: 'GR', hours: 7, nonstop: {}, hubs: ['DOH', 'DXB', 'IST'] },
    { code: 'IST', city: 'Istanbul', country: 'TR', hours: 6.5, nonstop: { DEL: ['Turkish Airlines', 'IndiGo'], BOM: ['Turkish Airlines', 'IndiGo'] }, hubs: ['DOH', 'DXB'] },
  ],

  /* Hubs used for one-stop connections */
  hubs: { FRA: 'Frankfurt (Lufthansa)', MUC: 'Munich (Lufthansa)', ZRH: 'Zurich (SWISS)', LHR: 'London (BA)', CDG: 'Paris (Air France)', HEL: 'Helsinki (Finnair)', CPH: 'Copenhagen (SAS)', DOH: 'Doha (Qatar Airways)', DXB: 'Dubai (Emirates)', AUH: 'Abu Dhabi (Etihad)', IST: 'Istanbul (Turkish)' },

  /* Per-country sources. consulates: Indian cities with a consulate besides the embassy in New Delhi. */
  countries: {
    DE: { name: 'Germany', lang: 'de', currency: 'EUR', advice: 'https://www.auswaertiges-amt.de/de/service/laender/indien-node', register: { n: 'ELEFAND', u: 'https://elefand.diplo.de/' }, embassy: 'https://india.diplo.de/', consulates: ['Mumbai', 'Bengaluru', 'Chennai', 'Kolkata'], health: { n: 'Auswärtiges Amt – Medizinische Hinweise', u: 'https://www.auswaertiges-amt.de/de/service/laender/indien-node' } },
    CH: { name: 'Switzerland', lang: 'de', currency: 'CHF', advice: 'https://www.eda.admin.ch/eda/de/home/vertretungen-und-reisehinweise/indien.html', register: { n: 'Travel Admin App', u: 'https://www.eda.admin.ch/eda/de/home/reiseberatung/travel-admin-app.html' }, embassy: 'https://www.eda.admin.ch/newdelhi', consulates: ['Mumbai', 'Bengaluru'], health: { n: 'Safetravel.ch', u: 'https://www.safetravel.ch/' } },
    AT: { name: 'Austria', lang: 'de', currency: 'EUR', advice: 'https://www.bmeia.gv.at/reise-services/reiseinformation/land/indien', register: { n: 'Reiseregistrierung', u: 'https://www.bmeia.gv.at/reise-services/reiseregistrierung' }, embassy: 'https://www.bmeia.gv.at/oeb-new-delhi', consulates: ['Mumbai'], health: { n: 'Tropeninstitut', u: 'https://www.tropeninstitut.at/' } },
    GB: { name: 'United Kingdom', lang: 'en', currency: 'GBP', advice: 'https://www.gov.uk/foreign-travel-advice/india', register: { n: 'GOV.UK travel advice email alerts', u: 'https://www.gov.uk/foreign-travel-advice/india' }, embassy: 'https://www.gov.uk/world/organisations/british-high-commission-new-delhi', consulates: ['Mumbai', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Chandigarh', 'Ahmedabad', 'Goa'], health: { n: 'TravelHealthPro', u: 'https://travelhealthpro.org.uk/country/105/india' } },
    IE: { name: 'Ireland', lang: 'en', currency: 'EUR', advice: 'https://www.ireland.ie/en/dfa/overseas-travel/advice/india/', register: { n: 'Citizens\' Registration', u: 'https://www.ireland.ie/en/dfa/overseas-travel/citizens-registration/' }, embassy: 'https://www.ireland.ie/en/india/newdelhi/', consulates: ['Mumbai'], health: { n: 'HSE Travel Health', u: 'https://www.hse.ie/eng/health/immunisation/pubinfo/travel/' } },
    FR: { name: 'France', lang: 'fr', currency: 'EUR', advice: 'https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/conseils-par-pays-destination/inde/', register: { n: 'Fil d\'Ariane', u: 'https://pastel.diplomatie.gouv.fr/fildariane/' }, embassy: 'https://in.ambafrance.org/', consulates: ['Mumbai', 'Bengaluru', 'Kolkata', 'Pondicherry'], health: { n: 'Institut Pasteur – Voyageurs', u: 'https://www.pasteur.fr/fr/centre-medical/preparer-son-voyage' } },
    NL: { name: 'Netherlands', lang: 'nl', currency: 'EUR', advice: 'https://www.nederlandwereldwijd.nl/reisadvies/india', register: { n: 'BZ Informatieservice', u: 'https://www.nederlandwereldwijd.nl/informatieservice' }, embassy: 'https://www.nederlandwereldwijd.nl/landen/india', consulates: ['Mumbai', 'Bengaluru'], health: { n: 'LCR / GGD Reisvaccinaties', u: 'https://www.ggdreisvaccinaties.nl/' } },
    BE: { name: 'Belgium', lang: 'nl', currency: 'EUR', advice: 'https://diplomatie.belgium.be/nl/landen/india', register: { n: 'Travellers Online', u: 'https://travellersonline.diplomatie.be/' }, embassy: 'https://india.diplomatie.belgium.be/', consulates: ['Mumbai'], health: { n: 'Instituut voor Tropische Geneeskunde', u: 'https://www.wanda.be/' } },
    IT: { name: 'Italy', lang: 'it', currency: 'EUR', advice: 'https://www.viaggiaresicuri.it/find-country/country/IND', register: { n: 'Dove siamo nel mondo', u: 'https://www.dovesiamonelmondo.it/' }, embassy: 'https://ambnewdelhi.esteri.it/', consulates: ['Mumbai', 'Kolkata'], health: { n: 'Viaggiare Sicuri – Salute', u: 'https://www.viaggiaresicuri.it/find-country/country/IND' } },
    ES: { name: 'Spain', lang: 'es', currency: 'EUR', advice: 'https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Recomendaciones-de-viaje.aspx', register: { n: 'Registro de Viajeros', u: 'https://registroviajeros.exteriores.gob.es/' }, embassy: 'https://www.exteriores.gob.es/Embajadas/nuevadelhi', consulates: ['Mumbai'], health: { n: 'Sanidad Exterior', u: 'https://www.sanidad.gob.es/areas/sanidadExterior/laSaludTambienViaja/home.htm' } },
    PT: { name: 'Portugal', lang: 'pt', currency: 'EUR', advice: 'https://portaldascomunidades.mne.gov.pt/pt/vai-viajar/conselhos-aos-viajantes', register: { n: 'Registo do Viajante', u: 'https://portaldascomunidades.mne.gov.pt/pt/vai-viajar/registo-viajante' }, embassy: 'https://novadeli.embaixadaportugal.mne.gov.pt/', consulates: ['Goa'], health: { n: 'Consulta do Viajante (DGS)', u: 'https://www.dgs.pt/' } },
    DK: { name: 'Denmark', lang: 'da', currency: 'DKK', advice: 'https://um.dk/rejse-og-ophold/rejse-til-udlandet/rejsevejledninger/indien', register: { n: 'Danskerlisten', u: 'https://um.dk/rejse-og-ophold/rejse-til-udlandet/danskerlisten' }, embassy: 'https://indien.um.dk/', consulates: ['Mumbai'], health: { n: 'Statens Serum Institut', u: 'https://www.ssi.dk/vaccinationer/rejsevaccination' } },
    SE: { name: 'Sweden', lang: 'sv', currency: 'SEK', advice: 'https://www.swedenabroad.se/en/embassies/india-new-delhi/', register: { n: 'UD Resklar app', u: 'https://www.regeringen.se/uds-reseinformation/ud-resklar/' }, embassy: 'https://www.swedenabroad.se/en/embassies/india-new-delhi/', consulates: ['Mumbai'], health: { n: '1177 Vårdguiden – Resevaccin', u: 'https://www.1177.se/' } },
    NO: { name: 'Norway', lang: 'no', currency: 'NOK', advice: 'https://www.regjeringen.no/no/tema/utenrikssaker/reiseinformasjon/velg-land/reiseinfo_india/', register: { n: 'Reiseregistrering', u: 'https://www.reiseregistrering.no/' }, embassy: 'https://www.norway.no/en/india/', consulates: ['Mumbai'], health: { n: 'FHI Reisevaksiner', u: 'https://www.fhi.no/' } },
    FI: { name: 'Finland', lang: 'fi', currency: 'EUR', advice: 'https://um.fi/matkustustiedote/-/c/IN', register: { n: 'Matkustusilmoitus', u: 'https://matkustusilmoitus.fi/' }, embassy: 'https://finlandabroad.fi/web/ind', consulates: ['Mumbai'], health: { n: 'THL Matkailijan terveysopas', u: 'https://thl.fi/' } },
    PL: { name: 'Poland', lang: 'pl', currency: 'PLN', advice: 'https://www.gov.pl/web/dyplomacja/indie', register: { n: 'Odyseusz', u: 'https://odyseusz.msz.gov.pl/' }, embassy: 'https://www.gov.pl/web/indie', consulates: ['Mumbai'], health: { n: 'Szczepienia.info', u: 'https://szczepienia.pzh.gov.pl/' } },
    CZ: { name: 'Czechia', lang: 'cs', currency: 'CZK', advice: 'https://www.mzv.cz/jnp/cz/encyklopedie_statu/asie/indie/', register: { n: 'DROZD', u: 'https://drozd.mzv.cz/' }, embassy: 'https://www.mzv.cz/newdelhi', consulates: ['Mumbai'], health: { n: 'Očkovací centra', u: 'https://www.ockovacicentrum.cz/' } },
    HU: { name: 'Hungary', lang: 'hu', currency: 'HUF', advice: 'https://konzuliszolgalat.kormany.hu/', register: { n: 'Konzuli Szolgálat', u: 'https://konzuliszolgalat.kormany.hu/' }, embassy: 'https://ujdelhi.mfa.gov.hu/', consulates: ['Mumbai'], health: { n: 'NNGYK utazás-egészségügy', u: 'https://www.nnk.gov.hu/' } },
    GR: { name: 'Greece', lang: 'el', currency: 'EUR', advice: 'https://www.mfa.gr/en/travel-advice/', register: { n: 'Ministry of Foreign Affairs', u: 'https://www.mfa.gr/' }, embassy: 'https://www.mfa.gr/missionsabroad/en/india-en', consulates: [], health: { n: 'EODY', u: 'https://eody.gov.gr/' } },
    TR: { name: 'Türkiye', lang: 'tr', currency: 'EUR', advice: 'https://www.mfa.gov.tr/', register: { n: 'Ministry of Foreign Affairs', u: 'https://www.mfa.gov.tr/' }, embassy: 'https://newdelhi.emb.mfa.gov.tr/', consulates: ['Mumbai', 'Hyderabad'], health: { n: 'Seyahat Sağlığı', u: 'https://www.seyahatsagligi.gov.tr/' } },
  },

  /* Currencies shown to the traveller. Rates come live from Frankfurter (EUR base); these are fallbacks. */
  currencies: { EUR: { sym: '€', rate: 1 }, CHF: { sym: 'CHF ', rate: 0.94 }, GBP: { sym: '£', rate: 0.85 }, SEK: { sym: 'kr ', rate: 11.2 }, NOK: { sym: 'kr ', rate: 11.6 }, DKK: { sym: 'kr ', rate: 7.46 }, PLN: { sym: 'zł ', rate: 4.3 }, CZK: { sym: 'Kč ', rate: 25 }, HUF: { sym: 'Ft ', rate: 395 }, INR: { sym: '₹', rate: 98 } },
};
