# Au Fil du Style · Kit completo · Modelo 1

**L’Art du Mouvement — Hero e cinco cenas da imagem aprovada em 28/10/2026.**

O pacote inclui o site editável em francês, identidade, fontes/licenças,
fotografias recebidas, assets de distribuição, referência aprovada, roteiros
e instruções de implementação. **Não há vídeo de animação.** O movimento do
site é feito com elementos HTML, CSS, SVG e JavaScript.

## Abrir e editar

1. Descompacte o ZIP inteiro, mantendo as pastas.
2. Abra `site/index.html` no navegador. Não há instalação, build, CDN ou API
   necessária para usar o site. Também pode ser servido por hospedagem estática.
3. Abra `docs/GUIA-VISUAL.html` para conferir a direção, logo, paleta e fontes.
4. Leia `roteiros/01-implementacao.md` e `roteiros/02-animacao.md` antes de integrar
   o material a outro projeto. O conteúdo editorial está em `site/content.js`.

Os links externos de Planity, Instagram e mapa precisam de internet quando
acionados. Nenhuma reserva é simulada dentro do site.

## Modelo travado

| Ordem | Cena | Composição |
|---|---|---|
| 1 | Hero | Cabelo no primeiro plano, arco de luz, “Le style, en mouvement.” |
| 2 | Le salon | Foto real ampla, “Le salon. Votre rythme.” |
| 3 | Savoir-faire | Único fundo liso, azul-pervinca; “Coupe. Couleur. Caractère.” |
| 4 | Réalisations | Duas fotos reais encostadas, “La couleur a du relief.” |
| 5 | Rendez-vous | Foto real do salão, “On se voit au salon ?”, Planity e rodapé |

O Hero e o corpo são ambos do modelo 1. Os modelos 2 e 3 não entram neste kit.
A imagem de estudo não é uma captura do site implementado; a interpretação em
código adapta a composição a diferentes telas mantendo a ordem e a identidade.

## Conteúdo do pacote

| Pasta | Arquivos |
|---|---|
| `site/` | Site sem dependências de execução, CSS, JS, fontes WOFF e assets |
| `brand/` | PNG aprovado com alfa real, SVGs em contornos, símbolo, avatar e paleta |
| `fonts/` | Fontes TTF, arquivos variáveis oficiais e licenças OFL |
| `images/originals/` | Sete capturas recebidas, preservadas byte a byte |
| `images/master/` | PNG de campanha do primeiro plano do Hero |
| `references/` | Modelo 1 gerado e imagem exata enviada para confirmar a escolha |
| `motion/` | Timeline editável em JSON, sem vídeo ou sequência de quadros |
| `roteiros/` | Implementação, animação, imagem/identidade, conteúdo e validação |
| `docs/` | Guia visual, textos franceses, fontes, origem dos assets e QA |
| `tools/` | Verificação do kit e reprodução de vetores/fontes |

## Identidade e fotografias

- Logo PNG aprovada: `brand/Logo-Au-Fil-Du-Style-Transparente.png`, **1635 × 962 px,
  RGBA, 91,801% totalmente transparente**. O PNG aprovado não foi redesenhado.
- SVGs reais: `Logo-Au-Fil-Du-Style-Encre.svg` e `-Porcelaine.svg`, em contornos,
  sem bitmap ou fonte externa incorporada. Derivados geometricamente do alfa
  da logo aprovada; o preenchimento segue a paleta uniforme.
- Paleta: azul profundo `#141E30`, pervenche `#A4B6E8`, porcelaine `#F4F0E8` e
  detalhe amadeirado `#B88F65`. As cores naturais das fotos permanecem naturais.
- Tipografia: **Bodoni Moda** 400 regular/italic e **Instrument Sans** 400/500/600.
  O lettering da logo é próprio da composição; não é uma fonte de alfabeto completo.
- O primeiro plano do Hero é um **asset de campanha derivado por imagem** da
  referência recebida, com fundo transparente. Não deve ser apresentado como
  um novo resultado documental do salão. As fotos da galeria são as originais,
  convertidas para WebP, com recortes de enquadramento que omitem a interface.
- Não há salão fictício, retratos de equipe inventados, preços, avaliações,
  antes/depois ou depoimentos criados.

## Funcionalidade

Todos os botões de reserva apontam para o Planity informado no Instagram.
Os três itens de serviço abrem detalhes em uma janela acessível e oferecem
o link para reservar. Sem JS, esses itens continuam como links para Planity.
A galeria tem quatro fotos reais, setas, teclado, fechamento por Escape e
retorno de foco. O site inclui navegação mobile e controle de movimento.

O Hero usa planos 2,5D, não rotação real de cabeça em 3D. Movimento reduzido,
pausa e preferência de economia de dados retiram o trecho sticky adicional.
Só a preferência de pausa é guardada localmente no navegador. Não há formulário,
analytics, checkout, backend ou envio de mensagens.

## Validação e limites

Os resultados técnicos estão em `docs/qa-results.json` e `docs/validacao.md`.
A sintaxe dos scripts, referências locais, assets, transparência, estrutura,
fontes, cópias dos originais, hashes e arquivo ZIP foram conferidos.

**Browser QA: UNVERIFIED.** A infraestrutura de prévia retornou indisponibilidade
do serviço; portanto layout efetivo, cliques, teclado, fluidez e performance
não foram verificados em navegador nesta entrega. O roteiro de validação indica
o que conferir no ambiente de integração. Não há captura fabricada do site.

O projeto não foi publicado e nenhum domínio foi registrado. Dados administrativos
não fornecidos não foram inventados. Endereço, telefone e links usados têm origem
indicada em `docs/fontes-e-origem.md`.

## Reproduzir ferramentas opcionais

O site não precisa de Python. Para conferir o pacote ou reproduzir os vetores e
as instâncias das fontes, use os scripts de `tools/` com `tools/requirements.txt`.
As fontes originais já estão incluídas: `preparar-assets.py` só baixa um arquivo
se ele não existir, sempre do repositório oficial informado.

```bash
python tools/conferir-kit.py
```

`MANIFEST.sha256` contém os hashes dos arquivos distribuídos. Não renomeie
somente parte dos assets nem substitua o CSS por outro tema.
