// Novidades do app, da mais nova para a mais antiga. Cada entrega nova ganha uma versão aqui.
export const CHANGELOG = [
  {
    version: '1.15',
    date: '2026-10-19',
    title: 'Celular: roteiro e mapa juntos',
    items: [
      'No celular, o roteiro agora é um painel que desliza por cima do mapa, como no Google Maps. Arraste a alça para escolher a altura: só a barra de dias, meio a meio ou a tela cheia. Um toque na alça também sobe um nível.',
      'Tocar num pino do mapa encolhe o painel e mostra os detalhes do lugar.',
      'Botão + flutuante: cria uma atividade no dia aberto, ou uma ideia na visão geral.',
      'As ferramentas do mapa ficam numa linha só, que desliza para o lado. O mapa enquadra os pontos na parte que o painel não cobre.',
    ],
  },
  {
    version: '1.14',
    date: '2026-10-19',
    title: 'Interface mais limpa',
    items: [
      'Os botões ganharam três níveis de destaque. O principal é cheio, os comuns têm contorno e os de navegação (Hospedagens, Orçamento, Checklist, Importar) são só texto, para não disputar atenção.',
      'Os avisos viraram um só. Na visão geral, “Ver em quais dias” mostra apenas os dias com horário sobreposto ou atividade sem local, e “Mostrar todos os dias” volta à lista completa.',
      'Ícones desenhados no lugar dos emoji nas categorias, nos filtros, nos pinos do mapa e nos botões de fechar. Eles ficam iguais em qualquer aparelho. Os emoji que você escolhe, como os das cidades e das viagens, continuam.',
      'Menos linhas divisórias. A lista de dias se separa por espaço, e as ferramentas do mapa perderam o contorno.',
    ],
  },
  {
    version: '1.13',
    date: '2026-10-19',
    title: 'Visão geral mais limpa',
    items: [
      'O botão de tipo de mapa (Mapa, Nomes locais, Relevo, Satélite) agora fica no canto do mapa, por cima de tudo, e lembra a sua escolha.',
      'A faixa com as noites por cidade foi para o pé do mapa, junto com a legenda. A barra de rota do topo saiu, porque repetia a mesma informação.',
      'Na lista de dias, cada dia tem a cor da cidade, o dia de hoje aparece destacado, os dias que já passaram ficam mais apagados e os dias sem nada ficam discretos.',
      'O cabeçalho da viagem ficou mais enxuto: o link “Editar” foi para a linha das datas.',
    ],
  },
  {
    version: '1.12',
    date: '2026-10-19',
    title: 'Aparência: o app com a sua cara',
    items: [
      'Novo painel Aparência (ícone de paleta na tela inicial e menu ⋯ na viagem). As mudanças aparecem na hora e ficam salvas no aparelho.',
      'Tema automático, que segue o claro ou escuro do celular, além de claro e escuro.',
      'Sete cores de destaque (Âmbar, Laca, Matcha, Mar, Jade, Glicínia, Sakura) ou qualquer outra. A cor pinta a rota no mapa, o dia de hoje e as contagens, e é ajustada para continuar legível no tema claro.',
      'Cada viagem pode ter a sua própria cor, que também aparece no link compartilhado.',
      'Três papéis de fundo (quente, grafite e noite), cinco pares de letras, cantos redondos, suaves ou retos, e texto menor, normal ou maior.',
    ],
  },
  {
    version: '1.11',
    date: '2026-10-19',
    title: 'Tempo, câmbio, deslocamento, mapa offline e lembretes',
    items: [
      'Previsão do tempo em cada dia (máxima, mínima e chance de chuva). Até 16 dias antes aparece a previsão; antes disso, como costuma fazer na mesma semana nos últimos 3 anos.',
      'Câmbio atualizado sozinho com a cotação do dia. Digitar um valor no Orçamento desliga a atualização; a caixinha liga de novo.',
      'Foto do recibo junto do “Gasto real” (abre a câmera no celular). O Orçamento mostra o link do recibo em cada item.',
      'Tempo real de deslocamento entre as atividades: a pé pela rota das ruas, de transporte com estimativa e link da rota no Google Maps. Avisa quando não dá tempo de chegar.',
      'Mapa offline (menu ⋯): baixa o mapa em volta das cidades da viagem para navegar sem internet.',
      'Lembretes (menu ⋯): o roteiro vira uma agenda no iPhone ou no Google Agenda, com aviso antes de cada atividade e voo, mesmo com o app fechado.',
      'Mapa mais leve: abre direto na região da viagem, não deixa afastar até o mundo inteiro e desenha menos coisas por vez.',
    ],
  },
  {
    version: '1.10',
    date: '2026-10-19',
    title: 'Anexos nas atividades',
    items: [
      'Ingressos, passagens, vouchers e confirmações podem ser anexados a qualquer atividade ou ideia, em “Anexos” no editor. Aceita PDF, fotos e outros arquivos de até 4 MB (fotos maiores são reduzidas sozinhas).',
      'Os anexos aparecem no roteiro do dia e no painel do pin, e abrem com um toque.',
      'Ao abrir a viagem, o app guarda os anexos no aparelho: dá para mostrar o ingresso mesmo sem internet.',
    ],
  },
  {
    version: '1.9',
    date: '2026-10-19',
    title: 'Compartilhar, meu mapa e Wikipédia',
    items: [
      'Compartilhar roteiro (no menu ⋯): cria um link só de leitura para quem viaja com você, sem senha. Notas, links, reservas, custos e checklist não aparecem, e o link pode ser desativado a qualquer momento.',
      'Meu mapa, na tela inicial: mapa-múndi com os países que você já visitou e os das viagens planejadas.',
      'No painel de um ponto turístico, “Sobre este lugar” traz o resumo da Wikipédia, com link para a página.',
      'Filtro Todas / A fazer / Feitas no roteiro do dia e no mapa.',
    ],
  },
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
