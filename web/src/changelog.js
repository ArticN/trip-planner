// Ideias para o futuro: o que ainda não existe no app, mostrado na Home abaixo das Novidades.
// Quando uma ideia virar versão, sai daqui e entra no CHANGELOG.
export const IDEAS = [
  {
    title: 'Viagem nacional ou internacional',
    text: 'Cada viagem teria um tipo, Nacional ou Internacional. A internacional mantém a cota da Receita (US$ 1.000, imposto sobre o excedente) e o checklist de passaporte e seguro; a nacional tira a cota das Compras e ajusta limites, documentos e moeda.',
  },
  { title: 'Divisão de gastos', text: 'Registrar quem pagou cada coisa e ver no fim quem deve a quem, como no Splitwise.' },
  { title: 'Prazos de cancelamento', text: 'Reservas com “cancelamento grátis até…” e aviso perto da data.' },
  { title: 'Modelos de checklist', text: 'Listas prontas por tipo de viagem (frio, praia, internacional) e a sua salva para reusar.' },
  { title: 'Diário com fotos', text: 'Fotos e texto em cada dia, virando um álbum da viagem no fim.' },
  { title: 'Retrospectiva', text: 'Resumo da viagem com km andados, lugares, gastos por categoria e as atividades mais bem avaliadas.' },
];

