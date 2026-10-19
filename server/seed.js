// Dados iniciais importados do Notion "Planner de Viagem - Japão".
// Horários já convertidos para o horário local (Japão) exibido no Notion.
// Coordenadas são aproximadas: dá pra ajustar arrastando os marcadores no app.

export const TRIP = {
  name: 'Japão 2026',
  subtitle: 'トラベルプランナー',
  start: '2026-11-06',
  end: '2026-11-29',
  brl_rate: '0.035', // 1 JPY em BRL — edite no app
};

export const CITIES = [
  { key: 'toquio', name: 'Tóquio', emoji: '🗼', color: '#8e44ad', lat: 35.6762, lng: 139.6503 },
  { key: 'nikko', name: 'Nikko', emoji: '🌲', color: '#2e86de', lat: 36.7500, lng: 139.5983 },
  { key: 'kawaguchiko', name: 'Kawaguchiko', emoji: '🗻', color: '#0fb5ae', lat: 35.5000, lng: 138.7686 },
  { key: 'nagoya', name: 'Nagoya', emoji: '🏰', color: '#27ae60', lat: 35.1815, lng: 136.9066 },
  { key: 'takayama', name: 'Takayama', emoji: '🏔️', color: '#16805f', lat: 36.1460, lng: 137.2520 },
  { key: 'shirakawa', name: 'Shirakawa-go', emoji: '🏘️', color: '#7cb342', lat: 36.2575, lng: 136.9062 },
  { key: 'kyoto', name: 'Kyoto', emoji: '⛩️', color: '#e67e22', lat: 35.0116, lng: 135.7681 },
  { key: 'nara', name: 'Nara', emoji: '🦌', color: '#b7791f', lat: 34.6851, lng: 135.8048 },
  { key: 'osaka', name: 'Osaka', emoji: '🏯', color: '#e74c3c', lat: 34.6937, lng: 135.5023 },
  { key: 'transito', name: 'Em trânsito', emoji: '✈️', color: '#64748b', lat: 35.7720, lng: 140.3929 },
];

// Hospedagens (check-out das cidades seguintes inferido pelo dia do trem/ônibus de saída)
export const STAYS = [
  { city: 'toquio', name: 'The Royal Park Canvas - Ginza 8', address: '8-9-4 Ginza, Chuo, Tokyo, 104-0061', check_in: '2026-11-08', check_out: '2026-11-15', lat: 35.6672, lng: 139.7600, notes: 'Check-in 15h, check-out 11h. Diária extra adicionada para entrar dia 8.' },
  { city: 'nagoya', name: 'Nikko Style Nagoya', address: '5-20-13 Meieki, Nakamura-ku, Nagoya, Aichi, 450-0002', check_in: '2026-11-15', check_out: '2026-11-17', lat: 35.1768, lng: 136.8885, notes: 'Check-in 15h.' },
  { city: 'takayama', name: 'Hida Hanasatonoyu Takayama Ouan', address: '4-313 Hanasato-machi, Takayama, Gifu, 506-0026', check_in: '2026-11-17', check_out: '2026-11-19', lat: 36.1427, lng: 137.2578, notes: 'Check-in 15h.' },
  { city: 'kyoto', name: 'The Royal Park Canvas Kyoto Nijo', address: '22-7 Nishinokyo Shokujicho, Nakagyo-ku, Kyoto, 604-8381', check_in: '2026-11-19', check_out: '2026-11-22', lat: 35.0130, lng: 135.7335, notes: 'Check-in 15h.' },
  { city: 'osaka', name: 'Hotel Monterey Le Frere Osaka', address: '1-12-8 Sonezakishinchi, Kita-ku, Osaka, 530-0002', check_in: '2026-11-22', check_out: '2026-11-26', lat: 34.6985, lng: 135.4945, notes: 'Check-in 15h.' },
  { city: 'toquio', name: 'Hotel em Tóquio (a definir)', address: '', check_in: '2026-11-26', check_out: '2026-11-28', lat: null, lng: null, notes: 'Hospedagem da volta a Tóquio ainda não cadastrada no Notion.' },
];

// Atalho: a(dia, início, fim, cidade, título, tipo, local, detalhes, transporte, custoJPY, lat, lng, extra)
// tipos: sight | food | move | stay | shop | free | flight
const a = (day, start, end, city, title, kind, location = '', details = '', transport = '', cost = null, lat = null, lng = null, extra = {}) => ({
  day, start, end, city, title, kind, location, details, transport, cost_jpy: cost, lat, lng, ...extra,
});

