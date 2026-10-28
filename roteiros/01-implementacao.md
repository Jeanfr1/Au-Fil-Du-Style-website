# Implementação · Modelo 1

Use `references/Modelo-1-Aprovado.png` e a confirmação em `Escolha-Cliente.png`.
O pacote já contém uma implementação estática editável. A referência é estudo
visual gerado, não screenshot do código. Não usar imagens reduzidas dessa prancha
para substituir as fotos originais distribuídas no kit.

## Arquitetura que deve continuar igual

1. `#accueil`: Hero em azul profundo, cabelo frontal da composição visto de
   costas, luz em arco separada, título em duas linhas e reserva.
2. `#salon`: foto ampla real e “Le salon. Votre rythme.”
3. `#savoir-faire`: único fundo liso principal, pervenche, com tipografia e três
   links editoriais de serviço. Sem cartões ou blocos de outra proposta.
4. `#realisations`: loiro e cobre encostados, título central atravessando o campo
   fotográfico. Galeria opcional acessível a partir de link discreto.
5. `#rendez-vous`: fotografia real, chamada e reserva, rodapé na mesma cena.

Somente adaptações responsivas e de acessibilidade já previstas. Não inserir
uma seção de equipe fictícia, produtos próprios, depoimentos ou contadores.

## Arquivos de trabalho

- `site/index.html`: estrutura, textos das cenas, links e janelas.
- `site/styles.css`: fontes locais, paleta, composição, medidas e breakpoints.
- `site/content.js`: conteúdo francês dos detalhes de serviço e quatro fotos.
- `site/app.js`: progresso do Hero, controles de movimento, modais e galeria.
- `site/assets/`: PNG aprovado, SVGs e WebPs usados.
- `motion/timeline.json`: mapa exato das intenções/parâmetros do movimento.

O HTML usa scripts clássicos deferidos e caminhos relativos, sem fetch de dados,
para funcionar também abrindo o arquivo local. Não há sistema de build.

## Camadas do Hero, de trás para frente

1. Fotografia real do salão desfocada/escurecida em CSS.
2. Revelação da mesma fotografia real por máscara circular.
3. Arco SVG de luz, distinto do personagem e editável por código.
4. PNG/WebP do cabelo com alfa real, pessoa e roupa em um plano.
5. Título, navegação e reserva legíveis.

Manter origem de transformação, escala e pontos de saída; a transparência é
necessária para o arco e o fundo aparecerem corretamente. Não achatar tudo
em uma imagem com textos ou em um vídeo.

## Integração em outra base

Copiar os assets e fontes com caminhos consistentes, trazer estrutura e estilos
do modelo escolhido e adaptar o mecanismo ao ambiente da base. Antes de reusar
um projeto antigo, remover somente os componentes que forem de outro modelo.
Não manter efeitos antigos competindo com o progresso deste Hero.

Os SVGs inline de fotografias definem recortes por `viewBox`: isso omite setas
ou texto da interface de capturas sem alterar os originais. Preservar os
recortes documentados em `docs/asset-manifest.json`.

Para uma hospedagem estática, a pasta pública é `site/`. O arquivo
`.openai/hosting.json` declara apenas essa configuração local; não contém ID de
Site, credenciais ou publicação. Publicação deve ser feita no ambiente real
do projeto quando solicitada pelo responsável.
