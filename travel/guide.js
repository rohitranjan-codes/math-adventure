/* ------------------------------------------------------------------
   Tour-guide layer: curated picks per destination.
   Every pick links to its live reviews (Google Maps / Booking.com) —
   ratings are never stored here so nothing goes stale or gets invented.
   tier: budget | mid | lux · kind (ops): cab | car | bus | boat | train | activity
   ------------------------------------------------------------------ */
window.GUIDE = {
  airports: { bengaluru: 'BLR', goa: 'GOI', munnar: 'COK', kochi: 'COK', thekkady: 'COK', hyderabad: 'HYD', ooty: 'CJB', varkala: 'TRV', andaman: 'IXZ', madurai: 'IXM', badami: 'HBX', hampi: 'VDY', wayanad: 'CCJ', goldentriangle: 'DEL', rajasthan: 'UDR', varanasi: 'VNS', rishikesh: 'DED', mumbai: 'BOM', pondicherry: 'MAA' },
  /* destinations reached by road/train from the previous stop rather than a flight of their own */
  roadOnly: ['mysuru', 'coorg', 'kabini', 'chikmagalur', 'gokarna', 'thekkady', 'munnar', 'badami', 'pondicherry', 'wayanad', 'ooty'],
  searchCity: { bengaluru: 'Bengaluru', goa: 'Goa', munnar: 'Munnar', kochi: 'Fort Kochi', thekkady: 'Thekkady', mysuru: 'Mysuru', coorg: 'Madikeri', hampi: 'Hampi', hyderabad: 'Hyderabad', ooty: 'Ooty', kabini: 'Kabini', chikmagalur: 'Chikmagalur', gokarna: 'Gokarna', wayanad: 'Wayanad', varkala: 'Varkala', andaman: 'Havelock Island', madurai: 'Madurai', badami: 'Badami', pondicherry: 'Pondicherry', goldentriangle: 'Agra', rajasthan: 'Udaipur', varanasi: 'Varanasi', rishikesh: 'Rishikesh', mumbai: 'Mumbai' },

  picks: {
    bengaluru: [
      { n: 'Taj West End', tier: 'lux', area: 'Race Course Road', why: 'Heritage garden hotel since 1887, 20 acres of trees in the city centre.' },
      { n: 'ITC Gardenia', tier: 'lux', area: 'Residency Road', why: 'Reliable luxury, superb breakfast, walk to Cubbon Park.' },
      { n: 'The Park Bangalore', tier: 'mid', area: 'MG Road', why: 'Design hotel next to the Metro and Church Street cafés.' },
      { n: 'Lemon Tree Premier Ulsoor Lake', tier: 'mid', area: 'Ulsoor', why: 'Good value, lake views, 10 min to Indiranagar.' },
      { n: 'Zostel Bangalore', tier: 'budget', area: 'Indiranagar', why: 'Social hostel with private rooms, the best neighbourhood for first-timers.' },
    ],
    goa: [
      { n: 'W Goa', tier: 'lux', area: 'Vagator', why: 'Cliff-top resort above the best sunset beach in the north.' },
      { n: 'Ahilya by the Sea', tier: 'lux', area: 'Nerul', why: 'Boutique villa hotel, 12 rooms, superb food, calm.' },
      { n: 'Alila Diwa Goa', tier: 'lux', area: 'Majorda (south)', why: 'Paddy-field views, quiet beach, family friendly.' },
      { n: 'Novotel Goa Candolim', tier: 'mid', area: 'Candolim', why: 'Solid mid-range base between Panaji and the northern beaches.' },
      { n: 'Casa Vagator', tier: 'mid', area: 'Vagator', why: 'Pool, sea views, walk to Chapora Fort and the shacks.' },
      { n: 'The Hosteller Goa', tier: 'budget', area: 'Anjuna', why: 'Clean hostel, scooter rental at the door, lively common area.' },
    ],
    munnar: [
      { n: 'Windermere Estate', tier: 'lux', area: 'Pothamedu', why: 'Planter\'s bungalows on a working cardamom estate, brilliant views.' },
      { n: 'Spice Tree Munnar', tier: 'lux', area: 'Bison Valley', why: 'Private villas with plunge pools in the hills, adults-only calm.' },
      { n: 'KDHP Tea Bungalows', tier: 'lux', area: 'Tea estates', why: 'Stay inside the tea company\'s colonial bungalows.' },
      { n: 'Tea Valley Resort', tier: 'mid', area: 'Pallivasal', why: 'Big estate views, cottages, good for groups.' },
      { n: 'Elixir Hills', tier: 'mid', area: 'Chinnakanal', why: 'Suites with fireplaces and forest views, quiet.' },
      { n: 'Rivulet Resort', tier: 'budget', area: 'Pallivasal', why: 'Well-run mid-budget resort by a stream.' },
    ],
    kochi: [
      { n: 'Brunton Boatyard (CGH Earth)', tier: 'lux', area: 'Fort Kochi harbour', why: 'Rebuilt Victorian boatyard on the water; watch ships pass from your bed.' },
      { n: 'Taj Malabar Resort & Spa', tier: 'lux', area: 'Willingdon Island', why: 'Harbour-front classic, pool with sunset views.' },
      { n: 'Old Harbour Hotel', tier: 'mid', area: 'Fort Kochi', why: '300-year-old Dutch building by the fishing nets, garden pool.' },
      { n: 'Fort House Hotel', tier: 'mid', area: 'Fort Kochi', why: 'Waterfront, famous seafood restaurant, cosy rooms.' },
      { n: 'Spice Routes houseboat', tier: 'mid', area: 'Alleppey backwaters', why: 'Well-maintained private houseboats with good crews and food.' },
      { n: 'Marari Beach Resort (CGH Earth)', tier: 'lux', area: 'Mararikulam', why: 'Village-style cottages on an empty beach, 1 h from Alleppey.' },
    ],
    thekkady: [
      { n: 'Spice Village (CGH Earth)', tier: 'lux', area: 'Kumily', why: 'Tribal-style cottages in a spice garden by the park gate.' },
      { n: 'Niraamaya Retreats Cardamom Club', tier: 'lux', area: 'Thekkady', why: 'Plantation villas with big verandas and cool air.' },
      { n: 'Greenwoods Resort', tier: 'mid', area: 'Thekkady', why: 'Pool, spa, walking distance to the town.' },
      { n: 'Cardamom County', tier: 'mid', area: 'Kumily', why: 'Right by the Periyar entrance, sensible prices.' },
    ],
    mysuru: [
      { n: 'Radisson Blu Plaza Mysore', tier: 'lux', area: 'JLB Road', why: 'The most comfortable base in town, 10 min to the palace.' },
      { n: 'Royal Orchid Metropole', tier: 'mid', area: 'JLB Road', why: 'Heritage building built for the Maharaja\'s guests, character rooms.' },
      { n: 'Grand Mercure Mysore', tier: 'mid', area: 'Nazarbad', why: 'Modern, reliable, easy for early trains.' },
      { n: 'Zostel Mysore', tier: 'budget', area: 'Gokulam', why: 'Popular with the yoga crowd, good cafés nearby.' },
    ],
    coorg: [
      { n: 'Evolve Back Coorg', tier: 'lux', area: 'Siddapur', why: 'Private pool villas on a 300-acre plantation, faultless service.' },
      { n: 'Taj Madikeri Resort & Spa', tier: 'lux', area: 'Madikeri', why: 'Rainforest resort with mist views, great spa.' },
      { n: 'Coorg Wilderness Resort', tier: 'mid', area: 'Madikeri', why: 'Big rooms, colonial style, tea gardens.' },
      { n: 'Amanvana Spa Resort', tier: 'mid', area: 'Kushalnagar', why: 'Cottages by the Cauvery river, close to the Golden Temple.' },
      { n: 'Estate homestays (e.g. Honey Valley)', tier: 'budget', area: 'Kabbinakad', why: 'Working coffee estate, home cooking, trekking guides.' },
    ],
    hampi: [
      { n: 'Evolve Back Kamalapura Palace', tier: 'lux', area: 'Kamalapura', why: 'Vijayanagara-style palace hotel, the only luxury in Hampi.' },
      { n: 'Heritage Resort Hampi', tier: 'mid', area: 'Hosapete road', why: 'Cottages with a pool, 15 min from the ruins.' },
      { n: 'Hampi\'s Boulders', tier: 'mid', area: 'Narayanpet', why: 'Nature resort among the boulders on the river.' },
      { n: 'Gouthami Guest House', tier: 'budget', area: 'Sanapur (Hippie Island)', why: 'Classic riverside guesthouse with hammocks and a café.' },
    ],
    hyderabad: [
      { n: 'Taj Falaknuma Palace', tier: 'lux', area: 'Falaknuma', why: 'The Nizam\'s palace on a hill; arrive by horse carriage.' },
      { n: 'Park Hyatt Hyderabad', tier: 'lux', area: 'Banjara Hills', why: 'Modern luxury near the restaurants and bars.' },
      { n: 'ITC Kakatiya', tier: 'mid', area: 'Begumpet', why: 'Dependable business hotel with a famous kitchen.' },
      { n: 'Lemon Tree Premier HITEC City', tier: 'mid', area: 'HITEC City', why: 'Value option with a pool.' },
      { n: 'Zostel Hyderabad', tier: 'budget', area: 'Gachibowli', why: 'Clean hostel for a short city stop.' },
    ],
    ooty: [
      { n: 'Savoy (Taj)', tier: 'lux', area: 'Ooty centre', why: '1841 cottages with fireplaces and rose gardens.' },
      { n: 'Kurumba Village Resort', tier: 'lux', area: 'Coonoor', why: 'Spice plantation resort with infinity pool over the valley.' },
      { n: 'Sinclairs Retreat Ooty', tier: 'mid', area: 'Ooty', why: 'Hillside rooms, big breakfast, good for groups.' },
      { n: 'Wallwood Garden (Neemrana)', tier: 'mid', area: 'Coonoor', why: '1890s bungalow in a garden, quiet and characterful.' },
      { n: 'YWCA Anandagiri', tier: 'budget', area: 'Ooty', why: 'Heritage bungalow guest house at hostel prices.' },
    ],
    kabini: [
      { n: 'Evolve Back Kabini', tier: 'lux', area: 'Kabini backwaters', why: 'Pool huts by the water, excellent naturalists, safaris included.' },
      { n: 'Kabini River Lodge (Jungle Lodges)', tier: 'lux', area: 'Karapura', why: 'The original — former Maharaja\'s hunting lodge, government-run safaris.' },
      { n: 'Red Earth Kabini', tier: 'mid', area: 'Kabini', why: 'Lakeside cottages, full board, relaxed.' },
      { n: 'Kaav Safari Lodge', tier: 'mid', area: 'Kabini', why: 'Small boutique lodge, strong on wildlife knowledge.' },
    ],
    chikmagalur: [
      { n: 'The Serai Chikmagalur', tier: 'lux', area: 'Mugthihalli', why: 'Plantation villas with private pools, the Coffee Day family\'s resort.' },
      { n: 'Java Rain Resorts', tier: 'mid', area: 'Mullayanagiri road', why: 'Hillside villas with infinity pool and huge views.' },
      { n: 'Trivik Hotels & Resorts', tier: 'mid', area: 'Mullayanagiri road', why: 'Reliable rooms, coffee estate walks.' },
      { n: 'Estate homestays (Thippanahalli)', tier: 'budget', area: 'Chikmagalur', why: 'Heritage estate bungalows with home food.' },
    ],
    gokarna: [
      { n: 'Kahani Paradise', tier: 'lux', area: 'Paradise Beach cliff', why: 'Boutique hilltop villa with sea views on both sides.' },
      { n: 'SwaSwara (CGH Earth)', tier: 'lux', area: 'Om Beach', why: 'Yoga and Ayurveda retreat with private villas.' },
      { n: 'Arya Ayurvedic Panchakarma Centre', tier: 'mid', area: 'Kudle Beach', why: 'Sea-view rooms plus real Ayurvedic treatments.' },
      { n: 'Namaste Café & Rooms', tier: 'budget', area: 'Om Beach', why: 'The classic beach-front stay, simple and friendly.' },
      { n: 'Zostel Gokarna', tier: 'budget', area: 'Kudle Beach', why: 'Beach hostel with a good crowd.' },
    ],
    wayanad: [
      { n: 'Vythiri Resort', tier: 'lux', area: 'Vythiri', why: 'Treehouses in the rainforest, stream-side villas.' },
      { n: 'Taj Wayanad Resort & Spa', tier: 'lux', area: 'Vythiri', why: 'New luxury resort with spa and pool in the hills.' },
      { n: 'Pepper Trail', tier: 'mid', area: 'Sultan Bathery', why: 'Heritage estate bungalow on a 200-acre plantation.' },
      { n: 'Wayanad Wild (CGH Earth)', tier: 'mid', area: 'Lakkidi', why: 'Rainforest lodge with naturalist walks.' },
      { n: 'Homestays around Kalpetta', tier: 'budget', area: 'Kalpetta', why: 'Family homes with spice-garden breakfasts.' },
    ],
    varkala: [
      { n: 'Taj Green Cove Resort & Spa', tier: 'lux', area: 'Kovalam', why: 'Hillside villas above a private beach, 1 h south.' },
      { n: 'Niraamaya Surya Samudra', tier: 'lux', area: 'Kovalam', why: 'Antique Kerala houses reassembled on a cliff; the best pool view in the south.' },
      { n: 'Palm Tree Heritage', tier: 'mid', area: 'Varkala cliff', why: 'Sea-facing rooms and a pool right on the cliff.' },
      { n: 'Clafouti Beach Resort', tier: 'mid', area: 'Varkala cliff', why: 'Long-running family-run cliff hotel.' },
      { n: 'Cliff guesthouses (e.g. Kaiya House)', tier: 'budget', area: 'North cliff', why: 'Boutique-feel guesthouse at budget prices.' },
    ],
    andaman: [
      { n: 'Taj Exotica Resort & Spa', tier: 'lux', area: 'Radhanagar, Havelock', why: 'Villas in the jungle behind Radhanagar Beach.' },
      { n: 'Barefoot at Havelock', tier: 'lux', area: 'Radhanagar, Havelock', why: 'Eco-resort with the best beach access on the island.' },
      { n: 'Jalakara', tier: 'lux', area: 'Havelock hills', why: '7-room boutique hideaway on an old betel plantation.' },
      { n: 'SeaShell Havelock', tier: 'mid', area: 'Govind Nagar, Havelock', why: 'Beachfront cottages near the ferry, dive centre on site.' },
      { n: 'Silver Sand Beach Resort', tier: 'mid', area: 'Havelock', why: 'Cottages on the beach, good snorkelling trips.' },
    ],
    madurai: [
      { n: 'The Bangala', tier: 'lux', area: 'Karaikudi (Chettinad)', why: 'Legendary Chettinad home with the region\'s best cooking.' },
      { n: 'Visalam (CGH Earth)', tier: 'lux', area: 'Kanadukathan', why: 'Art-deco Chettinad mansion turned hotel.' },
      { n: 'Heritage Madurai', tier: 'mid', area: 'Madurai', why: 'Former Madurai Club designed by Geoffrey Bawa, big pool.' },
      { n: 'Courtyard by Marriott Madurai', tier: 'mid', area: 'Madurai', why: 'Modern, clean, easy for the airport.' },
    ],
    badami: [
      { n: 'Heritage Resort Badami', tier: 'mid', area: 'Badami', why: 'Best rooms in town, pool, near the caves.' },
      { n: 'Clarks Inn Badami', tier: 'mid', area: 'Badami', why: 'Simple, reliable, central.' },
      { n: 'Krishna Heritage', tier: 'budget', area: 'Badami', why: 'Cottages in a garden, good value.' },
    ],
    pondicherry: [
      { n: 'Palais de Mahé (CGH Earth)', tier: 'lux', area: 'White Town', why: 'French-colonial style hotel with a rooftop pool.' },
      { n: 'Villa Shanti', tier: 'mid', area: 'White Town', why: 'Restored 19th-century house with a great courtyard restaurant.' },
      { n: 'Le Dupleix', tier: 'mid', area: 'White Town', why: 'Heritage villa, antiques, quiet garden.' },
      { n: 'Maison Perumal (CGH Earth)', tier: 'mid', area: 'Tamil Quarter', why: 'Tamil courtyard house with Creole cooking.' },
    ],
    goldentriangle: [
      { n: 'The Oberoi Amarvilas', tier: 'lux', area: 'Agra', why: 'Every room has a Taj Mahal view, 600 m from the gate.' },
      { n: 'Rambagh Palace (Taj)', tier: 'lux', area: 'Jaipur', why: 'Former Maharaja\'s palace with peacocks on the lawns.' },
      { n: 'The Imperial', tier: 'lux', area: 'New Delhi', why: 'Art-deco grande dame on Janpath, superb art collection.' },
      { n: 'Trident Agra / Trident Jaipur', tier: 'mid', area: 'Agra · Jaipur', why: 'Dependable Oberoi-group mid-range in both cities.' },
      { n: 'Samode Haveli', tier: 'mid', area: 'Jaipur old city', why: 'Painted haveli with a pool, real Rajasthani atmosphere.' },
      { n: 'Zostel Jaipur / Agra', tier: 'budget', area: 'Jaipur · Agra', why: 'Reliable hostels with private rooms.' },
    ],
    rajasthan: [
      { n: 'Taj Lake Palace', tier: 'lux', area: 'Lake Pichola, Udaipur', why: 'The marble palace floating in the lake; reached by boat.' },
      { n: 'Umaid Bhawan Palace (Taj)', tier: 'lux', area: 'Jodhpur', why: 'One of the world\'s largest private residences, still the Maharaja\'s home.' },
      { n: 'RAAS Jodhpur', tier: 'lux', area: 'Old city, Jodhpur', why: 'Modern boutique hotel beneath Mehrangarh Fort.' },
      { n: 'Jagat Niwas Palace', tier: 'mid', area: 'Lal Ghat, Udaipur', why: 'Lakeside haveli with a rooftop restaurant, superb value.' },
      { n: 'Zostel Udaipur / Jodhpur', tier: 'budget', area: 'Udaipur · Jodhpur', why: 'Rooftop views at hostel prices.' },
    ],
    varanasi: [
      { n: 'BrijRama Palace', tier: 'lux', area: 'Darbhanga Ghat', why: '18th-century palace right on the ghats; arrive by boat.' },
      { n: 'Taj Ganges', tier: 'lux', area: 'Cantonment', why: 'Calm garden hotel away from the crowds.' },
      { n: 'Suryauday Haveli', tier: 'mid', area: 'Shivala Ghat', why: 'Riverfront haveli with a courtyard and rooftop.' },
      { n: 'Ganpati Guest House', tier: 'mid', area: 'Meer Ghat', why: 'The classic budget-plus riverside choice.' },
      { n: 'Zostel Varanasi', tier: 'budget', area: 'Assi Ghat', why: 'Near the calmer end of the ghats.' },
    ],
    rishikesh: [
      { n: 'Ananda in the Himalayas', tier: 'lux', area: 'Narendra Nagar', why: 'World-famous spa retreat in a Maharaja\'s palace grounds.' },
      { n: 'Taj Rishikesh Resort & Spa', tier: 'lux', area: 'Singthali', why: 'Riverside luxury 30 min upriver.' },
      { n: 'Aloha on the Ganges', tier: 'mid', area: 'Tapovan', why: 'Riverside pool, rafting arranged, good for groups.' },
      { n: 'Divine Resort', tier: 'mid', area: 'Laxman Jhula', why: 'River-view rooms in the centre of things.' },
      { n: 'Zostel Rishikesh', tier: 'budget', area: 'Tapovan', why: 'Yoga-crowd hostel with river views.' },
    ],
    mumbai: [
      { n: 'The Taj Mahal Palace', tier: 'lux', area: 'Colaba', why: 'The 1903 landmark by the Gateway of India.' },
      { n: 'The Oberoi Mumbai', tier: 'lux', area: 'Nariman Point', why: 'Marine Drive views, polished service.' },
      { n: 'Abode Bombay', tier: 'mid', area: 'Colaba', why: 'Design boutique hotel in a heritage building.' },
      { n: 'Residency Hotel Fort', tier: 'mid', area: 'Fort', why: 'Clean, central, walkable to Kala Ghoda.' },
      { n: 'The Hosteller Mumbai', tier: 'budget', area: 'Colaba', why: 'Hostel steps from the Gateway.' },
    ],
  },

  /* Getting around & booking-ahead, per destination */
  ops: {
    bengaluru: [
      { n: 'Uber / Ola', kind: 'cab', url: 'https://www.uber.com/in/en/', why: 'Cabs and autos; airport pickup zone is signed. Namma Yatri is the local auto app.' },
      { n: 'BMTC Vayu Vajra airport bus', kind: 'bus', url: 'https://mybmtc.karnataka.gov.in/', why: 'AC buses to MG Road / Indiranagar every 30 min, ₹300.' },
      { n: 'Savaari (car with driver)', kind: 'car', url: 'https://www.savaari.com/', why: 'Book a 6-seater Innova with driver for Mysuru, Coorg, Kabini day trips.' },
    ],
    goa: [
      { n: 'Goa Miles', kind: 'cab', url: 'https://www.goamiles.com/', why: 'The official Goa taxi app — Uber/Ola are restricted here.' },
      { n: 'Scooter rental', kind: 'activity', url: 'https://www.google.com/maps/search/scooter+rental+Anjuna+Goa', why: '€6/day; carry your international driving permit.' },
      { n: 'Dudhsagar jeep safari (forest dept)', kind: 'activity', url: 'https://www.google.com/maps/search/Dudhsagar+jeep+safari+Kulem', why: 'Jeeps leave from Kulem; go before 09:00 in season.' },
    ],
    munnar: [
      { n: 'Car with driver from Kochi airport', kind: 'car', url: 'https://www.savaari.com/', why: 'Pre-book: 4 h, ≈ €60–80 for the car one way.' },
      { n: 'Eravikulam National Park tickets', kind: 'activity', url: 'https://www.eravikulam.org/', why: 'Book online — limited daily slots; closed Feb–Mar for calving.' },
      { n: 'Kolukkumalai sunrise jeep', kind: 'activity', url: 'https://www.google.com/maps/search/Kolukkumalai+jeep+safari+Suryanelli', why: 'Arrange through your hotel the day before; 04:30 start.' },
    ],
    kochi: [
      { n: 'Spice Routes / Lakes & Lagoons houseboats', kind: 'boat', url: 'https://www.spiceroutes.in/', why: 'Book a private houseboat 2–4 weeks ahead for November.' },
      { n: 'Kerala Kathakali Centre', kind: 'activity', url: 'https://www.kathakalicentre.com/', why: 'Daily 18:00 show; arrive 17:00 for the make-up session.' },
      { n: 'Uber / Ola', kind: 'cab', url: 'https://www.uber.com/in/en/', why: 'Works well in Kochi; Fort Kochi is best on foot.' },
    ],
    thekkady: [
      { n: 'Periyar Tiger Reserve boat & treks', kind: 'activity', url: 'https://www.periyarfoundation.org/', why: 'Book boat rides and bamboo rafting online ahead — they sell out.' },
    ],
    mysuru: [
      { n: 'Vande Bharat / Shatabdi (IRCTC)', kind: 'train', url: 'https://www.irctc.co.in/', why: 'BLR → Mysuru in 2 h; book 2–3 weeks out, or via 12Go.' },
      { n: 'Mysore Palace tickets', kind: 'activity', url: 'https://mysorepalace.karnataka.gov.in/', why: 'Buy at the gate; Sunday 19:00 illumination is free from the grounds.' },
    ],
    coorg: [
      { n: 'Car with driver', kind: 'car', url: 'https://www.savaari.com/', why: 'No ride-hailing in Coorg; hire a car for the whole stay.' },
      { n: 'Dubare Elephant Camp (Jungle Lodges)', kind: 'activity', url: 'https://www.junglelodges.com/', why: 'Morning interaction slots; book via JLR.' },
    ],
    hampi: [
      { n: 'Hampi Express (IRCTC)', kind: 'train', url: 'https://www.irctc.co.in/', why: 'Overnight from Bengaluru; book 2AC a month ahead.' },
      { n: 'Auto / e-bike hire in Hampi Bazaar', kind: 'cab', url: 'https://www.google.com/maps/search/bicycle+rental+Hampi', why: 'Full-day auto ≈ ₹1,200; e-bikes and cycles ≈ ₹300.' },
      { n: 'Hampi Utsav dates', kind: 'activity', url: 'https://www.karnatakatourism.org/', why: 'Check the festival dates before fixing your November nights.' },
    ],
    hyderabad: [
      { n: 'Uber / Ola / Rapido', kind: 'cab', url: 'https://www.uber.com/in/en/', why: 'Traffic is heavy; use the Metro for Charminar-side trips.' },
      { n: 'Golconda sound & light show', kind: 'activity', url: 'https://www.telanganatourism.com/', why: 'English show most evenings; tickets at the fort.' },
    ],
    ooty: [
      { n: 'Nilgiri Mountain Railway (IRCTC)', kind: 'train', url: 'https://www.irctc.co.in/', why: 'Mettupalayam 07:10 departure; book the moment tickets open (60 days).' },
      { n: 'Car with driver via Bandipur', kind: 'car', url: 'https://www.savaari.com/', why: 'Ghat road closed 21:00–06:00 through the tiger reserve.' },
    ],
    kabini: [
      { n: 'Safari bookings via your lodge / JLR', kind: 'activity', url: 'https://www.junglelodges.com/', why: 'Safaris are allotted to lodges — book stay and safari together.' },
    ],
    chikmagalur: [
      { n: 'Car with driver', kind: 'car', url: 'https://www.savaari.com/', why: 'Needed for Mullayanagiri, Hebbe Falls and Belur/Halebidu.' },
      { n: 'Bhadra boat safari (JLR)', kind: 'activity', url: 'https://www.junglelodges.com/', why: 'River Tern Lodge runs boat safaris; book ahead.' },
    ],
    gokarna: [
      { n: 'KSRTC / private sleeper bus', kind: 'bus', url: 'https://www.redbus.in/', why: 'Overnight from Bengaluru; pick a 2+1 AC sleeper.' },
      { n: 'Boat to Paradise Beach', kind: 'boat', url: 'https://www.google.com/maps/search/Om+Beach+boat+Gokarna', why: 'Fishermen run boats from Om Beach; agree the price first.' },
    ],
    wayanad: [
      { n: 'Car with driver', kind: 'car', url: 'https://www.savaari.com/', why: 'Sights are spread out; a car for two days covers them.' },
      { n: 'Edakkal Caves & Chembra permits', kind: 'activity', url: 'https://www.keralatourism.org/wayanad/', why: 'Chembra trek permits are limited daily — arrive by 07:00.' },
    ],
    varkala: [
      { n: 'Airport taxi from Trivandrum', kind: 'cab', url: 'https://www.uber.com/in/en/', why: 'Uber works from TRV; 1 h to the cliff.' },
      { n: 'Ayurveda treatments', kind: 'activity', url: 'https://www.google.com/maps/search/Ayurveda+Varkala', why: 'Book multi-day programmes a week ahead; check the centre is government-certified.' },
    ],
    andaman: [
      { n: 'Makruzz / Nautika ferries', kind: 'boat', url: 'https://www.makruzz.com/', why: 'Port Blair ↔ Havelock ↔ Neil; book online 2+ weeks ahead.' },
      { n: 'Scuba: Barefoot Scuba / Dive India', kind: 'activity', url: 'https://www.google.com/maps/search/scuba+diving+Havelock', why: 'PADI centres on Havelock; discover-scuba needs no licence.' },
      { n: 'Cellular Jail light & sound show', kind: 'activity', url: 'https://www.andamantourism.gov.in/', why: 'English show; book at the counter on arrival day.' },
    ],
    madurai: [
      { n: 'Uber / Ola & temple-area autos', kind: 'cab', url: 'https://www.uber.com/in/en/', why: 'Autos are cheap; agree prices near the temple.' },
      { n: 'Car to Chettinad / Rameswaram', kind: 'car', url: 'https://www.savaari.com/', why: 'Day trips are 2–3 h each way.' },
    ],
    badami: [
      { n: 'Car from Hampi / Hubli', kind: 'car', url: 'https://www.savaari.com/', why: 'A one-day loop Badami → Pattadakal → Aihole needs a car.' },
    ],
    pondicherry: [
      { n: 'Auroville Matrimandir viewing', kind: 'activity', url: 'https://auroville.org/', why: 'Book the viewing-point pass at the visitor centre a day ahead.' },
      { n: 'Bicycle / scooter rental', kind: 'cab', url: 'https://www.google.com/maps/search/bike+rental+Pondicherry', why: 'White Town is flat and small — cycle it.' },
    ],
    goldentriangle: [
      { n: 'Taj Mahal tickets (ASI)', kind: 'activity', url: 'https://asi.payumoney.com/', why: 'Book online for a timed sunrise slot; closed Fridays.' },
      { n: 'Gatimaan Express Delhi → Agra (IRCTC)', kind: 'train', url: 'https://www.irctc.co.in/', why: '1 h 40; the fastest way to Agra.' },
      { n: 'Car with driver for the loop', kind: 'car', url: 'https://www.savaari.com/', why: 'Delhi → Agra → Jaipur over 4–5 days, ≈ €300–400 for the car.' },
    ],
    rajasthan: [
      { n: 'Car Udaipur → Ranakpur → Jodhpur', kind: 'car', url: 'https://www.savaari.com/', why: 'Full-day drive with temple stop; hotels can also arrange.' },
      { n: 'Mehrangarh Fort zip line (Flying Fox)', kind: 'activity', url: 'https://www.flyingfox.asia/', why: 'Six zip lines over the fort lakes; book online.' },
    ],
    varanasi: [
      { n: 'Sunrise boat via your hotel', kind: 'boat', url: 'https://www.google.com/maps/search/boat+ride+Dashashwamedh+Ghat', why: 'Book a licensed boatman through the hotel; ≈ ₹500–1,000 per boat/hour.' },
      { n: 'Uber / Ola & e-rickshaws', kind: 'cab', url: 'https://www.uber.com/in/en/', why: 'Cars can\'t reach the ghats; walk the last part.' },
    ],
    rishikesh: [
      { n: 'Rafting (Red Chilli Adventure)', kind: 'activity', url: 'https://www.redchilliadventure.com/', why: 'Licensed operator; 16 km Shivpuri run is the classic.' },
      { n: 'Taxi from Dehradun airport', kind: 'cab', url: 'https://www.uber.com/in/en/', why: '45 min; prepaid counter at the airport.' },
    ],
    mumbai: [
      { n: 'Uber / Ola & black-and-yellow taxis', kind: 'cab', url: 'https://www.uber.com/in/en/', why: 'Metered cabs are fine in south Mumbai; avoid 17:00–20:00 traffic.' },
      { n: 'Elephanta ferry from the Gateway', kind: 'boat', url: 'https://www.google.com/maps/search/Elephanta+ferry+Gateway+of+India', why: 'Boats every 30 min from 09:00; caves closed Mondays.' },
      { n: 'Dharavi walk (Reality Tours)', kind: 'activity', url: 'https://realitytoursandtravel.com/', why: 'Community-run tours; 80 % of profits go back to Dharavi.' },
    ],
  },
};