export const ACTIVITIES = [
  // ── 06/11 ida
  a('2026-11-06', '19:25', '10:20', 'transito', 'Voo GRU → Zurique → Tóquio (NRT)', 'flight', 'Guarulhos (GRU) → Zurique → Narita (NRT)', 'GRU 06/nov 19:25 → Zurique 07/nov 10:40 → Narita 08/nov 10:20 (Swiss/Lufthansa). Horários de cada ponta no fuso local.', '✈️ Avião', null, -23.4356, -46.4731, { end_day: '2026-11-08' }),

  // ── 08/11
  a('2026-11-08', '10:20', null, 'toquio', 'Chegada em Narita + deslocamento ao hotel', 'move', 'Aeroporto de Narita → hotel', 'Pouso 10:20. Deslocamento até o hotel em Ginza.', '🚃 Trem', null, 35.7720, 140.3929),
  a('2026-11-08', '15:00', null, 'toquio', 'Check-in + descanso curto', 'stay', '8-9-4 Ginza, Chuo, Tokyo, 104-0061', 'The Royal Park Canvas - Ginza 8. Check-in 15h, check-out 15/nov 11h.', '', null, 35.6672, 139.7600),
  a('2026-11-08', null, null, 'toquio', 'Café - BONGENCOFFEE Tokyo Ginza', 'food', '2-16-3 Ginza, Chuo, Tokyo', 'Café de especialidade num espaço minúsculo em Higashi-Ginza, com decoração japonesa e um bonsai atrás do barista.', '', null, 35.6700, 139.7685),
  a('2026-11-08', null, null, 'toquio', 'Passeio (pós-café) - Hibiya Park', 'sight', 'Hibiya Park, Chiyoda, Tokyo', 'Caminhada tranquila depois do café — luz natural e movimento leve pra ajudar a resetar o jetlag.', '🚶 A pé', null, 35.6738, 139.7560),
  a('2026-11-08', null, null, 'toquio', 'Almoço - Tonkatsu Aoki Ginza 8-chome', 'food', 'B1 Dai-San Soire Dobiru, 8-8-7 Ginza, Chuo, Tokyo', 'Tonkatsu premiere, a poucos passos do hotel. 15 lugares, fila de 30-60 min é comum. Almoço aos domingos só até 15h.', '', null, 35.6670, 139.7603),
  a('2026-11-08', null, null, 'toquio', 'Passeio (tarde) - Uniqlo Ginza Flagship + Ginza Six', 'shop', 'Chuo-dori, Ginza 6-chome, Tokyo', 'Uniqlo Ginza (12 andares) e GINZA SIX, um em frente ao outro. Só reconhecimento — compras grandes ficam pros últimos dias.', '🚶 A pé', null, 35.6706, 139.7646),
  a('2026-11-08', null, null, 'toquio', 'Jantar - Menya Sugo', 'food', '4-19-1 Shinbashi, Minato City, Tokyo 105-0004', '⚠️ Aos domingos pode abrir só 11h-15h30 (sem jantar) — confirmar. Plano B: Ginza Ramen Shiraishi (cash only).', '', null, 35.6660, 139.7563),

  // ── 09/11
  a('2026-11-09', null, null, 'toquio', 'Café da Manhã', 'food', 'Ginza, Tokyo', 'Café da manhã tranquilo em Ginza antes de seguir pra Asakusa.', '', null, 35.6717, 139.7640),
  a('2026-11-09', null, null, 'toquio', '⛩️ Passeio contemplativo em Asakusa', 'sight', 'Asakusa, Tokyo', 'Senso-ji, Nakamise-dori e Kappabashi (maneki-neko que mexe a pata, pra sua avó).', '🚇 Metrô', null, 35.7148, 139.7967),
  a('2026-11-09', null, null, 'toquio', 'Almoço', 'food', 'Asakusa, Tokyo', 'Almoço tradicional em Asakusa, sem pressa.', '', null, 35.7135, 139.7965),
  a('2026-11-09', null, null, 'toquio', '🌸 Passeio contemplativo em Yanaka', 'sight', 'Yanaka, Tokyo', 'Bairro antigo e tranquilo, ruas estreitas que sobreviveram à guerra.', '🚇 Metrô', null, 35.7270, 139.7660),
  a('2026-11-09', null, null, 'toquio', 'Jantar', 'food', 'Yanaka, Tokyo', 'Jantar tranquilo pra fechar o dia contemplativo.', '', null, 35.7265, 139.7665),

  // ── 10/11
  a('2026-11-10', '08:00', '08:30', 'toquio', '☕ Café da Manhã', 'food'),
  a('2026-11-10', '09:30', '10:30', 'toquio', 'Kaminarimon e Nakamise-dori', 'sight', 'Asakusa', 'Rua de lojinhas de souvenir saindo do Senso-ji.', '', null, 35.7111, 139.7966),
  a('2026-11-10', '10:30', '11:00', 'toquio', 'Asakusa Kagetsudo (melon pan)', 'food', 'Asakusa', 'Parada rápida pro lanche da manhã.', '', null, 35.7130, 139.7960),
  a('2026-11-10', '11:00', '12:00', 'toquio', 'Senso-ji + Asakusa Jinja', 'sight', 'Asakusa', 'Templo mais antigo de Tóquio, chegar cedo pra evitar fila do goshuin.', '', null, 35.7148, 139.7967),
  a('2026-11-10', '11:30', '13:00', 'toquio', 'Tokyo Skytree', 'sight', 'Sumida/Oshiage', 'Vista panorâmica, torre mais alta do Japão.', '', 2100, 35.7101, 139.8107),
  a('2026-11-10', '12:00', '12:30', 'toquio', 'TEMPO LIVRE', 'free', '', 'Gap liberado pela redução do tempo de visita ao Senso-ji. Preencher livremente.'),
  a('2026-11-10', '13:15', '15:00', 'toquio', 'Sumida Aquarium', 'sight', 'Sumida/Skytree Town', 'Pinguins, focas e floresta de águas-vivas.', '', 2500, 35.7100, 139.8128),
  a('2026-11-10', '15:30', '16:15', 'toquio', 'Kanda Myojin', 'sight', 'Chiyoda', 'Santuário com tema otaku, goshuin famoso, a caminho de Akihabara.', '', null, 35.7020, 139.7681),
  a('2026-11-10', '16:30', '19:30', 'toquio', 'Akihabara (Animate, Super Potato, Gachapon Kaikan)', 'shop', 'Akihabara', 'Tarde livre de exploração otaku, compras.', '', null, 35.6984, 139.7731),
  a('2026-11-10', '19:30', '21:00', 'toquio', 'Jantar em Akihabara (izakaya)', 'food', 'Akihabara', 'Experiência temática ou jantar tradicional.', '', null, 35.6990, 139.7712),

  // ── 11/11
  a('2026-11-11', '08:00', '08:30', 'toquio', '☕ Café da Manhã', 'food'),
  a('2026-11-11', '09:45', '11:00', 'toquio', 'Takeshita Street', 'shop', 'Harajuku', 'Moda kawaii, crepes, cultura jovem.', '', null, 35.6702, 139.7027),
  a('2026-11-11', '11:00', '11:30', 'toquio', 'Meiji Jingu', 'sight', 'Harajuku', 'Santuário em floresta, ir cedo antes da multidão.', '', null, 35.6764, 139.6993),
  a('2026-11-11', '11:30', '12:30', 'toquio', 'TEMPO LIVRE', 'free', '', 'Gap liberado pela redução do tempo no Meiji Jingu. Preencher livremente.'),
  a('2026-11-11', '12:30', '13:30', 'toquio', 'Almoço em Harajuku/Omotesando', 'food', 'Harajuku/Omotesando', 'Pausa pro almoço.', '', null, 35.6652, 139.7123),
  a('2026-11-11', '13:45', '14:15', 'toquio', 'Shibuya Crossing', 'sight', 'Shibuya', 'Cruzamento mais movimentado do mundo.', '', null, 35.6595, 139.7005),
  a('2026-11-11', '14:15', '15:30', 'toquio', 'Shibuya Parco (Nintendo Tokyo + Capcom Store)', 'shop', 'Shibuya', 'Loja oficial Nintendo e Capcom.', '', null, 35.6619, 139.6988),
  a('2026-11-11', '17:00', '17:45', 'toquio', "I'm donut? (nama donuts)", 'food', 'Shibuya', 'Lanche da tarde, pode ter fila.', '', null, 35.6590, 139.7010),
  a('2026-11-11', '18:30', '21:00', 'toquio', 'Jantar + noite em Shibuya', 'food', 'Shibuya', 'Ramen ou izakaya, aproveitar luzes noturnas.', '', null, 35.6580, 139.6990),

  // ── 12/11 Nikko
  a('2026-11-12', '06:00', '08:00', 'nikko', 'Trem Tóquio → Nikko (Tobu Line)', 'move', 'Asakusa → Nikko', 'Tobu Limited Express, ~2h.', '🚃 Trem', null, 36.7487, 139.5990),
  a('2026-11-12', '07:00', '07:30', 'toquio', '☕ Café da Manhã', 'food'),
  a('2026-11-12', '08:00', '08:30', 'nikko', 'Shinkyo Bridge', 'sight', 'Nikko', 'Ponte sagrada vermelha, entrada da cidade.', '', null, 36.7473, 139.6021),
  a('2026-11-12', '11:45', '12:45', 'nikko', 'Nikko Toshogu Shrine', 'sight', 'Nikko', 'Mausoléu de Tokugawa Ieyasu, Portal Yomeimon, 3 macacos sábios.', '', null, 36.7580, 139.5995),
  a('2026-11-12', '12:00', '13:00', 'nikko', 'Almoço em Nikko', 'food', 'Nikko', 'Culinária local (yuba é especialidade da região).', '', null, 36.7530, 139.6010),
  a('2026-11-12', '12:55', '13:15', 'nikko', 'Nikkozan Rinno-ji Temple', 'sight', 'Nikko', '3 estátuas douradas gigantes das divindades das montanhas.', '', null, 36.7568, 139.5975),
  a('2026-11-12', '13:20', '13:35', 'nikko', 'Futarasan Shrine', 'sight', 'Nikko', 'Santuário mais antigo de Nikko.', '', null, 36.7585, 139.5963),
  a('2026-11-12', '13:35', '14:30', 'nikko', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo nos templos de Nikko. Preencher livremente (ex: almoço local).'),
  a('2026-11-12', '13:30', '16:00', 'nikko', 'Lake Chuzenji + Kegon Falls', 'sight', 'Nikko/Chuzenji', 'Estrada Irohazaka, cachoeira e lago aos pés do Monte Nantai.', '🚌 Ônibus', null, 36.7389, 139.5000),
  a('2026-11-12', '17:00', '19:00', 'nikko', 'Volta a Tóquio', 'move', 'Nikko → Tóquio', 'Retorno de trem, chegada à noite.', '🚃 Trem', null, 35.7119, 139.7976),
  a('2026-11-12', '19:30', '20:30', 'toquio', '🍽️ Jantar', 'food', '', 'Após voltar de Nikko.'),

  // ── 13/11 Kawaguchiko
  a('2026-11-13', '06:00', '07:45', 'kawaguchiko', 'Ônibus Tóquio → Kawaguchiko', 'move', 'Shinjuku → Kawaguchiko', 'Ônibus direto, ~1h45.', '🚌 Ônibus', null, 35.4986, 138.7686),
  a('2026-11-13', '07:00', '07:30', 'kawaguchiko', '☕ Café da Manhã', 'food'),
  a('2026-11-13', '08:00', '09:30', 'kawaguchiko', 'Chureito Pagoda', 'sight', 'Shimoyoshida', 'Vista mais icônica do Monte Fuji, 398 degraus.', '', null, 35.5009, 138.8046),
  a('2026-11-13', '10:00', '11:00', 'kawaguchiko', 'Oishi Park', 'sight', 'Lago Kawaguchiko', 'Vista do Fuji com flores, entrada grátis.', '', null, 35.5124, 138.7544),
  a('2026-11-13', '11:15', '12:00', 'kawaguchiko', 'Mt. Fuji Panoramic Ropeway (Kachi Kachi)', 'sight', 'Kawaguchiko', 'Teleférico com vista panorâmica do lago e do Fuji.', '', null, 35.5017, 138.7637),
  a('2026-11-13', '12:15', '13:15', 'kawaguchiko', 'Almoço (hoto - macarrão local)', 'food', 'Kawaguchiko', 'Prato típico da região de Yamanashi.', '', null, 35.4990, 138.7680),
  a('2026-11-13', '14:00', '15:00', 'kawaguchiko', 'Oshino Hakkai', 'sight', 'Perto de Kawaguchiko', 'Vila com 8 nascentes de água cristalina do degelo do Fuji.', '', null, 35.4595, 138.8352),
  a('2026-11-13', '16:00', '18:00', 'kawaguchiko', 'Ônibus Kawaguchiko → Tóquio', 'move', 'Kawaguchiko → Shinjuku', 'Retorno, chegada no fim da tarde.', '🚌 Ônibus', null, 35.6896, 139.7006),
  a('2026-11-13', '19:30', '20:30', 'toquio', '🍽️ Jantar', 'food', '', 'Após voltar de Kawaguchiko.'),

  // ── 14/11
  a('2026-11-14', '08:00', '08:30', 'toquio', '☕ Café da Manhã', 'food'),
  a('2026-11-14', '10:45', '12:00', 'toquio', 'Nakano Broadway', 'shop', 'Nakano', 'Reduto otaku alternativo a Akihabara.', '', null, 35.7074, 139.6657),
  a('2026-11-14', '11:30', '12:00', 'toquio', 'Nezu Shrine + Yushima Tenjin', 'sight', 'Yanesen', 'Túnel de torii vermelhos, goshuin.', '', null, 35.7267, 139.7609),
  a('2026-11-14', '12:00', '13:00', 'toquio', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo nos santuários de Yanesen. Preencher livremente.'),
  a('2026-11-14', '12:30', '13:15', 'toquio', 'Almoço em Ikebukuro', 'food', 'Ikebukuro', 'Pausa pro almoço.', '', null, 35.7295, 139.7109),
  a('2026-11-14', '13:30', '15:30', 'toquio', 'Tempo livre extra em Ikebukuro', 'free', 'Ikebukuro', 'Horário flexível liberado (Sunshine Aquarium cortado por repetir Sumida). Explorar lojas ou fazer pausa mais longa.', '', null, 35.7285, 139.7110),
  a('2026-11-14', '15:30', '16:30', 'toquio', 'Pokemon Center Ikebukuro + Jump Shop', 'shop', 'Ikebukuro', 'Compras de personagens.', '', null, 35.7295, 139.7192),
  a('2026-11-14', '18:30', '20:00', 'toquio', 'Jantar + noite em Ikebukuro', 'food', 'Ikebukuro', 'Izakaya ou ramen.', '', null, 35.7300, 139.7100),

  // ── 15/11 Nagoya
  a('2026-11-15', '07:00', '08:40', 'nagoya', 'Shinkansen Tóquio → Nagoya', 'move', 'Tóquio → Nagoya', 'Tokaido Shinkansen, ~1h40, malas para o hotel de Nagoya.', '🚄 Shinkansen', null, 35.1709, 136.8815),
  a('2026-11-15', '08:00', '08:30', 'toquio', '☕ Café da Manhã', 'food', '', 'Antes de pegar o Shinkansen.'),
  a('2026-11-15', '09:00', '10:00', 'nagoya', 'Check-in no hotel + descanso', 'stay', '5-20-13 Meieki, Nakamura-ku, Nagoya', 'Nikko Style Nagoya. Check-in 15h, deixar as malas antes de começar o passeio.', '', null, 35.1768, 136.8885),
  a('2026-11-15', '10:15', '11:00', 'nagoya', 'Almoço em Nagoya', 'food', 'Nagoya', 'Ichiran Ramen ou similar.'),
  a('2026-11-15', '11:15', '12:30', 'nagoya', 'Osu Shopping Street', 'shop', 'Osu', 'Compras e comida de rua.', '', null, 35.1604, 136.9010),
  a('2026-11-15', '13:00', '14:00', 'nagoya', 'Nagoya Castle', 'sight', 'Nagoya', 'Castelo com telhado dourado, jardins. Antecipado do dia 16 para o dia 15.', '', null, 35.1856, 136.8996),
  a('2026-11-15', '14:00', '14:30', 'nagoya', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo no Samurai Museum. Preencher livremente.'),
  a('2026-11-15', '17:15', '19:00', 'nagoya', '⏳ Tempo livre – noite em Nagoya', 'free', 'Nagoya', 'Corrigido: era Odaiba (Tóquio), mas você estará em Nagoya nesse dia. Preencher livremente.', '🚇 Metrô'),
  a('2026-11-15', '19:00', '20:30', 'nagoya', 'Jantar em Nagoya', 'food', 'Nagoya', 'Hitsumabushi ou Miso Katsu, especialidade local.'),

  // ── 16/11
  a('2026-11-16', '08:00', '08:30', 'nagoya', '☕ Café da Manhã', 'food'),
  a('2026-11-16', '10:00', '14:00', 'nagoya', 'Ghibli Park', 'sight', 'Nagakute (perto de Nagoya)', 'Parque temático do Studio Ghibli, reservar ingresso com antecedência.', '', 7800, 35.1731, 137.0852),
  a('2026-11-16', '12:00', '13:00', 'nagoya', '🍽️ Almoço', 'food', '', 'Dentro do Ghibli Park ou próximo.'),
  a('2026-11-16', '18:30', '19:00', 'nagoya', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo no Nagoya Castle. Preencher livremente.'),
  a('2026-11-16', '19:30', '20:30', 'nagoya', '🍽️ Jantar', 'food'),

  // ── 17/11 Takayama
  a('2026-11-17', '08:00', '10:30', 'takayama', 'Trem Nagoya → Takayama', 'move', 'Nagoya → Takayama', 'JR Takayama Line, ~2h30, paisagem de montanha.', '🚃 Trem', null, 36.1391, 137.2520),
  a('2026-11-17', '08:00', '08:30', 'nagoya', '☕ Café da Manhã', 'food', '', 'Antes de pegar o trem pra Takayama.'),
  a('2026-11-17', '09:00', null, 'takayama', '🏨 Check-in no hotel', 'stay', '4-313 Hanasato-machi, Takayama, Gifu', 'Hida Hanasatonoyu Takayama Ouan. Check-in 15h, deixar as malas antes do passeio.', '', null, 36.1427, 137.2578),
  a('2026-11-17', '11:00', '12:30', 'takayama', 'Sanmachi Suji (Old Town)', 'sight', 'Takayama', 'Ruas históricas período Edo, degustação de sake.', '', null, 36.1440, 137.2590),
  a('2026-11-17', '12:30', '13:30', 'takayama', 'Almoço - Hida beef e Takayama Ramen', 'food', 'Sanmachi Suji', 'Wagyu local e ramen tradicional de Takayama.', '', null, 36.1442, 137.2594),
  a('2026-11-17', '13:45', '14:30', 'takayama', 'Takayama Jinya', 'sight', 'Takayama', 'Único escritório governamental Edo ainda de pé.', '', null, 36.1405, 137.2580),
  a('2026-11-17', '15:00', '16:30', 'takayama', 'Hida Folk Village (Hida no Sato)', 'sight', 'Takayama', 'Vila ao ar livre com casas gassho-zukuri.', '', null, 36.1351, 137.2431),
  a('2026-11-17', '18:30', '20:00', 'takayama', 'Nakabashi Bridge + jantar em Takayama', 'food', 'Takayama', 'Ponte vermelha à noite, jantar tradicional.', '', null, 36.1431, 137.2599),

  // ── 18/11 Shirakawa-go
  a('2026-11-18', '07:30', '08:00', 'takayama', '☕ Café da Manhã', 'food'),
  a('2026-11-18', '07:30', '08:30', 'shirakawa', 'Miyagawa Morning Market', 'food', 'Takayama', 'Mercado matinal à beira do rio, petiscos e produtos locais.', '', null, 36.1445, 137.2612),
  a('2026-11-18', '09:00', '10:00', 'shirakawa', 'Ônibus Takayama → Shirakawa-go', 'move', 'Takayama → Shirakawa-go', 'Ônibus direto, ~50 min.', '🚌 Ônibus', null, 36.2575, 136.9062),
  a('2026-11-18', '10:15', '10:45', 'shirakawa', 'Shiroyama Viewpoint', 'sight', 'Shirakawa-go', 'Mirante panorâmico da vila inteira.', '', null, 36.2573, 136.9033),
  a('2026-11-18', '11:00', '12:30', 'shirakawa', 'Ogimachi (passeio pela vila)', 'sight', 'Shirakawa-go', 'Casas gassho-zukuri, Patrimônio UNESCO.', '', null, 36.2577, 136.9060),
  a('2026-11-18', '12:30', '13:30', 'shirakawa', 'Almoço + Gohei-mochi', 'food', 'Shirakawa-go', 'Comida típica da vila.', '', null, 36.2570, 136.9055),
  a('2026-11-18', '16:45', '17:15', 'shirakawa', 'Wada House + Myozenji Temple', 'sight', 'Shirakawa-go', 'Casa histórica e templo com telhado de palha.', '', null, 36.2586, 136.9066),
  a('2026-11-18', '17:15', '17:45', 'shirakawa', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo em Wada House/Myozenji. Preencher livremente.'),
  a('2026-11-18', '18:30', '19:20', 'takayama', 'Ônibus Shirakawa-go → Takayama', 'move', 'Shirakawa-go → Takayama', 'Corrigido: rota real é via Takayama, não Kanazawa. Ônibus Nohi direto, ~50min.', '🚌 Ônibus', null, 36.1391, 137.2520),
  a('2026-11-18', '19:30', '20:30', 'kyoto', '🍽️ Jantar', 'food', '', 'Após chegar de trem em Kyoto. (Veja: no Notion consta Kyoto, mas nesse horário você ainda estaria em Takayama.)'),

  // ── 19/11 Kyoto
  a('2026-11-19', '06:30', null, 'kyoto', '🏨 Check-in no hotel', 'stay', '22-7 Nishinokyo Shokujicho, Nakagyo-ku, Kyoto', 'The Royal Park Canvas Kyoto Nijo. Check-in 15h, deixar as malas antes do passeio.', '', null, 35.0130, 135.7335),
  a('2026-11-19', '08:00', '08:30', 'kyoto', '☕ Café da Manhã', 'food'),
  a('2026-11-19', '09:45', '11:00', 'kyoto', 'Kiyomizu-dera', 'sight', 'Higashiyama', 'Palco de madeira sem pregos, vista de Kyoto.', '', 500, 34.9949, 135.7850),
  a('2026-11-19', '10:00', '11:00', 'kyoto', 'Fushimi Inari Taisha', 'sight', 'Fushimi', 'Milhares de torii vermelhos, ir bem cedo pra evitar multidão.', '', null, 34.9671, 135.7727),
  a('2026-11-19', '11:00', '12:00', 'kyoto', 'Sannenzaka + Ninenzaka (ruas históricas)', 'sight', 'Higashiyama', 'Ladeiras de pedra tradicionais, lojinhas e doces.', '', null, 34.9976, 135.7810),
  a('2026-11-19', '11:00', '12:00', 'kyoto', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo no Fushimi Inari. Preencher livremente.'),
  a('2026-11-19', '12:15', '13:00', 'kyoto', 'Almoço em Gion', 'food', 'Gion', 'Culinária tradicional de Kyoto.', '', null, 35.0036, 135.7757),
  a('2026-11-19', '14:45', '15:30', 'kyoto', 'Sanjusangendo', 'sight', 'Higashiyama', '1001 estátuas douradas de Kannon.', '', 600, 34.9879, 135.7720),
  a('2026-11-19', '16:15', '16:45', 'kyoto', 'Yasaka Shrine + Gion (bairro das gueixas)', 'sight', 'Gion', 'Ruas tradicionais, possível avistar maiko.', '', null, 35.0036, 135.7785),
  a('2026-11-19', '16:15', '17:30', 'kyoto', 'Nishiki Market', 'food', 'Centro de Kyoto', 'Mercado coberto de comidinhas tradicionais, jantar leve por lá.', '', null, 35.0050, 135.7650),
  a('2026-11-19', '16:45', '17:30', 'kyoto', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo em Yasaka/Gion. Preencher livremente.'),

  // ── 20/11
  a('2026-11-20', '08:00', '08:30', 'kyoto', '☕ Café da Manhã', 'food'),
  a('2026-11-20', '10:30', '11:00', 'kyoto', 'Deslocamento pra Arashiyama', 'move', 'Noroeste de Kyoto → Arashiyama', '', '🚌 Ônibus', null, 35.0094, 135.6720),
  a('2026-11-20', '11:00', '11:30', 'kyoto', 'Kinkaku-ji (Pavilhão Dourado)', 'sight', 'Noroeste de Kyoto', 'Pavilhão dourado refletido no lago, ir de manhã cedo.', '', 600, 35.0394, 135.7292),
  a('2026-11-20', '11:15', '12:00', 'kyoto', 'Arashiyama Bamboo Grove', 'sight', 'Arashiyama', 'Caminho entre bambus altos.', '', null, 35.0170, 135.6713),
  a('2026-11-20', '11:30', '11:50', 'kyoto', 'Ryoan-ji', 'sight', 'Noroeste de Kyoto', 'Jardim seco (karesansui) mais famoso do Japão.', '', 600, 35.0345, 135.7185),
  a('2026-11-20', '11:50', '12:30', 'kyoto', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo em Kinkaku-ji/Ryoan-ji. Preencher livremente.'),
  a('2026-11-20', '13:15', '14:15', 'kyoto', 'Almoço em Arashiyama', 'food', 'Arashiyama', 'Yudofu ou soba tradicional.', '', null, 35.0140, 135.6760),
  a('2026-11-20', '14:30', '15:30', 'kyoto', 'Passeio pelo rio Hozugawa', 'sight', 'Arashiyama', 'Vista da ponte Togetsukyo, folhagem de outono.', '', null, 35.0129, 135.6775),
  a('2026-11-20', '15:15', '15:40', 'kyoto', 'Tenryu-ji', 'sight', 'Arashiyama', 'Jardim zen ao lado do bosque de bambu.', '', 500, 35.0158, 135.6738),
  a('2026-11-20', '15:40', '16:15', 'kyoto', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo em Tenryu-ji. Preencher livremente.'),
  a('2026-11-20', '16:15', '18:00', 'kyoto', 'Volta e descanso / compras em Kyoto', 'shop', 'Kyoto', 'Tempo livre pra lembrancinhas.', '', null, 35.0030, 135.7690),
  a('2026-11-20', '18:30', '19:00', 'kyoto', 'Nintendo Museum (Uji)', 'sight', 'Uji (perto de Kyoto)', 'Ingresso por loteria, reservar com antecedência. Após a tarde livre em Kyoto.', '', 3300, 34.8895, 135.8008),
  a('2026-11-20', '19:30', '20:30', 'kyoto', '🍽️ Jantar', 'food'),

  // ── 21/11 Nara
  a('2026-11-21', '07:30', '08:00', 'kyoto', '☕ Café da Manhã', 'food'),
  a('2026-11-21', '08:00', '09:00', 'nara', 'Trem Kyoto → Nara', 'move', 'Kyoto → Nara', 'JR Nara Line, ~45 min.', '🚃 Trem', null, 34.6811, 135.8196),
  a('2026-11-21', '09:15', '10:30', 'nara', 'Nara Park (veados)', 'sight', 'Nara', 'Alimentar os veados com shika senbei.', '', null, 34.6851, 135.8430),
  a('2026-11-21', '13:00', '14:00', 'nara', 'Almoço + Nakatanidou (mochi pounding)', 'food', 'Nara', 'Almoço e show de mochi socado na hora.', '', null, 34.6815, 135.8279),
  a('2026-11-21', '13:45', '14:15', 'nara', 'Todai-ji', 'sight', 'Nara Park', 'Grande Buda, maior edifício de madeira do mundo.', '', null, 34.6890, 135.8398),
  a('2026-11-21', '15:00', '15:25', 'nara', 'Kasuga Taisha', 'sight', 'Nara Park', 'Caminho de lanternas de pedra.', '', null, 34.6811, 135.8486),
  a('2026-11-21', '16:15', '17:00', 'nara', 'Trem Nara → Kyoto', 'move', 'Nara → Kyoto', 'Retorno pra Kyoto.', '🚃 Trem', null, 34.9858, 135.7588),
  a('2026-11-21', '17:15', '18:15', 'nara', 'Kofuku-ji + compras de souvenir de veado', 'sight', 'Nara', 'Pagode de 5 andares, rua de compras perto da estação Kintetsu.', '', null, 34.6832, 135.8325),
  a('2026-11-21', '20:30', '21:30', 'kyoto', '🍽️ Jantar', 'food', '', 'Após voltar de Nara.'),

  // ── 22/11 Osaka
  a('2026-11-22', '08:00', '08:30', 'kyoto', '☕ Café da Manhã', 'food', '', 'Antes de pegar o Shinkansen pra Osaka.'),
  a('2026-11-22', '09:00', '09:30', 'osaka', 'Shinkansen Kyoto → Osaka', 'move', 'Kyoto → Osaka', 'Trem rápido, ~15 min, malas para o hotel de Osaka.', '🚄 Shinkansen', null, 34.7335, 135.5002),
  a('2026-11-22', '10:00', null, 'osaka', '🏨 Check-in no hotel', 'stay', '1-12-8 Sonezakishinchi, Kita-ku, Osaka', 'Hotel Monterey Le Frere Osaka. Check-in 15h, deixar as malas antes do passeio.', '', null, 34.6985, 135.4945),
  a('2026-11-22', '12:15', '13:00', 'osaka', 'Almoço', 'food', 'Osaka', 'Pausa pro almoço.'),
  a('2026-11-22', '13:30', '14:15', 'osaka', 'Osaka Castle', 'sight', 'Chūō-ku', 'Castelo histórico, jardins gratuitos.', '', null, 34.6873, 135.5262),
  a('2026-11-22', '14:00', '16:30', 'osaka', 'Den Den Town (Nipponbashi)', 'shop', 'Nipponbashi', 'Akihabara de Osaka, incluindo Super Potato.', '', null, 34.6598, 135.5058),
  a('2026-11-22', '14:15', '15:00', 'osaka', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo no Osaka Castle. Preencher livremente.'),
  a('2026-11-22', '17:00', '18:30', 'osaka', 'Dotonbori (canal + letreiro Glico)', 'sight', 'Dotonbori', 'Melhor ao entardecer/noite.', '', null, 34.6687, 135.5013),
  a('2026-11-22', '18:30', '20:00', 'osaka', 'Jantar - Takoyaki e Okonomiyaki', 'food', 'Dotonbori', 'Comida de rua icônica de Osaka.', '', null, 34.6685, 135.5020),
  a('2026-11-22', '20:15', '21:00', 'osaka', 'Hozenji Yokocho', 'sight', 'Dotonbori', 'Viela com lanternas, clima noturno tranquilo.', '', null, 34.6679, 135.5028),

  // ── 23/11
  a('2026-11-23', '08:00', '08:30', 'osaka', '☕ Café da Manhã', 'food'),
  a('2026-11-23', '08:30', '19:00', 'osaka', 'USJ (Universal Studios Japan)', 'sight', 'Universal Studios Japan', 'Dia inteiro no parque, considerar Express Pass.', '', 8900, 34.6654, 135.4323),
  a('2026-11-23', '12:00', '13:00', 'osaka', '🍽️ Almoço', 'food', '', 'Dentro do USJ.'),
  a('2026-11-23', '19:30', '20:30', 'osaka', 'Jantar perto do USJ / hotel', 'food', 'Osaka', 'Descanso após dia cheio no parque.'),

  // ── 24/11
  a('2026-11-24', '08:00', '08:30', 'osaka', '☕ Café da Manhã', 'food'),
  a('2026-11-24', '09:30', '11:00', 'osaka', 'Shinsaibashi-suji Shopping Street', 'shop', 'Shinsaibashi', 'Arcada coberta, marcas grandes e lojas locais.', '', null, 34.6727, 135.5012),
  a('2026-11-24', '11:00', '12:30', 'osaka', 'America-mura (American Village)', 'shop', 'Shinsaibashi', 'Moda vintage e streetwear.', '', null, 34.6722, 135.4980),
  a('2026-11-24', '13:00', '14:00', 'osaka', 'Almoço - Kuromon Ichiba Market', 'food', 'Nipponbashi', 'Cozinha de Osaka, comidinhas frescas.', '', null, 34.6624, 135.5063),
  a('2026-11-24', '14:15', '14:45', 'osaka', 'Deslocamento pra Umeda', 'move', 'Nipponbashi → Umeda', '', '🚇 Metrô', null, 34.7055, 135.4983),
  a('2026-11-24', '15:00', '15:45', 'osaka', 'Pokemon Center Osaka (Umeda)', 'shop', 'Umeda', 'Loja oficial Pokemon.', '', null, 34.7040, 135.4970),
  a('2026-11-24', '16:15', '17:30', 'osaka', 'Umeda Sky Building', 'sight', 'Umeda', 'Mirante flutuante, vista do pôr do sol.', '', null, 34.7054, 135.4905),
  a('2026-11-24', '18:30', '20:00', 'osaka', 'Jantar em Umeda', 'food', 'Umeda', 'Último jantar tranquilo em Osaka.', '', null, 34.7045, 135.4960),

  // ── 25/11
  a('2026-11-25', '08:00', '08:30', 'osaka', '☕ Café da Manhã', 'food'),
  a('2026-11-25', '10:15', '11:30', 'osaka', 'Shinsekai + Tsutenkaku Tower', 'sight', 'Shinsekai', 'Bairro retrô, torre icônica.', '', null, 34.6525, 135.5063),
  a('2026-11-25', '11:45', '12:45', 'osaka', 'Almoço - Kushikatsu', 'food', 'Shinsekai', 'Espetinhos empanados fritos.', '', null, 34.6520, 135.5060),
  a('2026-11-25', '12:00', '12:30', 'osaka', 'Shitennoji Temple', 'sight', 'Tennoji', 'Um dos templos budistas mais antigos do Japão.', '', null, 34.6538, 135.5167),
  a('2026-11-25', '12:30', '13:00', 'osaka', '⏳ Tempo livre', 'free', '', 'Gap liberado pela redução do tempo no Shitennoji. Preencher livremente.'),
  a('2026-11-25', '13:15', '14:15', 'osaka', 'Abeno Harukas (mirante)', 'sight', 'Tennoji', 'Prédio mais alto do Japão, vista de Osaka inteira.', '', null, 34.6458, 135.5139),
  a('2026-11-25', '14:45', '15:15', 'osaka', 'Namba Yasaka Shrine', 'sight', 'Namba', 'Santuário com palco em formato de cabeça de leão.', '', null, 34.6609, 135.4960),
  a('2026-11-25', '15:30', '17:30', 'osaka', 'Últimas compras em Namba/Dotonbori', 'shop', 'Namba/Dotonbori', 'Última chance de lembrancinhas de Osaka.', '', null, 34.6668, 135.5010),
  a('2026-11-25', '18:30', '20:00', 'osaka', 'Jantar de despedida de Osaka', 'food', 'Osaka', 'Última noite antes de seguir pra Tóquio.'),

  // ── 26/11 volta a Tóquio
  a('2026-11-26', '08:00', '08:30', 'osaka', '☕ Café da Manhã', 'food', '', 'Antes de pegar o Shinkansen pra Tóquio.'),
  a('2026-11-26', '09:00', '11:30', 'toquio', 'Shinkansen Osaka → Tóquio', 'move', 'Osaka → Tóquio', 'Tokaido Shinkansen, ~2h30, check-in no hotel de Tóquio.', '🚄 Shinkansen', null, 35.6812, 139.7671),
  a('2026-11-26', '12:30', '13:30', 'toquio', '🍽️ Almoço', 'food', '', 'Após chegar de Osaka.'),
  a('2026-11-26', '13:00', '17:00', 'toquio', 'Tarde livre - lembrancinhas pendentes', 'shop', 'Tóquio', 'Cobrir itens pendentes da lista de metas (comida/bebida, tecnologia).'),
  a('2026-11-26', '18:30', '20:00', 'toquio', 'Jantar tranquilo', 'food', 'Tóquio', 'Descanso após viagem de volta.'),

  // ── 27/11
  a('2026-11-27', '08:00', '08:30', 'toquio', '☕ Café da Manhã', 'food'),
  a('2026-11-27', '09:00', '11:30', 'toquio', 'Última manhã livre em Tóquio', 'free', 'Tóquio', 'Ritmo tranquilo, organizar malas (voo sai à noite).'),
  a('2026-11-27', '12:00', '13:00', 'toquio', 'Almoço final em Tóquio', 'food', 'Tóquio', 'Último almoço antes do embarque.'),
  a('2026-11-27', '13:15', '14:30', 'toquio', 'Check-out do hotel + últimas compras rápidas', 'stay', 'Tóquio', 'Malas prontas, aproveitar pra qualquer lembrancinha de última hora.'),
  a('2026-11-27', '14:00', '16:00', 'toquio', 'Museu Ghibli (Mitaka)', 'sight', 'Mitaka', 'Estava como "TEMPO LIVRE" no Notion. Ingresso por loteria mensal (sorteio dia 10 do mês anterior via Lawson Ticket). Museu íntimo desenhado pelo próprio Miyazaki, com curta-metragem exclusivo. Foco no processo de animação (o Ghibli Park em Nagoya é andar nos cenários).', '', 1000, 35.6962, 139.5704),
  a('2026-11-27', '16:30', '18:30', 'toquio', 'Últimas compras + lembrancinhas finais', 'shop', 'Tóquio', 'Lembrancinhas pra mãe, avó e avô, mala revisada.'),
  a('2026-11-27', '21:30', '22:30', 'toquio', '🍽️ Jantar', 'food', '', 'Último jantar da viagem.'),

  // ── 28/11 volta
  a('2026-11-28', '07:00', '07:30', 'toquio', '☕ Café da Manhã', 'food', '', 'Último café antes do voo.'),
  a('2026-11-28', '08:15', '09:30', 'toquio', 'Deslocamento ao Aeroporto de Narita', 'move', 'Tóquio → Narita', 'Trem expresso até Narita (~1h15), voo sai às 12:10.', '🚃 Trem', null, 35.7720, 140.3929),
  a('2026-11-28', '09:30', '12:10', 'toquio', 'Check-in + embarque', 'flight', 'Narita (NRT)', 'Voo com 2 escalas (ICN, ADD), decolagem 12:10.', '', null, 35.7720, 140.3929),
  a('2026-11-28', '10:00', '11:00', 'toquio', '🍽️ Almoço', 'food', 'Aeroporto de Narita', 'No aeroporto, antes do embarque (voo 12:10).', '', null, 35.7740, 140.3880),
  a('2026-11-28', '12:10', '06:40', 'transito', 'Voo NRT → Seul (ICN) → Addis Abeba (ADD) → GRU', 'flight', 'Narita → Seul → Addis Abeba → Guarulhos', 'Sai de Narita 12:10 do dia 28, chegada em GRU 06:40 do dia 29 (horário local).', '✈️ Avião', null, -23.4356, -46.4731, { end_day: '2026-11-29' }),
];
