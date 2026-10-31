// Ideias para o futuro: o que ainda não existe no app, mostrado na Home abaixo das Novidades.
// Quando uma ideia virar versão, sai daqui e entra no CHANGELOG.
export const IDEAS = [
  { title: 'Divisão de gastos', text: 'Registrar quem pagou cada coisa e ver no fim quem deve a quem, como no Splitwise.' },
  { title: 'Prazos de cancelamento', text: 'Reservas com “cancelamento grátis até…” e aviso perto da data.' },
  { title: 'Modelos de checklist', text: 'Listas prontas por tipo de viagem (frio, praia, internacional) e a sua salva para reusar.' },
  {
    title: 'Trajeto real do voo',
    text: 'Depois que o voo pousa, buscar a rota que o avião fez de verdade (pelo número do voo e a data) e desenhar no mapa no lugar do arco ilustrativo. Depende de um serviço de dados de voo com chave, como o FlightAware.',
  },
  { title: 'Retrospectiva', text: 'Resumo da viagem com km andados, lugares, gastos por categoria e as atividades mais bem avaliadas.' },
];

// Novidades do app, da mais nova para a mais antiga. Cada entrega nova ganha uma versão aqui
// e atualiza a página da área em docs/funcionalidades/ (o que mudou, como usar e as limitações).
export const CHANGELOG = [
  {
    version: '1.40',
    date: '2026-10-31',
    title: 'Fotos que sabem onde foram tiradas, e vídeos no álbum',
    items: [
      'Ao enviar, o app lê o local (GPS), a hora e a câmera de cada foto e liga a foto à atividade do roteiro em que ela foi tirada.',
      'Legenda automática: sem legenda escrita, a foto mostra a atividade (ou a cidade) e a hora, como “Shinjuku Gyoen · 11:15”.',
      'Ficha da foto (ⓘ Info): local com altitude e link para o mapa, a atividade (dá para trocar), câmera, lente e exposição.',
      'Fotos no mapa: miniaturas onde cada foto foi tirada e, no mapa do dia, o caminho que você fez de verdade. O botão Fotos liga e desliga. O painel da atividade mostra as fotos dela.',
      'A aba Fotos avisa quais fotos vieram sem localização e como ligar isso na câmera do Galaxy.',
      'Novo bloco de vídeo: cole o link de um vídeo do YouTube (pode ser “Não listado”), Vimeo, Google Drive, Instagram ou TikTok. O vídeo fica na plataforma, na resolução original, e toca dentro do álbum e no link de visitante.',
    ],
  },
  {
    version: '1.39',
    date: '2026-10-31',
    title: 'Diário vira álbum de fotos',
    items: [
      'O Diário agora é um álbum: as fotos vão sozinhas para a página do dia em que foram tiradas, já montadas num mosaico.',
      'Em Editar, cada página é uma sequência de blocos que você monta como quiser: fotos (Mosaico, Grade, Destaque, Polaroides ou Filme) ou texto (Nota, Título ou Citação). Dá para subir, descer e apagar blocos e mudar a ordem das fotos.',
      'Páginas livres: crie páginas extras sem dia (como “Melhores momentos”), mude o título ou o dia de qualquer página e mova uma foto de página ao abri-la.',
      'Nova aba Fotos, com todas as fotos por dia, como o rolo da câmera. Ao abrir uma foto, deslize o dedo para passar para a próxima.',
      'Compartilhar roteiro ganhou “Mostrar o diário de viagem no link”: quem tem o link vê o álbum e baixa as fotos, sem poder mudar nada.',
      'O humor do dia e o canhoto do roteiro saíram. Os textos que você já tinha escrito viraram notas nas páginas.',
    ],
  },
  {
    version: '1.38',
    date: '2026-10-31',
    title: 'Diário de viagem',
    items: [
      'Nova página Diário, no topo da viagem (ou no ⋯, no celular): um caderno com uma página para cada dia, com carimbo da data, a cidade numa fita colorida e o que estava no roteiro num canhoto de ingresso.',
      'Adicionar fotos: escolha várias de uma vez e cada uma vai sozinha para o dia em que foi tirada. No computador, dá para arrastar as fotos para um dia.',
      'No celular, o botão Câmera abre direto a câmera e a foto vai para o dia de hoje.',
      'As fotos viram polaroides. Toque numa para ver grande, escrever a legenda, trocar o dia, baixar ou excluir.',
      'Escreva sobre o dia em papel pautado (salva sozinho) e cole um adesivo de humor: Incrível, Feliz, Tranquilo, Cansado, Emocionado, Dia de chuva ou Comi demais.',
      'No Android, o ícone do app instalado agora preenche o formato do sistema (redondo ou squircle), sem borda branca.',
      'As fotos são reduzidas no próprio celular antes de subir, para gastar pouco dado e pouco espaço. Guarde as originais: elas não vão no backup.',
    ],
  },
  {
    version: '1.37',
    date: '2026-10-31',
    title: 'Análise com gráficos',
    items: [
      'A Análise trocou listas e tabelas por gráficos, com mais espaço entre as seções. As tabelas continuam em “Ver em tabela”.',
      'Por dia: dia mais caro, mais barato e média, colunas com a linha da média e a faixa das cidades embaixo.',
      'Por cidade em barras na mesma escala; hospedagens numa linha do tempo; comida com a faixa entre a opção mais barata e a mais cara e um mapa de calor das refeições dia a dia.',
      'Passe o mouse, toque ou use o teclado em qualquer barra ou quadrado para ver o detalhe. Funciona no tema claro e no escuro.',
    ],
  },
  {
    version: '1.36',
    date: '2026-10-31',
    title: 'Ingressos e reservas',
    items: [
      'Nova página Ingressos, no topo da viagem (ou no ⋯, no celular): o que falta comprar ou reservar, o que só precisa se escolher aquela opção, o que já foi comprado e o que se paga na entrada.',
      'Cada item mostra dia, horário, preço, as notas com onde comprar, os links, os anexos (o PDF do ingresso abre direto dali) e quando a venda abre, se as notas disserem.',
      'Marcar “Comprado” marca o item de reserva da checklist (e cria um, se a atividade ainda não tiver).',
      'Compartilhar roteiro ganhou a opção “Mostrar gastos e ingressos no link”: com ela ligada, quem tem o link vê os botões Gastos e Ingressos. Códigos de reserva e anexos continuam fora do link.',
    ],
  },
  {
    version: '1.35',
    date: '2026-10-31',
    title: 'Análise rola de novo',
    items: [
      'A página de Análise volta a rolar com o mouse, o dedo e o teclado, com o título e o menu de seções sempre no topo.',
      'Resumo, no menu de seções, volta ao início da página; a seta ← volta ao roteiro.',
    ],
  },
  {
    version: '1.34',
    date: '2026-10-31',
    title: 'Análise da viagem',
    items: [
      'Nova página Análise (botão no topo da viagem): o total planejado em reais, quanto vai por dia, por noite de hotel e em comida, e um aviso do que ainda está sem preço.',
      'Gráficos de para onde vai o dinheiro (hospedagem, voos, transporte, comida, passeios e compras), gasto por dia e por cidade, sempre com a tabela ao lado.',
      'Todas as refeições com o preço da opção escolhida e a faixa entre a mais barata e a mais cara, mais os ingressos, o transporte por tipo, as compras na cota de US$ 1.000 e as reservas que faltam.',
      'Quem abre o link de compartilhamento também vê a análise, pelo botão "Análise de gastos", e pode imprimir ou salvar em PDF.',
    ],
  },
  {
    version: '1.33',
    date: '2026-10-31',
    title: 'Trens entre cidades no mapa',
    items: [
      'Shinkansen, trem expresso e ônibus rodoviário com estações cadastradas agora aparecem no mapa na cor da linha, em vez de uma linha reta clara.',
      'Em dia de troca de cidade, o trajeto da manhã sai do hotel do check-out, não do hotel novo.',
      'Na chegada pelo aeroporto, a linha do trem começa no aeroporto, sem um trecho a pé desde o hotel.',
    ],
  },
  {
    version: '1.32',
    date: '2026-10-30',
    title: 'Busca de lugares em romaji',
    items: [
      'Na busca de lugares e de estações, o resultado mostra o nome em português ou inglês (ou em romaji, quando o OpenStreetMap tem) e o nome local em japonês, chinês etc. ao lado. Ex.: "Shirakawa-go 白川郷".',
      'Ao adicionar o lugar no roteiro, o título entra no nome legível, não em kanji.',
    ],
  },
  {
    version: '1.31',
    date: '2026-10-27',
    title: 'Login mais protegido',
    items: [
      'Depois de 10 senhas erradas seguidas, o login daquele aparelho fica bloqueado por 15 minutos. Isso freia quem tenta adivinhar a senha.',
      'O site passa a mandar cabeçalhos de proteção: não pode ser aberto dentro de outro site (contra golpes de clique disfarçado) e não repassa o endereço completo para outros sites.',
    ],
  },
  {
    version: '1.30',
    date: '2026-10-27',
    title: 'Viagem nacional ou internacional',
    items: [
      'Cada viagem agora é nacional ou internacional. No automático, o app descobre pelas cidades: se todas ficam no país de “Onde moro” (no Meu mapa), a viagem é nacional. Dá para fixar o tipo em Editar viagem.',
      'A visão geral mostra o tipo e por onde a viagem passa: “Viagem nacional · Amazonas” ou “Viagem internacional · Japão”.',
      'Viagem nacional fica sem cota da Receita: Compras mostra só o total comprado e o previsto, sem dólar, imposto nem free shop, e a viagem usa uma moeda só, a sua, sem câmbio.',
      'No Meu mapa, o país onde você mora não conta mais como destino estrangeiro: aparece primeiro, com os estados das viagens nacionais, e a contagem ganha “viagens nacionais”.',
      'Viagens e backups antigos continuam como estavam: sem tipo escolhido, ficam no automático, e sem “Onde moro” contam como internacionais.',
    ],
  },
  {
    version: '1.29',
    date: '2026-10-27',
    title: 'Anotações do dia sem texto cortado',
    items: [
      'A caixa de tema e anotações do dia não estoura mais para a direita: o texto quebra linha dentro da caixa, no computador e no celular. Uma URL comprida (como a de um roteiro a pé no Google Maps) deixava a caixa inteira mais larga que o painel e cortava até as frases normais.',
      'Links colados no texto agora aparecem curtos e clicáveis: “rota no Google Maps”, “abrir no Google Maps” ou o nome do site. Vale para as anotações do dia e para detalhes, notas e avaliação das atividades, na lista e no cartão do mapa. Clicar no link abre a página sem entrar na edição.',
    ],
  },
  {
    version: '1.28',
    date: '2026-10-27',
    title: 'Voo com escalas no mapa do dia',
    items: [
      'No dia de um voo, o mapa grande deixa de ficar preso na região da viagem e mostra o trajeto inteiro: o aeroporto de origem, cada escala e o destino final como pontos, ligados por arcos com setas. Ao voltar para um dia comum, o mapa volta para a região da viagem.',
      'A escala agora é lida do próprio voo: um local como “Guarulhos (GRU) → Zurique → Narita (NRT)” já desenha GRU → ZRH → NRT, sem precisar preencher o campo Escalas. Vale para códigos de aeroporto e para os nomes das cidades que mais servem de escala, em português ou inglês.',
    ],
  },
  {
    version: '1.27',
    date: '2026-10-27',
    title: 'Trajeto do voo no mapa-múndi',
    items: [
      'Cada voo ganhou um mapa-múndi com o trajeto: saída, escalas e chegada ligadas por arcos, com um aviãozinho percorrendo a rota, a lista das cidades e a distância em linha reta. É um trajeto ilustrativo (o caminho mais curto entre os aeroportos), não a rota real do avião.',
      'Novo campo “Escalas” no voo: digite os códigos dos aeroportos na ordem, como ZRH ou ICN, ADD. Mais de 3 mil aeroportos com voos regulares vêm embutidos no app, então o mapa funciona offline.',
    ],
  },
  {
    version: '1.26',
    date: '2026-10-27',
    title: 'Ida e volta no roteiro',
    items: [
      'O primeiro voo da viagem (ida) e o último (volta) saíram dos blocos do dia, como “Depois do jantar”, e ganharam um cartão de viagem próprio: a ida abre o dia em que a viagem começa e a volta fecha o dia em que ela termina. Num dia só de voo, os blocos vazios nem aparecem.',
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
      'A linha entre as atividades mostra cada parte, por exemplo “7min a pé · G Ginza, Ginza → Asakusa 18min · 7min a pé”, e o total.',
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
