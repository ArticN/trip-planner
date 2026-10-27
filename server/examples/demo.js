// Roteiro de demonstração, totalmente fictício: datas, hotéis e voos são inventados.
// Serve para mostrar o que o app faz (cidades, hospedagens, dia a dia, voos com fuso, metrô e opções no mesmo horário).
// Coordenadas são aproximadas: dá pra ajustar arrastando os marcadores no app.

export const TRIP = {
  name: 'Tóquio e Kyoto (exemplo)',
  subtitle: '東京・京都',
  emoji: '🗾',
  start: '2027-04-02',
  end: '2027-04-10',
  currency: 'JPY',
  home_currency: 'BRL',
  rate: 0.035, // 1 JPY em BRL — edite no app
  tz: 'Asia/Tokyo',
};

export const EXAMPLE = { key: 'exemplo', title: 'Tóquio e Kyoto (roteiro de exemplo)', description: 'Uma semana fictícia entre Tóquio, Kyoto e Nara, com horários, hotéis, metrô e custos.' };

export const CITIES = [
  { key: 'toquio', name: 'Tóquio', emoji: '🗼', color: '#8e44ad', lat: 35.6762, lng: 139.6503 },
  { key: 'kyoto', name: 'Kyoto', emoji: '⛩️', color: '#e67e22', lat: 35.0116, lng: 135.7681 },
  { key: 'nara', name: 'Nara', emoji: '🦌', color: '#b7791f', lat: 34.6851, lng: 135.8048 },
  { key: 'transito', name: 'Em trânsito', emoji: '✈️', color: '#64748b', lat: 35.5494, lng: 139.7798 },
];

export const STAYS = [
  { city: 'toquio', name: 'Hotel de exemplo em Ginza', address: 'Ginza, Chuo, Tokyo', check_in: '2027-04-03', check_out: '2027-04-06', lat: 35.6717, lng: 139.7640, check_in_time: '15:00', check_out_time: '11:00', cost: 54000, notes: 'Hospedagem fictícia, só para o exemplo.' },
  { city: 'kyoto', name: 'Ryokan de exemplo em Higashiyama', address: 'Higashiyama, Kyoto', check_in: '2027-04-06', check_out: '2027-04-09', lat: 35.0003, lng: 135.7780, check_in_time: '15:00', check_out_time: '10:00', cost: 66000, notes: 'Hospedagem fictícia, só para o exemplo.' },
];

// Atalho: a(dia, início, fim, cidade, título, tipo, local, detalhes, transporte, custo, lat, lng, extra)
// tipos: sight | food | move | stay | shop | free | flight
const a = (day, start, end, city, title, kind, location = '', details = '', transport = '', cost = null, lat = null, lng = null, extra = {}) => ({
  day, start, end, city, title, kind, location, details, transport, cost, lat, lng, ...extra,
});

const GINZA_LINE = {
  mode: 'metro', line: 'Ginza', code: 'G', color: '#FF9500', dir: 'sentido Asakusa', min: 18, cost: 210,
  from: { name: 'Ginza', lat: 35.6717, lng: 139.7650 },
  to: { name: 'Asakusa', lat: 35.7111, lng: 139.7964 },
  stops: [
    { name: 'Kyobashi', lat: 35.6766, lng: 139.7701 }, { name: 'Nihombashi', lat: 35.6820, lng: 139.7740 },
    { name: 'Mitsukoshimae', lat: 35.6872, lng: 139.7735 }, { name: 'Kanda', lat: 35.6939, lng: 139.7709 },
    { name: 'Suehirocho', lat: 35.7027, lng: 139.7718 }, { name: 'Ueno-hirokoji', lat: 35.7077, lng: 139.7727 },
    { name: 'Ueno', lat: 35.7114, lng: 139.7768 }, { name: 'Inaricho', lat: 35.7111, lng: 139.7826 },
    { name: 'Tawaramachi', lat: 35.7108, lng: 139.7905 },
  ],
};

