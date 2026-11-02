// Guia pronto de notas de viagem: Japão, viajando sozinho, com foco em novembro.
// Carregado pela aba Notas ("Carregar guia"): cada nota vira uma nota da viagem, que dá para editar ou apagar.
// Conteúdo pesquisado em novembro de 2026 em guias, sites oficiais e relatos de viajantes (fontes em cada nota).
// tag: 'consenso' (quase todo guia e relato concorda), 'opiniao' (dica de alguns viajantes, gosto pessoal)
// ou 'atencao' (regra, mudança recente ou algo que dá problema se esquecer).

export const GUIDE = {
  key: 'japao-solo',
  title: 'Japão viajando sozinho',
  description: 'Primeiros dias, como se comunicar, transporte, dinheiro, apps, restaurantes, dia a dia, serviços, etiqueta, templos, tax free, remédios e farmácia, emergências, novembro e dicas por cidade (Tóquio, Nikko, Kawaguchiko, Nagoya, Takayama, Kyoto e Osaka).',
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
  jntoMed: L('JNTO: guia para quem fica doente', 'https://www.jnto.go.jp/emergency/eng/mi_guide.html'),
  himawari: L('Tóquio: Himawari (informação médica)', 'https://www.hokeniryo.metro.tokyo.lg.jp/iryo/iryo_hoken/medical_info_eng/himawari'),
  otc: L('Japan Unwritten: remédios de farmácia', 'https://www.japanunwritten.com/2025/11/essential-medicines-and-remedies-in-japan.html'),
  otc2: L('Japan Travel: remédios mais comuns', 'https://en.japantravel.com/article/most-common-otc-drugs-in-japan/72611'),
  pharmacy: L('Travelers Hospital: farmácia para turistas', 'https://travelershospital.com/en/column/japan-pharmacy-guide-tourists'),
  arrival: L('Japlanease: chegando ao Japão', 'https://japlanease.com/japan-airport-arrival-guide/'),
  restMistakes: L('Erros de turista em restaurantes', 'https://yourmileagemayvary.com/2026/06/24/restaurant-mistakes-tourists-make-in-japan-and-the-etiquette-locals-notice/'),
  apps: L('Coto Academy: 22 apps para o Japão', 'https://cotoacademy.com/must-have-travel-apps-for-japan-guide/'),
  wish: L('O que eu queria saber antes (relato)', 'https://rustyselectricdreams.substack.com/p/what-i-wish-i-knew-before-going-to'),
  dos: L('Two Wandering Soles: 35 dicas', 'https://www.twowanderingsoles.com/?p=351841'),
  fodors: L('Fodor’s: o que saber antes', 'https://www.fodors.com/world/asia/japan/experiences/news/photos/important-things-to-know-before-traveling-to-japan'),
  laundry: L('Tokyo Cheapo: lavanderia', 'https://tokyocheapo.com/living/laundry-on-the-go-a-guide-to-keeping-your-clothes-clean-while-traveling-japan/'),
};

// n(grupo, tag, título, texto, fontes, fixada)
const n = (grp, tag, title, body, links = [], pinned = false) => ({ grp, tag, title, body: body.trim(), links, pinned: pinned ? 1 : 0 });

