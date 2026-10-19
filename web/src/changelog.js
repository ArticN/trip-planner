// Novidades do app, da mais nova para a mais antiga. Cada entrega nova ganha uma versão aqui.
export const CHANGELOG = [
  {
    version: '1.6',
    date: '2026-10-19',
    title: 'Mapa em português',
    items: [
      'Nomes de cidades, bairros e ruas no mapa aparecem em português ou inglês, em vez de kanji. O mapa antigo continua em “Mapa (nomes locais)”.',
      'Esta seção de novidades na tela inicial.',
      'Saiu o botão de viagem de exemplo.',
      'Se a conexão com o banco falhar, o app tenta de novo sozinho.',
    ],
  },
  {
    version: '1.5',
    date: '2026-10-19',
    title: 'Tema do dia, gasto real e lugares próximos',
    items: [
      'Cada dia pode ter um tema (“Templos de Higashiyama”) e anotações.',
      'Atividades têm “Gasto real” além do previsto; o orçamento compara os dois.',
      'Botão “Perto daqui” no mapa: atrações, comida e compras em volta.',
    ],
  },
  {
    version: '1.4',
    date: '2026-10-19',
    title: 'No ar e no celular',
    items: [
      'App publicado na web com senha de acesso; os dados ficam na nuvem.',
      'Tela pensada para o celular, com botão para alternar entre roteiro e mapa.',
      'Dá para instalar como app na tela inicial do celular.',
      'Tela inicial mostra a viagem em andamento ou a próxima, com o próximo compromisso.',
      'Mapa menos poluído quando a viagem inteira está na tela.',
    ],
  },
  {
    version: '1.3',
    date: '2026-10-19',
    title: 'Trechos, hospedagem e modo hoje',
    items: [
      'Voos e trens com códigos (GRU, NRT), número e horários no fuso de cada ponta.',
      'Hospedagem com horário de check-in e check-out, reserva, preço e link.',
      'Lista de ideias sem data, para agendar depois.',
      'Adicionar pelo mapa: buscar um lugar ou clicar e já criar a atividade.',
      'Durante a viagem o app abre no dia de hoje e destaca a próxima atividade.',
    ],
  },
  {
    version: '1.2',
    date: '2026-10-19',
    title: 'Checklist, estatísticas e calendário',
    items: [
      'Checklist da viagem, estatísticas e calendário mensal.',
      'Notas e links em cada atividade.',
      'Exportar o roteiro para a agenda do celular (.ics).',
    ],
  },
  {
    version: '1.1',
    date: '2026-10-19',
    title: 'Visual novo',
    items: ['Tema escuro, fontes maiores e mapa do OpenStreetMap.'],
  },
  {
    version: '1.0',
    date: '2026-10-19',
    title: 'Planner para qualquer viagem',
    items: ['Várias viagens, moeda e câmbio por viagem, cidades e hospedagens editáveis.'],
  },
];

const KEY = 'trip-planner-seen-version';
export const latestVersion = CHANGELOG[0].version;
export function seenVersion() {
  try { return localStorage.getItem(KEY) || ''; } catch { return latestVersion; }
}
export function markSeen() {
  try { localStorage.setItem(KEY, latestVersion); } catch { /* sem armazenamento: nada a lembrar */ }
}
