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
| Buscar lugar para adicionar | Procura um lugar no OpenStreetMap e abre o editor com nome, endereço e posição. |
| Perto daqui | Ver [abaixo](#perto-daqui). |
| + No mapa | Clique em qualquer ponto do mapa para criar ali uma atividade (no dia) ou uma ideia (na visão geral). O app tenta descobrir o nome e o endereço do ponto. |
| Números / Ícones | No dia: pinos com o número da ordem ou com o ícone do tipo. |
| Fotos | Aparece quando há fotos do [diário](diario.md#o-que-o-app-lê-de-cada-foto) com GPS. Mostra ou esconde as miniaturas (ver [abaixo](#fotos-do-diário)). A escolha fica salva. |
| Hotéis | Mostra ou esconde as hospedagens. |
| Mover pontos | No dia: arraste os pinos para corrigir a posição. Salva sozinho. |
| Tipo de mapa (canto) | **Mapa** (nomes em português ou inglês), **Nomes locais** (como nas placas), **Relevo** e **Satélite**. A escolha fica salva. |

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

Três caminhos, todos abrem o editor já preenchido para você conferir e salvar:

1. **Buscar lugar para adicionar**: digite o nome (inclua a cidade se não achar). Fora do Brasil, o resultado mostra o nome em português ou inglês e, ao lado, o nome local (kanji, por exemplo); o título da atividade usa o nome legível. A busca é literal: no Japão, escreva em romaji ("Shirakawa-go Ogimachi") ou em japonês.
2. **+ No mapa** e clique no lugar.
3. **Perto daqui** e escolha um resultado.

Estando num dia, vira atividade daquele dia; na visão geral, vira ideia. A cidade é escolhida pela mais próxima (até 80 km).

## Perto daqui

Lista lugares a até 900 m da atividade selecionada (ou do centro do mapa, se nenhuma estiver selecionada), em três
categorias: **Atrações**, **Comida** e **Compras**, ordenados pela distância. Usa o Overpass, a busca pública do
OpenStreetMap. Se aparecer "muitas buscas seguidas", espere alguns segundos.

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
