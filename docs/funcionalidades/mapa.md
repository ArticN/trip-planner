# Mapa

[← Índice](README.md)

## Visão geral e mapa do dia

- **Visão geral** ("Geral" na barra de dias): as cidades com o emoji e o número de pontos turísticos, a rota entre as
  hospedagens (linha cheia com setas), os bate-voltas (tracejado) e as ideias. Os pontos das atividades só aparecem
  quando você aproxima. Tocar numa cidade aproxima nela.
- **Mapa do dia**: as atividades numeradas na ordem do roteiro e o caminho entre elas. A pé fica pontilhado, de carro em
  linha cheia, trem e metrô na cor da linha. Voos e trechos de viagem sem estações cadastradas aparecem como linha reta clara.
- **Recorte**: o mapa abre direto na região da viagem e não deixa afastar até o mundo inteiro (fica mais leve). A
  exceção é o [dia de voo](voos.md#no-mapa-grande-do-dia).

Ferramentas do mapa (no celular ficam numa linha que desliza para o lado):

| Botão | O que faz |
| --- | --- |
| Buscar lugar, endereço, link ou coordenadas | Sugere lugares enquanto você digita, primeiro os que estão na tela e mais perto. Enter busca também por endereço. Escolher um resultado põe um marcador no mapa (ver [abaixo](#adicionar-pelo-mapa)). |
| Explorar área | Um círculo no mapa e a lista de tudo o que tem dentro dele. Ver [abaixo](#explorar-área). |
| + Marcar ponto | Clique em qualquer ponto do mapa para pôr ali um marcador. O mesmo vale para o botão direito do mouse ou tocar e segurar no celular. |
| Números / Ícones | No dia: pinos com o número da ordem ou com o ícone do tipo. |
| Fotos | Aparece quando há fotos do [diário](diario.md#o-que-o-app-lê-de-cada-foto) com GPS. Mostra ou esconde as miniaturas (ver [abaixo](#fotos-do-diário)). A escolha fica salva. |
| Hotéis | Mostra ou esconde as hospedagens. |
| Mover pontos | No dia: arraste os pinos para corrigir a posição. Salva sozinho. |
| Tipo de mapa (canto) | **Mapa** (nomes em português ou inglês, visual limpo), **Detalhado** (o estilo mais completo do OpenFreeMap: ícones de lojas, restaurantes e atrações, prédios; nomes em português ou inglês; sempre claro), **Nomes locais** (o mapa padrão do openstreetmap.org, como nas placas), **Relevo** e **Satélite**. A escolha fica salva. |

**Painel do pin:** tocar num pino abre horário, detalhes, notas, links, anexos, custos, **Como chegar**,
**Google Maps**, **Marcar como feita** e **Editar**. Em pontos turísticos, compras e hospedagens,
**Sobre este lugar (Wikipédia)** traz o resumo
da página (em português, ou inglês se não houver), só se a página for de um lugar perto do pino, para evitar homônimos.
Num grupo de [opções](roteiro.md#opções-no-mesmo-horário), o painel também tem as setas do carrossel.

## Fotos do diário

As fotos do [diário](diario.md) que vieram com GPS aparecem como miniaturas onde foram tiradas: todas na visão geral, e
só as do dia no mapa do dia. No dia, uma linha tracejada laranja liga as fotos na ordem do horário: o caminho que você
fez de verdade, para comparar com o planejado. Passar o mouse mostra a legenda e a hora; tocar abre a foto no diário. O
painel do pino de uma atividade mostra as fotos ligadas a ela.

## Adicionar pelo mapa

Dois caminhos, os dois põem um marcador laranja no mapa com um cartão que mostra o nome, o endereço e as coordenadas:

1. **Buscar**: digite o nome (a partir de 3 letras aparecem sugestões, as mais próximas do que está na tela primeiro, com a distância). Use as setas e Enter para escolher, ou Enter sem escolher para buscar também por endereço. Colar um link do Google Maps ou coordenadas leva direto ao ponto. Fora do Brasil, o resultado mostra o nome em português ou inglês e, ao lado, o nome local (kanji, por exemplo). No Japão, escreva em romaji ("Shirakawa-go Ogimachi") ou em japonês.
2. **Marcar no mapa**: botão direito do mouse no lugar, tocar e segurar no celular, ou **+ Marcar ponto** e clique. O app tenta descobrir o nome e o endereço do ponto.

O marcador pode ser arrastado para acertar a posição (num ponto marcado à mão, o app busca o nome de novo). No cartão, **Criar atividade** abre o editor já preenchido para o dia aberto, e **Guardar como ideia** guarda para depois. O X ou Esc tiram o marcador.

Estando num dia, vira atividade daquele dia; na visão geral, vira ideia. A cidade é escolhida pela mais próxima (até 80 km).

## Explorar área

Para descobrir o que tem em volta de um lugar, como a lista do Google Maps:

1. Selecione uma atividade (ou deixe o mapa onde quer) e toque em **Explorar área**. Um círculo aparece no mapa com a
   atividade (ou o centro do mapa) no meio, e ao lado (no celular, embaixo) a lista de cada lugar dentro dele.
2. **Raio**: 300 m, 500 m, 1 km, 2 km ou 5 km. Diminuir o raio no mesmo centro não busca de novo.
3. **Centro**: arraste o ponto do meio do círculo, toque e segure no mapa, digite uma cidade, bairro ou lugar em
   "Mudar o centro", ou use **Centro do mapa**.
4. **Categorias**: Tudo, Comida, Cafés e doces, Atrações, Templos, Parques, Compras e Bares e noite, com quantos
   lugares cada uma tem. Os pontos no mapa têm a cor da categoria e mostram só o filtro escolhido.
5. **Ordem**: **Destaques** (lugares mais conhecidos primeiro, a distância desempata) ou **Mais perto**.

Cada lugar mostra nome (e o nome local, em kanji por exemplo), tipo (ex.: "Restaurante · ramen", "Santuário xintoísta"),
distância do centro e endereço. Tocar num lugar marca ele no mapa (e o mapa vai até ele se estiver escondido atrás da
lista); tocar num ponto do mapa marca o lugar na lista. Aberto, o lugar mostra o horário (quando o OpenStreetMap tem),
**Adicionar em [dia]** (abre o editor já com nome, endereço, posição, tipo e horário nos detalhes), **Guardar como
ideia**, **Notas e fotos no Google Maps** e o site. Lugares que já estão no roteiro aparecem com "No roteiro".

Limitações:

- Os dados vêm do OpenStreetMap pelo Overpass (grátis, sem chave). Ele não tem notas nem fotos: "Destaque" quer dizer
  que o lugar tem página na Wikipédia/Wikidata. Para notas, use o link do Google Maps de cada lugar.
- Cada categoria traz no máximo um número de lugares (300 de comida, 200 de compras, 150 nas outras). Em raios grandes
  de cidades cheias, a lista avisa que há mais lugares e pede para diminuir o raio.
- Lugares pequenos ou novos podem não estar no OpenStreetMap. Sem internet, a busca não funciona. Se aparecer "muitas
  buscas seguidas", espere alguns segundos (o app tenta um segundo servidor sozinho).

## Caminho a pé e linhas de trem e metrô

Cada atividade pode guardar como você chega até ela a partir da anterior do dia. Na primeira atividade do dia, o
caminho parte da hospedagem.

1. No editor da atividade, abra **Trem ou metrô até aqui** e clique em **+ Trecho de trem ou metrô**.
2. Escolha o **Tipo** (Metrô, Trem, Trem de alta velocidade, Ônibus, Bonde, Balsa) e preencha **Linha**, **Sigla**
   (ex.: G, JY) e **Cor da linha**.
3. Em **Embarque** e **Desembarque**, digite o nome da estação e clique em **Buscar** (o app acrescenta "station" à busca
   quando você não escreveu). Escolha o resultado certo; a bolinha "● no mapa" confirma a posição. Se não achar,
   digite latitude e longitude.
4. Opcionais: **Sentido** (ex.: sentido Asakusa), **Minutos no trem** (sem ele, o app estima pela distância) e **Valor**.
5. Para baldeação, **+ Baldeação (outro trecho)**: o novo trecho já começa na estação onde o anterior termina.

No mapa, a linha aparece na cor dela com as estações marcadas, e os trechos a pé (até a estação, entre estações de uma
baldeação e da estação até a atividade) seguem as ruas. No roteiro, a linha entre as atividades mostra cada parte e o
total, ex.: "7min a pé · G Ginza, Ginza → Asakusa 18min · 7min a pé · 32min no total".

Trechos de viagem entre cidades (atividade do tipo deslocamento, como shinkansen, trem expresso ou ônibus rodoviário)
também mostram a linha quando têm as estações. A primeira atividade do dia sai da hospedagem: num dia de troca de cidade,
da hospedagem do check-out. Se a primeira estação fica a mais de 5 km da hospedagem (ex.: chegada pelo aeroporto), a
linha começa direto na estação de embarque. Antes de um deslocamento, a folga entre os horários só conta a caminhada até
a estação, já que o trem é a própria atividade.

Limitações: sem estações intermediárias, a linha é desenhada reta entre o embarque e o desembarque. As intermediárias
só podem ser cadastradas pelo [backup JSON](compartilhar-e-backup.md#trem-e-metrô-campo-route) (campo `stops`).
Trechos a pé de menos de 40 m são ignorados (mesma estação, saída ao lado).

## Diagrama de metrô

A rota da viagem também aparece como um diagrama de linha de metrô, inspirado na sinalização de Tóquio: cada cidade com
hospedagem é uma estação na cor dela, com um código de 3 letras (TQO, KYT, OSK) e o número de noites; os bate-voltas
saem como ramais tracejados. Fica no pé do mapa na visão geral (no celular, no painel) e no link compartilhado. Tocar
numa estação leva o mapa até a cidade.

A barra de dias segue a mesma ideia: cada dia é uma estação na cor da cidade onde você dorme, e dia de bate-volta ganha
um ramal na cor do destino.

## Mapa offline

Menu **⋯ › Mapa offline**. Escolha as cidades e o raio (4, 8, 12 ou 20 km); o app mostra quantos trechos de mapa vai
baixar e o tamanho aproximado. Faça no Wi-Fi antes de viajar. Os mapas baixados ficam no aparelho até você clicar em
**Apagar mapas baixados**. Só funciona na versão publicada (ver [sem internet](app.md#sem-internet)).

## Meu mapa

Na tela inicial, um mapa-múndi com os países de todas as suas viagens: pintados os que você já visitou e contornados os
das viagens planejadas, com a lista das cidades de cada país.

- O país vem da posição das cidades cadastradas (cidades sem posição não contam).
- Um país conta como "Já fui" a partir do primeiro dia da viagem.
- Em **Onde moro**, escolha o país em que você vive: aparece a opção **Mundo** ou só o seu país. Na visão do país, os
  estados (ou províncias) ficam pintados quando você já foi e contornados quando a viagem ainda vai acontecer, e a
  lista agrupa as cidades por estado. Ilhas e territórios distantes ficam fora do quadro, a não ser que alguma viagem
  passe por lá.
- Viagens dentro do país onde você mora são [nacionais](viagens.md#nacional-ou-internacional): na visão **Mundo**, o
  seu país aparece primeiro, com "onde você mora" e os estados visitados (ex.: Amazonas) em vez das cidades, fica com
  contorno próprio e não conta em "países visitados". A contagem ganha **viagens nacionais**.
- O país e a visão escolhida ficam salvos no servidor, iguais em todos os aparelhos. "Onde moro" também decide se cada
  viagem é nacional ou internacional no modo automático.
