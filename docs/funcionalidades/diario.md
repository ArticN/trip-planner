# Diário de viagem

[← Índice](README.md)

**Diário** no topo da viagem (ou no ⋯, no celular) abre um caderno com uma página para cada dia da viagem. É onde ficam
as fotos que você tirou, o que você quer lembrar de cada dia e como ele foi.

## O que tem em cada página

- **Carimbo com a data**, no estilo dos carimbos japoneses (hanko). Em viagens em ienes a data aparece em kanji
  (`11月6日 · 金`); nas outras, dia e mês.
- **Título**: o tema do dia (se o dia tiver um) ou a cidade onde você dorme, sobre uma fita na cor da cidade.
- **Adesivo de humor**: toque em "como foi?" e escolha Incrível, Feliz, Tranquilo, Cansado, Emocionado, Dia de chuva ou
  Comi demais. Tocar de novo no mesmo tira o adesivo.
- **Fotos** como polaroides presas com fita. A legenda (ou o horário da foto, se ela não tiver legenda) aparece embaixo.
- **Texto** em papel pautado. Salva sozinho enquanto você escreve.
- **Canhoto "no roteiro"**: até seis atividades planejadas para o dia, com ✓ nas que você marcou como feitas.

No topo fica a capa do caderno (as três primeiras fotos, quantas fotos, dias escritos e cidades) e uma etiqueta por dia
para pular direto para ele. As etiquetas dos dias com lembranças ficam preenchidas na cor da cidade e o dia de hoje
ganha um contorno vermelho. **Só os dias com lembranças** esconde as páginas vazias.

## Colocar fotos

- **Adicionar fotos** (no topo) aceita várias de uma vez. Cada foto vai sozinha para **o dia em que foi tirada**, pela
  data gravada na foto (EXIF). Sem essa data, vale a data do arquivo.
- **Câmera** (só no celular) abre direto a câmera; a foto tirada vai para o dia de hoje.
- **Colar fotos**, dentro de um dia, faz o mesmo, mas uma foto tirada fora das datas da viagem vai para aquele dia.
- No computador, dá para **arrastar** fotos para a página de um dia.
- Fotos fora das datas da viagem, enviadas pelo botão do topo, ficam em **Fotos soltas**, no fim.
- Enquanto a foto sobe, a polaroide aparece "revelando…".

Toque numa foto para abrir grande. Ali dá para escrever a **legenda**, trocar o **dia**, **baixar** e **excluir**. As setas
(ou ← → no teclado) passam para a foto anterior ou a próxima; Esc fecha.

## Como as fotos são guardadas

- O próprio aparelho reduz cada foto antes de enviar: até 2048 px no lado maior, em JPEG (algo entre 300 KB e 1 MB),
  mais uma miniatura de 720 px para as polaroides. A foto já sai girada do jeito certo.
- As fotos ficam no mesmo banco do app (o Turso, na versão publicada), como os anexos. Mil fotos ocupam por volta de
  1 GB. Confira o espaço do seu plano no Turso se for subir muitas.
- **Não são a cópia original**: guarde as originais no celular ou na nuvem. A versão do diário é para ver e lembrar.
- No iPhone, envie pelo Safari ou pelo app instalado: o iOS converte as fotos HEIC para JPEG sozinho. No computador,
  navegadores que não abrem HEIC (Chrome e Firefox, por exemplo) recusam esse formato com um aviso.
- No Android (Samsung Galaxy, por exemplo), a câmera salva em JPEG por padrão e tudo funciona. Se você ligou
  **Fotos de alta eficiência** (HEIF) nas configurações da câmera, o Chrome pode recusar essas fotos: desligue a opção
  antes da viagem.

## Sem internet

As miniaturas das fotos são guardadas no aparelho quando você abre o diário com internet, então as polaroides continuam
aparecendo sem sinal. A foto grande só fica guardada depois de aberta uma vez. Enviar fotos e salvar texto precisam de
internet (ver [sem internet](app.md#sem-internet)).

## Limitações

- As fotos **não vão no backup JSON**. O texto e o humor de cada dia vão (campo `journal`, ver
  [formato do JSON](compartilhar-e-backup.md#formato-do-json)).
- O diário não aparece no link compartilhado.
- Duplicar a viagem não copia o diário.