export const ACTIVITIES = [
  // ── 02/04 ida
  a('2027-04-02', '22:00', '10:00', 'transito', 'Voo São Paulo → Tóquio (HND)', 'flight', 'Guarulhos (GRU) → Haneda (HND)', 'Voo fictício com uma escala. Cada ponta usa o fuso local, então a duração sai certa.', '✈️ Avião', null, -23.4356, -46.4731, { end_day: '2027-04-04', start_tz: 'America/Sao_Paulo', end_tz: 'Asia/Tokyo', from_code: 'GRU', to_code: 'HND' }),

  // ── 03/04 (em trânsito, o voo continua)
  // ── 04/04 chegada
  a('2027-04-04', '10:00', '11:00', 'toquio', 'Chegada em Haneda + trem até Ginza', 'move', 'Haneda → Ginza', 'Keikyu + Asakusa Line, cerca de 30 min. Deixar as malas no hotel.', '🚃 Trem', 600, 35.5494, 139.7798),
  a('2027-04-04', '11:30', '12:30', 'toquio', 'Almoço: ramen', 'food', 'Yurakucho', 'Duas opções no mesmo horário: aparecem num carrossel e o mapa mostra cada uma.', '', 1200, 35.6750, 139.7630, { alt: 'almoco-04' }),
  a('2027-04-04', '11:30', '12:30', 'toquio', 'Almoço: sushi de esteira', 'food', 'Ginza', '', '', 2500, 35.6705, 139.7660, { alt: 'almoco-04' }),
  a('2027-04-04', '13:00', '14:30', 'toquio', 'Jardins do Palácio Imperial', 'sight', 'Chiyoda, Tokyo', 'Caminhada leve para ajudar com o jet lag.', '🚶 A pé', null, 35.6852, 139.7528),
  a('2027-04-04', '15:00', '16:00', 'toquio', 'Check-in no hotel', 'stay', 'Ginza, Chuo, Tokyo', '', '', null, 35.6717, 139.7640),
  a('2027-04-04', '18:30', '20:00', 'toquio', 'Jantar em Yurakucho (izakaya sob os trilhos)', 'food', 'Yurakucho', '', '🚶 A pé', 3500, 35.6748, 139.7620),

  // ── 05/04
  a('2027-04-05', '08:00', '08:45', 'toquio', 'Café da manhã', 'food', 'Ginza', '', '', 1200, 35.6717, 139.7640),
  a('2027-04-05', '09:30', '11:30', 'toquio', 'Senso-ji e Nakamise-dori', 'sight', 'Asakusa, Tokyo', 'Chegar cedo para evitar a multidão.', '🚇 Metrô', null, 35.7148, 139.7967, { route: { rides: [GINZA_LINE] } }),
  a('2027-04-05', '12:00', '13:00', 'toquio', 'Almoço: tempurá', 'food', 'Asakusa', '', '', 2000, 35.7120, 139.7950),
  a('2027-04-05', '13:30', '15:00', 'toquio', 'Tokyo Skytree', 'sight', 'Sumida, Tokyo', 'Mirante a 350 m.', '🚶 A pé', 2400, 35.7101, 139.8107),
  a('2027-04-05', '16:30', '18:30', 'toquio', 'Shibuya Crossing e Shibuya Sky', 'sight', 'Shibuya, Tokyo', 'Pôr do sol no mirante (reservar horário).', '🚇 Metrô', 2500, 35.6595, 139.7005),
  a('2027-04-05', '19:00', '20:30', 'toquio', 'Jantar: yakitori', 'food', 'Shibuya', '', '', 3000, 35.6590, 139.6990),

  // ── 06/04 Tóquio → Kyoto
  a('2027-04-06', '07:30', '08:30', 'toquio', 'Tsukiji Outer Market', 'food', 'Tsukiji, Tokyo', 'Café da manhã de peixe fresco.', '🚶 A pé', 2500, 35.6655, 139.7707),
  a('2027-04-06', '09:30', '10:00', 'toquio', 'Check-out do hotel', 'stay', 'Ginza, Chuo, Tokyo', '', '', null, 35.6717, 139.7640),
  a('2027-04-06', '10:30', '12:45', 'kyoto', 'Shinkansen Tóquio → Kyoto', 'move', 'Tokyo Station → Kyoto Station', 'Nozomi, cerca de 2h15. Sentar do lado direito para ver o Monte Fuji.', '🚄 Shinkansen', 14000, 35.0116, 135.7681),
  a('2027-04-06', '13:00', '14:00', 'kyoto', 'Almoço perto da estação', 'food', 'Kyoto Station', '', '', 1500, 34.9858, 135.7588),
  a('2027-04-06', '15:00', '15:30', 'kyoto', 'Check-in no ryokan', 'stay', 'Higashiyama, Kyoto', '', '', null, 35.0003, 135.7780),
  a('2027-04-06', '16:00', '18:00', 'kyoto', 'Gion e Hanamikoji ao entardecer', 'sight', 'Gion, Kyoto', '', '🚶 A pé', null, 35.0037, 135.7750),
  a('2027-04-06', '19:00', '20:30', 'kyoto', 'Jantar kaiseki no ryokan', 'food', 'Higashiyama, Kyoto', '', '', 8000, 35.0003, 135.7780),

  // ── 07/04
  a('2027-04-07', '06:30', '08:30', 'kyoto', 'Fushimi Inari Taisha', 'sight', 'Fushimi, Kyoto', 'Os portões torii ficam vazios bem cedo.', '🚃 Trem', null, 34.9671, 135.7727),
  a('2027-04-07', '09:00', '10:00', 'kyoto', 'Café da manhã', 'food', 'Fushimi', '', '', 1200, 34.9680, 135.7700),
  a('2027-04-07', '11:00', '13:00', 'kyoto', 'Kiyomizu-dera', 'sight', 'Higashiyama, Kyoto', 'Subir por Ninenzaka e Sannenzaka.', '🚌 Ônibus', 500, 34.9949, 135.7850),
  a('2027-04-07', '13:30', '14:30', 'kyoto', 'Almoço: tofu yudofu', 'food', 'Higashiyama', '', '', 3000, 34.9970, 135.7820),
  a('2027-04-07', '15:30', '17:30', 'kyoto', 'Caminho do Filósofo', 'sight', 'Sakyo, Kyoto', 'Cerejeiras em abril.', '🚶 A pé', null, 35.0270, 135.7942),
  a('2027-04-07', '18:30', '20:00', 'kyoto', 'Jantar no Pontocho', 'food', 'Pontocho, Kyoto', '', '', 4000, 35.0050, 135.7710),

  // ── 08/04 bate-volta a Nara
  a('2027-04-08', '08:00', '08:45', 'kyoto', 'Café da manhã', 'food', 'Higashiyama, Kyoto', '', '', null, 35.0003, 135.7780),
  a('2027-04-08', '09:00', '09:45', 'nara', 'Trem Kyoto → Nara', 'move', 'Kyoto → Kintetsu-Nara', 'Kintetsu, cerca de 45 min.', '🚃 Trem', 760, 34.6840, 135.8270),
  a('2027-04-08', '10:00', '12:30', 'nara', 'Parque de Nara e Todai-ji', 'sight', 'Nara Park', 'Cervos soltos no parque e o grande Buda.', '🚶 A pé', 600, 34.6890, 135.8398),
  a('2027-04-08', '13:00', '14:00', 'nara', 'Almoço: kakinoha-zushi', 'food', 'Naramachi', '', '', 1800, 34.6790, 135.8300),
  a('2027-04-08', '16:00', '17:30', 'kyoto', 'Arashiyama: bosque de bambu', 'sight', 'Arashiyama, Kyoto', 'Voltando de Nara direto para o oeste de Kyoto.', '🚃 Trem', null, 35.0170, 135.6713),
  a('2027-04-08', '19:00', '20:30', 'kyoto', 'Jantar de despedida', 'food', 'Kyoto', '', '', 5000),
  a('2027-04-08', '20:30', '21:30', 'kyoto', 'Lembrancinhas em Nishiki', 'shop', 'Nishiki Market, Kyoto', '', '', 3000, 35.0050, 135.7647),

  // ── 09/04 volta
  a('2027-04-09', '09:00', '09:30', 'kyoto', 'Check-out do ryokan', 'stay', 'Higashiyama, Kyoto', '', '', null, 35.0003, 135.7780),
  a('2027-04-09', '10:00', '11:30', 'kyoto', 'Haruka até o aeroporto de Kansai', 'move', 'Kyoto → Kansai (KIX)', '', '🚃 Trem', 3600, 34.4320, 135.2304),
  a('2027-04-09', '14:00', '07:00', 'transito', 'Voo Osaka (KIX) → São Paulo', 'flight', 'Kansai (KIX) → Guarulhos (GRU)', 'Voo fictício com uma escala.', '✈️ Avião', null, 34.4320, 135.2304, { end_day: '2027-04-10', start_tz: 'Asia/Tokyo', end_tz: 'America/Sao_Paulo', from_code: 'KIX', to_code: 'GRU' }),
];
