// Viagem de exemplo, 100% fictícia: hotéis, reservas, valores e datas são inventados.
// Os lugares visitados são pontos turísticos públicos, com coordenadas aproximadas.
// Serve para conhecer o app sem cadastrar nada: carregue pela API (POST /api/examples/exemplo)
// ou importe o arquivo examples/viagem-exemplo.json na tela inicial ("Importar backup").

export const TRIP = {
  name: 'Japão em 8 dias (exemplo)',
  subtitle: 'Roteiro fictício para testar o app',
  emoji: '🗾',
  start: '2027-04-03',
  end: '2027-04-11',
  currency: 'JPY',
  home_currency: 'BRL',
  rate: 0.037, // 1 JPY em BRL, edite no app
  usd_rate: 0.0067, // 1 JPY em dólar, para a cota de compras
  tz: 'Asia/Tokyo',
};

export const EXAMPLE = { key: 'exemplo', title: 'Japão em 8 dias (exemplo fictício)', description: 'Tóquio, Kyoto e um bate-volta a Nara, com voos, metrô, trem-bala, hospedagens e custos inventados.' };

export const CITIES = [
  { key: 'toquio', name: 'Tóquio', emoji: '🗼', color: '#8e44ad', lat: 35.6762, lng: 139.6503 },
  { key: 'kyoto', name: 'Kyoto', emoji: '⛩️', color: '#e67e22', lat: 35.0116, lng: 135.7681 },
  { key: 'nara', name: 'Nara', emoji: '🦌', color: '#b7791f', lat: 34.6851, lng: 135.8048 },
];

export const STAYS = [
  { city: 'toquio', name: 'Hotel Exemplo Shinjuku', address: 'Shinjuku, Tokyo', check_in: '2027-04-05', check_out: '2027-04-08', check_in_time: '15:00', check_out_time: '11:00', booking: 'EXEMPLO-001', cost: 54000, lat: 35.6938, lng: 139.7034, notes: 'Hospedagem fictícia, só para mostrar o cartão de hotel.' },
  { city: 'kyoto', name: 'Pousada Exemplo Kyoto', address: 'Shimogyo-ku, Kyoto', check_in: '2027-04-08', check_out: '2027-04-10', check_in_time: '15:00', check_out_time: '10:00', booking: 'EXEMPLO-002', cost: 36000, lat: 34.9858, lng: 135.7588, notes: 'Hospedagem fictícia.' },
];

// Atalho: a(dia, início, fim, cidade, título, tipo, local, detalhes, transporte, custo, lat, lng, extra)
// tipos: sight | food | move | stay | shop | free | flight
const a = (day, start, end, city, title, kind, location = '', details = '', transport = '', cost = null, lat = null, lng = null, extra = {}) => ({
  day, start, end, city, title, kind, location, details, transport, cost, lat, lng, ...extra,
});

