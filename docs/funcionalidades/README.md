# Funcionalidades do Trip Planner

Tudo o que o app faz e como usar cada coisa, com dicas, limitações e, onde não é óbvio, como funciona por baixo.
Para instalar e publicar o seu, veja o [guia de hospedagem](../GUIA.md); para a API e as variáveis de ambiente, os
[detalhes técnicos](../TECNICO.md).

Os exemplos usam a viagem fictícia "Japão em 8 dias", que dá para carregar na tela inicial vazia ("carregue um roteiro
de exemplo") ou importando [`examples/viagem-exemplo.json`](../../examples/viagem-exemplo.json).

## Índice

| Área | O que tem |
| --- | --- |
| [Viagens, cidades e hospedagens](viagens.md) | Criar, editar, duplicar e excluir viagens · nacional ou internacional · moeda, câmbio e fuso · foto de capa · cidades e locais · hospedagens · tela inicial |
| [Roteiro do dia](roteiro.md) | Atividades e seus campos · blocos do dia · tempo livre e deslocamento · opções no mesmo horário (carrossel) · ideias sem data · tema do dia, tempo e sol · avaliações · busca · modo hoje |
| [Mapa](mapa.md) | Visão geral e mapa do dia · tipos de mapa · adicionar pelo mapa · "Perto daqui" · caminho a pé e linhas de trem/metrô · Wikipédia · mapa offline · Meu mapa |
| [Voos e trechos](voos.md) | Voos e trens com fuso · cartões de Ida e Volta · mapa-múndi do voo · escalas reconhecidas sozinhas (e como isso funciona) |
| [Dinheiro](dinheiro.md) | Orçamento e análise da viagem · câmbio automático · gasto real e recibo · estatísticas · compras e a cota da Receita |
| [Organização e agenda](organizacao.md) | Checklist · notas, links e anexos · ingressos e reservas · calendário · exportar .ics · lembretes · imprimir/PDF |
| [Diário de viagem](diario.md) | Álbum de fotos em páginas · blocos de fotos (mosaico, grade, destaque, polaroides, filme) e de texto · compartilhar no link · como as fotos são guardadas |
| [Compartilhar e backup](compartilhar-e-backup.md) | Link só de leitura · exportar e importar backup · formato do JSON (campos `alt`, `route`, `via`…) |
| [O app no dia a dia](app.md) | Instalar no celular (PWA) · funcionar sem internet · celular x computador · atalhos · aparência · Novidades |

## Onde fica cada coisa

- **Tela inicial**: lista de viagens, viagem em destaque, Meu mapa, Novidades, Importar backup e Aparência (ícone de paleta).
- **Dentro da viagem, no topo**: lupa (busca), Hospedagens, Orçamento, Análise, Ingressos, Diário, Checklist, Compras e o menu **⋯** (no celular, todos ficam no ⋯).
- **Menu ⋯**: Aparência, Editar viagem, Cidades e locais, Estatísticas, Calendário, Compartilhar roteiro, Mapa offline,
  Lembretes, Imprimir ou salvar PDF, Exportar para agenda (.ics) e Exportar backup (JSON).
- **Barra de dias**: "Geral" abre a visão geral da viagem; cada dia abre o roteiro daquele dia.

## Mantendo esta documentação

Cada versão nova em [`web/src/changelog.js`](../../web/src/changelog.js) deve atualizar a página da área que mudou
(e este índice, se surgir uma área nova). Ao documentar, confira no código como a função se comporta de verdade,
inclusive limites e casos que não funcionam.
