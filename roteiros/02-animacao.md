# Roteiro de animação · L’Art du Mouvement

**Sem vídeo.** A animação é uma composição de elementos do próprio site.
As medidas exatas do código estão em `motion/timeline.json`.

## Referência e tradução para a marca

O vídeo fornecido usa objeto em primeiro plano, arco de luz, profundidade e
tipografia que atravessa planos. Aqui, cabelo e espelhos traduzem essa intenção.
Não reutilizar estátua, nome do museu, enquadramentos literais ou identidade
da referência. O salão real precisa continuar reconhecível.

## Abertura

Navegação, chamada e link para Planity já estão no HTML e não dependem de intro
para funcionar. Esperar fontes e decodificação do primeiro plano antes da
entrada; não repetir se o usuário já rolou além de 24 px.

- 80–930 ms: primeira linha de título, máscara curta e deslocamento de 24 px.
- 220–1170 ms: segunda linha, mesma família de curva e ritmo mais suave.
- 50–1200 ms: imagem do cabelo passa de opacidade 0,35 a 1 e deslocamento 18 a 0 px.
- 120–1120 ms: arco ganha presença, sem cintilação, flare explosivo ou flash.
- 1450 ms: limpar a classe de abertura. Scroll interrompe a intro se já avançou.

Não adicionar áudio, contagem, loader bloqueador ou tela preta de introdução.

## Hero vinculado ao scroll

Trecho de 166 svh desktop e 150 svh mobile, com palco sticky de uma viewport,
respeitando alturas mínimas da composição. Progresso normalizado de 0 a 1.

- O título sai entre 22% e 65%, subindo no máximo 32 px.
- O cabelo desloca no máximo 20 px para a direita e escala até 1,045.
- O arco gira até 12° e desloca 18 px em sentido oposto.
- O arco perde opacidade entre 72% e 100%, deixando o interior sem halo residual.
- A máscara da fotografia real abre entre 34% e 100%; raio de 0 a 145%.
- O cabelo perde opacidade com o avanço da máscara e sai completamente no fim.
- O interior então encontra a segunda cena, que acrescenta título e endereço.

O movimento deve ser contínuo, reversível e discreto. Não simular um giro de
180/360° de cabeça a partir de uma única fotografia. Isso exigiria outro tipo
de captura/modelo e não faz parte desta entrega.

Ponteiro fino pode deslocar o plano do cabelo até 5 px para cada lado; não
ativar esse efeito em toque. Links do Hero tornam-se inertes quando invisíveis,
evitando foco em um CTA que já não aparece.

## Entre as cenas

O recorte diagonal conduz ao interior amplo. Na sequência, o fundo pervenche
cria a única pausa de cor lisa. Os três serviços têm hierarquia tipográfica,
sem aparecer como cartões. Duas fotografias de resultados criam o próximo
campo de fundo; texto e imagens têm parallax pequeno. A última diagonal
encontra a foto de reserva e termina numa ação simples: agendar no Planity.

Textos abaixo do Hero revelam uma vez ao entrar na área visível, com até 18 px
de curso e duração de 900 ms. Fotografias usam deslocamento moderado; o código
limita a razão a ±0,8 e usa multiplicador 24 px desktop/12 px mobile.

## Desempenho e preferência do visitante

Atualização por requestAnimationFrame solicitada em scroll, resize e ponteiro;
sem loop de render permanente. Suspender quando a página fica oculta.
As fotos estão em WebP, o primeiro plano é priorizado e as fontes são locais.

Pausa manual, `prefers-reduced-motion` e economia de dados retiram a abertura,
parallax e o trecho sticky extra. Todo conteúdo fica visível, sem espaço vazio
de animação. Guardar somente a escolha local de pausa; nenhuma telemetria.

## Conferência no ambiente final

Testar toda a passagem em desktop/mobile, entrada direta por âncora, rolagem
reversa, resize, navegação por teclado e mudança de preferência com a página
aberta. Evitar texto cortado, halos residuais, salto de enquadramento e botão
invisível ainda focável. Esses testes de navegador estão pendentes nesta entrega
por indisponibilidade da infraestrutura de prévia, não por aprovação de resultado.