export const ACTIVITIES = [
  // ── ida
  a('2027-04-03', '23:00', '06:00', 'transito', 'Voo de ida São Paulo → Tóquio', 'flight', 'Guarulhos (GRU) → Haneda (HND)', 'Voo fictício com uma escala. Cada ponta usa o fuso local.', '✈️ Avião', null, -23.4356, -46.4731, { end_day: '2027-04-05', start_tz: 'America/Sao_Paulo', end_tz: 'Asia/Tokyo', from_code: 'GRU', to_code: 'HND' }),

  // ── 05/04 Tóquio: chegada e Shinjuku
  a('2027-04-05', '07:00', '08:00', 'toquio', 'Chegada e trem até o hotel', 'move', 'Haneda → Shinjuku', 'Deixar as malas no hotel até o check-in.', '🚃 Trem', 600, 35.5494, 139.7798),
  a('2027-04-05', '09:00', null, 'toquio', 'Café da manhã em Shinjuku', 'food', 'Shinjuku, Tokyo', 'Primeira de duas opções no mesmo horário: use as setas no cartão.', '', 1200, 35.6909, 139.7003, { alt: 'cafe-0405' }),
  a('2027-04-05', '09:00', null, 'toquio', 'Café da manhã numa padaria de estação', 'food', 'Estação de Shinjuku', 'Opção alternativa, mais rápida.', '', 800, 35.6896, 139.7006, { alt: 'cafe-0405' }),
  a('2027-04-05', '10:30', '12:30', 'toquio', 'Shinjuku Gyoen', 'sight', 'Shinjuku Gyoen National Garden', 'Jardim enorme, ótimo para a época das cerejeiras.', '🚶 A pé', 500, 35.6852, 139.7100),
  a('2027-04-05', '13:00', '14:00', 'toquio', 'Almoço: ramen', 'food', 'Shinjuku, Tokyo', '', '', 1100, 35.6905, 139.7020),
  a('2027-04-05', '15:00', null, 'toquio', 'Check-in no hotel', 'stay', 'Shinjuku, Tokyo', 'Descanso curto para o jetlag.', '', null, 35.6938, 139.7034),
  a('2027-04-05', '17:30', '18:30', 'toquio', 'Mirante da Prefeitura de Tóquio', 'sight', 'Tokyo Metropolitan Government Building', 'Mirante gratuito, bonito no pôr do sol.', '🚶 A pé', null, 35.6896, 139.6917),
  a('2027-04-05', '19:30', '21:00', 'toquio', 'Jantar em Omoide Yokocho', 'food', 'Omoide Yokocho, Shinjuku', 'Vielas de espetinhos perto da estação.', '', 3000, 35.6934, 139.6995),

  // ── 06/04 Tóquio: Ginza e Asakusa
  a('2027-04-06', '08:00', '08:45', 'toquio', 'Café da manhã', 'food', 'Shinjuku, Tokyo', '', '', 900, 35.6909, 139.7003),
  a('2027-04-06', '10:00', '11:30', 'toquio', 'Passeio por Ginza', 'shop', 'Ginza, Tokyo', 'Avenida Chuo-dori, lojas de departamento.', '🚇 Metrô', null, 35.6717, 139.7650),
  a('2027-04-06', '12:15', '13:00', 'toquio', 'Senso-ji e Nakamise-dori', 'sight', 'Asakusa, Tokyo', 'O templo mais antigo de Tóquio. Exemplo de trecho de metrô com estações no mapa.', '🚇 Metrô', null, 35.7148, 139.7967, {
    route: { rides: [{
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
    }] },
  }),
  a('2027-04-06', '13:15', '14:15', 'toquio', 'Almoço: tempurá', 'food', 'Asakusa, Tokyo', '', '', 1800, 35.7125, 139.7960),
  a('2027-04-06', '15:00', '16:30', 'toquio', 'Tokyo Skytree', 'sight', 'Oshiage, Tokyo', 'Vista panorâmica da cidade.', '🚶 A pé', 2100, 35.7101, 139.8107),
  a('2027-04-06', '19:00', '20:30', 'toquio', 'Jantar: sushi de esteira', 'food', 'Shinjuku, Tokyo', '', '', 2500, 35.6915, 139.7010),

  // ── 07/04 Tóquio: Shibuya e Harajuku
  a('2027-04-07', '08:00', '08:45', 'toquio', 'Café da manhã', 'food', 'Shinjuku, Tokyo', '', '', 900, 35.6909, 139.7003),
  a('2027-04-07', '09:30', '10:30', 'toquio', 'Santuário Meiji', 'sight', 'Meiji Jingu, Shibuya', 'Floresta no meio da cidade.', '🚃 Trem', null, 35.6764, 139.6993),
  a('2027-04-07', '10:45', '12:00', 'toquio', 'Takeshita-dori', 'shop', 'Harajuku, Tokyo', 'Rua de lojas e doces coloridos.', '🚶 A pé', null, 35.6716, 139.7031),
  a('2027-04-07', '12:30', '13:30', 'toquio', 'Almoço em Harajuku', 'food', 'Harajuku, Tokyo', '', '', 1500, 35.6702, 139.7027),
  a('2027-04-07', '15:00', '17:00', 'toquio', 'Cruzamento de Shibuya e Shibuya Sky', 'sight', 'Shibuya, Tokyo', 'Ingresso com horário marcado: exemplo de atividade com hora dentro do bloco.', '🚃 Trem', 2500, 35.6595, 139.7005),
  a('2027-04-07', '19:00', '20:30', 'toquio', 'Jantar: izakaya', 'food', 'Shibuya, Tokyo', '', '', 3500, 35.6590, 139.6982),

  // ── 08/04 Tóquio → Kyoto
  a('2027-04-08', '07:30', '08:00', 'toquio', 'Café da manhã e check-out', 'food', 'Shinjuku, Tokyo', '', '', 800, 35.6909, 139.7003),
  a('2027-04-08', '09:00', '11:15', 'kyoto', 'Shinkansen Tóquio → Kyoto', 'move', 'Tokyo Station → Kyoto Station', 'Trem-bala Tokaido, cerca de 2h15.', '🚄 Shinkansen', 14000, 34.9858, 135.7588, {
    route: { rides: [{
      mode: 'shinkansen', line: 'Tokaido', color: '#1E64C8', dir: 'sentido Shin-Osaka', min: 135, cost: 14000,
      from: { name: 'Tokyo', lat: 35.6812, lng: 139.7671 },
      to: { name: 'Kyoto', lat: 34.9858, lng: 135.7588 },
      stops: [{ name: 'Shinagawa', lat: 35.6285, lng: 139.7387 }, { name: 'Shin-Yokohama', lat: 35.5069, lng: 139.6170 }, { name: 'Nagoya', lat: 35.1709, lng: 136.8815 }],
    }] },
  }),
  a('2027-04-08', '12:00', '13:00', 'kyoto', 'Almoço perto da estação', 'food', 'Kyoto Station', '', '', 1300, 34.9850, 135.7580),
  a('2027-04-08', '14:00', '16:30', 'kyoto', 'Fushimi Inari Taisha', 'sight', 'Fushimi-ku, Kyoto', 'Milhares de portais torii subindo o morro.', '🚃 Trem', null, 34.9671, 135.7727),
  a('2027-04-08', '19:00', '20:30', 'kyoto', 'Jantar em Pontocho', 'food', 'Pontocho, Kyoto', 'Viela estreita à beira do rio Kamo.', '', 4000, 35.0050, 135.7710),

  // ── 09/04 bate-volta a Nara
  a('2027-04-09', '08:00', '08:45', 'kyoto', 'Café da manhã', 'food', 'Kyoto', '', '', 900, 34.9858, 135.7588),
  a('2027-04-09', '09:30', '10:15', 'nara', 'Trem Kyoto → Nara', 'move', 'Kyoto Station → Kintetsu Nara', 'Bate-volta: aparece como ramal tracejado na linha da viagem.', '🚃 Trem', 760, 34.6840, 135.8270),
  a('2027-04-09', '10:30', '12:30', 'nara', 'Parque de Nara e Todai-ji', 'sight', 'Nara Park', 'Cervos soltos e o grande Buda de bronze.', '🚶 A pé', 600, 34.6890, 135.8398),
  a('2027-04-09', '12:45', '13:45', 'nara', 'Almoço em Naramachi', 'food', 'Naramachi, Nara', '', '', 1500, 34.6781, 135.8289),
  a('2027-04-09', '15:00', '15:45', 'kyoto', 'Trem de volta a Kyoto', 'move', 'Kintetsu Nara → Kyoto Station', '', '🚃 Trem', 760, 34.9858, 135.7588),
  a('2027-04-09', '16:30', '18:00', 'kyoto', 'Gion ao entardecer', 'sight', 'Gion, Kyoto', 'Hanamikoji-dori e o santuário Yasaka.', '🚌 Ônibus', null, 35.0037, 135.7751),
  a('2027-04-09', '19:00', '20:30', 'kyoto', 'Jantar em Gion', 'food', 'Gion, Kyoto', '', '', 3500, 35.0030, 135.7745),

  // ── 10/04 Kyoto e volta
  a('2027-04-10', '06:30', '08:00', 'kyoto', 'Bosque de bambu de Arashiyama', 'sight', 'Arashiyama, Kyoto', 'Bem cedo, antes da multidão.', '🚃 Trem', null, 35.0170, 135.6713),
  a('2027-04-10', '08:30', '09:15', 'kyoto', 'Café da manhã em Arashiyama', 'food', 'Arashiyama, Kyoto', '', '', 1000, 35.0150, 135.6780),
  a('2027-04-10', '10:00', '11:00', 'kyoto', 'Kinkaku-ji (Pavilhão Dourado)', 'sight', 'Kita-ku, Kyoto', '', '🚌 Ônibus', 500, 35.0394, 135.7292),
  a('2027-04-10', '12:00', '13:00', 'kyoto', 'Almoço e lembrancinhas no Nishiki Market', 'food', 'Nishiki Market, Kyoto', '', '', 2000, 35.0050, 135.7649),
  a('2027-04-10', '14:00', '16:30', 'kyoto', 'Trem até o aeroporto de Kansai', 'move', 'Kyoto → Kansai (KIX)', 'Trem expresso, cerca de 1h20.', '🚃 Trem', 3600, 34.4320, 135.2304),
  a('2027-04-10', '19:00', '08:00', 'transito', 'Voo de volta Osaka → São Paulo', 'flight', 'Kansai (KIX) → Guarulhos (GRU)', 'Voo fictício com uma escala.', '✈️ Avião', null, 34.4320, 135.2304, { end_day: '2027-04-11', start_tz: 'Asia/Tokyo', end_tz: 'America/Sao_Paulo', from_code: 'KIX', to_code: 'GRU' }),
];

