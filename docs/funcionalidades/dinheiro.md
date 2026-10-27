# Dinheiro

[← Índice](README.md)

Todos os valores são digitados na **moeda da viagem** (definida em Editar viagem) e convertidos para a **sua moeda**
quando as duas são diferentes.

## Orçamento

**Orçamento** no topo (ou no ⋯, no celular). Soma o **custo previsto** das atividades e o **preço total** das
hospedagens, e mostra:

- o total previsto, na moeda da viagem e convertido;
- a lista por item (com o link do recibo, quando houver), por cidade e por dia.

Só entram os custos que você preencheu. Das [opções no mesmo horário](roteiro.md#opções-no-mesmo-horário), só a
principal conta.

### Gasto real e recibo

No editor da atividade, **Gasto real** é quanto saiu de fato. Com ele preenchido:

- aparece o campo **Recibo**, com **Foto do recibo** (no celular abre a câmera), que guarda a foto ou o PDF;
- o Orçamento ganha um quadro com o gasto real, o previsto desses mesmos itens e a diferença (acima ou abaixo do previsto);
- o cabeçalho do dia passa a mostrar "gasto de … previstos".

## Câmbio automático

Com moedas diferentes, o Orçamento mostra "1 JPY = … BRL" e a caixa **Atualizar sozinho com a cotação do dia**.

- Ligada (padrão), ao abrir a viagem com internet o app busca a cotação do dia uma vez por dia, no Frankfurter (dados do
  Banco Central Europeu, cerca de 30 moedas) ou, se a moeda não estiver lá, na ExchangeRate-API. Nenhuma pede chave.
- **Digitar um valor** (no Orçamento ou em Editar viagem) desliga a atualização. Marque a caixa de novo para voltar.
- O valor é arredondado para 4 algarismos significativos e a data da última atualização aparece ao lado.

As moedas disponíveis são BRL, USD, EUR, GBP, JPY, ARS, CLP, CAD, AUD, CHF, MXN, KRW, CNY e THB.

## Estatísticas

Menu **⋯ › Estatísticas** (ou no pé da visão geral):

- gasto previsto total, média por dia, distância em linha reta entre as atividades (sem contar voos) e quantas
  atividades estão feitas;
- gráficos de gasto por dia e distância por dia;
- tabela por cidade (noites, atividades e gasto) e por tipo, com as hospedagens numa linha própria.

## Compras e a cota da Receita

**Compras** no topo (ou no ⋯). Para anotar o que você pretende trazer e saber quanto da cota de isenção já está
comprometido.

**Anotar um item:** nome, loja, preço na moeda da viagem (aceita `12.800`, `12800` ou `1.234,50`), grupo (Café e
cozinha, Figures e anime, Roupas e tênis, Eletrônicos, Lembranças, Outros) e dia. Duas caixas:

- **Já comprei**: passa de previsto para comprado. Também dá para marcar direto na lista.
- **Fora da cota**: itens de uso pessoal (como uma roupa que você vai usar) não entram na conta.

Clique num item para editar; o **×** remove (com Desfazer).

**A barra da cota** mostra quanto já foi comprado em dólar e, num tom mais claro, quanto o previsto ainda vai ocupar,
com a marca da cota. Se o total passar da cota, o app avisa quanto passa e estima o imposto: 50% sobre o excedente,
convertido para a sua moeda.

**Ajustes no pé da tela:**

- **Cotação em dólar** (só quando nenhuma das moedas da viagem é o dólar): atualiza sozinha uma vez por dia ao abrir
  Compras, ou pode ser digitada, o que desliga a atualização.
- **Cota de isenção (US$)**: 1.000 por padrão, editável.

> Regra usada (Receita Federal): até US$ 1.000 por pessoa em compras trazidas na bagagem de viagem aérea ou marítima;
> o excedente paga 50% e precisa ser declarado (e-DBV). O free shop da chegada tem cota própria e não entra nessa conta.
> Confira as regras atuais antes de viajar. A cota vale para qualquer viagem por enquanto; separar viagens nacionais e
> internacionais está nas "Ideias para o futuro".
