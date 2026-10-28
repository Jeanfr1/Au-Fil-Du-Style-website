# Validação e entrega

O kit passa por verificações estáticas de estrutura, arquivos, fontes,
transparência e integridade. `docs/qa-results.json` registra cada resultado.

## Conferência no ambiente de integração

- Abrir em desktop largo e notebook; conferir duas linhas do Hero, cabelo sem
  corte indesejado, arco atrás do primeiro plano e CTA/navegação legíveis.
- Conferir mobile 320/375/390/430 px, tablet e orientação horizontal. Letras,
  botões e endereços não devem criar rolagem horizontal ou colidir com controles.
- Percorrer as cinco cenas na ordem aprovada e voltar com scroll reverso.
- Confirmar uma única seção principal de fundo liso.
- Testar todos os CTAs de reserva, telefone, mapa e Instagram.
- Abrir as três categorias, alternar abas com setas/Home/End, fechar por Escape,
  botão e clique fora, verificando retorno de foco.
- Abrir quatro fotos na galeria e testar setas, teclado e fechamento.
- Testar pausa, preferência do sistema e economia de dados. Sem movimento,
  não pode restar uma longa faixa vazia ou conteúdo oculto.
- Sem JS, o conteúdo e links de Planity continuam disponíveis; os controles
  opcionais ficam ocultos. Conferir contraste efetivo sobre cada fotografia.
- Testar carregamento inicial, imagens decodificadas, fontes sem erros e
  desempenho num celular real antes de publicar.

## Estado desta entrega

A prévia gerenciada retornou:
`sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests`.
O diagnóstico repetiu indisponibilidade de infraestrutura. Não foi substituído
por navegador/server improvisado. Browser QA permanece **UNVERIFIED**.

Consequentemente não se declara que clicks, teclado, layout final ou taxa de
quadros foram testados em navegador. As medições tipográficas por arquivo de
fonte são apoio estático, não substituem essa revisão.

O ZIP tem um único diretório raiz e inclui código, assets, README e roteiros.
Conferir CRC do arquivo e `MANIFEST.sha256`. Não entregar apenas PDF ou guia.
Não há vídeo, áudio, deploy, domínio ou agendamento realizado nesta etapa.