// Novidades do app, da mais nova para a mais antiga. Cada entrega nova ganha uma versão aqui.
export const CHANGELOG = [
  {
    version: '1.26',
    date: '2026-10-27',
    title: 'Mapa certo no dia do voo',
    items: [
      'No dia de um voo que sai de fora da região da viagem (como o voo de Guarulhos para Tóquio), o mapa ficava preso num canto vazio, e clicar no voo afastava ainda mais. Agora o dia mostra a região da viagem inteira e um aviso explica que o voo começa fora da área do mapa.',
    ],
  },
  {
    version: '1.25',
    date: '2026-10-27',
    title: 'Opções no mesmo horário',
    items: [
      'Ficou em dúvida entre dois ou três lugares para o mesmo horário, como o café da manhã? No ingresso da atividade, o botão de cartões empilhados cria outra opção para aquele horário, já com o mesmo dia, bloco e horário.',
      'As opções viram um carrossel dentro do mesmo ingresso: as setinhas ‹ › (ou deslizar o dedo para o lado, no celular) trocam a opção mostrada, e o mapa vai até ela. As outras opções aparecem no mapa como pinos apagados com o mesmo número; clicar num deles mostra aquela opção.',
      'A primeira opção é a principal: é ela que conta no orçamento, nas estatísticas, na agenda (.ics), nos lembretes e no PDF. “Tornar principal” troca a principal sem descartar as outras.',
      'Para tirar uma opção do carrossel, abra o editor dela e use “Separar das outras opções”, ou exclua a opção. O link compartilhado mostra a principal e cita as outras embaixo.',
    ],
  },
  {
    version: '1.24',
    date: '2026-10-22',
    title: 'Meu mapa no seu país',
    items: [
      'No “Meu mapa” da Home, escolha em “Onde moro” o país em que você vive. O mapa ganha a opção Mundo ou só o seu país, e lembra a escolha em todos os aparelhos.',
      'Na visão do país aparecem os estados (ou províncias) com as cidades das suas viagens: o estado fica pintado quando você já foi e contornado quando a viagem ainda vai acontecer. A lista abaixo agrupa as cidades por estado.',
      'Ilhas e territórios distantes ficam fora do quadro para o mapa não encolher, a não ser que alguma viagem passe por lá.',
      'Novo bloco “Ideias para o futuro” abaixo das Novidades, começando por separar viagens nacionais e internacionais (cota da Receita, limites e documentos diferentes).',
    ],
  },
  {
    version: '1.23',
    date: '2026-10-21',
    title: 'Correção na tela de Hospedagens',
    items: [
      'Na tela de Hospedagens, o emoji e o nome da cidade e o botão Excluir não ficam mais por cima do campo Nome: agora ficam numa linha própria no topo de cada hospedagem, com o Excluir à direita.',
      'No celular, os campos de cada hospedagem ficam em uma coluna só e cabem na tela, sem rolar para o lado.',
    ],
  },
  {
    version: '1.22',
    date: '2026-10-21',
    title: 'Caminho a pé e linhas de trem no mapa',
    items: [
      'No mapa do dia, o trajeto entre as atividades agora segue as ruas: o caminho a pé aparece pontilhado e o de carro em linha cheia, no lugar da linha reta.',
      'Cada atividade ganhou a seção “Trem ou metrô até aqui” no editor. Cadastre a linha (nome, sigla e cor), a estação de embarque e a de desembarque, o sentido, os minutos e o valor. O mapa desenha a linha na cor dela, com as estações marcadas, e o caminho a pé até a estação e da estação até a atividade.',
      'Dá para fazer baldeação: com mais de um trecho, a troca de linha é feita a pé entre as estações. Na primeira atividade do dia, o trajeto parte da hospedagem.',
      'A linha entre as atividades mostra cada parte, por exemplo “7min a pé · G Ginza, Ginza → Asakusa 18min · 7min a pé”, e o total. O exemplo do Japão traz o metrô Ginza → Asakusa no dia 9/11.',
    ],
  },
  {
    version: '1.21',
    date: '2026-10-21',
    title: 'Compras e a cota da Receita',
    items: [
      'Novo painel Compras (no topo, ao lado do Checklist): anote cada item que vai trazer com loja, preço na moeda da viagem, grupo (café e cozinha, figures, roupas, eletrônicos…) e dia. O preço já aparece convertido em dólar e em reais.',
      'A barra mostra quanto da cota de US$ 1.000 da Receita já foi comprado e, num tom mais claro, quanto o previsto ainda vai ocupar. Se o previsto passar da cota, o app avisa quanto passa e estima o imposto de 50% sobre o excedente.',
      'Marque “Já comprei” quando comprar. Itens de uso pessoal podem ficar fora da cota. A cotação do dólar se atualiza sozinha (ou pode ser digitada), e o valor da cota é editável.',
    ],
  },
  {
    version: '1.20',
    date: '2026-10-21',
    title: 'Atividades como ingressos que se encaixam',
    items: [
      'Todas as atividades agora têm cara de ingresso: o horário fica no canhoto, separado do resto por um picote com entalhes no topo e na base.',
      'Os ingressos se encaixam uns nos outros. O picote continua pela linha entre as atividades, que mostra o deslocamento e o tempo livre, e atravessa o dia inteiro como uma fita de ingressos.',
      'Os blocos vazios do dia (Manhã, Café, Almoço…) ficaram como cabeçalhos leves, sem caixa, para não competir com as atividades.',
    ],
  },
  {
    version: '1.19',
    date: '2026-10-21',
    title: 'O dia em blocos',
    items: [
      'O roteiro de cada dia agora segue uma escala: Manhã, Café da manhã, Depois do café, Almoço, Depois do almoço, Jantar e Depois do jantar. Cada bloco aceita uma ou mais atividades, e o botão + do bloco já abre a atividade ali (nas refeições, com o tipo Comida).',
      'Dentro do bloco, a atividade pode ter horário (um ingresso do Aquário, do Museu Ghibli ou da Universal) ou ficar sem hora. No editor há o campo “Bloco do dia”; em Automático, o app usa o título (café, almoço, jantar) e o horário para escolher o bloco.',
      'Arraste uma atividade para outro bloco, ou para o título de um bloco, para mudá-la de lugar. “Ordenar por horário” ordena dentro de cada bloco. O link compartilhado mostra os mesmos blocos.',
    ],
  },
  {
    version: '1.18',
    date: '2026-10-20',
    title: 'Endereço em vez de coordenadas',
    items: [
      'Na atividade, o campo agora se chama Endereço e vale sozinho: dá para guardar só o texto (rua, número, bairro), sem posição no mapa. Ele aparece no cartão da atividade.',
      'A busca de posição já vem preenchida com o endereço. Um clique em Buscar acha o lugar e marca o pino, e latitude e longitude ficaram escondidas em “Digitar latitude e longitude”, para quem precisar.',
    ],
  },
  {
    version: '1.17',
    date: '2026-10-19',
    title: 'O dia como tempo',
    items: [
      'O espaço entre duas atividades agora acompanha o tempo livre entre elas: um intervalo de três horas fica bem maior que um de dez minutos. Na linha ao lado dos horários, o trecho colorido é o deslocamento estimado e o pontilhado é o tempo que sobra, com “45min livre” escrito quando passa de meia hora. Quando não dá tempo de chegar, a linha fica âmbar.',
      'Voos e trens têm cara de bilhete, com picote entre o horário e o trecho e os códigos dos aeroportos em destaque.',
      'A hospedagem do dia virou um cartão com ícone de estado: no check-in a porta aparece aberta e acesa, no check-out fechada e apagada, e nos outros dias aparece a cama. O número da reserva e o link ficam no mesmo cartão.',
    ],
  },
  {
    version: '1.16',
    date: '2026-10-19',
    title: 'A viagem como linha de metrô',
    items: [
      'A rota virou um diagrama de linha de metrô, inspirado na sinalização de Tóquio. Cada cidade é uma estação com a sua cor, um código curto (TQO, KYT, OSK) e o número de noites, e os bate-voltas saem da linha como ramais tracejados. Aparece no pé do mapa, na visão geral do celular e no link compartilhado. Tocar numa estação leva o mapa até a cidade.',
      'A barra de dias também segue a linha: cada dia é uma estação na cor da cidade onde você dorme, e dia de bate-volta ganha um ramal na cor do destino.',
      'Durante a viagem, o dia de hoje mostra um painel “Agora”, como a placa da estação: a atividade atual (ou a próxima) em destaque, com a anterior e a seguinte ao lado.',
    ],
  },
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
