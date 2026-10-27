# Viagens, cidades e hospedagens

[← Índice](README.md)

## Viagens

Uma instalação guarda quantas viagens você quiser. Cada uma tem as próprias datas, moeda, cidades, hospedagens e roteiro.

**Criar:** na tela inicial, **+ Nova viagem**. Preencha:

- **Nome** e **subtítulo** (opcional), e um emoji da lista.
- **Início** e **Fim**: definem os dias do roteiro (um por data, inclusive as duas pontas).
- **Moeda da viagem** e **Sua moeda**: os custos são digitados na moeda da viagem e convertidos para a sua. Com moedas
  diferentes aparece o campo **Câmbio** (quanto 1 unidade da moeda da viagem vale na sua). Veja [câmbio automático](dinheiro.md#câmbio-automático).
- **Foto de capa** (opcional): escolha do aparelho ou cole um link. A foto escolhida é reduzida no próprio aparelho
  (cerca de 100 KB) antes de ser salva. Aparece no cartão da tela inicial.
- **Fuso horário do destino** (ex.: `Asia/Tokyo`): importante. Com ele o app sabe que dia e hora são "agora" no destino
  (modo hoje), calcula o nascer e o pôr do sol e grava a agenda `.ics` no horário certo.

**Editar, duplicar, excluir:** menu **⋯ › Editar viagem** (ou o link "Editar" ao lado das datas, na visão geral).

- **Duplicar** cria "(cópia)" com tudo, mas zera o que é de quem já viajou: atividades feitas, gasto real, avaliações,
  itens do checklist marcados e compras marcadas como compradas. Bom para reaproveitar um roteiro.
- **Excluir** apaga a viagem e tudo dela, sem desfazer. Exporte um [backup](compartilhar-e-backup.md#backup) antes, se quiser guardar.

## Tela inicial

- **Viagem em destaque**: a que está acontecendo ou a próxima. Antes da viagem mostra quantos dias faltam, o progresso
  do checklist e quantas atividades tem o primeiro dia. Durante a viagem mostra "Dia N de M", a próxima atividade de hoje
  e o botão **Abrir o dia de hoje**.
- **Próximas viagens** e **Concluídas**, com contagem regressiva ou "Dia N da viagem" em cada cartão.
- **Importar backup**, [Meu mapa](mapa.md#meu-mapa), [Novidades](app.md#novidades) e [Aparência](app.md#aparência).
- Sem nenhuma viagem, a tela oferece **ou carregue um roteiro de exemplo**, que cria a viagem fictícia para você explorar.

## Cidades e locais

Menu **⋯ › Cidades e locais** (ou "Cidades" no pé da visão geral).

As cidades agrupam as atividades, dão cor aos dias (na barra de dias, no calendário e no diagrama de metrô) e aparecem
no mapa da visão geral.

- **+ Adicionar**: digite o nome; o app procura a posição no OpenStreetMap e já preenche latitude e longitude. Se não
  achar, preencha à mão.
- Cada cidade tem **emoji**, **nome**, **cor** e posição, todos editáveis. Clique em **Salvar alterações** no fim.
- **Excluir** uma cidade não apaga nada: as atividades, ideias e hospedagens dela ficam sem cidade.
- A cidade especial **Em trânsito** é criada sozinha em toda viagem, para voos e deslocamentos. Ela não aparece nesta
  tela nem no Meu mapa.

> Por baixo, cada cidade tem uma chave curta tirada do nome (ex.: `kyoto`), que é o que liga atividades e hospedagens a
> ela. Renomear a cidade não muda a chave, então nada se perde.

## Hospedagens

**Hospedagens** no topo (ou no ⋯, no celular).

Campos: nome, cidade, endereço, **check-in** e **check-out** (data e horário), nº da reserva, preço total, link da
reserva, posição (busca pelo endereço ou lat/lng) e notas. **+ Hospedagem** já sugere o check-in no dia do último
check-out. Clique em **Salvar alterações** para gravar.

O que elas fazem pelo resto do app:

- **Rota da viagem**: na visão geral, as hospedagens em ordem formam a rota entre cidades (linha cheia no mapa) e o
  [diagrama de linha de metrô](mapa.md#diagrama-de-metrô). Cidades sem hospedagem viram **bate-voltas** (tracejado).
- **Cabeçalho do dia**: cada dia mostra a hospedagem daquela noite, com o estado: porta aberta no dia do check-in
  ("a partir das 15:00"), cama nos outros dias, e um cartão de check-out ("até 11:00") no dia em que você sai.
  O número da reserva e o link aparecem no mesmo cartão.
- **Noites por cidade** nas estatísticas e o **preço** no orçamento.
- **Trajeto a partir do hotel**: na primeira atividade do dia com trem ou metrô, o caminho parte da hospedagem.

Regra das datas: você dorme na hospedagem nas noites de `check-in` até a véspera do `check-out`. Um hotel de 05/04 a
08/04 cobre as noites de 5, 6 e 7 (três noites); no dia 8 aparece só como check-out.
