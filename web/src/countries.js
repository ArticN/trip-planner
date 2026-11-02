// Dados dos países para montar uma viagem nova sem precisar de internet: moeda, fuso, idioma, tomadas,
// voltagem, lado do trânsito, telefone de emergência, aeroporto principal e cidades mais visitadas.
// Países fora da lista também funcionam: o app usa o que o navegador sabe (nome, idioma, fuso) e a moeda
// fica para escolher. Números de emergência e tomadas mudam pouco, mas vale conferir antes de viajar.
import { countryName } from './geo.js';

// c: [nome, lat, lng, emoji]
const C = (name, lat, lng, emoji = '📍') => ({ name, lat, lng, emoji });

// cur: moeda · tz: fuso principal · lang: idioma(s) · plug: tipos de tomada · volt: voltagem
// drive: 'E' = mão inglesa (dirige pela esquerda) · sos: emergência · air: aeroporto principal
export const COUNTRY_INFO = {
  // América do Sul
  BR: { cur: 'BRL', tz: 'America/Sao_Paulo', lang: 'Português', plug: 'N, C', volt: '127 V ou 220 V', sos: '190 polícia · 192 SAMU · 193 bombeiros', air: 'GRU',
    cities: [C('São Paulo', -23.5505, -46.6333, '🏙️'), C('Rio de Janeiro', -22.9068, -43.1729, '🏖️'), C('Salvador', -12.9777, -38.5016, '🌴'), C('Florianópolis', -27.5954, -48.548, '🏝️'), C('Foz do Iguaçu', -25.5163, -54.5854, '💧'), C('Gramado', -29.3746, -50.8764, '🌲')] },
  AR: { cur: 'ARS', tz: 'America/Argentina/Buenos_Aires', lang: 'Espanhol', plug: 'I, C', volt: '220 V', sos: '911 · 107 ambulância', air: 'EZE',
    cities: [C('Buenos Aires', -34.6037, -58.3816, '💃'), C('Bariloche', -41.1335, -71.3103, '🏔️'), C('Mendoza', -32.8895, -68.8458, '🍷'), C('El Calafate', -50.3379, -72.2648, '🧊'), C('Ushuaia', -54.8019, -68.303, '🐧'), C('Salta', -24.7821, -65.4232, '🌵')] },
  CL: { cur: 'CLP', tz: 'America/Santiago', lang: 'Espanhol', plug: 'C, L', volt: '220 V', sos: '133 polícia · 131 ambulância', air: 'SCL',
    cities: [C('Santiago', -33.4489, -70.6693, '🏔️'), C('Valparaíso', -33.0472, -71.6127, '🎨'), C('San Pedro de Atacama', -22.9087, -68.1997, '🏜️'), C('Puerto Natales', -51.7236, -72.4875, '🏔️'), C('Puerto Varas', -41.3195, -72.9854, '🌋')] },
  UY: { cur: 'UYU', tz: 'America/Montevideo', lang: 'Espanhol', plug: 'C, F, L', volt: '220 V', sos: '911', air: 'MVD',
    cities: [C('Montevidéu', -34.9011, -56.1645, '🏛️'), C('Punta del Este', -34.9627, -54.9505, '🏖️'), C('Colonia del Sacramento', -34.4626, -57.8398, '🏘️')] },
  PY: { cur: 'PYG', tz: 'America/Asuncion', lang: 'Espanhol e guarani', plug: 'C', volt: '220 V', sos: '911', air: 'ASU',
    cities: [C('Assunção', -25.2637, -57.5759, '🏛️'), C('Ciudad del Este', -25.5097, -54.6111, '🛍️'), C('Encarnación', -27.3306, -55.8667, '🏖️')] },
  PE: { cur: 'PEN', tz: 'America/Lima', lang: 'Espanhol e quíchua', plug: 'A, B, C', volt: '220 V', sos: '105 polícia · 106 ambulância', air: 'LIM',
    cities: [C('Lima', -12.0464, -77.0428, '🍽️'), C('Cusco', -13.532, -71.9675, '🦙'), C('Machu Picchu', -13.1547, -72.5254, '⛰️'), C('Arequipa', -16.409, -71.5375, '🌋'), C('Puno', -15.8402, -70.0219, '🛶')] },
  BO: { cur: 'BOB', tz: 'America/La_Paz', lang: 'Espanhol, quíchua e aimará', plug: 'A, C', volt: '230 V', sos: '110 polícia · 118 ambulância', air: 'LPB',
    cities: [C('La Paz', -16.4897, -68.1193, '🚡'), C('Uyuni', -20.4603, -66.8261, '🧂'), C('Sucre', -19.0196, -65.2619, '🏛️'), C('Santa Cruz de la Sierra', -17.8146, -63.1561, '🌴')] },
  CO: { cur: 'COP', tz: 'America/Bogota', lang: 'Espanhol', plug: 'A, B', volt: '110 V', sos: '123', air: 'BOG',
    cities: [C('Bogotá', 4.711, -74.0721, '🏛️'), C('Cartagena', 10.391, -75.4794, '🏰'), C('Medellín', 6.2442, -75.5812, '🌺'), C('San Andrés', 12.5847, -81.7006, '🏝️')] },
  EC: { cur: 'USD', tz: 'America/Guayaquil', lang: 'Espanhol', plug: 'A, B', volt: '120 V', sos: '911', air: 'UIO',
    cities: [C('Quito', -0.1807, -78.4678, '⛰️'), C('Galápagos', -0.7432, -90.3135, '🐢'), C('Cuenca', -2.9001, -79.0059, '🏛️'), C('Guayaquil', -2.171, -79.9224, '🌴')] },
  // Américas do Norte e Central, Caribe
  US: { cur: 'USD', tz: 'America/New_York', lang: 'Inglês', plug: 'A, B', volt: '120 V', sos: '911', air: 'JFK', tzNote: 'O país tem vários fusos: ajuste o fuso da viagem se for para a costa oeste.',
    cities: [C('Nova York', 40.7128, -74.006, '🗽'), C('Orlando', 28.5383, -81.3792, '🎢'), C('Miami', 25.7617, -80.1918, '🌴'), C('Los Angeles', 34.0522, -118.2437, '🎬'), C('San Francisco', 37.7749, -122.4194, '🌉'), C('Las Vegas', 36.1699, -115.1398, '🎰')] },
  CA: { cur: 'CAD', tz: 'America/Toronto', lang: 'Inglês e francês', plug: 'A, B', volt: '120 V', sos: '911', air: 'YYZ', tzNote: 'O país tem vários fusos: Vancouver fica 3 horas atrás de Toronto.',
    cities: [C('Toronto', 43.6532, -79.3832, '🏙️'), C('Montreal', 45.5019, -73.5674, '🥯'), C('Quebec', 46.8139, -71.208, '🏰'), C('Vancouver', 49.2827, -123.1207, '🌲'), C('Banff', 51.1784, -115.5708, '🏔️')] },
  MX: { cur: 'MXN', tz: 'America/Mexico_City', lang: 'Espanhol', plug: 'A, B', volt: '127 V', sos: '911', air: 'MEX', tzNote: 'Cancún e a Riviera Maya ficam 1 hora à frente da Cidade do México.',
    cities: [C('Cidade do México', 19.4326, -99.1332, '🌮'), C('Cancún', 21.1619, -86.8515, '🏖️'), C('Playa del Carmen', 20.6296, -87.0739, '🌊'), C('Tulum', 20.2114, -87.4654, '🏛️'), C('Oaxaca', 17.0732, -96.7266, '🎨')] },
  CR: { cur: 'CRC', tz: 'America/Costa_Rica', lang: 'Espanhol', plug: 'A, B', volt: '120 V', sos: '911', air: 'SJO',
    cities: [C('San José', 9.9281, -84.0907, '🏙️'), C('La Fortuna', 10.471, -84.6453, '🌋'), C('Monteverde', 10.301, -84.825, '🌿'), C('Tamarindo', 10.2993, -85.8371, '🏄')] },
  PA: { cur: 'USD', tz: 'America/Panama', lang: 'Espanhol', plug: 'A, B', volt: '120 V', sos: '911', air: 'PTY',
    cities: [C('Cidade do Panamá', 8.9824, -79.5199, '🚢'), C('Bocas del Toro', 9.3403, -82.242, '🏝️')] },
  CU: { cur: 'CUP', tz: 'America/Havana', lang: 'Espanhol', plug: 'A, B, C, L', volt: '110 V ou 220 V', sos: '106 polícia · 104 ambulância', air: 'HAV',
    cities: [C('Havana', 23.1136, -82.3666, '🚗'), C('Varadero', 23.1394, -81.2861, '🏖️'), C('Trinidad', 21.8019, -79.9847, '🏘️')] },
  DO: { cur: 'DOP', tz: 'America/Santo_Domingo', lang: 'Espanhol', plug: 'A, B', volt: '120 V', sos: '911', air: 'PUJ',
    cities: [C('Punta Cana', 18.5601, -68.3725, '🏖️'), C('Santo Domingo', 18.4861, -69.9312, '🏛️'), C('Samaná', 19.2056, -69.3364, '🐋')] },
  // Europa
  PT: { cur: 'EUR', tz: 'Europe/Lisbon', lang: 'Português', plug: 'C, F', volt: '230 V', sos: '112', air: 'LIS',
    cities: [C('Lisboa', 38.7223, -9.1393, '🚋'), C('Porto', 41.1579, -8.6291, '🍷'), C('Sintra', 38.8029, -9.3817, '🏰'), C('Coimbra', 40.2033, -8.4103, '🎓'), C('Lagos', 37.1028, -8.673, '🏖️'), C('Funchal', 32.6669, -16.9241, '🌺')] },
  ES: { cur: 'EUR', tz: 'Europe/Madrid', lang: 'Espanhol', plug: 'C, F', volt: '230 V', sos: '112', air: 'MAD',
    cities: [C('Madri', 40.4168, -3.7038, '🏛️'), C('Barcelona', 41.3874, 2.1686, '⛪'), C('Sevilha', 37.3891, -5.9845, '💃'), C('Granada', 37.1773, -3.5986, '🏰'), C('Valência', 39.4699, -0.3763, '🥘')] },
  FR: { cur: 'EUR', tz: 'Europe/Paris', lang: 'Francês', plug: 'C, E', volt: '230 V', sos: '112', air: 'CDG',
    cities: [C('Paris', 48.8566, 2.3522, '🗼'), C('Nice', 43.7102, 7.262, '🏖️'), C('Lyon', 45.764, 4.8357, '🍽️'), C('Marselha', 43.2965, 5.3698, '⛵'), C('Bordeaux', 44.8378, -0.5792, '🍷')] },
  IT: { cur: 'EUR', tz: 'Europe/Rome', lang: 'Italiano', plug: 'C, F, L', volt: '230 V', sos: '112', air: 'FCO',
    cities: [C('Roma', 41.9028, 12.4964, '🏛️'), C('Florença', 43.7696, 11.2558, '🎨'), C('Veneza', 45.4408, 12.3155, '🛶'), C('Milão', 45.4642, 9.19, '👗'), C('Nápoles', 40.8518, 14.2681, '🍕')] },
  DE: { cur: 'EUR', tz: 'Europe/Berlin', lang: 'Alemão', plug: 'C, F', volt: '230 V', sos: '112', air: 'FRA',
    cities: [C('Berlim', 52.52, 13.405, '🐻'), C('Munique', 48.1351, 11.582, '🍺'), C('Frankfurt', 50.1109, 8.6821, '🏙️'), C('Hamburgo', 53.5511, 9.9937, '⚓'), C('Colônia', 50.9375, 6.9603, '⛪')] },
  GB: { cur: 'GBP', tz: 'Europe/London', lang: 'Inglês', plug: 'G', volt: '230 V', sos: '999 ou 112', air: 'LHR', drive: 'E',
    cities: [C('Londres', 51.5074, -0.1278, '💂'), C('Edimburgo', 55.9533, -3.1883, '🏰'), C('Oxford', 51.752, -1.2577, '🎓'), C('Liverpool', 53.4084, -2.9916, '🎸'), C('Manchester', 53.4808, -2.2426, '⚽')] },
  IE: { cur: 'EUR', tz: 'Europe/Dublin', lang: 'Inglês e irlandês', plug: 'G', volt: '230 V', sos: '112 ou 999', air: 'DUB', drive: 'E',
    cities: [C('Dublin', 53.3498, -6.2603, '🍀'), C('Galway', 53.2707, -9.0568, '🎻'), C('Cork', 51.8985, -8.4756, '🏘️')] },
  NL: { cur: 'EUR', tz: 'Europe/Amsterdam', lang: 'Holandês', plug: 'C, F', volt: '230 V', sos: '112', air: 'AMS',
    cities: [C('Amsterdã', 52.3676, 4.9041, '🚲'), C('Roterdã', 51.9244, 4.4777, '🏙️'), C('Haia', 52.0705, 4.3007, '🏛️'), C('Utrecht', 52.0907, 5.1214, '🌷')] },
  BE: { cur: 'EUR', tz: 'Europe/Brussels', lang: 'Holandês, francês e alemão', plug: 'C, E', volt: '230 V', sos: '112', air: 'BRU',
    cities: [C('Bruxelas', 50.8503, 4.3517, '🧇'), C('Bruges', 51.2093, 3.2247, '🛶'), C('Gante', 51.0543, 3.7174, '🏰'), C('Antuérpia', 51.2194, 4.4025, '💎')] },
  CH: { cur: 'CHF', tz: 'Europe/Zurich', lang: 'Alemão, francês e italiano', plug: 'C, J', volt: '230 V', sos: '112', air: 'ZRH',
    cities: [C('Zurique', 47.3769, 8.5417, '🏙️'), C('Lucerna', 47.0502, 8.3093, '🌉'), C('Interlaken', 46.6863, 7.8632, '🏔️'), C('Zermatt', 46.0207, 7.7491, '⛷️'), C('Genebra', 46.2044, 6.1432, '⛲')] },
  AT: { cur: 'EUR', tz: 'Europe/Vienna', lang: 'Alemão', plug: 'C, F', volt: '230 V', sos: '112', air: 'VIE',
    cities: [C('Viena', 48.2082, 16.3738, '🎻'), C('Salzburgo', 47.8095, 13.055, '🎼'), C('Hallstatt', 47.5622, 13.6493, '🏔️'), C('Innsbruck', 47.2692, 11.4041, '⛷️')] },
  CZ: { cur: 'CZK', tz: 'Europe/Prague', lang: 'Tcheco', plug: 'C, E', volt: '230 V', sos: '112', air: 'PRG',
    cities: [C('Praga', 50.0755, 14.4378, '🏰'), C('Český Krumlov', 48.8127, 14.3175, '🏘️')] },
  HU: { cur: 'HUF', tz: 'Europe/Budapest', lang: 'Húngaro', plug: 'C, F', volt: '230 V', sos: '112', air: 'BUD',
    cities: [C('Budapeste', 47.4979, 19.0402, '♨️')] },
  PL: { cur: 'PLN', tz: 'Europe/Warsaw', lang: 'Polonês', plug: 'C, E', volt: '230 V', sos: '112', air: 'WAW',
    cities: [C('Cracóvia', 50.0647, 19.945, '🏰'), C('Varsóvia', 52.2297, 21.0122, '🏙️'), C('Gdańsk', 54.352, 18.6466, '⚓')] },
  GR: { cur: 'EUR', tz: 'Europe/Athens', lang: 'Grego', plug: 'C, F', volt: '230 V', sos: '112', air: 'ATH',
    cities: [C('Atenas', 37.9838, 23.7275, '🏛️'), C('Santorini', 36.3932, 25.4615, '🌅'), C('Mykonos', 37.4467, 25.3289, '🏖️'), C('Creta', 35.3387, 25.1442, '🏝️')] },
  HR: { cur: 'EUR', tz: 'Europe/Zagreb', lang: 'Croata', plug: 'C, F', volt: '230 V', sos: '112', air: 'ZAG',
    cities: [C('Dubrovnik', 42.6507, 18.0944, '🏰'), C('Split', 43.5081, 16.4402, '⛵'), C('Plitvice', 44.8654, 15.582, '💧'), C('Zagreb', 45.815, 15.9819, '🏛️')] },
  TR: { cur: 'TRY', tz: 'Europe/Istanbul', lang: 'Turco', plug: 'C, F', volt: '230 V', sos: '112', air: 'IST',
    cities: [C('Istambul', 41.0082, 28.9784, '🕌'), C('Capadócia', 38.6431, 34.8289, '🎈'), C('Pamukkale', 37.9137, 29.1187, '♨️'), C('Antália', 36.8969, 30.7133, '🏖️')] },
  SE: { cur: 'SEK', tz: 'Europe/Stockholm', lang: 'Sueco', plug: 'C, F', volt: '230 V', sos: '112', air: 'ARN',
    cities: [C('Estocolmo', 59.3293, 18.0686, '🏛️'), C('Gotemburgo', 57.7089, 11.9746, '⚓'), C('Kiruna', 67.8558, 20.2253, '🌌')] },
  NO: { cur: 'NOK', tz: 'Europe/Oslo', lang: 'Norueguês', plug: 'C, F', volt: '230 V', sos: '112', air: 'OSL',
    cities: [C('Oslo', 59.9139, 10.7522, '🏙️'), C('Bergen', 60.3913, 5.3221, '🏘️'), C('Tromsø', 69.6492, 18.9553, '🌌'), C('Lofoten', 68.2342, 14.5683, '🏔️')] },
  DK: { cur: 'DKK', tz: 'Europe/Copenhagen', lang: 'Dinamarquês', plug: 'C, E, F, K', volt: '230 V', sos: '112', air: 'CPH',
    cities: [C('Copenhague', 55.6761, 12.5683, '🧜'), C('Aarhus', 56.1629, 10.2039, '🏛️')] },
  FI: { cur: 'EUR', tz: 'Europe/Helsinki', lang: 'Finlandês e sueco', plug: 'C, F', volt: '230 V', sos: '112', air: 'HEL',
    cities: [C('Helsinque', 60.1699, 24.9384, '⛵'), C('Rovaniemi', 66.5039, 25.7294, '🎅')] },
  IS: { cur: 'ISK', tz: 'Atlantic/Reykjavik', lang: 'Islandês', plug: 'C, F', volt: '230 V', sos: '112', air: 'KEF',
    cities: [C('Reykjavík', 64.1466, -21.9426, '🌌'), C('Vík', 63.4186, -19.006, '🌋'), C('Akureyri', 65.6885, -18.1262, '🐋')] },
  // África e Oriente Médio
  ZA: { cur: 'ZAR', tz: 'Africa/Johannesburg', lang: 'Inglês, africâner, zulu e outros', plug: 'C, D, M, N', volt: '230 V', sos: '10111 polícia · 10177 ambulância · 112 do celular', air: 'JNB', drive: 'E',
    cities: [C('Cidade do Cabo', -33.9249, 18.4241, '⛰️'), C('Joanesburgo', -26.2041, 28.0473, '🏙️'), C('Kruger', -24.9948, 31.5969, '🦁')] },
  EG: { cur: 'EGP', tz: 'Africa/Cairo', lang: 'Árabe', plug: 'C, F', volt: '220 V', sos: '122 polícia · 123 ambulância · 126 polícia turística', air: 'CAI',
    cities: [C('Cairo', 30.0444, 31.2357, '🐪'), C('Luxor', 25.6872, 32.6396, '🏛️'), C('Assuã', 24.0889, 32.8998, '⛵'), C('Hurghada', 27.2579, 33.8116, '🤿')] },
  MA: { cur: 'MAD', tz: 'Africa/Casablanca', lang: 'Árabe e berbere (francês muito usado)', plug: 'C, E', volt: '220 V', sos: '19 polícia · 15 ambulância', air: 'RAK',
    cities: [C('Marrakech', 31.6295, -7.9811, '🕌'), C('Fez', 34.0181, -5.0078, '🏺'), C('Chefchaouen', 35.1688, -5.2636, '💙'), C('Merzouga', 31.0802, -4.0133, '🐪'), C('Casablanca', 33.5731, -7.5898, '🏙️')] },
  AE: { cur: 'AED', tz: 'Asia/Dubai', lang: 'Árabe (inglês muito usado)', plug: 'G', volt: '230 V', sos: '999 polícia · 998 ambulância', air: 'DXB',
    cities: [C('Dubai', 25.2048, 55.2708, '🏙️'), C('Abu Dhabi', 24.4539, 54.3773, '🕌')] },
  QA: { cur: 'QAR', tz: 'Asia/Qatar', lang: 'Árabe (inglês muito usado)', plug: 'G, D', volt: '240 V', sos: '999', air: 'DOH',
    cities: [C('Doha', 25.2854, 51.531, '🏙️')] },
  // Ásia
  JP: { cur: 'JPY', tz: 'Asia/Tokyo', lang: 'Japonês', plug: 'A, B', volt: '100 V', sos: '110 polícia · 119 ambulância e bombeiros', air: 'NRT', drive: 'E',
    cities: [C('Tóquio', 35.6762, 139.6503, '🗼'), C('Kyoto', 35.0116, 135.7681, '⛩️'), C('Osaka', 34.6937, 135.5023, '🏯'), C('Nara', 34.6851, 135.8048, '🦌'), C('Hiroshima', 34.3853, 132.4553, '🕊️'), C('Hakone', 35.2324, 139.1069, '🗻')] },
  KR: { cur: 'KRW', tz: 'Asia/Seoul', lang: 'Coreano', plug: 'C, F', volt: '220 V', sos: '112 polícia · 119 ambulância', air: 'ICN',
    cities: [C('Seul', 37.5665, 126.978, '🏙️'), C('Busan', 35.1796, 129.0756, '🌊'), C('Jeju', 33.4996, 126.5312, '🌋'), C('Gyeongju', 35.8562, 129.2247, '🏯')] },
  CN: { cur: 'CNY', tz: 'Asia/Shanghai', lang: 'Mandarim', plug: 'A, C, I', volt: '220 V', sos: '110 polícia · 120 ambulância', air: 'PEK',
    cities: [C('Pequim', 39.9042, 116.4074, '🏯'), C('Xangai', 31.2304, 121.4737, '🏙️'), C("Xi'an", 34.3416, 108.9398, '🗿'), C('Chengdu', 30.5728, 104.0668, '🐼'), C('Guilin', 25.2736, 110.29, '⛰️')] },
  HK: { cur: 'HKD', tz: 'Asia/Hong_Kong', lang: 'Cantonês e inglês', plug: 'G', volt: '220 V', sos: '999', air: 'HKG', drive: 'E',
    cities: [C('Hong Kong', 22.3193, 114.1694, '🏙️')] },
  TW: { cur: 'TWD', tz: 'Asia/Taipei', lang: 'Mandarim', plug: 'A, B', volt: '110 V', sos: '110 polícia · 119 ambulância', air: 'TPE',
    cities: [C('Taipei', 25.033, 121.5654, '🏙️'), C('Tainan', 22.9999, 120.227, '🏯'), C('Hualien', 23.9872, 121.6015, '⛰️')] },
  TH: { cur: 'THB', tz: 'Asia/Bangkok', lang: 'Tailandês', plug: 'A, B, C, O', volt: '220 V', sos: '191 polícia · 1155 polícia turística · 1669 ambulância', air: 'BKK', drive: 'E',
    cities: [C('Bangcoc', 13.7563, 100.5018, '🛕'), C('Chiang Mai', 18.7883, 98.9853, '🐘'), C('Phuket', 7.8804, 98.3923, '🏖️'), C('Krabi', 8.0863, 98.9063, '🧗'), C('Koh Samui', 9.512, 100.0136, '🏝️')] },
  VN: { cur: 'VND', tz: 'Asia/Ho_Chi_Minh', lang: 'Vietnamita', plug: 'A, C, F', volt: '220 V', sos: '113 polícia · 115 ambulância', air: 'SGN',
    cities: [C('Hanói', 21.0278, 105.8342, '🛵'), C('Baía de Ha Long', 20.9101, 107.1839, '⛵'), C('Hoi An', 15.8801, 108.338, '🏮'), C('Ho Chi Minh', 10.8231, 106.6297, '🏙️')] },
  ID: { cur: 'IDR', tz: 'Asia/Makassar', lang: 'Indonésio', plug: 'C, F', volt: '230 V', sos: '110 polícia · 118 ambulância', air: 'DPS', drive: 'E', tzNote: 'Fuso de Bali; Jacarta fica 1 hora atrás.',
    cities: [C('Ubud', -8.5069, 115.2625, '🌾'), C('Seminyak', -8.6913, 115.1683, '🏖️'), C('Ilhas Gili', -8.35, 116.04, '🐢'), C('Jacarta', -6.2088, 106.8456, '🏙️')] },
  SG: { cur: 'SGD', tz: 'Asia/Singapore', lang: 'Inglês, malaio, mandarim e tâmil', plug: 'G', volt: '230 V', sos: '999 polícia · 995 ambulância', air: 'SIN', drive: 'E',
    cities: [C('Singapura', 1.3521, 103.8198, '🦁')] },
  MY: { cur: 'MYR', tz: 'Asia/Kuala_Lumpur', lang: 'Malaio (inglês muito usado)', plug: 'G', volt: '240 V', sos: '999', air: 'KUL', drive: 'E',
    cities: [C('Kuala Lumpur', 3.139, 101.6869, '🏙️'), C('Penang', 5.4141, 100.3288, '🍜'), C('Langkawi', 6.35, 99.8, '🏝️')] },
  PH: { cur: 'PHP', tz: 'Asia/Manila', lang: 'Filipino e inglês', plug: 'A, B, C', volt: '220 V', sos: '911', air: 'MNL',
    cities: [C('Manila', 14.5995, 120.9842, '🏙️'), C('El Nido', 11.1956, 119.4075, '🏝️'), C('Cebu', 10.3157, 123.8854, '🐋'), C('Boracay', 11.9674, 121.9248, '🏖️')] },
  IN: { cur: 'INR', tz: 'Asia/Kolkata', lang: 'Hindi e inglês', plug: 'C, D, M', volt: '230 V', sos: '112', air: 'DEL', drive: 'E',
    cities: [C('Nova Délhi', 28.6139, 77.209, '🕌'), C('Agra', 27.1767, 78.0081, '🕌'), C('Jaipur', 26.9124, 75.7873, '🏰'), C('Varanasi', 25.3176, 82.9739, '🪔'), C('Mumbai', 19.076, 72.8777, '🎬')] },
  MV: { cur: 'MVR', tz: 'Indian/Maldives', lang: 'Divehi (inglês muito usado)', plug: 'D, G', volt: '230 V', sos: '119 polícia · 102 ambulância', air: 'MLE', drive: 'E',
    cities: [C('Malé', 4.1755, 73.5093, '🏝️')] },
  // Oceania
  AU: { cur: 'AUD', tz: 'Australia/Sydney', lang: 'Inglês', plug: 'I', volt: '230 V', sos: '000', air: 'SYD', drive: 'E', tzNote: 'O país tem vários fusos: Perth fica 3 horas atrás de Sydney.',
    cities: [C('Sydney', -33.8688, 151.2093, '🎭'), C('Melbourne', -37.8136, 144.9631, '☕'), C('Cairns', -16.9186, 145.7781, '🐠'), C('Brisbane', -27.4698, 153.0251, '🏙️'), C('Perth', -31.9505, 115.8605, '🏖️')] },
  NZ: { cur: 'NZD', tz: 'Pacific/Auckland', lang: 'Inglês e maori', plug: 'I', volt: '230 V', sos: '111', air: 'AKL', drive: 'E',
    cities: [C('Auckland', -36.8485, 174.7633, '⛵'), C('Queenstown', -45.0312, 168.6626, '🏔️'), C('Rotorua', -38.1368, 176.2497, '♨️'), C('Wellington', -41.2865, 174.7762, '🏛️')] },
};