const ANTES = 'Antes de embarcar';
const FIRST = 'Primeiros dias';
const TALK = 'Como se comunicar';
const DAILY = 'Dia a dia';
const SERV = 'Serviços e situações do dia';
const MEDS = 'Remédios e farmácia';
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

  // ── primeiros dias
  n(FIRST, 'consenso', 'No aeroporto, na ordem', `
- Imigração: QR code do Visit Japan Web (print salvo), foto e digitais. Depois, pegue a mala e passe na alfândega com o segundo QR code.
- Ainda no saguão: saque ienes no caixa do Seven Bank, compre o cartão IC (Welcome Suica em Narita e Haneda) e ative o eSIM.
- Se for de trem para a cidade, compre a passagem no balcão ou na máquina; muita gente prefere o ônibus (limousine bus) quando o hotel fica longe da estação, por causa da mala.
- Chegou cansado demais para carregar mala no metrô? Os balcões de entrega no saguão mandam a mala para o hotel, chegando no mesmo dia ou no seguinte.`, [S.arrival], true),
  n(FIRST, 'opiniao', 'Jet lag: o primeiro dia', `
São 12 horas de fuso. O que mais funciona nos relatos:
- Ficar acordado até umas 21h no primeiro dia, mesmo morto de sono, e pegar sol de manhã nos primeiros dias.
- Primeiro dia leve, perto do hotel: conbini, um lámen, uma volta no bairro.
- Acordar às 4h da manhã nos primeiros dias é normal. Use isso: templos, mercados e mirantes vazios bem cedo.
- Beba bastante água no voo e evite álcool.`, [S.wish]),
  n(FIRST, 'consenso', 'Primeiro passeio pelo bairro do hotel', `
Vale gastar meia hora no primeiro dia para descobrir o básico em volta do hotel:
- O conbini mais perto (café da manhã, caixa eletrônico, lixeira) e a farmácia (drugstore).
- A estação e qual saída dá no hotel.
- Um lugar para comer barato e aberto até tarde (gyudon, lámen).
- A lavanderia de moedas mais próxima, se o hotel não tiver.
Tire um print do mapa com o hotel marcado.`),
  n(FIRST, 'consenso', 'Kit que fica na mochila todo dia', `
- Passaporte (é obrigatório andar com ele), cartão IC, dinheiro e um porta-moedas.
- Powerbank e cabo.
- Lencinho de mão (hankachi): muitos banheiros não têm papel para secar as mãos.
- Um saquinho para lixo, lenço de papel e álcool em gel.
- Guarda-chuva dobrável (o de conbini custa uns ¥500 se esquecer).
- Uma garrafinha de água: água da torneira é potável.
- Meia sem furo: em templos, restaurantes com tatame e provadores você tira o sapato.`, [S.fodors, S.wish]),

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

  // ── como se comunicar
  n(TALK, 'consenso', 'Sem japonês dá, com o tradutor certo', `
Inglês é pouco falado fora de hotéis e lugares turísticos, mas placas de trem e estação têm inglês quase sempre.
- Google Tradutor: baixe o japonês offline. A câmera traduz cardápio, placa e embalagem; o modo conversa traduz falando.
- Frases curtas e simples traduzem melhor. Mostre a tela em vez de tentar pronunciar.
- Apontar resolve muito: foto do prato, a vitrine de comida de plástico, o mapa no celular.
- Muitos japoneses entendem inglês escrito melhor que falado: escreva se a conversa travar.`, [S.solo, S.dos]),
  n(TALK, 'consenso', 'Jeito japonês de falar e ouvir', `
- "Sumimasen" serve para tudo: chamar alguém, pedir licença, agradecer um favor. Use antes de qualquer pergunta.
- Ninguém gosta de dizer "não" direto. "Chotto…" (é um pouco…) com cara de dúvida, ou "muzukashii" (é difícil), quase sempre quer dizer não.
- Fale baixo e devagar, sem gritar em inglês. Um sorriso e uma leve inclinação de cabeça ajudam.
- Para apontar para alguém ou chamar, use a mão inteira com a palma para baixo, não o dedo.`, [S.dos]),
  n(TALK, 'opiniao', 'Deixe prontos no celular', `
Prints que poupam muito tempo:
- Endereço de cada hotel em japonês (para o taxista ou para pedir direção).
- Sua alergia ou restrição escrita em japonês, se tiver.
- Frase "sou de outro país, não falo japonês, desculpe" em japonês: 外国から来ました。日本語が話せません。すみません。`),

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

  n(NET, 'consenso', 'Mais apps que os viajantes indicam', `
- Navitime Japan Travel ou Japan Transit (Jorudan): rotas de trem às vezes melhores que o Google, com plataforma e vagão para baldeação.
- Japan Official Travel App (JNTO): alertas de emergência, guias e etiqueta.
- DeepL: tradução mais natural que o Google para textos longos.
- Klook: ingressos, passes e alguns trens com desconto. Omakase e TableCheck: restaurantes.
- Tenki.jp ou Yahoo Weather: previsão do tempo local, chuva hora a hora e terremotos.
- MyMizu: onde encher a garrafinha de graça.
- Wise ou outro app de câmbio: para acompanhar o que gastou.
- LINE: o WhatsApp japonês, que alguns restaurantes e hostels usam para reservas.`, [S.apps]),
  n(NET, 'opiniao', 'Configure antes de embarcar', `
- Google Maps: salve hotéis, restaurantes e lugares com estrela, e baixe as cidades offline.
- Google Tradutor: baixe o pacote de japonês.
- Faça login nos apps de reserva e deixe ingressos e QR codes salvos fora do app (print).
- Teste o eSIM ainda no Brasil (instalar, sem ativar).`),

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

  n(FOOD, 'consenso', 'Restaurante passo a passo', `
1. Na porta você ouve "irasshaimase!" (bem-vindo). Não precisa responder: mostre um dedo (sou só eu) ou diga "hitori desu". Se houver uma prancheta na porta, escreva seu nome e o número de pessoas e espere chamarem.
2. Espere indicarem a mesa. No balcão é normal sentar ao lado de estranhos.
3. Toalhinha quente (oshibori): só para as mãos. Água ou chá vêm de graça e reabastecem.
4. Para chamar o garçom: "sumimasen!" com a mão levantada, ou o botão de chamada na mesa. Muitos lugares têm tablet ou QR code para pedir.
5. A conta: peça "okaikei onegaishimasu" ou faça um X com os dedos indicadores. Muitas vezes a conta já está na mesa (virada para baixo) e se paga no caixa da saída, não na mesa.
6. Ao sair, um "gochisousama deshita" (obrigado pela refeição) agrada muito.`, [S.restMistakes, S.soloDining], true),
  n(FOOD, 'consenso', 'Pequenas regras que os japoneses notam', `
- Não chegue atrasado em reserva: atraso de 15 minutos pode cancelar a mesa.
- Não divida um prato só entre duas pessoas em restaurante cheio, nem fique muito tempo no balcão de lugares rápidos (lámen, gyudon) depois de comer.
- Molho de soja: pouco no pratinho, e o sushi molha pelo peixe, não pelo arroz.
- Não passe comida de hashi para hashi e não aponte com eles.
- Pode levantar a tigela até a boca para tomar o caldo e comer o arroz.
- Se tirar o sapato, os chinelos não entram no tatame.`, [S.restMistakes, S.fodors]),
  n(FOOD, 'opiniao', 'Como achar onde comer', `
- Google Maps com nota 4,0 ou mais e muitas avaliações, ou Tabelog acima de 3,5.
- Andares altos de prédios de estação e de lojas de departamento têm praças de restaurantes (resutoran-gai), quase todos com cardápio de fotos.
- Fila de japoneses na porta é a melhor avaliação.
- Lugares com cardápio só em japonês costumam ser mais baratos e mais locais: o Google Tradutor resolve.
- Nada de comida de rua parada no meio da calçada: coma ao lado da barraca.`, [S.fodors]),

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

  // ── dia a dia
  n(DAILY, 'consenso', 'Conbini: como usar de verdade', `
- No caixa perguntam se quer esquentar (atatamemasu ka?): responda "hai, onegaishimasu" (sim) ou "daijoubu desu" (não precisa). Hashi, colher e sacola também são oferecidos.
- Sacola é paga (uns ¥3 a ¥5): leve uma ecobag dobrável.
- Café: pague o copo no caixa e sirva-se na máquina.
- Tem caixa eletrônico, impressora (imprimir ingressos e reservas), cobrança de contas e lixeiras. Alguns têm banheiro.
- Cerveja e saquê são vendidos 24h (só para maiores de 20, podem pedir documento).`, [S.reddit, S.wish]),
  n(DAILY, 'consenso', 'Lavar roupa na viagem', `
Lavanderia de moedas (koin randorii) existe em todo bairro e em muitos hotéis.
- Lavar: ¥400 a ¥800 (30 a 60 min). Secar: uns ¥100 a cada 10 minutos. Lavar e secar numa máquina só: perto de ¥1.000.
- Muitas máquinas já colocam sabão sozinhas. Botões: 洗濯 (lavar), 乾燥 (secar), スタート (começar).
- Para três semanas, levar roupa para uma semana e lavar duas vezes é o mais comum.`, [S.laundry]),
  n(DAILY, 'consenso', 'Água, bebidas e máquinas', `
- Água da torneira é potável em todo o país.
- Máquinas de bebida em toda esquina, e no inverno com bebidas quentes (botão com faixa vermelha).
- Pocari Sweat e Aquarius repõem sais minerais depois de um dia andando muito.
- Garrafinhas vazias vão na lixeira ao lado da máquina, não no lixo comum.`, [S.dos]),
  n(DAILY, 'consenso', 'Endereços e como achar os lugares', `
A maioria das ruas não tem nome: o endereço é bairro, quarteirão e número do prédio. Por isso:
- Use sempre o pino do Google Maps, não o endereço digitado.
- Restaurantes e lojas costumam ficar em andares altos de prédios: confira o andar (2F, B1F…) no Maps e procure a placa vertical na fachada.
- B1F, B2F são subsolos. Muitas lojas e restaurantes ficam lá.
- Em estação grande, siga as placas amarelas de saída (exit) e as letras e números.`, [S.dos]),
  n(DAILY, 'opiniao', 'Andar muito: cuide dos pés', `
É comum passar de 20 mil passos por dia.
- Leve o tênis já amaciado e um segundo par para alternar.
- Bolhas: o curativo de hidrocoloide Kizu Power Pad (キズパワーパッド), vendido em farmácia, é o mais elogiado.
- À noite, as folhas refrescantes Kyusoku Jikan (休足時間) nas pernas aliviam muito.
- Planeje pausas: um café sentado a cada duas ou três horas.`, [S.fodors]),
  n(DAILY, 'consenso', 'Horários do país', `
- Lojas abrem por volta das 10h ou 11h e fecham às 20h ou 21h. Lojas de departamento fecham perto das 20h.
- Templos: das 8h ou 9h às 16h30 ou 17h. Museus: até 17h, com última entrada 30 minutos antes; muitos fecham às segundas.
- Restaurantes fecham entre o almoço e o jantar (14h às 17h) e aceitam o último pedido uma hora antes de fechar.
- Conbini, Don Quijote, karaokê e redes de gyudon funcionam até de madrugada ou 24h.`),

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

  // ── serviços e situações do dia
  n(SERV, 'consenso', 'No hotel', `
- Check-in quase sempre às 15h e check-out às 10h ou 11h. Deixe a mala na recepção antes e depois, de graça.
- A recepção ajuda a despachar mala (takkyubin), a reservar restaurante por telefone e a chamar táxi. Peça com antecedência.
- Pijama e chinelo do quarto não saem do hotel (o pijama em ryokan pode ser usado nos corredores e no onsen).
- Em hotel pequeno ou cápsula, há horário de silêncio e às vezes a chave fica na recepção quando você sai.`, [S.wish]),
  n(SERV, 'consenso', 'Táxi', `
- A porta de trás abre e fecha sozinha. Entre e não toque nela.
- Mostre o endereço em japonês ou o pino no mapa. Muitos aceitam cartão e cartão IC (confira o adesivo na janela).
- O app GO chama o táxi e já informa o destino e o pagamento, sem precisar falar.
- Sem gorjeta. Depois das 22h a tarifa sobe 20%.`),
  n(SERV, 'consenso', 'Lojas e provadores', `
- Ao entrar, ouve-se "irasshaimase": não precisa responder.
- No provador, tire o sapato antes de subir no degrau. Em muitas lojas dão uma capinha para o rosto, para não sujar a roupa de maquiagem.
- Pague colocando o dinheiro ou o cartão na bandeja. O troco vem em notas primeiro, depois as moedas.
- Tax free: avise antes de pagar ("menzei onegaishimasu") e mostre o passaporte.`, [S.lp]),
  n(SERV, 'opiniao', 'Karaokê, fliperama e onsen sozinho', `
- Karaokê (Big Echo, Karaoke Kan, Jankara): sozinho é normal. Paga-se por 30 minutos ou pacote de horas, com bebida inclusa em muitos.
- Fliperamas (Round1, GiGO, Taito Station): andares de máquinas de pegar bichinho, jogos de ritmo e cabines de foto (purikura).
- Sento (banho público de bairro) custa uns ¥500 a ¥550 em Tóquio e é um ótimo fim de dia depois de andar muito. Super sento e onsen de cidade têm sauna, restaurante e sala de descanso.`),
  n(SERV, 'consenso', 'Correios e enviar coisas para o Brasil', `
Comprou demais? O Japan Post (correio, placa 〒) manda caixas para o Brasil por avião ou pelo modo econômico. Compre a caixa lá mesmo e preencha a declaração de alfândega. Lembre que o que chega pelo correio entra na regra de importação da Receita, separada da cota de bagagem.`),

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

  n(TEMPLE, 'consenso', 'Omikuji, ema e omamori', `
- Omikuji: a sorte em papel (¥100 a ¥300). Se vier azar (kyo), amarre no varal do templo para deixar a má sorte lá; sorte boa você pode levar.
- Ema: plaquinha de madeira para escrever um pedido e pendurar.
- Omamori: amuleto por tema (saúde, estudo, viagem segura, amor). Não se abre e é trocado depois de um ano. Ótimo presente.
- Na caixa de oferendas, jogue uma moeda antes de rezar. A de ¥5 (go-en) é a preferida, porque soa como "boa ligação".`, [S.safety]),
  n(TEMPLE, 'opiniao', 'Como aproveitar sem multidão', `
- Kyoto e os lugares famosos de Tóquio: chegue na abertura ou na última hora antes de fechar.
- Ande dez minutos além do ponto principal: templos menores ao lado dos famosos estão quase vazios.
- Dia de semana ganha do fim de semana, e chuva fina esvazia tudo.`, [S.wish]),

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

  // ── remédios e farmácia
  n(MEDS, 'consenso', 'Como comprar remédio no Japão', `
- Drugstore (ドラッグストア, placa com 薬 "kusuri"): Matsumoto Kiyoshi, Welcia, Sundrug, Tsuruha, Sugi. Muitas abrem até tarde, e a Don Quijote é o plano B de madrugada.
- Remédios de classe 1 (como Loxonin S e Gaster 10) só são vendidos com o farmacêutico (yakuzaishi) presente. Fora desse horário, a gôndola fica fechada.
- As doses japonesas são mais fracas que as brasileiras. Se você depende de uma dose específica, leve o seu remédio.
- Use a câmera do Google Tradutor na caixa. Para pedir, mostre o sintoma escrito ou a foto da caixa abaixo.
- Antibiótico e remédio de receita exigem receita japonesa (consulta numa clínica).`, [S.pharmacy, S.otc], true),
  n(MEDS, 'opiniao', 'Dor, febre e resfriado', `
- Dor de cabeça, dor no corpo, febre: EVE (イブ, ibuprofeno), Loxonin S (ロキソニンS, loxoprofeno, mais forte, precisa de farmacêutico), Tylenol A (タイレノールA, paracetamol, o mais leve para o estômago), Bufferin (バファリン).
- Resfriado com vários sintomas: Pabron Gold A (パブロンゴールドA), Lulu Attack (ルルアタック) ou Benza Block (ベンザブロック, por cor de sintoma). Muitos dão sono.
- Começo de resfriado: Kakkonto (葛根湯), fitoterápico tradicional, tomado logo no início.
- Garganta: Pelack T (ペラックT), gargarejo Isodine (イソジンうがい薬) e pastilhas de Ryukakusan (龍角散).
- Febre ou mal-estar: Pocari Sweat ou OS-1 (経口補水液) para hidratar.
Leia a bula pelo tradutor, siga a dose da caixa e não misture dois antigripais.`, [S.otc, S.pharmacy]),
  n(MEDS, 'opiniao', 'Estômago, intestino e enjoo', `
- Azia, má digestão, comeu demais: Ohta Isan (太田胃散) ou Gaster 10 (ガスター10, precisa de farmacêutico).
- Diarreia: Stoppa (ストッパ, não precisa de água) ou Seirogan (正露丸, cheiro forte; prefira o 糖衣A, revestido).
- Prisão de ventre: Korak (コーラック), só por poucos dias.
- Enjoo de ônibus, barco ou trem de montanha: Travelmin (トラベルミン), tomado 30 minutos antes.
- Ressaca: Ukon no Chikara (ウコンの力), bebida de cúrcuma vendida no conbini, antes ou depois de beber.`, [S.otc, S.otc2]),
  n(MEDS, 'opiniao', 'Pés, músculos, pele e olhos', `
- Bolhas: Kizu Power Pad (キズパワーパッド), curativo de hidrocoloide.
- Pernas cansadas: Kyusoku Jikan (休足時間), folhas refrescantes para a noite.
- Dor muscular: adesivos Salonpas (サロンパス) ou Feitas (フェイタス), gel Voltaren (ボルタレン).
- Picada e coceira: Muhi (ムヒ).
- Corte e esfolado: Band-Aid e Isodine (o de pele, não o de gargarejo).
- Olho cansado ou seco: Sante FX (サンテFX) ou Rohto (ロート). Rinite: Allegra FX (アレグラFX), que não dá sono.
- Ar seco do outono: hidratante labial e um creme de mãos.`, [S.otc, S.otc2]),
  n(MEDS, 'consenso', 'Sintomas em japonês para mostrar', `
- Atama ga itai desu (頭が痛いです): estou com dor de cabeça.
- Onaka ga itai desu (お腹が痛いです): estou com dor de barriga.
- Netsu ga arimasu (熱があります): estou com febre.
- Kaze o hikimashita (風邪をひきました): peguei um resfriado.
- Geri desu (下痢です): estou com diarreia.
- Nodo ga itai desu (喉が痛いです): estou com dor de garganta.
- Kusuri o kudasai (薬をください): quero um remédio, por favor.`),
  n(MEDS, 'consenso', 'Precisei de médico', `
- Antes de ir, acione a assistência do seguro viagem: ela indica a clínica e paga direto. Sem acionar, você paga e pede reembolso depois, com laudo, receita e recibos.
- Para achar hospital com atendimento em inglês: guia do JNTO (busca por cidade, idioma e especialidade) e a Japan Visitor Hotline (050-3816-2787, 24h).
- Em Tóquio, o Himawari (03-5285-8181, das 9h às 20h) indica clínicas que falam inglês.
- Leve o passaporte. Consulta simples numa clínica costuma custar de ¥5.000 a ¥15.000 para quem não tem o seguro de saúde japonês.
- Emergência grave: 119 (ambulância, gratuita).`, [S.jntoMed, S.himawari, S.hotline]),

  // ── emergências
  n(SOS, 'atencao', 'Números de emergência', `
- 110: polícia.
- 119: ambulância e bombeiros (fale "kyuukyuusha", ambulância).
- Japan Visitor Hotline (JNTO): 050-3816-2787, 24 horas, em inglês. Ajuda com doença, acidente, hospital e desastres.
- Embaixada do Brasil em Tóquio: (03) 3404-5211.
- Consulado-Geral do Brasil em Tóquio: (03) 5488-5451 (Gotanda).
- Consulado-Geral do Brasil em Nagoya: 052-222-1077.
Os telefones dos consulados são de 2023: confira no site do Itamaraty antes de viajar.`, [S.hotline, S.consul], true),
  n(SOS, 'consenso', 'Como usar o seguro viagem', `
- Salve no celular, fora do app, o telefone e o WhatsApp da assistência, o número da apólice e o PDF das condições.
- Ligue para a assistência ANTES de ir à clínica: ela indica onde ir e paga direto. Indo por conta própria, guarde laudo, receita e recibos detalhados para o reembolso.
- Mala extraviada ou danificada: faça o relatório de irregularidade (PIR) no balcão da companhia aérea antes de sair da área de desembarque. Sem ele, o seguro não paga.
- Voo muito atrasado: guarde as notas de hotel e comida e o comprovante do atraso.
- Confira se a vigência cobre até o dia em que você chega ao Brasil, não só o dia em que sai do Japão.`, [S.jntoMed]),
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
