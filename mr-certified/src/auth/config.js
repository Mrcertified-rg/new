/**
 * auth/config.js
 * Central settings and constants for the account system.
 * Change values here instead of hunting through the code.
 */

/** DEMO_MODE = the account system runs fully inside the browser (no server). */
export const DEMO_MODE = true;

/** Buyers stay signed in this long (days) after signing in / registering. */
export const SESSION_DAYS = 30;

/** Seller mode locks itself after this many idle minutes. */
export const ROLE_IDLE_MINUTES = 15;

/** Brute-force protection: lock a login after N wrong passwords for N seconds. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 60;

export const ROLE_LABEL = { buyer: 'Buyer', seller: 'Seller' };

/** Role application states (same wording as the product spec). */
export const STATUS_LABEL = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

/** Kenya's 47 counties - used for the delivery address dropdown. */
export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', "Murang'a", 'Nairobi', 'Nakuru', 'Nandi',
  'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

export const KENYA_SUB_COUNTIES = {
  Baringo: ['Baringo Central', 'Baringo North', 'Baringo South', 'Eldama Ravine', 'Mogotio', 'Tiaty'],
  Bomet: ['Bomet Central', 'Bomet East', 'Chepalungu', 'Konoin', 'Sotik'],
  Bungoma: ['Bumula', 'Bungoma Central', 'Bungoma East', 'Bungoma North', 'Bungoma South', 'Bungoma West', 'Kabuchai', 'Kimilili', 'Mt Elgon', 'Sirisia', 'Tongaren', 'Webuye East', 'Webuye West'],
  Busia: ['Budalangi', 'Butula', 'Funyula', 'Matayos', 'Nambale', 'Teso North', 'Teso South'],
  'Elgeyo-Marakwet': ['Keiyo North', 'Keiyo South', 'Marakwet East', 'Marakwet West'],
  Embu: ['Manyatta', 'Mbeere North', 'Mbeere South', 'Runyenjes'],
  Garissa: ['Dadaab', 'Fafi', 'Garissa Township', 'Hulugho', 'Ijara', 'Lagdera', 'Balambala'],
  'Homa Bay': ['Homa Bay Town', 'Kabondo Kasipul', 'Karachuonyo', 'Kasipul', 'Mbita', 'Ndhiwa', 'Rangwe', 'Suba'],
  Isiolo: ['Isiolo North', 'Isiolo South'],
  Kajiado: ['Isinya', 'Kajiado Central', 'Kajiado North', 'Kajiado South', 'Kajiado West'],
  Kakamega: ['Butere', 'Ikolomani', 'Khwisero', 'Likuyani', 'Lugari', 'Lurambi', 'Malava', 'Matungu', 'Mumias East', 'Mumias West', 'Navakholo', 'Shinyalu'],
  Kericho: ['Ainamoi', 'Belgut', 'Bureti', 'Kipkelion East', 'Kipkelion West', 'Soin Sigowet'],
  Kiambu: ['Gatundu North', 'Gatundu South', 'Githunguri', 'Juja', 'Kabete', 'Kiambaa', 'Kiambu', 'Kikuyu', 'Lari', 'Limuru', 'Ruiru', 'Thika Town'],
  Kilifi: ['Ganze', 'Kaloleni', 'Kilifi North', 'Kilifi South', 'Magarini', 'Malindi', 'Rabai'],
  Kirinyaga: ['Kirinyaga Central', 'Kirinyaga East', 'Kirinyaga West', 'Mwea East', 'Mwea West'],
  Kisii: ['Bobasi', 'Bomachoge Borabu', 'Bomachoge Chache', 'Bonchari', 'Kitutu Chache North', 'Kitutu Chache South', 'Nyaribari Chache', 'Nyaribari Masaba', 'South Mugirango'],
  Kisumu: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Muhoroni', 'Nyakach', 'Nyando', 'Seme'],
  Kitui: ['Kitui Central', 'Kitui East', 'Kitui Rural', 'Kitui South', 'Kitui West', 'Mwingi Central', 'Mwingi North', 'Mwingi West'],
  Kwale: ['Kinango', 'Lunga Lunga', 'Matuga', 'Msambweni'],
  Laikipia: ['Laikipia East', 'Laikipia North', 'Laikipia West'],
  Lamu: ['Lamu East', 'Lamu West'],
  Machakos: ['Kangundo', 'Kathiani', 'Machakos Town', 'Masinga', 'Matungulu', 'Mavoko', 'Yatta'],
  Makueni: ['Kaiti', 'Kibwezi East', 'Kibwezi West', 'Kilome', 'Makueni', 'Mukaa'],
  Mandera: ['Banissa', 'Lafey', 'Mandera Central', 'Mandera East', 'Mandera North', 'Mandera South', 'Mandera West'],
  Marsabit: ['Laisamis', 'Moyale', 'North Horr', 'Saku'],
  Meru: ['Buuri', 'Igembe Central', 'Igembe North', 'Igembe South', 'Imenti Central', 'Imenti North', 'Imenti South', 'Tigania East', 'Tigania West'],
  Migori: ['Awendo', 'Kuria East', 'Kuria West', 'Nyatike', 'Rongo', 'Suna East', 'Suna West', 'Uriri'],
  Mombasa: ['Changamwe', 'Jomvu', 'Kisauni', 'Likoni', 'Mvita', 'Nyali'],
  "Murang'a": ['Gatanga', 'Kahuro', 'Kandara', 'Kangema', 'Kigumo', 'Mathioya', 'Murang’a South'],
  Nairobi: ['Dagoretti North', 'Dagoretti South', 'Embakasi Central', 'Embakasi East', 'Embakasi North', 'Embakasi South', 'Embakasi West', 'Kamukunji', 'Kasarani', 'Kibra', 'Langata', 'Mathare', 'Roysambu', 'Ruaraka', 'Starehe', 'Westlands'],
  Nakuru: ['Bahati', 'Gilgil', 'Kuresoi North', 'Kuresoi South', 'Molo', 'Naivasha', 'Nakuru Town East', 'Nakuru Town West', 'Njoro', 'Rongai', 'Subukia'],
  Nandi: ['Aldai', 'Chesumei', 'Emgwen', 'Mosop', 'Nandi Hills', 'Tindiret'],
  Narok: ['Narok East', 'Narok North', 'Narok South', 'Narok West', 'Transmara East', 'Transmara West'],
  Nyamira: ['Borabu', 'Manga', 'Masaba North', 'Nyamira North', 'Nyamira South'],
  Nyandarua: ['Kinangop', 'Kipipiri', 'Ndaragwa', 'Ol Jorok', 'Ol Kalou'],
  Nyeri: ['Kieni East', 'Kieni West', 'Mathira', 'Mukurwe-ini', 'Nyeri Town', 'Othaya', 'Tetu'],
  Samburu: ['Samburu East', 'Samburu North', 'Samburu West'],
  Siaya: ['Bondo', 'Gem', 'Rarieda', 'Ugenya', 'Ugunja'],
  'Taita-Taveta': ['Mwatate', 'Taveta', 'Voi', 'Wundanyi'],
  'Tana River': ['Bura', 'Galole', 'Garsen'],
  'Tharaka-Nithi': ['Chuka/Igamba- Ng’ombe', 'Maara', 'Tharaka'],
  'Trans Nzoia': ['Cherangany', 'Endebess', 'Kiminini', 'Kwanza', 'Saboti'],
  Turkana: ['Loima', 'Turkana Central', 'Turkana East', 'Turkana North', 'Turkana South', 'Turkana West'],
  'Uasin Gishu': ['Ainabkoi', 'Kapseret', 'Kesses', 'Moiben', 'Soy', 'Turbo'],
  Vihiga: ['Emuhaya', 'Hamisi', 'Luanda', 'Sabatia', 'Vihiga'],
  Wajir: ['Eldas', 'Wajir East', 'Wajir North', 'Wajir South', 'Wajir West', 'Tarbaj'],
  'West Pokot': ['Kipkomo', 'Pokot South', 'Sigor', 'West Pokot'],
};