// bandeira a partir do código do país (dois "indicadores regionais" Unicode)
export const flag = (a) => (a && /^[A-Z]{2}$/.test(a) ? String.fromCodePoint(...[...a].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : '');

// todos os países (códigos ISO de duas letras) com nome em português, para a busca do assistente
const ALL_CODES = (() => {
  const out = [];
  for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) out.push(String.fromCharCode(65 + i, 65 + j));
  return out;
})();
let allCache = null;
export function allCountries() {
  if (allCache) return allCache;
  const names = (() => { try { return new Intl.DisplayNames(['pt-BR'], { type: 'region', fallback: 'none' }); } catch { return null; } })();
  const seen = new Set();
  allCache = ALL_CODES.map((a) => {
    let n = null;
    try { n = names?.of(a); } catch { /* código inválido */ }
    if (!n && COUNTRY_INFO[a]) n = countryName(a);
    if (!n || n === a || seen.has(n)) return null;
    // códigos especiais (UE, ONU, "região desconhecida"...) ficam de fora
    if (/^(EU|EZ|UN|QO|XA|XB|ZZ|AA|QM|QN|QP|QQ|QR|QS|QT|QU|QV|QW|QX|QY|QZ|XK)$/.test(a)) return null;
    seen.add(n);
    return { a, name: n, known: !!COUNTRY_INFO[a] };
  }).filter(Boolean).sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
  return allCache;
}