export const CHECKLIST = [
  { grp: 'Documentos', text: 'Passaporte válido' },
  { grp: 'Documentos', text: 'Seguro viagem' },
  { grp: 'Reservas', text: 'Hotéis confirmados', done: true },
  { grp: 'Reservas', text: 'Ingresso do Shibuya Sky' },
  { grp: 'Mala', text: 'Adaptador de tomada' },
  { grp: 'Mala', text: 'Sapato confortável para caminhar' },
  { grp: 'Outros', text: 'Cartão de transporte (Suica/Pasmo) no celular' },
];

export const IDEAS = [
  { title: 'teamLab Planets', kind: 'sight', city: 'toquio', location: 'Toyosu, Tokyo', details: 'Museu de arte digital; encaixar se sobrar uma tarde.', cost: 3800, lat: 35.6491, lng: 139.7898 },
  { title: 'Kiyomizu-dera', kind: 'sight', city: 'kyoto', location: 'Higashiyama, Kyoto', details: 'Templo com varanda de madeira sobre a encosta.', lat: 34.9949, lng: 135.7850 },
];

export const PURCHASES = [
  { title: 'Fone de ouvido', store: 'Loja de eletrônicos', city: 'toquio', price: 25000, grp: 'Eletrônicos' },
  { title: 'Doces de matcha', store: 'Nishiki Market', city: 'kyoto', price: 2400, grp: 'Lembranças', exempt: true },
];
