# Estado da verificação

O relatório estruturado `qa-results.json` registra as verificações estáticas
e seus resultados. O kit confere arquitetura do modelo 1, cinco cenas, única
seção lisa, idioma, destinos de reserva, vínculos locais, SVG, PNG RGBA,
originais, fontes/licenças, dados de galeria, sintaxe dos scripts e ausência de vídeo.

Os vetores da marca e o primeiro plano foram inspecionados visualmente como
assets. A largura de títulos em telas pequenas também foi estimada pelas fontes
distribuídas, como apoio estático para ajustar os limites de tamanho.

**Browser QA: UNVERIFIED.** `sites-preview start` e o diagnóstico retornaram
indisponibilidade da infraestrutura de prévia:

`sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests`.

Não houve screenshot do site, teste de cliques, teclado ou performance em
navegador. Métricas tipográficas, análise de código e leitura dos arquivos
não substituem esses testes. O roteiro `05-validacao-e-entrega.md` explica o
que conferir no ambiente real de integração.

Nenhum vídeo foi gerado. Nenhum deploy, domínio ou agendamento foi realizado.
Os originais foram preservados e os SVGs da marca contêm contornos nativos.
O Hero usa asset de campanha derivado por imagem; não se declara uma nova
realização documental ou captura de outra perspectiva real da cliente.

O ZIP final é conferido por CRC e o arquivo `MANIFEST.sha256` registra o
conteúdo distribuído. O site é local/estático, com fontes e imagens incluídas.