const fold = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
// busca por nome (sem acento) ou código: "japao", "JP", "eua"
const ALIASES = { eua: 'US', usa: 'US', 'estados unidos': 'US', inglaterra: 'GB', 'reino unido': 'GB', escocia: 'GB', holanda: 'NL', 'coreia': 'KR', dubai: 'AE', emirados: 'AE', bali: 'ID', tchequia: 'CZ' };
export function searchCountries(q, limit = 8) {
  const f = fold(q);
  if (!f) return [];
  const list = allCountries();
  const alias = Object.entries(ALIASES).filter(([k]) => k.startsWith(f)).map(([, a]) => a);
  const hits = list.filter((c) => c.a.toLowerCase() === f || fold(c.name).startsWith(f) || fold(c.name).includes(` ${f}`) || alias.includes(c.a));
  // também acha pelo nome de uma cidade sugerida ("Paris" → França)
  const byCity = Object.entries(COUNTRY_INFO).filter(([, i]) => i.cities.some((c) => fold(c.name).startsWith(f))).map(([a]) => list.find((c) => c.a === a)).filter(Boolean);
  return [...new Set([...hits.sort((x, y) => (y.known - x.known)), ...byCity])].slice(0, limit);
}

// países mais procurados, para os atalhos do primeiro passo
export const POPULAR = ['PT', 'US', 'AR', 'FR', 'IT', 'ES', 'JP', 'CL', 'GB', 'MX'];

