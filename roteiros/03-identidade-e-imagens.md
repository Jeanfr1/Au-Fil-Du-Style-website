# Identidade, tipografia e imagem

O cliente aprovou o modelo 1 completo. Não trocar a paleta, a logo ou a
tipografia por identidades de outros projetos.

## Marca

O traço fluido sugere uma mecha e um S/F. O lettering “Au Fil du Style” é uma
composição própria da logo; a assinatura é “COIFFURE · PONTCHÂTEAU”.
Não é uma fonte de alfabeto completo e não exige instalar fonte para ler o SVG.

O PNG aprovado foi preservado. Os SVGs são contornos nativos obtidos do alfa,
com preenchimento uniforme: encre ou porcelaine. O símbolo vem dos três
contornos superiores da própria logo; não é um desenho independente parecido.
Há também avatar quadrado nativo e favicon derivados desse símbolo.

Usar porcelaine sobre fundos escuros e encre sobre superfícies claras.
Não aplicar sombra dourada, relevo, contorno duplo, retângulo opaco ou esticar.
Conservar a área transparente e a proporção. Em espaço pequeno, usar o símbolo
em vez de reduzir a assinatura até ficar ilegível.

## Cores e fontes

Bleu encre #141E30 · pervenche #A4B6E8 · porcelaine #F4F0E8 · bois doux #B88F65.
O pervenche é a única seção principal lisa; os outros campos são fotografias.
O detalhe amadeirado é pontual. A cor real dos cabelos e da roupa não é cor de UI.

Bodoni Moda 400 para títulos, itálico pontual. Instrument Sans 400/500/600 para
texto, navegação e botões. Fontes WOFF locais no site e TTF/fontes variáveis com
OFL em `fonts/`. Não substituir automaticamente por outra Didone com medidas
diferentes: isso altera quebras de linha e a composição do Hero.

## Fotografias

Os sete arquivos em `images/originals/` são cópias byte a byte das capturas
recebidas. O site usa derivados WebP em qualidade 95, sem inventar novos
resultados. Recortes por viewBox omitem UI das capturas; os originais continuam
intactos no kit. Não colocar a marca por cima do resultado como rótulo falso.

O PNG em `images/master/` é um recorte de campanha assistido por imagem,
baseado na fotografia de ondas loiras enviada. Pode reconstruir detalhes;
nunca apresentá-lo como uma nova cliente ou resultado documental. O registro
original dessa foto também está no kit e é usado na galeria e no fundo de resultados.

Não gerar outro salão ou equipe. As paredes azuis, espelhos, bancada, poltronas
e madeira das fotos reais são parte essencial da ligação com a empresa.
O escurecimento/desfoque do Hero é uma camada CSS, não substituição de arquitetura.

Não incluir o vídeo da referência dentro do site ou converter em uma nova
animação. O pacote contém somente instruções, timeline e movimento do código.
