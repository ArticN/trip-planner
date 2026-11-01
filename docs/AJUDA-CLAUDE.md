# Pedir ajuda ao Claude

O Trip Planner foi todo feito conversando com o [Claude](https://claude.ai), e ele também é um bom ajudante para quem
está montando o próprio planner. Abaixo há textos prontos: copie, cole numa conversa nova em [claude.ai](https://claude.ai)
e complete o que está entre colchetes.

> **Nunca cole na conversa** o token do Turso, a URL do banco nem a senha do app. O Claude não precisa deles para
> ajudar; se um print mostrar algum deles, cubra antes de mandar.

## Ajuda para instalar

```text
Estou montando o Trip Planner, um app de planejamento de viagens, seguindo este guia:
https://github.com/ArticN/trip-planner/blob/main/docs/GUIA.md

Eu não sei programar, então me explique com cliques e nomes de botões, um passo de cada vez,
e espere eu dizer que terminei antes de mandar o próximo.

Estou no passo [número e nome do passo, por exemplo "3. Publique na Vercel"].
O que eu fiz: [conte o que já clicou].
O que aparece na tela: [copie a mensagem ou mande um print].
```

Dica: a tela de configuração do próprio app ("Falta ligar o banco de dados", "O banco recusou o acesso") já diz o que
fazer. Se mesmo assim não der, mande um print dela junto com o texto acima.

## Transformar o seu roteiro num arquivo para importar

Se o seu roteiro já está escrito em outro lugar (Notion, Google Docs, planilha, um e-mail da agência, anotações no
celular), o Claude pode convertê-lo num arquivo de backup. Depois é só usar **Importar backup** na tela inicial do app.

1. Baixe o arquivo de modelo [`viagem-exemplo.json`](../examples/viagem-exemplo.json) (no GitHub, botão **Download raw file**).
2. Numa conversa nova, anexe esse arquivo e cole o seu roteiro (ou anexe o PDF, a planilha ou prints dele).
3. Mande o texto abaixo.

```text
Anexei um arquivo de modelo (viagem-exemplo.json) do app Trip Planner e o meu roteiro de viagem.
Gere um arquivo JSON no MESMO formato do modelo com a MINHA viagem, para eu importar no app.
O formato completo está documentado em:
https://github.com/ArticN/trip-planner/blob/main/docs/funcionalidades/compartilhar-e-backup.md#formato-do-json

Regras:
- Datas como AAAA-MM-DD e horários como HH:MM (24h). Se uma atividade não tiver horário, deixe sem start/end.
- Crie uma cidade em "cities" para cada cidade onde eu durmo ou que visito, com uma "key" curta sem acento
  (ex.: "lisboa"), um emoji, uma cor em hex e a latitude/longitude aproximadas do centro.
- Use "city" com essa key nas atividades e hospedagens.
- "kind" de cada atividade: sight (passeio), food (refeição), move (deslocamento), stay (hotel), shop (compras),
  free (tempo livre) ou flight (voo).
- Coloque latitude e longitude aproximadas de cada lugar que você conhecer; se não souber, deixe sem.
- Moeda da viagem em "currency" e a minha moeda em "home_currency" ([ex.: EUR e BRL]).
- Não invente atividades, hotéis, preços nem códigos de reserva que não estejam no meu roteiro.
- No fim, me dê o JSON inteiro como um arquivo para baixar, e uma lista do que ficou faltando ou ficou em dúvida.

Meu roteiro:
[cole aqui]
```

Se a importação der erro, mande para o Claude a mensagem que o app mostrou e peça para corrigir o arquivo.

## Mudar alguma coisa no app

Quer um campo novo, outra cor, uma tela diferente? Isso já é programar, mas dá para fazer conversando, com o
[Claude Code](https://claude.com/claude-code). Peça ajuda assim:

```text
Tenho uma cópia (fork) do Trip Planner no meu GitHub: https://github.com/[seu-usuario]/trip-planner
publicada na Vercel. Não sei programar.

Quero que [descreva a mudança, por exemplo: "cada hospedagem tenha um campo de telefone"].

Me guie desde o começo: o que instalar, como abrir o projeto no Claude Code, como testar a mudança
antes de publicar e como publicar sem perder as minhas viagens.
```

As suas viagens ficam no banco, não no código, então mudar o app não apaga nada. Mesmo assim, exporte um backup antes.
