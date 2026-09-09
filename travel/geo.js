/* ------------------------------------------------------------------
   Geo: estimate any leg between two Indian stops from coordinates.
   Mode: named train where one exists → flight when both ends have an
   airport and the road is long → otherwise private car with driver.
   Costs are per person in EUR for the chosen style; hours are door-to-door.
   ------------------------------------------------------------------ */
(function () {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const km = (a, b) => { const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

  /* Excellent day trains worth preferring over a car (both directions). hours door-to-door, cost per person EUR (executive/first class). */
  const TRAINS = [
    { a: 'bengaluru', b: 'mysuru', name: 'Vande Bharat Express', hours: 2.5, cost: 15 },
    { a: 'delhi', b: 'goldentriangle', name: 'Gatimaan / Vande Bharat to Agra', hours: 2.5, cost: 18 },
    { a: 'delhi', b: 'rishikesh', name: 'Vande Bharat to Dehradun / Rishikesh', hours: 5, cost: 20 },
    { a: 'chennai', b: 'bengaluru', name: 'Vande Bharat Express', hours: 5, cost: 22 },
    { a: 'mumbai', b: 'goa', name: 'Vande Bharat (Madgaon)', hours: 8.5, cost: 30 },
  ];

  /* road speed incl. stops: hills are slower */
  const ROAD_KMH = { default: 50, hills: 35 };
  const HILLS = new Set(['munnar', 'thekkady', 'coorg', 'ooty', 'wayanad', 'chikmagalur', 'kabini', 'rishikesh']);

  const STYLE = {
    comfort: { flightMult: 1.0, carPerDay: 90, seat: 'economy' },       // 4★, IndiGo/Air India economy, Innova Crysta with driver
    premium: { flightMult: 1.15, carPerDay: 130, seat: 'economy+' },     // 5★, flexible fares, larger car / better driver agency
    luxury:  { flightMult: 2.2, carPerDay: 220, seat: 'business' },     // domestic business class, premium sedan or SUV
  };

  function leg(from, to, style = 'comfort', people = 2) {
    if (!from || !to || from.id === to.id) return { mode: 'none', hours: 0, cost: 0, km: 0, label: '' };
    const s = STYLE[style] || STYLE.comfort;
    const d = km(from, to);
    const train = TRAINS.find((t) => (t.a === from.id && t.b === to.id) || (t.b === from.id && t.a === to.id));
    const roadHours = d / (HILLS.has(from.id) || HILLS.has(to.id) ? ROAD_KMH.hills : ROAD_KMH.default) * 1.15; // real roads ≠ straight lines
    const carDays = Math.max(1, Math.ceil(roadHours / 9));
    const road = { mode: 'road', hours: Math.round(roadHours * 2) / 2, cost: Math.round((s.carPerDay * carDays) / Math.max(1, Math.min(people, 6))), km: Math.round(d * 1.25), label: `Private car with driver · ${Math.round(d * 1.25)} km` };
    if (train && style !== 'luxury') return { mode: 'train', hours: train.hours, cost: train.cost, km: Math.round(d * 1.2), label: train.name, alt: road };
    const bothAir = from.airport && to.airport && from.airport !== to.airport;
    if (bothAir && (d > 350 || roadHours > 7)) {
      const flightHours = Math.round((1.25 + d / 650 + 1.75) * 2) / 2; // check-in + block + transfers
      const cost = Math.round((45 + d * 0.07) * s.flightMult);
      return { mode: 'flight', hours: flightHours, cost, km: Math.round(d), label: `Flight ${from.airport} → ${to.airport}`, alt: roadHours <= 9 ? road : null, train: train || null };
    }
    // road, possibly with a flight to the nearest airport first (e.g. Bengaluru → Munnar via Kochi)
    if (!to.airport && to.via && to.via !== from.airport && d > 350) {
      const via = window.TRIP.destinations.find((x) => x.airport === to.via);
      if (via) { const f = leg(from, via, style, people), r = leg(via, to, style, people); return { mode: 'flight+road', hours: f.hours + r.hours, cost: f.cost + r.cost, km: f.km + r.km, label: `Flight ${from.airport} → ${to.via}, then car ${r.km} km` }; }
    }
    return road;
  }

  const MODE_ICON = { flight: '✈️', 'flight+road': '✈️🚗', road: '🚗', train: '🚆', none: '' };
  window.GEO = { km, leg, STYLE, TRAINS, MODE_ICON };
})();
