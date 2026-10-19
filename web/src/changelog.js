// Novidades do app, da mais nova para a mais antiga. Cada entrega nova ganha uma versão aqui.
export const CHANGELOG = [
  {
    version: '1.8',
    date: '2026-10-19',
    title: 'Avaliações, busca e calendário por semana',
    items: [
      'Depois de visitar, dá para dar de 1 a 5 estrelas e escrever como foi. A nota aparece no roteiro e no painel do pin.',
      'Busca geral na viagem: atividades, ideias, hospedagens, cidades e dias. Abre pela lupa no topo ou com a tecla “/”.',
      'Cada viagem pode ter uma foto de capa, escolhida do aparelho ou por link. Ela aparece no cartão da tela inicial.',
      'O calendário ganhou as visões Semana (grade por horário) e Agenda (lista dia a dia). Clicar numa atividade abre ela no roteiro.',
    ],
  },
  {
    version: '1.7',
    date: '2026-10-19',
    title: 'Funciona sem internet',
    items: [
      'Sem internet, o app abre com a última versão que você viu: viagens, roteiro e os trechos do mapa já carregados. Um aviso no topo indica quando está offline.',
      'Tocar num pin abre um painel com horário, detalhes, notas, links, custos e os botões “Marcar como feita” e “Editar”.',
      'Excluir uma atividade, ideia ou item do checklist mostra “Desfazer” por alguns segundos.',
      'Cada dia mostra o horário do nascer e do pôr do sol.',
    ],
  },
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