// o que se sabe de um país: da tabela acima ou, para os outros, do próprio navegador
export function infoOf(a) {
  const own = COUNTRY_INFO[a];
  if (own) return { a, name: countryName(a), ...own, known: true };
  let tz = null;
  let lang = null;
  try {
    const loc = new Intl.Locale(`und-${a}`).maximize();
    const zones = loc.getTimeZones?.() || loc.timeZones;
    if (zones?.length) tz = zones[0];
    lang = new Intl.DisplayNames(['pt-BR'], { type: 'language' }).of(loc.language);
    if (lang) lang = lang[0].toUpperCase() + lang.slice(1);
  } catch { /* navegador sem esses dados */ }
  return { a, name: countryName(a), cur: null, tz, lang, cities: [], known: false };
}

// nome da moeda em português ("iene japonês")
export const currencyName = (cur) => { try { return new Intl.DisplayNames(['pt-BR'], { type: 'currency' }).of(cur); } catch { return cur; } };

// diferença de horas entre dois fusos numa data (positivo = destino à frente)
export function tzDiff(fromTz, toTz, day) {
  try {
    const at = new Date(`${day || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
    const off = (tz) => {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(at).map((x) => [x.type, x.value]));
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - at.getTime()) / 3600000;
    };
    return off(toTz) - off(fromTz);
  } catch { return null; }
}
export function fmtTzDiff(h) {
  if (h == null) return '';
  if (h === 0) return 'mesmo horário';
  const n = Math.abs(h);
  const t = Number.isInteger(n) ? `${n} h` : `${Math.floor(n)} h ${Math.round((n % 1) * 60)} min`;
  return `${t} ${h > 0 ? 'à frente' : 'atrás'}`;
}

const plugSet = (p) => new Set(String(p || '').split(/[^A-Z]+/).filter(Boolean));
// as tomadas do destino aceitam os plugues de casa?
export function plugAdvice(dest, home) {
  if (!dest?.plug) return null;
  if (!home?.plug) return { need: null, text: `Tomadas tipo ${dest.plug}, ${dest.volt}.` };
  const d = plugSet(dest.plug);
  const shared = [...plugSet(home.plug)].filter((x) => d.has(x));
  const need = !shared.length;
  return { need, text: need ? `Tomadas tipo ${dest.plug} (${dest.volt}). Seus plugues (${home.plug}) não encaixam: leve um adaptador universal.` : `Tomadas tipo ${dest.plug} (${dest.volt}). Plugues tipo ${shared.join(', ')} encaixam sem adaptador.` };
}

// "JP,KR" → ['JP', 'KR']
export const countryList = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
