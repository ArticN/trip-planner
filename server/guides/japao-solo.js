// Guia pronto de notas de viagem: Japão, viajando sozinho, com foco em novembro.
// Carregado pela aba Notas ("Carregar guia"): cada nota vira uma nota da viagem, que dá para editar ou apagar.
// Conteúdo pesquisado em novembro de 2026 em guias, sites oficiais e relatos de viajantes (fontes em cada nota).
// tag: 'consenso' (quase todo guia e relato concorda), 'opiniao' (dica de alguns viajantes, gosto pessoal)
// ou 'atencao' (regra, mudança recente ou algo que dá problema se esquecer).

export const GUIDE = {
  key: 'japao-solo',
  title: 'Japão viajando sozinho',
  description: 'Transporte, dinheiro, internet, comida, etiqueta, templos, tax free, saúde, emergências, novembro e dicas por cidade (Tóquio, Nikko, Kawaguchiko, Nagoya, Takayama, Kyoto e Osaka).',
  updated: '2026-11-02',
};

const L = (label, url) => ({ label, url });
const S = {
  timeoutTax: L('Time Out: novo tax free', 'https://www.timeout.com/tokyo/news/heres-everything-you-need-to-know-about-japans-new-tax-free-system-starting-in-november-101526'),
  mlitTax: L('Agência de Turismo: reembolso', 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00028.html'),
  jrPass: L('JNTO: novos preços do JR Pass', 'https://www.japan.travel/en/ca/news/price-increases-are-coming-to-the-nationwide-japan-rail-pass-2026/'),
  jrPassWorth: L('Explorer Tom: JR Pass vale a pena?', 'https://explorertom.com/en/?p=90643'),
  suica: L('Tokyo Cheapo: Welcome Suica Mobile', 'https://tokyocheapo.com/travel/transport/welcome-suica-mobile-jr-east-reservations/'),
  hotline: L('JNTO: Japan Visitor Hotline', 'https://www.japan.travel/en/plan/hotline/'),
  safety: L('Dicas de desastre e etiqueta (Kansai)', 'https://enjoy-osaka-kyoto-kobe.com/article/a/tips-for-traveling-in-japan/'),
  lp: L('Lonely Planet: 35 regras', 'https://www.lonelyplanet.com/articles/essential-tourist-rules-for-japan'),
  drinktea: L('Drink Tea Travel: dicas', 'https://drinkteatravel.com/japan-travel-tips/'),
  reddit: L('r/JapanTravelTips: dicas de Tóquio', 'https://redlib.ssps.io/r/JapanTravelTips/comments/1kf46j3/a_few_small_tips_for_tokyo'),
  solo: L('Mala de Aventuras: Japão sozinho', 'https://www.maladeaventuras.com/viajar-sozinho-para-o-japao/'),
  soloDining: L('Inside Japan: comer sozinho', 'https://www.insidejapantours.com/blog/?p=17121'),
  wise: L('Wise: caixas eletrônicos no Japão', 'https://wise.com/us/blog/atms-in-japan'),
  luggage: L('Explorer Tom: envio de malas', 'https://explorertom.com/en/japan-luggage-forwarding/'),
  meds: L('Japan Documented: remédios proibidos', 'https://japan-documented.com/tips/medications-you-cant-bring-into-japan/'),
  visa: L('Melhores Destinos: isenção de visto', 'https://www.melhoresdestinos.com.br/japao-isencao-visto-2029.html'),
  consul: L('Embaixada e consulados do Brasil', 'https://gogonihon.com/pt/blog/a-embaixada-e-os-consulados-do-brasil-no-japao/'),
  kyotoTax: L('Time Out: taxa de hospedagem de Kyoto', 'https://timeout.com/osaka/news/kyotos-highest-hotel-tax-hike-takes-effect-all-you-need-to-know-030226'),
  kyotoBus: L('Ônibus de Kyoto: tarifa para turistas', 'https://tokyointernationalmeetup.com/kyoto-two-tier-bus-fare-plan-2026-tourists-guide/'),
  kyotoAutumn: L('Never Ending Voyage: Kyoto no outono', 'https://www.neverendingvoyage.com/kyoto-in-autumn/'),
  nikko: L('Japan Activity: dicas de Nikko', 'https://japanactivity.com/nikko-travel-tips'),
  fuji: L('Is Fuji Visible? Kawaguchiko', 'https://isfujivisible.com/viewspots/lake-kawaguchiko'),
  hida: L('Japan Activity: trem Hida', 'https://japanactivity.com/nagoya-to-takayama-train'),
  takayama: L('Self Guide Japan: Takayama', 'https://selfguidejapan.com/blog/takayama'),
  vjw: L('Visit Japan Web', 'https://www.vjw.digital.go.jp/'),
  smartex: L('smartEX (Shinkansen)', 'https://smart-ex.jp/en/'),
  safeTravel: L('JNTO: Japan Safe Travel', 'https://www.jnto.go.jp/safety-tips/eng/'),
};

// n(grupo, tag, título, texto, fontes, fixada)
const n = (grp, tag, title, body, links = [], pinned = false) => ({ grp, tag, title, body: body.trim(), links, pinned: pinned ? 1 : 0 });

const ANTES = 'Antes de embarcar';
const SOLO = 'Viajando sozinho';
const TRANSP = 'Transporte';
const MONEY = 'Dinheiro e pagamentos';
const NET = 'Internet e apps';
const FOOD = 'Comida';
const STAY = 'Hospedagem e bagagem';
const ETI = 'Etiqueta';
const TEMPLE = 'Templos e santuários';
const SHOP = 'Compras e tax free';
const HEALTH = 'Saúde e segurança';
const SOS = 'Emergências';
const NOV = 'Novembro no Japão';
const ROUTE = 'Cidades da rota';
const PHRASES = 'Frases úteis';

export const NOTES = [
  // ── antes de embarcar
  n(ANTES, 'consenso', 'Entrada sem visto', `
Brasileiro com passaporte eletrônico (com chip) entra no Japão sem visto para turismo de até 90 dias. A isenção foi prorrogada até setembro de 2029.
- Tenha a passagem de volta e o endereço do primeiro hotel à mão: podem pedir na imigração.
- O Visit Japan Web gera os QR codes da imigração e da alfândega. Tire um print dos dois antes de embarcar, para não depender de internet no aeroporto.`, [S.visa, S.vjw]),
  n(ANTES, 'atencao', 'Remédios na mala', `
O Japão é rígido com alguns remédios comuns no Brasil.
- Proibidos ou só com autorização prévia: estimulantes (Venvanse precisa de licença pedida 14 dias antes), descongestionantes com pseudoefedrina (alguns antigripais) e remédios com codeína (como o Tylex).
- Sem papelada: até 1 mês de remédio com receita e até 2 meses dos de venda livre.
- Leve na embalagem original, com a receita (de preferência com o nome do princípio ativo em inglês).`, [S.meds]),
  n(ANTES, 'consenso', 'Tomada e voltagem', `
A tomada japonesa é do tipo A (dois pinos chatos) e a rede é de 100 V.
- Plugue brasileiro (três pinos redondos) não entra: leve um adaptador tipo A ou um carregador com cabo USB.
- Carregadores de celular e notebook costumam ser bivolt (100–240 V), então funcionam. Confira secador e chapinha, que muitas vezes não são.`),
  n(ANTES, 'consenso', 'Deixe tudo salvo offline', `
- Print dos endereços dos hotéis em japonês (para mostrar ao taxista ou pedir direção).
- Reservas, ingressos com QR code e apólice do seguro baixados no celular.
- Mapa offline das cidades no Google Maps e o japonês offline no Google Tradutor.
- Foto do passaporte numa nuvem e com alguém de confiança no Brasil.`, [S.solo]),

  // ── viajando sozinho
  n(SOLO, 'consenso', 'O Japão é um dos países mais fáceis para viajar sozinho', `
É seguro, o transporte é pontual e muita coisa foi pensada para uma pessoa só: balcões em restaurantes, quartos de solteiro, karaokê individual (hitokara). Ninguém estranha quem come ou passeia sozinho.`, [S.solo, S.soloDining]),
  n(SOLO, 'opiniao', 'Ritmo: menos é mais', `
Relato muito comum de quem foi: o maior arrependimento é ter enchido demais os dias.
- O fuso é de 12 horas em relação a Brasília: deixe o primeiro dia leve, perto do hotel.
- Uma atração grande de manhã e outra à tarde, com espaço para se perder nos bairros, rende mais que uma lista de dez lugares.
- Começar cedo compensa: os lugares famosos ficam vazios na primeira hora.`),
  n(SOLO, 'opiniao', 'Para conhecer gente', `
- Balcão de izakaya e bares pequenos (como os da Golden Gai, em Shinjuku, que cobram uma taxa de entrada de ¥500 a ¥1.500) são onde mais se puxa conversa.
- Hostels com bar ou área comum, walking tours gratuitos e eventos do Meetup/Couchsurfing juntam outros viajantes.
- Um "sumimasen, hitori desu" (com licença, sou só eu) abre a porta de qualquer restaurante.`, [S.solo]),
  n(SOLO, 'consenso', 'Alguém no Brasil sabendo do roteiro', `
Mande o roteiro para a família (o link de visitante do planner serve para isso) e combine um horário para dar sinal de vida. Separe os cartões: um na carteira, outro na mala ou no hotel.`),

  // ── transporte
  n(TRANSP, 'consenso', 'Cartão IC (Suica, PASMO, ICOCA)', `
Um cartão recarregável paga metrô, trem, ônibus, conbini e máquinas de bebida. Os cartões funcionam entre si: um Suica comprado em Tóquio vale em Nagoya, Kyoto e Osaka.
- iPhone: dá para ter o Suica na Carteira da Apple (ou o app Welcome Suica Mobile) e recarregar com cartão estrangeiro.
- Android comprado fora do Japão normalmente não aceita o Suica no celular: use o cartão físico. O Welcome Suica (aeroportos de Narita e Haneda) não tem caução e vale 28 dias.
- O cartão físico só recarrega em dinheiro, nas máquinas da estação ou no caixa do conbini.
- Em cidades menores e em alguns ônibus o cartão nem sempre é aceito: tenha moedas.`, [S.suica, S.reddit], true),
  n(TRANSP, 'consenso', 'JR Pass não compensa nessa rota', `
Depois dos aumentos de 2023 e de 1º de outubro de 2026, o JR Pass nacional custa ¥53.000 (7 dias), ¥84.000 (14 dias) e ¥105.000 (21 dias).
Somando os trechos avulsos de uma rota Tóquio → Nagoya → Takayama → Kyoto → Osaka → Tóquio dá algo perto de ¥40.000 (valores aproximados: Tóquio–Nagoya ~¥11.000, Nagoya–Takayama ~¥6.000, Takayama–Kyoto ~¥9.000, Kyoto–Osaka ~¥600, Osaka–Tóquio ~¥14.500), espalhados por mais de duas semanas. Fica mais barato comprar cada trecho.
Além disso, o passe não cobre o Nozomi (o Shinkansen mais rápido) sem pagar uma taxa extra.`, [S.jrPass, S.jrPassWorth]),
  n(TRANSP, 'consenso', 'Shinkansen: como comprar e onde sentar', `
- O app/site smartEX vende o Tokaido Shinkansen (Tóquio–Nagoya–Kyoto–Osaka) e aceita cartão estrangeiro. Dá para entrar na catraca com o próprio cartão IC.
- Monte Fuji: assento E (janela do lado do monte), nos dois sentidos. Ele aparece uns 40 a 50 minutos depois de sair de Tóquio, se o céu estiver limpo.
- Mala grande (soma das três medidas entre 160 e 250 cm) exige reservar o assento com espaço para bagagem no Tokaido. Sem a reserva, paga ¥1.000 de multa e tem que ajeitar a mala onde mandarem.
- Comer no Shinkansen é normal (ekiben, a marmita de estação). No metrô e no trem local, não.`, [S.smartex, S.lp]),
  n(TRANSP, 'consenso', 'Google Maps resolve quase tudo', `
Mostra linha, plataforma, horário e preço. Duas dicas de quem já se perdeu:
- Anote a saída indicada (A1, B3, Saída Leste…). Estações como Shinjuku, Tóquio e Umeda são enormes, e sair pela saída errada pode custar 15 minutos.
- Os horários do Maps são confiáveis, mas trens que dividem no meio do caminho e trens expressos que pulam estações confundem: confira o nome do destino no letreiro.
Alternativas: Japan Transit (Jorudan) e Navitime, que alguns acham mais precisos.`, [S.reddit]),
  n(TRANSP, 'consenso', 'Lado da escada rolante e hora do rush', `
- Tóquio: fica parado à esquerda. Osaka: à direita. Em Kyoto varia: copie quem está na frente.
- Evite o metrô com mala entre 7h30 e 9h30 e entre 17h30 e 19h30.
- Vagão rosa "Women Only" no horário de pico: homens não entram.
- Na plataforma, faça fila nas marcas do chão e deixe as pessoas saírem primeiro.`, [S.lp]),
  n(TRANSP, 'consenso', 'Ônibus em Kyoto', `
Os ônibus de Kyoto vivem lotados no outono. Tarifa única de ¥230 na área central, entra por trás e paga na saída (cartão IC ou moedas).
- Prefira metrô, trens Keihan e Hankyu e caminhar. É mais rápido no pico.
- A tarifa mais cara para turistas ainda é só um plano (previsão para 2027).`, [S.kyotoBus]),
  n(TRANSP, 'consenso', 'Último trem e táxi', `
- O último trem sai perto da meia-noite. Perdeu: táxi (caro) ou esperar o primeiro, perto das 5h.
- No táxi a porta de trás abre e fecha sozinha: não mexa. O app GO chama táxi em inglês e aceita cartão.
- Uber existe nas grandes cidades, mas na prática chama um táxi comum.`, [S.drinktea]),

  // ── dinheiro
  n(MONEY, 'consenso', 'Cartão em quase tudo, mas leve dinheiro', `
Nas cidades grandes o cartão passa em quase todo lugar. Ainda pedem dinheiro:
- Restaurantes pequenos e máquinas de tíquete de lámen.
- Templos e santuários (entrada, amuletos, goshuin).
- Feiras de rua (como as de Takayama), ônibus e recarga do cartão IC físico.
Andar com uns ¥10.000 a ¥20.000 é o mais citado.`, [S.drinktea, S.reddit]),
  n(MONEY, 'consenso', 'Onde sacar: 7-Eleven', `
Os caixas do Seven Bank (7-Eleven, estações e aeroportos) aceitam cartão estrangeiro e têm menu em português. Também funcionam os do Japan Post (correios, taxa de ¥220) e os da FamilyMart.
- Quando o caixa oferecer converter para reais, recuse e saque em ienes: a conversão do caixa sai mais cara.
- Saque valores maiores de uma vez: a taxa costuma ser por saque.`, [S.wise]),
  n(MONEY, 'atencao', 'IOF e cartão: faça a conta', `
Compra no cartão de crédito internacional, débito em conta global e saque pagam IOF. Desde 2025 a alíquota para cartões e saques ficou em 3,5%. Compare o câmbio do dia de cada opção (conta global como Wise, Nomad ou Inter, cartão de crédito, dinheiro trocado no Brasil) antes de escolher a principal. Leve duas bandeiras diferentes (Visa e Mastercard).`),
  n(MONEY, 'consenso', 'Moedas, bandeja e gorjeta', `
- Não existe gorjeta. Deixar dinheiro na mesa faz o garçom correr atrás de você para devolver.
- Pague colocando o dinheiro ou o cartão na bandejinha do caixa, não na mão.
- Junta muita moeda: um porta-moedas ajuda, e dá para gastar no conbini e nas máquinas de bebida.`, [S.drinktea, S.lp]),
  n(MONEY, 'atencao', 'Taxa de hospedagem por noite', `
Algumas cidades cobram por pessoa e por noite, à parte da diária, quase sempre no check-in.
- Kyoto (desde março de 2026): ¥200 (diária abaixo de ¥6.000), ¥400 (¥6.000 a ¥19.999), ¥1.000 (¥20.000 a ¥49.999), chegando a ¥10.000 nas diárias acima de ¥100.000.
- Tóquio e Osaka também cobram, em valores menores.
Algumas reservas já incluem a taxa: confira no voucher.`, [S.kyotoTax]),

  // ── internet
  n(NET, 'consenso', 'eSIM antes de embarcar', `
O mais recomendado hoje para quem viaja sozinho é um eSIM de dados, comprado e instalado ainda no Brasil e ativado ao pousar (Ubigi, Airalo, Saily, Holafly e outros). Pocket wi-fi compensa mais para grupos.
- Confira se o celular aceita eSIM e não tem bloqueio de operadora.
- Com mapas, tradutor e redes sociais, uns 20 GB costumam dar para três semanas. O Wi-Fi grátis existe, mas falha.`, [S.solo, S.drinktea]),
  n(NET, 'consenso', 'Apps que todo mundo indica', `
- Google Maps (transporte e restaurantes) e Google Tradutor com japonês offline e a câmera para cardápios e placas.
- smartEX (Shinkansen) e Safety Tips (alertas oficiais de terremoto e tsunami em inglês).
- Visit Japan Web (imigração), GO (táxi).
- Tabelog para restaurantes: nota 3,5 ou mais já é muito boa por lá. TableCheck e Omakase para reservar.`, [S.drinktea, S.solo]),
  n(NET, 'opiniao', 'Bateria externa', `
Com mapa e câmera o dia inteiro, a bateria do celular não aguenta. Leve um powerbank na mochila (no avião ele vai na bagagem de mão). Se esquecer, o ChargeSPOT aluga baterias em conbinis e estações.`, [S.safety]),

  // ── comida
  n(FOOD, 'consenso', 'Comer sozinho é normal', `
Muitos japoneses comem sozinhos, e a maioria dos restaurantes tem balcão. Os que mais funcionam para uma pessoa:
- Lámen, gyudon (Yoshinoya, Sukiya, Matsuya, abertos 24h), teishoku (Ootoya, Yayoiken), tonkatsu e udon.
- Sushi de esteira (Sushiro, Kura, Hama), pedido pelo tablet.
- Izakaya no balcão, bares em pé (tachinomi) e praças de alimentação das estações e dos subsolos das lojas de departamento (depachika).`, [S.soloDining]),
  n(FOOD, 'consenso', 'Máquina de tíquete (shokken)', `
Em muito lámen e gyudon você paga numa máquina na entrada, pega o tíquete e entrega no balcão.
- O prato principal costuma ser o botão maior, no canto de cima à esquerda.
- Muitas máquinas só aceitam dinheiro, às vezes só notas de ¥1.000. Use o Google Tradutor com a câmera.`, [S.soloDining]),
  n(FOOD, 'opiniao', 'Ichiran e as filas', `
O Ichiran, com cabines individuais, é ótimo para o primeiro dia com jet lag, mas é turístico e tem fila. Muitos viajantes acham os lámens bem avaliados do bairro melhores e mais baratos. Fila de japoneses na porta é bom sinal. Vá fora do horário de pico (das 14h às 17h, ou antes das 11h30).`, [S.soloDining]),
  n(FOOD, 'consenso', 'Conbini é refeição de verdade', `
7-Eleven, FamilyMart e Lawson têm onigiri, sanduíche de ovo (tamago sando), pratos quentes que eles esquentam na hora, café e frutas. Bom para o café da manhã e para equilibrar dias de muita fritura. Também têm caixa eletrônico e lixeiras.`, [S.reddit, S.drinktea]),
  n(FOOD, 'consenso', 'Horários e regras à mesa', `
- O almoço (ranchi, das 11h às 14h) é bem mais barato que o jantar no mesmo restaurante. Muitos fecham entre 14h e 17h.
- L.O. (last order) é o último pedido, bem antes de fechar.
- Água e chá são de graça. A toalhinha quente (oshibori) é só para as mãos.
- Izakaya cobra uma entradinha que você não pediu (otoshi, uns ¥300 a ¥700): funciona como couvert.
- Não espete os hashis em pé no arroz. E pode fazer barulho ao comer lámen.`, [S.lp, S.drinktea]),
  n(FOOD, 'consenso', 'Não coma andando', `
Comer andando pela rua é malvisto. Coma em pé ao lado da barraca ou da máquina de bebida, ou leve para o hotel. Trem local e metrô também não são lugar de comer.`, [S.lp, S.soloDining]),
  n(FOOD, 'atencao', 'Reservas de restaurantes famosos', `
Restaurantes concorridos (sushi omakase, wagyu, kaiseki) só abrem vagas por TableCheck, Omakase, Tabelog ou pelo hotel, e muitos cobram multa por não comparecer. Faltar sem avisar é levado muito a sério. Restaurante que pede o cartão na reserva vai cobrar se você não for.`),

  // ── hospedagem e bagagem
  n(STAY, 'consenso', 'Mandar a mala pelo correio (takkyubin)', `
A recepção do hotel despacha sua mala para o próximo hotel (Yamato/Kuroneko). Custa uns ¥2.000 a ¥4.500 por volume e chega no dia seguinte, mas conte com 2 dias.
- Tenha nome, endereço e telefone do próximo hotel e o nome da reserva.
- Leve uma mochila com 1 ou 2 noites de roupa, remédios, carregadores e documentos.
- Para o aeroporto, mande pelo menos 2 dias antes do voo.`, [S.luggage], true),
  n(STAY, 'opiniao', 'Sugestão para uma rota com Takayama', `
Takayama é cidade pequena e o trem Hida tem pouco espaço para mala grande. Uma estratégia comum: mandar a mala grande direto para o hotel de Kyoto (ou da cidade depois de Takayama) e fazer Nagoya e Takayama só de mochila. Na volta, mandar de Osaka para o hotel de Tóquio ou para o aeroporto.`, [S.luggage, S.hida]),
  n(STAY, 'consenso', 'Armários nas estações (coin lockers)', `
Toda estação grande tem armários, em vários tamanhos, de uns ¥400 a ¥1.000 por dia, muitos pagos com o cartão IC. Os grandes acabam cedo. A recepção do hotel guarda a mala de graça antes do check-in (normalmente às 15h) e depois do check-out.`, [S.lp, S.luggage]),
  n(STAY, 'consenso', 'Hotel japonês', `
Quarto pequeno, banheiro compacto e muito completo: pijama, escova de dente, chinelo e às vezes lavanderia de moedas. Tire o sapato onde houver um degrau na entrada. Em ryokan e casas tradicionais, o chinelo do banheiro fica no banheiro.`),

  // ── etiqueta
  n(ETI, 'consenso', 'No trem: silêncio', `
- Celular no silencioso (manner mode) e nada de ligação.
- Fale baixo. Mochila na frente do corpo ou no bagageiro.
- Assentos prioritários (yusen seki): deixe livre e não use o celular perto deles.`, [S.lp, S.safety]),
  n(ETI, 'consenso', 'Lixo: leve uma sacolinha', `
Quase não há lixeira na rua. Guarde o lixo e jogue no conbini, na estação ou no hotel. Do lado das máquinas de bebida há lixeira só para garrafas e latas. Separe por tipo quando houver as divisões.`, [S.reddit, S.lp]),
  n(ETI, 'consenso', 'Fotos e Gion', `
- Peça antes de fotografar pessoas.
- Em Gion (Kyoto), as ruelas particulares proíbem fotos e há placas de multa. Nunca pare ou siga gueixas (geiko e maiko) para fotografar.
- Não bloqueie a calçada ou a escada para tirar foto.`, [S.lp]),
  n(ETI, 'consenso', 'Fumar e beber na rua', `
Fumar na rua é proibido em boa parte das cidades: só nas áreas de fumantes. Beber na rua é permitido na maior parte do país, mas Shibuya proíbe nas ruas em volta da estação das 18h às 5h, e beber em frente ao conbini é malvisto.`, [S.lp]),
  n(ETI, 'consenso', 'Onsen e sento', `
- Banho nu, separado por sexo. Lave-se inteiro sentado nos chuveiros antes de entrar.
- A toalhinha não entra na água (deixe na cabeça ou na borda).
- Tatuagem ainda é barrada em muitos lugares: procure "tattoo friendly" ou use um onsen privativo (kashikiri).
- Fotos são proibidas.`, [S.drinktea]),
  n(ETI, 'opiniao', 'Gentileza básica basta', `
Ninguém espera que um turista saiba todas as regras. Uma leve inclinação de cabeça, "sumimasen" e "arigatou gozaimasu" resolvem quase tudo. Entregue e receba coisas com as duas mãos quando puder.`, [S.solo]),

  // ── templos e santuários
  n(TEMPLE, 'consenso', 'Santuário (xintoísta) x templo (budista)', `
- Santuário (jinja): tem torii, o portal. Na frente do altar: duas reverências, duas palmas, uma reverência.
- Templo (otera): tem portão (sanmon), estátuas de Buda, pagodes e incenso. Junte as mãos em silêncio, sem bater palmas.`, [S.safety], true),
  n(TEMPLE, 'consenso', 'As regras de ouro', `
- Purificação (temizuya): concha na mão direita, lave a esquerda; troque, lave a direita; despeje água na mão em concha para enxaguar a boca (não encoste a boca na concha) e cuspa ao lado, não na fonte.
- No caminho do santuário, ande pelos lados: o centro é o caminho dos deuses.
- Fale baixo, não coma, não toque nem se apoie nas estátuas e construções.
- Foto dentro dos salões e de frente para a imagem principal costuma ser proibida: siga as placas.
- Sapato fora onde houver piso de madeira ou tatame (meia sem furo ajuda).`, [S.safety]),
  n(TEMPLE, 'consenso', 'Horários: chegue na abertura', `
A maioria abre entre 8h e 9h e fecha entre 16h30 e 17h, e no inverno fecha mais cedo. Na primeira hora os lugares famosos estão vazios. Fushimi Inari fica aberto 24h.`, [S.kyotoAutumn, S.nikko]),
  n(TEMPLE, 'opiniao', 'Goshuin (carimbo caligrafado)', `
Muitos templos e santuários fazem um carimbo à mão num caderninho próprio (goshuincho), por uns ¥300 a ¥500, em dinheiro. Peça no balcão (nokyosho): "goshuin onegaishimasu". Alguns separam livros de templo e de santuário. É uma lembrança muito citada por quem faz.`),

  // ── compras e tax free
  n(SHOP, 'atencao', 'Tax free mudou em 1º de novembro de 2026', `
Agora você paga o preço cheio, com imposto, e pede o reembolso dos 10% no aeroporto, na saída.
- Mínimo de ¥5.000 (sem imposto) por loja e por dia.
- Mostre o passaporte na compra. Na saída, use o quiosque de tax free antes de despachar a mala (ou faça pelo Visit Japan Web). A alfândega pode pedir para ver as compras.
- Os itens têm que sair do Japão sem uso e fechados. O reembolso é por nota: um item aberto ou consumido pode anular a nota inteira. Peça notas separadas para comida e cosméticos.
- Prazo de 90 dias. O reembolso cai no cartão de crédito, que é a forma mais simples. Chegue mais cedo ao aeroporto.`, [S.timeoutTax, S.mlitTax], true),
  n(SHOP, 'atencao', 'Cota da Receita na volta', `
Na volta ao Brasil por avião, a cota de isenção é de US$ 1.000 por pessoa. O que passar paga 50% sobre o excedente. O free shop de chegada tem uma cota separada. O app tem a aba Compras, que soma tudo e avisa quando passa.`),
  n(SHOP, 'opiniao', 'Onde vale a pena', `
- Don Quijote: de tudo, aberto até tarde, bom para lembrancinhas e tax free (mas lotado).
- Daiso, Seria e Can★Do (lojas de ¥100): utensílios e papelaria.
- Uniqlo e GU têm peças que não chegam ao Brasil. Lojas de figures, usados (Book Off, Hard Off, Mandarake) e Akihabara para eletrônicos e games.`),

  // ── saúde e segurança
  n(HEALTH, 'consenso', 'Muito seguro, mas cuidado com os golpes de bar', `
O crime é raro e dá para andar à noite tranquilo. O golpe mais relatado é o de bar: um "promotor" na rua (kyakuhiki) leva você a um bar que depois cobra uma conta absurda. Acontece em Kabukicho e Roppongi (Tóquio) e em Dotonbori/Namba (Osaka). Nunca siga quem chama na rua. Cuidado com bebida de estranhos.`, [S.solo]),
  n(HEALTH, 'consenso', 'Farmácia (drugstore)', `
Matsumoto Kiyoshi, Welcia, Sundrug e Tsuruha vendem remédio de venda livre, curativos e cosméticos. Remédio forte exige receita japonesa: leve os seus. Doente, use máscara no transporte, que é o costume.`, [S.lp]),
  n(HEALTH, 'consenso', 'Terremoto', `
- Durante o tremor: proteja a cabeça, fique embaixo de uma mesa firme e não corra para fora.
- Depois: saia com cuidado. Se houver alerta de tsunami, suba para um lugar alto na hora.
- Instale o Safety Tips e ande com powerbank e um lanchinho.`, [S.safety, S.safeTravel]),
  n(HEALTH, 'consenso', 'Banheiros', `
Banheiros públicos limpos em estações, conbinis, shoppings e parques. Muitos não têm papel para secar a mão: os japoneses andam com um lencinho de mão (hankachi). Na privada eletrônica, o botão 止 (tomeru) para tudo.`, [S.drinktea]),

  // ── emergências
  n(SOS, 'atencao', 'Números de emergência', `
- 110: polícia.
- 119: ambulância e bombeiros (fale "kyuukyuusha", ambulância).
- Japan Visitor Hotline (JNTO): 050-3816-2787, 24 horas, em inglês. Ajuda com doença, acidente, hospital e desastres.
- Embaixada do Brasil em Tóquio: (03) 3404-5211.
- Consulado-Geral do Brasil em Tóquio: (03) 5488-5451 (Gotanda).
- Consulado-Geral do Brasil em Nagoya: 052-222-1077.
Os telefones dos consulados são de 2023: confira no site do Itamaraty antes de viajar.`, [S.hotline, S.consul], true),
  n(SOS, 'consenso', 'Ande com o passaporte', `
Estrangeiro tem que andar com o passaporte o tempo todo: a polícia pode pedir. Ele também é exigido no tax free e no check-in dos hotéis.`),
  n(SOS, 'consenso', 'Perdeu alguma coisa', `
É muito comum recuperar o que se perde. Procure o balcão de achados e perdidos da estação ou o koban (posto policial do bairro). Coisa esquecida no trem: fale com a estação dizendo a linha, o horário e o vagão.`),

  // ── novembro
  n(NOV, 'consenso', 'Clima e roupa', `
- Tóquio, Nagoya, Kyoto e Osaka: uns 8 °C a 18 °C, esfriando no fim do mês. Dias secos e de céu limpo.
- Takayama (montanha) é bem mais fria: perto de 0 °C de manhã no fim de novembro, e pode gear ou nevar.
- Escureça cedo: o sol se põe por volta das 16h30. Deixe parques e jardins para a manhã.
- Roupa em camadas: uma segunda pele (Heattech da Uniqlo), um fleece e uma jaqueta corta-vento. Trem e loja são aquecidos.`),
  n(NOV, 'consenso', 'Folhas vermelhas (momiji)', `
O auge muda todo ano e desce das montanhas para as cidades:
- Nikko: centro entre o começo e a metade de novembro (o alto, em Okunikko, no fim de outubro).
- Takayama: começo de novembro.
- Kyoto e Tóquio: fim de novembro ao começo de dezembro.
Acompanhe a previsão de folhas (koyo) e, em Kyoto, o calendário oficial atualizado duas vezes por semana.`, [S.kyotoAutumn, S.nikko]),
  n(NOV, 'atencao', 'Feriado de 23 de novembro', `
23/11 é feriado (Dia de Ação de Graças do Trabalho). Em 2026 cai numa segunda-feira, então o fim de semana de 21 a 23 é prolongado e Kyoto lota. Em 15/11 há o Shichi-Go-San: famílias com crianças de quimono nos santuários (bonito de ver, mas cheio).`, [S.kyotoAutumn]),
  n(NOV, 'consenso', 'Iluminações noturnas', `
De meados de novembro ao começo de dezembro, vários templos de Kyoto (Kiyomizu-dera, Eikando, Kodaiji, Toji) abrem à noite com as folhas iluminadas, por volta das 17h30 às 21h. Ingresso separado e muita gente: a última hora costuma ser a mais vazia.`, [S.kyotoAutumn]),

  // ── cidades da rota
  n(ROUTE, 'consenso', 'Tóquio', `
- Use outras linhas no lugar da Yamanote no pico (Fukutoshin, Oedo).
- Mirantes concorridos (como o Shibuya Sky ao pôr do sol) esgotam: reserve com antecedência.
- Fuja de promotores em Kabukicho e Roppongi.
- Café da manhã cedo: redes 24h como Matsuya e Sukiya.`, [S.reddit]),
  n(ROUTE, 'consenso', 'Nikko (bate-volta)', `
- Tobu Limited Express a partir de Asakusa: cerca de 1h50 e uns ¥2.900. O Nikko World Heritage Area Pass (¥3.000, 2 dias) cobre a ida e volta pela Tobu e os ônibus do centro, mas não a taxa do expresso.
- Toshogu: de novembro a março fecha às 16h (entrada ¥1.600). Chegue na abertura (8h), antes dos ônibus de excursão.
- Lago Chuzenji e cachoeira Kegon: a estrada de curvas (Irohazaka) trava no fim de semana de outono, e a subida pode levar 3 horas. Vá em dia de semana, no primeiro ônibus, e confira o último ônibus de volta.
- Leve dinheiro: muitos lugares não aceitam cartão.`, [S.nikko]),
  n(ROUTE, 'consenso', 'Kawaguchiko e o Monte Fuji', `
- O Fuji aparece muito mais de manhã cedo: de novembro a fevereiro, ele ficou visível na maioria das manhãs. À tarde costuma fechar.
- Trem Fuji Excursion direto de Shinjuku (cerca de 2h, reserve) ou ônibus rodoviário de Shinjuku, Tóquio ou Shibuya.
- Mirantes: Oishi Park (de graça, margem norte do lago), Chureito Pagoda (quase 400 degraus, vá cedo) e o teleférico Panoramic Ropeway.
- Veja a previsão no site Is Fuji Visible e a câmera ao vivo antes de ir, e tenha um plano B (onsen, museus).`, [S.fuji]),
  n(ROUTE, 'opiniao', 'Nagoya', `
Comida típica (nagoya meshi): hitsumabushi (enguia sobre arroz, comida em três etapas), misokatsu, tebasaki (asinha frita) e kishimen. O cartão IC de outras cidades funciona aqui (o local é o manaca). Ghibli Park exige ingresso comprado com antecedência.`),
  n(ROUTE, 'consenso', 'Takayama', `
- Trem Hida (Nagoya–Takayama): cerca de 2h20 a 2h40, uns ¥6.000 com assento reservado. Sente do lado direito na ida, pela vista do rio; na volta, do lado esquerdo. Reserve no outono.
- Compre um bento de carne Hida na plataforma de Nagoya antes de embarcar.
- Feira da manhã Miyagawa: das 7h ao meio-dia (até novembro). Takayama Jinya fecha às 16h30 de novembro a março.
- A cidade dorme cedo: lojas fecham por volta das 17h. Jante cedo ou reserve.
- Shirakawa-go: ônibus Nohi saindo ao lado da estação, cerca de 50 min e ¥2.800 (¥2.900 a partir de 1º/12/2026). Reserve o horário.
- Sushi e espetinho de carne Hida nas janelinhas da rua velha (Sanmachi); degustação de saquê nas destilarias com uma bola de cedro na porta.`, [S.hida, S.takayama]),
  n(ROUTE, 'consenso', 'De Takayama para Kyoto', `
O caminho mais comum é voltar de Hida para Nagoya e pegar o Shinkansen até Kyoto (umas 3h30 no total). Há também um trem Hida direto por dia entre Takayama e Osaka, passando por Kyoto: confira horários e reserve.`, [S.hida]),
  n(ROUTE, 'consenso', 'Kyoto', `
- Lugares famosos na primeira hora: Fushimi Inari ao amanhecer, Kiyomizu-dera às 6h, Arashiyama antes das 8h. Tofukuji lota mesmo na abertura.
- Fuja do ônibus no pico: metrô, Keihan, Hankyu e caminhada.
- Alguns lugares exigem reserva no outono (Enkoji, Saihoji/Musgo, Murin-an).
- Alternativas mais calmas para as folhas: Eikando no fim da tarde em dia de semana, Nanzenji, Kodaiji, Shorenin.
- Evite Kyoto no feriado de 23/11.`, [S.kyotoAutumn]),
  n(ROUTE, 'opiniao', 'Osaka', `
- Na escada rolante, fique à direita.
- Dotonbori à noite é turístico, mas vale a visita. O mercado Kuromon virou caro e turístico: muitos preferem Ura-Namba, Tenma e Shinsekai para comer.
- Kushikatsu: nunca mergulhe o espeto duas vezes no molho comunitário.
- USJ: o Express Pass esgota em datas cheias, então compre antes.`),
  n(ROUTE, 'atencao', 'Últimos dias e aeroporto', `
- Mande a mala grande para o aeroporto ou para o último hotel com 2 dias de folga.
- Deixe as compras do tax free fechadas e acessíveis (fora da mala despachada até passar no quiosque).
- Chegue com folga ao aeroporto: o novo processo de reembolso gera fila.`, [S.timeoutTax, S.luggage]),

  // ── frases
  n(PHRASES, 'consenso', 'O básico', `
- Sumimasen: com licença / desculpa / chamar o garçom.
- Arigatou gozaimasu: muito obrigado.
- Hai / iie: sim / não.
- Daijoubu desu: está tudo bem / não precisa (recusar sacola, por exemplo).
- Wakarimasen: não entendo.
- Eigo daijoubu desu ka?: tudo bem em inglês?`, [S.solo]),
  n(PHRASES, 'consenso', 'No restaurante e nas compras', `
- Hitori desu: sou só eu (mostre 1 dedo).
- Kore kudasai: este, por favor (apontando).
- Osusume wa?: o que você recomenda?
- Okaikei onegaishimasu: a conta, por favor.
- Kaado de ii desu ka?: pode ser no cartão?
- Fukuro wa iranai desu: não preciso de sacola.
- Menzei dekimasu ka?: tem tax free?`),
  n(PHRASES, 'consenso', 'Direções e emergência', `
- ___ wa doko desu ka?: onde fica ___?
- Eki / toire / byouin: estação / banheiro / hospital.
- Tasukete!: socorro!
- Kyuukyuusha o yonde kudasai: chame uma ambulância, por favor.
- Keisatsu: polícia.
- ___ ni arerugii ga arimasu: tenho alergia a ___.`),
];
