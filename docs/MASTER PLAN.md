# Prompt mestre para recriar o fluxo completo do Flash Professional CS4 com interface fluida e suporte profissional a mesas digitalizadoras

## Conclusões da pesquisa que mudam a especificação

A arquitetura proposta no rascunho está no caminho certo, mas há algumas correções importantes para que a implementação seja tecnicamente fiel, executável e não dependa de premissas incorretas.

A principal delas é o **modelo vetorial**. O comportamento clássico de desenho não deve ser implementado como uma coleção simples de objetos SVG independentes. No modo equivalente ao *Merge Drawing*, formas que se cruzam na mesma camada alteram a topologia: interseções dividem segmentos, sobreposições podem remover/substituir áreas e strokes/fills podem ser selecionados separadamente. Já o *Object Drawing* mantém cada forma independente e une conceitualmente o stroke e o fill dentro daquele objeto. A própria documentação da Adobe descreve essa diferença de comportamento. citeturn8view0

O formato SWF também confirma que a representação histórica é fortemente **edge-based**. Estruturas `SHAPE` são compostas por registros de estilo e registros de arestas; arestas curvas são Béziers quadráticas, e uma mesma aresta pode carregar referências de preenchimento dos dois lados por meio de `FillStyle0` e `FillStyle1`. citeturn4view1turn4view3 A especificação inclusive ilustra a associação dos preenchimentos aos lados da aresta e a representação quadrática das curvas. citeturn5view2turn5view3 Isso favorece um núcleo topológico próprio — por exemplo, um grafo planar/half-edge — em vez de usar o DOM SVG como modelo de documento.

Há também uma correção histórica importante sobre **XFL**. O XFL como formato de documento editável aberto/comprimido passou a fazer parte do fluxo principal a partir do Flash Professional CS5; a documentação da Adobe descreve CS4 e anteriores como a geração de FLA binário e CS5+ como a geração XFL. citeturn20search10 Ao mesmo tempo, XFL já existia no ecossistema CS4 como formato de intercâmbio: o After Effects podia exportar XFL para posterior edição no Flash CS4 ou posterior. citeturn20search24 Portanto, uma recriação historicamente correta não deve escolher XFL como seu formato nativo apenas sob a premissa de que ele era o formato de projeto nativo do CS4. A melhor solução é criar um formato aberto próprio e deixar XFL como importação/exportação de compatibilidade.

Os recursos avançados que você listou são coerentes com o conjunto de recursos que caracterizou o CS4. Fontes dedicadas ao CS4 cobrem desenho, filtros/blends, novo modelo de animação, inverse kinematics, 3D e fluxo de produção; documentação contemporânea ao lançamento também descreveu o novo tween baseado em objetos e o sistema de bones. citeturn22search18turn22search19 Na linhagem atual do Animate, a distinção entre *motion tween* e *classic tween* continua explícita: motion tween trabalha com um objeto por span e oferece tracks/propriedades temporais, enquanto classic tween segue a lógica tradicional de grupos de frames/keyframes. citeturn9view0 O Motion Editor é, conceitualmente, um editor de curvas de propriedades ao longo do tempo, com keyframes e controles de curva. citeturn9view1

O Bone Tool também merece ser modelado como um subsistema real, e não apenas como “parenting”. O modelo documentado usa armatures, relações parent-child e inverse kinematics, com poses interpoladas em pose layers. citeturn9view2turn9view3 Isso pede um solver IK determinístico, constraints e tracks de pose separados da timeline de transform comum.

Para tablets, o **Pointer Events Level 3** é uma excelente API primária. A recomendação W3C de 2026 unifica mouse, touch e pen e expõe `pressure`, `tangentialPressure`, `tiltX`, `tiltY`, `twist`, `pointerType`, eventos coalescidos e eventos preditos. citeturn11view0 O padrão também define diretamente o barrel button do stylus como `button = 2`, o eraser como `button = 5`, e os respectivos bitmasks em `buttons`. citeturn14view0turn14view2 Portanto, a troca automática para Eraser pode ser implementada de forma padronizada quando o WebView/driver realmente expuser esses valores.

Há, porém, duas limitações que o prompt original tratava como garantias. Primeiro, `pointerrawupdate` e recursos de baixa latência não devem ser presumidos em todos os engines; a própria especificação registra suporte desigual e orienta a usá-lo apenas onde eventos de alta frequência realmente forem necessários. citeturn14view3 Segundo, palm rejection não é inteiramente controlável pela aplicação: sistema operacional e user agent podem descartar touch quando detectam uma caneta, e a especificação observa que a aplicação não controla esse comportamento do sistema. citeturn14view0 A aplicação ainda pode fazer uma segunda camada de rejeição, descartando touches enquanto mantém estado de pen ativo/hover, mas isso precisa ser descrito como **best effort**, não como garantia universal.

Eventos preditos também não devem entrar permanentemente no traço. A especificação os destina a “desenhar à frente” para reduzir latência percebida e depois substituí-los pelos samples reais quando estes chegarem. citeturn14view3 Isso leva naturalmente a duas geometrias durante o desenho: `confirmedStroke` e `predictedTail`.

O uso do Tauri introduz outra consequência arquitetural importante. O Tauri não controla um único engine de browser multiplataforma: ele usa o WebView do sistema — WKWebView no macOS, WebView2 no Windows e WebKitGTK no Linux. citeturn17view0turn17view1 Portanto, suporte a Pointer Events avançado, OffscreenCanvas, WebCodecs e outros recursos precisa ser **detectado em runtime**, e não inferido apenas do fato de o aplicativo usar Tauri.

Para renderização, **WebGL2 como backend principal continua sendo a opção conservadora mais adequada para esta arquitetura**, com Canvas2D como fallback e WebGPU atrás de uma interface experimental. A especificação WebGL2 o define como um contexto de rendering próximo do OpenGL ES 3.0 e permite o uso tanto de `HTMLCanvasElement` quanto de `OffscreenCanvas`. citeturn23view1 O importante é não confundir WebGL2 com um renderer vetorial pronto: paths precisam ser tessellated, armazenados em vertex/index buffers e desenhados pelo engine.

Uma biblioteca interessante para essa fronteira é `lyon`: seu objetivo declarado é transformar paths, incluindo Béziers quadráticas e cúbicas, em triângulos para renderização por APIs de GPU. Ela é disponibilizada sob MIT/Apache-2.0. citeturn16view0 Isso a torna adequada como implementação de tessellation sem contaminar o modelo vetorial propriamente dito. O merge/topology, entretanto, deve continuar sendo código próprio.

Para desenho livre, `perfect-freehand` é MIT, escrito em TypeScript, aceita pressão real e produz o outline poligonal de um stroke; é uma ótima referência comportamental, embora o requisito clean-room sugira não copiar seu algoritmo literalmente. citeturn16view1 Excalidraw também é MIT e oferece bons pontos de comparação para canvas, zoom/pan e undo/redo. citeturn17view3 Por outro lado, Krita e Synfig são GPL-3.0, portanto são excelentes referências de comportamento e UX, mas não devem fornecer código incorporado a um produto que queira manter somente uma base permissiva. citeturn18view0turn18view1

A estabilização solicitada por você pode realmente usar a família de algoritmos de Philip J. Schneider: o trabalho de 1990 descreve fitting automático de curvas digitalizadas. citeturn21search3 O detalhe importante é que o resultado clássico do fitting é em segmentos cúbicos, enquanto o modelo histórico SWF trabalha com curvas quadráticas. Consequentemente, o engine deve ou permitir cúbicas internamente como extensão moderna ou fazer uma conversão cúbica→quadráticas dentro de uma tolerância conhecida antes de inserir o resultado no grafo Flash-like.

Finalmente, os atalhos merecem uma política de pesquisa mais rígida. Uma folha histórica secundária do CS4 registra, por exemplo, `V` Selection, `A` Subselection, `L` Lasso, `Q` Free Transform, `F` Fill Transform, `G` 3D Translation, `W` 3D Rotation, `P` Pen, `N` Line, `O` Oval, `R` Rectangle, `Y` Pencil, `B` Brush/Spray Brush, `U` Deco, `X` Bone, `Z` Bind, `K` Paint Bucket, `S` Ink Bottle, `I` Eyedropper, `E` Eraser e `H` Hand. citeturn22search0 Como essa fonte não é o manual oficial, o prompt abaixo não manda simplesmente copiar essa tabela: transforma o inventário de atalhos em um **gate da Phase 0**, exigindo confirmação por documentação histórica antes que a compatibilidade seja declarada.

## Arquitetura recomendada

A arquitetura que melhor concilia fidelidade ao CS4, performance moderna e tablets é uma separação rígida entre **modelo de documento**, **geometria vetorial**, **renderer**, **input**, **timeline** e **UI**. O renderer jamais deve ser a fonte da verdade, e elementos DOM/SVG não devem ser usados como modelo persistente.

| Decisão | Recomendação | Motivo |
|---|---|---|
| Modelo vetorial | Grafo planar edge/half-edge com faces | Reproduz melhor merge drawing, divisão em interseções e fills em ambos os lados das edges, coerente com a representação histórica edge-based. citeturn8view0turn4view3 |
| Curvas persistidas | `LineSegment` + `QuadraticBezier`; cúbicas opcionais apenas na camada moderna | SWF representa curved edges quadraticamente. citeturn4view3 |
| Object Drawing | `DrawingObject` contendo grafo local próprio | Preserva isolamento entre formas e impede merge automático. citeturn8view0 |
| Merge Drawing | Grafo compartilhado por keyframe/camada | Permite splitting, face reconstruction e edição independente de stroke/fill. citeturn8view0 |
| Backend gráfico | WebGL2 principal | Oferece API de GPU adequada a buffers tessellated e pode operar com canvas/offscreen canvas. citeturn23view1 |
| Fallback | Canvas2D | Caminho funcional para context-loss, hardware limitado ou incompatibilidades |
| WebGPU | Backend opcional posterior | Não deve ser requisito da arquitetura central enquanto o aplicativo depender de WebViews de engines distintos via Tauri. citeturn17view0 |
| Tessellation | Interface própria + `lyon` como implementação inicialmente permitida | Lyon transforma paths em triangles e possui licença MIT/Apache-2.0. citeturn16view0 |
| Tablet | Pointer Events primeiro; bridges nativas opcionais | Pointer Events fornece propriedades padronizadas de pen; bridges resolvem casos onde um WebView/driver não as entrega. citeturn11view0turn14view0 |
| Low latency | confirmed samples + speculative predicted tail | Corresponde ao modelo previsto por `getPredictedEvents()`. citeturn14view3 |
| Formato nativo | Pacote aberto próprio, versionado e determinístico | Evita vincular o modelo interno ao XFL/SWF e facilita source control |
| XFL | Import/export posterior | XFL pertence principalmente à geração CS5+, apesar de já existir como intercâmbio no ecossistema CS4. citeturn20search10turn20search24 |
| SWF | Import/export experimental, baseado na especificação publicada | O formato possui estruturas formais de shapes/edges/styles que podem ser mapeadas para o engine. citeturn4view1turn4view3 |
| Undo | Command + transaction journal | Mantém alterações do documento determinísticas e permite coalescing de drag/stroke |
| UI | DOM para chrome/painéis; canvas/GPU para Stage e timeline densa | Evita enviar pointermove de alta frequência através de uma árvore UI reativa |
| Timeline | Modelo próprio com spans, keyframes e property tracks | Necessário para classic tween, motion tween e Motion Editor. citeturn9view0turn9view1 |
| IK | Armature + constraints + pose tracks + solver próprio | É substancialmente mais complexo que simples hierarquia de transforms. citeturn9view2turn9view3 |

O ponto mais importante de performance é separar o **hot path da caneta** do framework de UI. Um `pointerrawupdate` ou `pointermove` não deve provocar atualização global de React/Solid/Vue, recalcular layout de painéis ou serializar o documento inteiro. Os samples devem entrar diretamente no pipeline de ink, atualizar apenas o preview GPU e só produzir uma operação persistente quando necessário. Essa recomendação é especialmente importante porque a própria especificação alerta que listeners de `pointerrawupdate` podem prejudicar performance se a aplicação não processá-los rapidamente. citeturn14view3

A meta de “60 fps mínimo / 120 fps” também deve ser transformada de promessa absoluta em **benchmark verificável em máquinas de referência**. A aplicação não controla GPU, driver, refresh rate ou WebView do usuário. Em vez de afirmar que qualquer hardware rodará a 120 fps, o projeto deve impor budgets: 16,67 ms por frame em 60 Hz e 8,33 ms em 120 Hz, registrar p50/p95/p99 e possuir cenas-padrão reproduzíveis.

## Principais riscos de implementação

O maior risco técnico é o **Merge Drawing**. Boolean operations convencionais entre polygons não bastam. Uma réplica convincente precisa dividir curvas exatamente nos pontos de interseção, reconstruir faces, preservar quais edges são strokes, manter referências de fill dos dois lados e responder corretamente a seleção/remoção parcial. A documentação de drawing behavior e a especificação SWF deixam claro por que um modelo de “um SVG path = uma shape” seria insuficiente. citeturn8view0turn4view3

O segundo é a **fragmentação de tablet/WebView**. Tauri entrega WebView2, WKWebView e WebKitGTK dependendo do sistema. citeturn17view0 Ao mesmo tempo, Pointer Events padroniza recursos avançados mas não exige que todos os dispositivos disponibilizem todos os sensores, e `pointerrawupdate`/predictions não devem ser tratados como universalmente disponíveis. citeturn11view0turn14view3 Por isso o projeto precisa de feature detection, telemetria local de capabilities e backend nativo opcional, em vez de centenas de condicionais por marca de tablet.

O terceiro é confundir **predição com dados reais**. Predicted points são especulativos e precisam desaparecer quando chegam samples confirmados. citeturn14view3 Persistir predictions resultaria em strokes diferentes conforme a velocidade de CPU/browser, prejudicando determinismo, undo e colaboração futura.

Outro risco é licenciamento. Krita e Synfig são referências úteis, porém GPL-3.0. citeturn18view0turn18view1 O projeto deve usar uma política clean-room mesmo para software permissivo: estudar comportamentos e documentação, mas implementar os subsistemas centrais independentemente. Dependências reais devem passar por auditoria automática de license/SPDX.

Há também um risco específico em **MP4/H.264/AAC**. “A biblioteca é open source” e “o codec pode ser distribuído sem outras considerações” são problemas distintos. Portanto, o encoder deve ficar atrás de uma abstração e preferir encoders do sistema operacional quando disponíveis; o projeto não deve simplesmente incorporar FFmpeg e violar a própria regra de “somente MIT/Apache/BSD”.

Finalmente, é importante separar “fidelidade funcional” de “cópia visual”. O objetivo abaixo é uma **reimplementação clean-room de comportamento e workflow**, usando ícones, assets, branding, sons e artwork originais. A interface pode ter o mesmo modelo mental — Tools à esquerda, Stage central, Timeline, Properties, Library etc. — sem copiar bitmaps ou recursos proprietários.

## Prompt mestre completo

O texto abaixo já incorpora as correções da pesquisa e pode ser entregue diretamente a um agente de programação autônomo.

```text
ROLE

Você é o principal arquiteto de software, engenheiro de gráficos 2D, engenheiro de ferramentas de animação e especialista em entrada por stylus de um projeto desktop profissional.

Você possui experiência avançada em:

- editores vetoriais;
- animação 2D baseada em timeline;
- curvas Bézier e geometria computacional;
- grafos planares, half-edge/DCEL e operações booleanas;
- tessellation de fills e strokes para GPU;
- WebGL2;
- Canvas2D;
- Web Workers e OffscreenCanvas;
- Pointer Events;
- Windows Ink, WM_POINTER e WinTab;
- input de Wacom, Huion, XP-Pen e Surface Pen;
- aplicações Tauri/Rust;
- interfaces dockable;
- editores não destrutivos;
- sistemas de undo/redo;
- serialização de documentos;
- exportação de gráficos e vídeo;
- profiling de aplicações gráficas;
- testes determinísticos de editores interativos.

Sua responsabilidade não é construir um "mockup parecido".
Sua responsabilidade é construir um editor de animação vetorial de nível profissional, funcional, testável e extensível.

NOME DO PRODUTO

Use sempre:

[PRODUCT NAME]

como placeholder.

Não use "Adobe", "Flash", "Flash Professional", "CS4" ou marcas similares como nome do produto.

É permitido mencionar o software histórico apenas dentro de documentos de pesquisa e matrizes de compatibilidade.

MISSÃO

Criar, do zero, uma recriação clean-room do workflow de um editor vetorial de animação profissional da geração 2008, tendo o Flash Professional CS4 como referência comportamental principal.

O programa deve reproduzir, com a maior fidelidade prática possível:

- organização geral do workspace;
- Stage;
- Timeline;
- Tools;
- Properties;
- Library;
- Color;
- Swatches;
- Align;
- Transform;
- History;
- Info;
- filtros;
- símbolos;
- cenas;
- layers;
- frames;
- keyframes;
- desenho vetorial;
- Merge Drawing;
- Object Drawing;
- classic tween;
- object-based motion tween;
- Motion Editor;
- shape tween;
- shape hints;
- motion guides;
- masks;
- onion skin;
- inverse kinematics;
- 3D translation;
- 3D rotation;
- Deco-like procedural drawing;
- Spray Brush;
- texto;
- publishing/export;
- keyboard-driven workflow.

Ao mesmo tempo, modernize deliberadamente:

- fluidez;
- responsividade;
- escalabilidade em DPI;
- entrada por stylus;
- pressão;
- tilt;
- twist;
- eraser;
- touch;
- gestures;
- acessibilidade;
- temas;
- multithreading;
- GPU rendering;
- undo;
- crash recovery;
- formato de documento;
- testes;
- observabilidade de performance.

DEFINIÇÃO DE "REPLICA"

"Replica" significa compatibilidade de conceitos, workflow e comportamento observável.

Não significa:

- copiar código;
- copiar arquivos;
- copiar ícones;
- copiar bitmaps;
- extrair recursos de software proprietário;
- copiar fontes;
- copiar sons;
- copiar splash screens;
- copiar strings proprietárias desnecessariamente;
- descompilar executáveis;
- incorporar bibliotecas proprietárias.

Toda implementação deverá ser original.

Toda iconografia deverá ser original.

Toda arte deverá ser original.

O tema "Classic" poderá reproduzir densidade, disposição geral, tons e modelo mental da interface histórica, mas deve usar artwork próprio.

REGRA CLEAN-ROOM

Considere software histórico e projetos open source apenas referências comportamentais e arquiteturais.

Não copie implementações.

Não traduza código GPL para outra linguagem linha a linha.

Não reescreva código externo alterando apenas nomes.

Para algoritmos publicados academicamente, implemente a partir da descrição matemática/documentação e registre a referência.

Crie:

docs/clean-room-policy.md

documentando esta regra.

STACK OBRIGATÓRIA

Frontend:
- TypeScript;
- HTML/CSS;
- framework de UI leve apenas para chrome/panels;
- Stage fora do hot path de rerender do framework.

Desktop:
- Tauri 2.x estável;
- Rust para bridges nativas e operações adequadas ao backend.

Renderização:
- WebGL2 = backend primário;
- Canvas2D = fallback;
- WebGPU = backend experimental opcional atrás de interface, nunca requisito do MVP.

Input:
- Pointer Events = backend primário;
- bridge nativa somente quando necessária para recuperar funcionalidade perdida pelo WebView/driver.

Threads:
- main/UI thread;
- geometry worker;
- export worker;
- thumbnail worker;
- optional render worker quando OffscreenCanvas for realmente suportado;
- Tauri/Rust async para filesystem e integrações nativas.

SISTEMAS ALVO

Obrigatório:
- Windows 11;
- Windows 10 suportado se a toolchain permitir;
- macOS atual suportado pela versão escolhida do Tauri;
- Linux desktop moderno suportado pelo Tauri/WebKitGTK.

Arquitetura:
x86_64 e arm64 onde a toolchain permitir.

IMPORTANTE SOBRE WEBVIEWS

Nunca presuma que todos os recursos web existem apenas porque funcionam no Chromium usado durante desenvolvimento.

Crie:

src/platform/capabilities.ts

Ele deve detectar, no startup:

- WebGL2;
- Canvas2D;
- OffscreenCanvas;
- transferControlToOffscreen;
- PointerEvent;
- pointerrawupdate;
- getCoalescedEvents;
- getPredictedEvents;
- pressure;
- tiltX;
- tiltY;
- twist;
- tangentialPressure;
- WebCodecs;
- SharedArrayBuffer;
- hardwareConcurrency;
- devicePixelRatio;
- prefers-reduced-motion;
- maxTextureSize;
- GPU/context limits necessários.

A aplicação deve degradar funcionalidade explicitamente.

Nunca silenciosamente.

ARTEFATOS DE DOCUMENTAÇÃO OBRIGATÓRIOS

Antes de implementar cada subsistema relevante, mantenha:

docs/
  assumptions.md
  architecture.md
  clean-room-policy.md
  research.md
  feature-matrix.md
  historical-shortcuts.md
  vector-model.md
  timeline-model.md
  tablet-input.md
  rendering.md
  file-format.md
  licensing.md
  performance.md
  testing.md
  export.md
  compatibility.md
  known-limitations.md

adr/
  ADR-*.md

Toda decisão arquitetural significativa deve gerar ADR.

PHASE ZERO — DEEP RESEARCH

NÃO ESCREVA FEATURES DE PRODUÇÃO antes de concluir esta fase.

Pode criar apenas:

- workspace;
- CI;
- lint;
- test harness;
- benchmark harness;
- pequenos prototypes descartáveis.

Crie docs/research.md.

Para cada descoberta registre:

- comportamento observado;
- fonte;
- confiança;
- impacto arquitetural;
- como será testado;
- diferença entre comportamento histórico e extensão moderna.

CLASSIFICAÇÃO DE FONTES

Classifique cada informação como:

A — especificação/documentação primária;
B — livro/documentação histórica confiável;
C — fonte secundária;
D — comportamento experimental não documentado.

Nunca declare fidelidade baseada somente em fonte C/D quando for possível obter fonte A/B.

INVENTÁRIO HISTÓRICO

Produza feature-matrix.md com no mínimo as colunas:

Feature
Category
Historical behavior
Reference
Confidence
Required parity
Modern extension
Milestone
Implementation status
Automated test
Manual test
Known deviations

Pesquise em profundidade:

WORKSPACE

- Application frame;
- menu bar;
- document tabs;
- Stage;
- pasteboard;
- Tools panel;
- Properties;
- Library;
- Timeline;
- Color;
- Swatches;
- Align;
- Transform;
- Info;
- History;
- Actions;
- Motion Editor;
- Components quando pertinente;
- Output quando pertinente;
- Scene management;
- workspace presets;
- docking;
- panel groups;
- collapsing;
- floating panels;
- resizing;
- keyboard focus behavior.

MENUS

Inventarie os menus completos da versão de referência:

- File;
- Edit;
- View;
- Insert;
- Modify;
- Text;
- Commands;
- Control;
- Debug;
- Window;
- Help;

e qualquer variação relevante por plataforma/documento.

Não invente comandos ausentes.

SHORTCUTS

Crie docs/historical-shortcuts.md.

Para cada shortcut registre:

Command
Windows
macOS
Context
Source
Source confidence
Implemented
Conflict with OS
User remappable

Separe:

VERIFIED
PROVISIONAL
UNKNOWN

Nenhum shortcut baseado apenas em memória deverá ser marcado VERIFIED.

Forneça compatibilidade histórica como preset:

"Classic"

Permita também:

"Modern"
"Custom"

TOOLS

Pesquise e documente pelo menos:

Selection;
Subselection;
Free Transform;
Gradient/Fill Transform;
3D Rotation;
3D Translation;
Lasso;
Pen;
Add Anchor Point;
Delete Anchor Point;
Convert Anchor Point;
Text;
Line;
Rectangle;
Rectangle Primitive;
Oval;
Oval Primitive;
PolyStar;
Pencil;
Brush;
Spray Brush;
Deco;
Bone;
Bind;
Paint Bucket;
Ink Bottle;
Eyedropper;
Eraser;
Hand;
Zoom.

Pesquise também opções contextuais de cada tool.

Não trate "tool existe" como paridade completa.

Para cada tool documente:

- mouse behavior;
- pen behavior;
- modifier keys;
- snapping;
- cursor;
- Properties interaction;
- Tool Options;
- selection semantics;
- double-click behavior;
- drag threshold;
- editing mode;
- undo unit.

MODELO VETORIAL — REQUISITO CRÍTICO

Não use SVG DOM como modelo canônico.

Não modele o documento como uma simples lista de SVG paths.

Implemente um modelo geométrico próprio.

A representação canônica de shapes estilo clássico deve ser edge-based.

Tipos básicos:

Point
Vector
Bounds
Transform2D

Vertex
Edge
HalfEdge ou representação equivalente
Face
Contour
ShapeGraph

Segment:
- Line;
- QuadraticBezier.

Extensões modernas podem usar:
- CubicBezier;
mas deverão possuir conversão determinística para quadratic segments quando necessário para compatibilidade.

Cada edge deve ser capaz de representar:

- geometry;
- stroke style;
- fill on side A;
- fill on side B;
- selection state via IDs externos;
- ownership;
- winding/topology metadata.

Não amarre seleção ao vertex buffer do renderer.

IDs de documento devem ser estáveis.

MERGE DRAWING

Implemente Merge Drawing de verdade.

Modelo recomendado:

LayerFrameGeometry
  -> shared planar ShapeGraph

Ao inserir geometria:

1. encontre interseções edge-edge;
2. encontre line-curve;
3. curve-line;
4. quadratic-quadratic;
5. split edges exatamente nos parâmetros encontrados;
6. reconstrua loops;
7. classifique faces;
8. aplique regras de fill;
9. preserve strokes relevantes;
10. remova regiões substituídas quando o comportamento histórico exigir;
11. normalize edges colineares compatíveis;
12. atualize índices espaciais;
13. invalidate apenas os meshes afetados.

Casos obrigatórios de teste:

- rectangle crossing rectangle;
- oval crossing rectangle;
- line crossing fill;
- two strokes intersecting;
- same-color fills;
- different-color fills;
- filled shape over filled shape;
- erasing inside a fill;
- deleting only stroke;
- deleting only fill;
- partial selection;
- Paint Bucket filling closed region;
- Paint Bucket with a gap;
- Ink Bottle on fill boundary;
- self-intersections;
- tangent intersections;
- curve endpoints touching;
- nested contours;
- holes.

Adote tolerâncias geométricas explícitas.

Nunca espalhe "0.001" magic constants pelo código.

Crie GeometryTolerance.

OBJECT DRAWING

Object Drawing NÃO deverá participar do shared graph de outras shapes.

Modelo:

DrawingObject {
  id
  transform
  geometry: ShapeGraph
  metadata
}

Ao selecionar um DrawingObject:

- stroke e fill pertencem ao mesmo drawing object;
- interseções visuais com outro DrawingObject não modificam a geometria;
- transformação afeta o objeto;
- enter/edit mode abre edição interna.

Implemente conversões:

Break Apart / equivalent:
DrawingObject -> merge geometry

Group:
elements -> Group

Ungroup:
Group -> elements

GEOMETRY KERNEL

Crie packages/geometry.

Submódulos:

math/
bezier/
intersections/
topology/
boolean/
hit-test/
snapping/
stroke/
flatten/
fit/
simplify/
spatial-index/
tessellation-adapter/

Todos os algoritmos devem ser:

- determinísticos;
- unit-tested;
- independentes da UI;
- independentes de WebGL.

QUADRATIC BEZIERS

Implemente:

- evaluation;
- first derivative;
- second derivative;
- subdivision por De Casteljau;
- extrema;
- exact bounds;
- closest point;
- flatness;
- adaptive flattening;
- line/quad intersections;
- quad/quad intersections;
- splitting;
- reverse;
- winding contribution;
- hit-testing.

STROKES

StrokeStyle deve suportar:

- width;
- color;
- alpha;
- cap;
- join;
- miter;
- scale mode;
- pixel hinting quando aplicável;
- dash como extensão moderna opcional.

Não derive stroke rendering de CSS.

O renderer deve controlar a geometria.

FILLS

Suporte:

- solid;
- linear gradient;
- radial gradient;
- bitmap fill;
- alpha;
- transforms próprios do fill.

Implemente Gradient Transform separadamente do object transform.

HIT TESTING

Crie hit-testing em coordenadas de Stage.

Use:

- broad phase spatial index;
- narrow phase matemática.

Tipos:

- vertex;
- control point;
- edge;
- stroke;
- fill;
- transform handle;
- bounding box;
- symbol;
- text;
- bone;
- motion path.

Hit radius deve ser adaptado a:

- zoom;
- pointerType;
- touch-friendly mode.

PENCIL

Modos clássicos:

- Straighten;
- Smooth;
- Ink.

Pesquise comportamento real.

Não implemente os três como simplesmente presets cosméticos do mesmo smoothing.

BRUSH

Crie dois conceitos:

Classic Vector Brush
Modern Pressure Brush

Classic Vector Brush:
- produz geometria compatível com o modelo clássico.

Modern Pressure Brush:
- pressure;
- tilt;
- opacity;
- flow;
- stabilization;
- configurable curves.

Permita ao usuário escolher:

Bake pressure stroke to vector outline

ou

Keep editable pressure stroke

EDITABLE INK STROKE

Modelo sugerido:

InkStroke {
  id
  centerlineSamples
  fittedSegments
  widthProfile
  opacityProfile
  angleProfile
  brushPresetId
  seed
  baked
}

Samples confirmados podem armazenar:

x
y
time
pressure
tiltX
tiltY
twist
tangentialPressure

Não armazene predicted samples.

FREEHAND STABILIZATION

Implemente estágios configuráveis:

raw samples
-> coalesced sample expansion
-> calibration
-> resampling
-> optional moving stabilizer
-> corner preservation
-> Schneider-style curve fitting
-> curve simplification
-> optional cubic-to-quadratic conversion
-> committed vector geometry

O usuário deverá controlar:

Stabilization:
0–100%

Smoothing:
0–100%

Corner preservation:
0–100%

Pressure smoothing:
0–100%

FITTING

Implemente o algoritmo de fitting a partir da literatura, não copiando código de terceiros.

Tenha:

fitCurve(points, tolerance)

O output poderá inicialmente ser cubic Beziers.

Para modo clássico, implemente:

approximateCubicWithQuadratics(cubic, tolerance)

com subdivisão adaptativa.

Adicione property tests:

- erro máximo <= tolerance;
- endpoints preservados;
- nenhum NaN;
- nenhuma loop acidental para input monotônico simples;
- comportamento estável em milhares de samples.

RENDERER

Crie abstraction:

Renderer {
  initialize()
  resize()
  beginFrame()
  renderDocument()
  renderOverlay()
  renderSelection()
  renderGuides()
  renderOnionSkin()
  renderInkPreview()
  endFrame()
  dispose()
}

Implementações:

WebGL2Renderer
Canvas2DRenderer

Opcional:
WebGPURenderer

WEBGL2 PIPELINE

Separar:

scene traversal;
visibility;
LOD;
tessellation;
mesh cache;
GPU upload;
draw batching;
selection overlay.

Nunca retessellar o documento inteiro porque o cursor se moveu.

MeshCache key deve considerar:

geometry revision
style revision
LOD bucket

Use partial invalidation.

PATH TESSELLATION

Uma dependency de tessellation permissiva pode ser usada.

Inicialmente avalie lyon.

Mesmo utilizando uma biblioteca:

- topology pertence ao nosso engine;
- merge drawing pertence ao nosso engine;
- hit testing pertence ao nosso engine;
- document representation pertence ao nosso engine.

Tessellator só recebe paths e devolve triangles.

ANTI-ALIASING

Pesquise e compare:

- MSAA;
- analytic edge AA;
- fringe geometry;
- supersampling seletivo.

Escolha por benchmark.

Não use simplesmente uma textura enorme do Stage.

LEVEL OF DETAIL

Crie LOD de paths baseado no erro em screen pixels.

Exemplo conceitual:

zoom distante:
  menos subdivisions

zoom normal:
  precisão padrão

zoom extremo:
  mais subdivisions

LOD nunca pode alterar o documento.

Somente o mesh renderizado.

STAGE CAMERA

Camera2D:

translation
zoom
rotation
mirrorX
mirrorY
devicePixelRatio

Implementar:

- cursor-anchored zoom;
- Space + drag pan;
- middle-button pan;
- trackpad pan;
- pinch zoom;
- two-finger pan;
- canvas rotation;
- reset rotation;
- mirror horizontal;
- mirror vertical;
- fit Stage;
- 100%;
- center Stage.

Ao fazer zoom no ponto P sob o cursor:

screenToWorld(P) deve permanecer aproximadamente constante após o zoom.

Crie teste matemático para isso.

GRID / GUIDES / RULERS

Implementar:

- horizontal ruler;
- vertical ruler;
- draggable guides;
- guide lock;
- clear guides;
- grid;
- grid size;
- snap to grid;
- snap to guides;
- snap to objects;
- snap to pixels quando aplicável;
- smart snapping como extensão moderna opcional.

TABLET INPUT — ARQUITETURA

Crie interface:

PenInputBackend

Implementações:

WebPointerBackend

e somente se necessário:

WindowsNativePenBackend
WinTabBackend

Futuro:
MacNativeTabletBackend
LinuxNativeTabletBackend

O default é WebPointerBackend.

Não ative backend nativo simplesmente por preferência do desenvolvedor.

Ele existe para cobrir lacunas observadas em hardware real.

POINTER EVENT NORMALIZATION

Normalize para:

PenSample {
  pointerId
  pointerType
  x
  y
  stageX
  stageY
  timestamp
  pressure
  tangentialPressure
  tiltX
  tiltY
  altitude
  azimuth
  twist
  width
  height
  buttons
  button
  isPrimary
  predicted
  coalesced
}

Nunca suponha suporte real só porque a propriedade existe.

Crie capability flags.

PRESSURE

Pressure deve poder controlar independentemente:

- size;
- opacity;
- flow.

Cada propriedade deve possuir:

enabled;
min;
max;
response curve.

PRESSURE CURVE EDITOR

Crie editor visual.

Representação inicial:

monotonic cubic curve
ou
piecewise curve

Presets:

Linear
Soft
Firm
S-Curve
Custom

Permita:

- dead zone inferior;
- max clamp;
- invert somente onde fizer sentido;
- reset.

A saída deve ser determinística.

TILT

Tilt deverá controlar opcionalmente:

- nib angle;
- nib aspect ratio;
- stroke direction influence;
- shading/opacity como extensão.

Calcule orientation de forma estável.

Evite jumps na passagem ±180°.

TWIST

Quando disponível:

- suporte brush rotation;
- fallback para nib angle quando indisponível.

ERASER END

Quando Pointer Events reportar eraser:

- mude temporariamente para Eraser;
- preserve a tool anterior;
- ao voltar à ponta normal, restaure a tool;
- não altere permanentemente a tool selecionada sem necessidade.

Crie testes para:

button transition
buttons bitmask
pointerdown
pointermove
pointerup

BARREL BUTTONS

Painel de configuração:

Barrel Button 1
Barrel Button 2 quando backend permitir

Actions possíveis:

Pan
Temporary Eraser
Eyedropper
Right Click
Lasso
Brush Size HUD
Rotate Canvas
None

POINTER CAPTURE

Durante strokes:

use pointer capture quando aplicável.

Trate:

pointercancel;
lostpointercapture;
window blur;
device disconnect.

Nenhuma dessas situações deve deixar a aplicação presa no estado "drawing".

COALESCED EVENTS

Ao receber evento:

samples =
  event.getCoalescedEvents?.()
  ?? [event]

Ordene por timestamp quando necessário.

Evite sample duplicado.

PREDICTED EVENTS

Predictions são visuais.

Nunca entram no documento final.

Mantenha:

confirmedGeometry
predictedTail

Quando samples reais chegarem:

discard predictedTail
rebuild apenas speculative tail
append confirmed samples

Nunca faça undo/redo de predicted points.

POINTERRAWUPDATE

Feature detect.

Quando disponível e benchmarkado como benéfico:

use para stroke ingestion.

Quando indisponível:

pointermove + coalesced events.

Não tenha dois pipelines duplicando samples simultaneamente.

PALM REJECTION

Implemente duas camadas:

Platform palm rejection
+
Application heuristic

Estado:

penPresenceState:
  absent
  hover
  contact

Quando houver pen hover/contact confiável:

- ignore touch destinado a drawing;
- permita gestos touch somente conforme configuração;
- introduza cooldown curto e configurável após pen contact se necessário.

Nunca prometa que software pode controlar rejeição implementada pelo OS.

Modo:

Pen Only
Pen + Touch Gestures
Mouse + Pen + Touch

TWO-FINGER GESTURES

Quando não conflitarem com palm rejection:

- pinch zoom;
- pan;
- optional rotate canvas.

Não permita que um segundo dedo altere o stroke da caneta.

HOVER PREVIEW

Quando pen hover for reportado:

renderize:

- real brush diameter;
- nib shape;
- angle;
- optional pressure indicator.

O preview deve ocorrer em GPU overlay e não modificar documento.

CALIBRATION PANEL

Crie painel Tablet.

Mostrar em tempo real:

Device/backend
pointerType
pressure
tiltX
tiltY
twist
tangential pressure
buttons
sample rate
coalesced count
predicted count
input latency estimate

Área de teste:

- pressure ramp;
- circles;
- diagonal strokes;
- fast zig-zag;
- slow curves;
- hover;
- eraser;
- barrel buttons.

Permita salvar profile local.

Não faça fingerprinting remoto.

DEVICE TEST MATRIX

Valide fisicamente, quando hardware estiver disponível:

Wacom:
- Intuos;
- Cintiq.

Huion:
- pelo menos um pen display ou pen tablet.

XP-Pen:
- pelo menos um dispositivo.

Microsoft:
- Surface Pen.

Fallback:
- mouse;
- touchpad;
- touch display.

Por dispositivo registrar:

OS
driver version
backend
pressure
tilt
hover
eraser
barrel
coalesced
predicted
issues
workaround

Nunca marque "supported" apenas através de simulated events.

Simulação automatizada é adicional ao teste físico.

WINDOWS INPUT

Primeiro valide Pointer Events através do WebView2.

Somente se testes mostrarem perda importante de:

pressure;
tilt;
eraser;
buttons;
sample frequency;

implemente bridge nativa.

WindowsNativePenBackend deve isolar detalhes de Windows.

WinTabBackend deverá ser opt-in/fallback e não espalhar APIs WinTab pelo core.

UI E WORKSPACE

Objetivo:

mesmo modelo mental da interface histórica,
mas reconstruído com layout responsivo e animation moderna.

Estrutura inicial:

+-------------------------------------------------------+
| Menu | Document tabs | Workspace                      |
+----+------------------------------------------+--------+
|    |                                          |        |
| T  |                  STAGE                   | PANEL  |
| O  |                                          | STACK  |
| O  |                                          |        |
| L  |                                          |        |
| S  |                                          |        |
+----+------------------------------------------+--------+
|                 TIMELINE                              |
+-------------------------------------------------------+
| status / zoom / frame / performance optional         |
+-------------------------------------------------------+

TOOLS PANEL

Layouts:

1 column
2 columns

Compact mode.

Stylus-friendly mode.

PAINEL SYSTEM

Panels devem:

dock left;
dock right;
dock bottom;
dock top onde permitido;
tab into panel group;
float;
resize;
collapse;
close;
restore;
persist layout.

Crie DockLayout model independente do DOM.

Workspace presets:

Essentials
Animator
Designer

Custom workspaces:
- save;
- rename;
- delete;
- reset.

THEMES

Classic:
- inspirado na densidade e organização do período;
- artwork original;
- iconografia original.

Modern Dark:
- moderno;
- maior contraste;
- polished.

Também suporte:

prefers-reduced-motion.

ANIMATIONS DE UI

Podem animar:

panel docking;
collapse;
workspace change;
menus;
tool transitions.

Nunca anime ações que aumentem input latency durante drawing.

Use preferencialmente:

transform;
opacity.

Não provoque layout thrashing.

ACCESSIBILITY

Keyboard navigable onde apropriado.

ARIA para UI DOM.

Visible focus.

Adjustable UI scale:

80%
90%
100%
110%
125%
150%

Stylus-friendly mode aumenta hit targets.

Não aumente Stage coordinates por causa de UI scaling.

TIMELINE — MODELO

Não represente 500 frames × 50 layers como 25.000 DOM nodes permanentes se puder virtualizar.

Crie:

Timeline
Scene
Layer
FrameSpan
Keyframe
Element
TweenSpan
PropertyTrack

Layer kinds:

Normal
Guide
Guided
Mask
Masked
Folder
Armature/Pose quando necessário

FRAME SEMANTICS

Suporte:

empty frame;
regular held frame;
keyframe;
blank keyframe;
frame span;
labels;
comments quando pesquisados;
actions/event metadata;
sound metadata futuramente.

Operações:

Insert Frame
Remove Frames
Insert Keyframe
Insert Blank Keyframe
Clear Keyframe
Convert to Keyframes quando aplicável
Copy Frames
Cut Frames
Paste Frames
Reverse Frames quando historicamente aplicável

Pesquise semântica exata antes de implementar nomes definitivos.

PLAYHEAD

Scrub contínuo.

Click frame.

Drag playhead.

Keyboard step.

Playback.

Loop.

Frame-rate selectable.

Display:

frame number;
time opcional.

PLAYBACK CLOCK

Não use simplesmente setInterval(1000/fps).

Crie clock baseado em monotonic high-resolution time.

Acumule delta.

Suporte:

12
15
23.976 quando export exigir
24
25
29.97 quando export exigir
30
50
60
custom

O documento clássico pode usar frame-rate racional internamente:

FrameRate {
 numerator
 denominator
}

ONION SKIN

Suporte:

previous frames;
next frames;
range handles;
configurable count;
configurable opacity;
optional tint;
outlines-only quando implementado.

Renderer deve cachear onion meshes.

Não retesselle todos os neighbors em todo cursor movement.

SCENES

Document:
  scenes[]

Cada Scene:
  timeline
  name

Scene order deve ser editável.

Símbolos não dependem de Scene.

SYMBOLS

Tipos obrigatórios:

MovieClip
Graphic
Button

SymbolDefinition:
  id
  type
  name
  timeline
  registrationPoint
  metadata

SymbolInstance:
  definitionId
  transform
  colorEffect
  blendMode
  filters
  instanceName
  playbackSettings
  overrides

NESTED TIMELINES

MovieClip:
- timeline independente.

Graphic:
- sincronização vinculada à timeline pai conforme comportamento estudado;
- modes como loop/play once/single frame se confirmados na pesquisa.

Button:
- states correspondentes ao comportamento histórico;
- pesquisar timeline/states exatos e documentar.

LIBRARY

Suporte:

folders;
symbols;
bitmaps;
audio futuramente;
rename;
duplicate;
delete;
unused asset detection;
search;
sort;
preview;
drag to Stage;
symbol properties.

Não use nome de arquivo como ID interno.

EDIT IN PLACE

Double-click symbol instance:

enter nested editing context.

Mostrar breadcrumb:

Scene > Symbol A > Symbol B

Stage deve manter contexto externo visual conforme opção.

Escape/back retorna nível.

Undo continua pertencendo ao documento global.

TRANSFORMS

2D:

x
y
scaleX
scaleY
rotation
skew
pivot/registration

Mantenha matrix representation robusta.

Evite decompor/recompor matrix repetidamente quando isso acumular erro.

TRANSFORM TOOL

Handles:

scale corners;
scale sides;
rotation;
skew;
pivot;
distort quando pertinente e pesquisado.

Modifier keys:
pesquisar comportamento clássico.

COLOR EFFECTS

Implementar conforme pesquisa:

None
Brightness
Tint
Alpha
Advanced

internamente como transformação de cor consistente.

BLEND MODES

Pesquise conjunto histórico.

Renderer deve tratar com batching/FBO onde necessário.

FILTERS

Milestone apropriado:

Blur
Glow
Drop Shadow
Bevel
Gradient Glow/Bevel quando fizerem parte do target
Color Adjust quando aplicável

Nunca implementar filter apenas em CSS no Stage.

O renderer/export devem produzir o mesmo resultado.

TWEEN SYSTEM

Crie interface:

TweenEvaluator

Implementações:

ClassicTweenEvaluator
MotionTweenEvaluator
ShapeTweenEvaluator
ArmatureTweenEvaluator

CLASSIC TWEEN

Pesquise comportamento histórico de:

position;
scale;
rotation;
skew;
color;
filters;
ease;
orient to path quando aplicável;
snap;
sync.

Validação:

aceite apenas elementos/tipos compatíveis.

Quando inválido:
mostre diagnóstico explícito.

MOTION TWEEN

Modele como object-based span.

MotionTweenSpan {
  startFrame
  duration
  targetElementId
  tracks
  motionPath
  easing
}

PropertyTrack<T> {
  keyframes[]
}

Keyframe:
  frame/time
  value
  interpolation
  ease reference
  tangent data quando necessário
}

Tracks:

x
y
z
scaleX
scaleY
rotationZ
rotationX
rotationY
skew
alpha
color effects
filters onde aplicável

MOTION EDITOR

Implementar editor gráfico real.

Não fazer um painel que apenas mostra números.

Precisa:

property list;
timeline horizontal;
curves;
property keyframes;
add/delete key;
drag;
box select;
zoom;
pan;
value axis;
time axis;
Bezier handles para curves onde aplicável;
easing curve;
copy/paste;
numeric editing.

Renderize curves eficientemente.

Use canvas/SVG próprio do editor, mas não confunda este gráfico com o document vector model.

MOTION PATH

Motion tween deve expor path editável no Stage.

Subselection poderá editar pontos quando compatível.

Suporte:

orient to path;
rotation offset;
path editing;
copy/paste path quando aplicável.

MOTION GUIDES

Para classic workflow:

guide layer;
guided layer;
object attachment to path;
orientation option;
path position interpolation.

MASKS

Layer mask system.

Representar relação explicitamente por IDs.

Não depender apenas de posição visual da layer no array.

Renderer:
mask stack.

Editor:
mostrar relação na Timeline.

SHAPE TWEEN

Este é um subsistema próprio.

Não implementar shape tween como crossfade.

Precisa interpolar geometria.

Pipeline:

normalize contours
match contours
normalize orientation
establish correspondence
resample/split segments
interpolate geometry
rebuild fill/stroke
render

SHAPE HINTS

Pesquisar comportamento histórico exato.

Implementar correspondências explícitas entre pontos/features.

UI:

add hint
move start hint
move end hint
show label
delete hint

Hints devem influenciar correspondence.

Testes:

circle -> square
letter-like contour -> deformed contour
multiple disconnected shapes
holes
different point counts
with hints
without hints

EASING

Implementar:

historical/simple ease
custom ease
property-specific ease para Motion Editor onde aplicável

Uma ease deve ser serializável.

Não salvar closure JavaScript.

BONE / IK

Modelo:

Armature {
 id
 roots[]
 bones[]
 constraints[]
}

Bone:
 parentBoneId
 child joints
 length
 restTransform

Joint constraints:
rotation enabled
rotation min/max
translation flags quando aplicável

Implementar solver em package independente.

Começar com CCD ou FABRIK apenas se corresponder aos requisitos.

Documentar a escolha.

Exigir:

deterministic solving;
constraint enforcement;
no NaN;
stable convergence;
configurable iteration cap.

POSES

Armature layer/timeline.

Pose keyframes.

Tween/interpolation entre poses.

Selection de bone.

Bone transformation handles.

BIND TOOL

Para shape armatures:

- vertex/region weights;
- influence visualization;
- add/remove influences;
- inspect binding.

Não falsificar Bind Tool usando apenas parenting de symbols.

3D

Implementar o modelo 2.5D necessário ao workflow histórico.

Transform3D:

x
y
z
rotationX
rotationY
rotationZ
scaleX
scaleY
scaleZ onde fizer sentido
pivot

Camera/perspective model documentado.

3D Translation tool.

3D Rotation tool.

Gizmo original.

Não copie o artwork histórico do gizmo.

3D deve coexistir com motion tween.

DECO TOOL

Pesquisar os padrões disponíveis na versão de referência.

Implementar arquitetura procedural:

DecoPreset {
 id
 generator
 parameters
 seed
}

Generator recebe:

path/region/input
parameters
seed

e produz vetores determinísticos.

Seed deve ser salvo no documento.

Não use Math.random sem seed.

SPRAY BRUSH

Suporte:

symbol spray;
dot spray conforme comportamento pesquisado;
density;
random rotation;
random scale;
scatter;
seed.

Resultado deverá poder ser reproduzido identicamente após reabrir o projeto.

TEXT

Pesquisar os tipos de texto pertinentes ao target.

Arquitetura:

TextElement
TextRun
ParagraphStyle

Suporte inicial:

static text;
font family;
size;
weight;
italic;
color;
tracking;
leading;
alignment;
text box;
transform.

Font fallback explícito.

Nunca embuta fonte proprietária da referência.

Separar text layout de rasterization.

FILE FORMAT NATIVO

NÃO use FLA como native format.

NÃO use XFL como native format.

Crie formato original:

[PROJECT_EXTENSION]

Escolha extensão posteriormente.

Formato conceitual:

project-package/
  manifest.json
  document.json
  library/
  assets/
  scripts/
  thumbnails/
  metadata/
  recovery/

manifest.json:

format
formatVersion
appVersion
documentId
createdAt
modifiedAt

Formato deve ser:

- versionado;
- documentado;
- forward-aware;
- deterministic quando possível;
- migratable;
- recoverable.

IDs:
UUID ou identificador equivalente.

SERIALIZATION

Separar runtime objects de DTOs.

Nunca JSON.stringify diretamente uma árvore de classes complexa e chamá-la de file format.

Crie schema explícito.

MIGRATIONS

migrations/
  v1_to_v2
  v2_to_v3

Load:

detect version
-> validate
-> migrate
-> normalize
-> construct model

Save nunca destrói arquivo anterior antes de nova versão estar escrita com sucesso.

ATOMIC SAVE

Desktop:

write temp
flush
rename atomically quando OS permitir

Autosave separado do manual save.

CRASH RECOVERY

Journal ou snapshots periódicos.

Ao iniciar após crash:

Recovery dialog
-> recovered document
-> timestamp
-> discard
-> open

IMPORT / EXPORT

Primeira classe:

PNG
PNG sequence
SVG
animated GIF
HTML5 package

Depois:

WebM
MP4

Compatibility/stretch:

SWF import
SWF export subset
XFL import
XFL export subset
legacy FLA import somente se tecnicamente/documentalmente justificável

Nunca declare "XFL compatible" sem corpus de teste.

SWF

Implemente parser em módulo isolado.

Nunca transforme o SWF parser no modelo principal.

Pipeline:

SWF tags
-> intermediate representation
-> internal document model

Começar por:

shapes
styles
gradients
bitmaps
placements
symbols
frames

Depois:
masks
text
filters
tweens onde recuperáveis

ActionScript pode inicialmente ser ignorado com warning estruturado.

XFL

Trate como formato externo.

Parser:

XML
-> XFL intermediate representation
-> internal document model

Crie compatibility report ao importar:

Imported exactly
Imported approximately
Unsupported
Dropped

Nunca descarte feature silenciosamente.

SVG EXPORT

Exportar:

paths;
fills;
strokes;
gradients;
transforms;
masks;
symbols quando adequado;
text quando representável.

Recursos sem equivalente:
flatten/selectively bake com warning.

HTML5 EXPORT

Gerar pacote independente do editor.

Opções:

Canvas/WebGL runtime
SVG runtime quando possível

Documentar runtime license.

VIDEO EXPORT

Renderer deve poder renderizar frame determinístico offscreen:

renderFrame(scene, frame, width, height, scale)

Encoder é subsystem separado.

Não bloqueie main thread.

MP4/H.264

Não adicione FFmpeg automaticamente.

Crie:

VideoEncoderBackend

Possíveis implementações:

WebCodecs
OS-native encoder
future approved permissive backend

Se codec não estiver disponível:
mostrar erro de capability.

Não comprometer a política de licenças para marcar checkbox de MP4 como pronto.

SCRIPTING

Separe:

Editor scripting
Runtime document scripting

M7 inicialmente:

JavaScript-based editor API original.

Não copie JSFL API literalmente.

Namespace próprio.

Exemplo conceitual:

app.document
app.selection
app.timeline
app.library

Scripts deverão usar capability permissions.

Não exponha Tauri filesystem irrestrito por padrão.

Runtime scripting deverá rodar isolado.

Não usar eval arbitrário na mesma global context da UI principal.

ActionScript 3 subset é stretch goal posterior.

UNDO / REDO

Todas as mutações permanentes do document model devem passar por Command.

Interface:

Command {
  label
  apply(ctx)
  revert(ctx)
  mergeWith?(next)
}

Exemplos:

AddShapeCommand
DeleteSelectionCommand
MoveSelectionCommand
ChangeFillCommand
InsertFrameCommand
CreateKeyframeCommand
CreateTweenCommand
EditCurvePointCommand
AddBoneCommand

TRANSACTIONS

Uma drag operation não gera 300 undo steps.

Durante drag:

preview ephemeral state.

Ao pointerup:

commit one transaction.

Para drawing:

um stroke normalmente = uma undo unit.

Commands compostos:

CompositeCommand.

UNDO MEMORY

Medir memória.

Criar configurable history limit.

Não clonar documento inteiro para cada undo.

STATE MANAGEMENT

Single source of truth:

DocumentModel.

UI state separado:

UIState.

Ephemeral interaction:

InteractionState.

Render caches:

RenderState.

Nunca misturar os quatro.

Exemplo:

DocumentModel:
conteúdo salvo.

UIState:
panel open/closed.

InteractionState:
drag in progress.

RenderState:
GPU buffers.

Somente DocumentModel entra no arquivo de projeto, salvo exceções deliberadas como workspace settings armazenadas separadamente.

SELECTION

Selection model por IDs.

Suporte:

object selection;
edge selection;
fill selection;
anchor selection;
multi-selection;
timeline selection;
bone selection.

Selection não deve depender de DOM nodes.

TOOLS ARCHITECTURE

Interface:

Tool {
  activate()
  deactivate()
  pointerDown()
  pointerMove()
  pointerUp()
  pointerCancel()
  keyDown()
  keyUp()
  renderOverlay()
}

Tools não podem mutar Model arbitrariamente.

Usar command/interaction services.

TOOL STATE MACHINE

Estados explícitos.

Exemplo Pen Tool:

idle
placingFirstPoint
extendingPath
draggingHandle
closingPath

Selection:

idle
marquee
moving
transforming
editingPivot

Evite dezenas de booleans incompatíveis.

COMMAND ROUTER / SHORTCUTS

Crie commands registry:

CommandDefinition {
 id
 label
 execute
 enabled
 checked
 defaultShortcuts
 context
}

Menus, shortcuts e command palette usam o mesmo registry.

Nunca implemente shortcut chamando diretamente componente UI.

KEYBOARD CONTEXTS

Contexts:

global
stage
timeline
textEditing
motionEditor
modal
inputField

Quando usuário digita texto:

tool shortcuts não devem disparar.

PERFORMANCE GOALS

"60/120 fps" são targets em hardware de referência, não promessa universal.

Defina máquinas de benchmark reais.

Crie benchmark scene corpus.

Benchmarks mínimos:

Simple:
5 layers
100 frames
500 shapes

Medium:
25 layers
300 frames
5,000 visible edges

Stress:
50 layers
500 frames
20,000+ visible vector edges
nested symbols
onion skin
gradients

Ink:
sustained stylus samples por pelo menos 30 s.

Timeline:
50 × 500.

Targets em máquina de referência:

60 Hz:
frame CPU p95 abaixo do budget com margem.

120 Hz:
frame CPU p95 compatível com 8.33 ms quando scene permitir.

Input:
nenhuma operação síncrona grande no pen hot path.

Monitorar:

frame time
tessellation time
GPU upload
draw calls
triangles
visible edges
worker queue depth
input samples/s
dropped samples
command duration
memory

PERFORMANCE HUD

Dev-only overlay:

FPS
frame ms
CPU render
tessellation
GPU upload
draw calls
triangles
sample rate
input queue
memory estimate

LONG TASKS

Nenhuma operação normal de desenho, pan, zoom ou scrub deve iniciar:

full document serialization;
full document tessellation;
video encoding;
asset compression;
thumbnail regeneration global.

Mover esses trabalhos para worker/backend apropriado.

WORKERS

Geometry Worker:
heavy intersection/boolean/tessellation tasks que puderem ser assíncronas.

Export Worker:
frame preparation/encoding quando APIs permitirem.

Thumbnail Worker:
Library previews.

Cuidados:

não mande megabytes de JSON em todo pointermove.

Use compact structures/Transferables quando necessário.

OFFSCREENCANVAS

Use somente após feature detection.

O app não deve quebrar quando estiver ausente.

SHAREDARRAYBUFFER

Não seja requisito.

Pode ser otimização opcional se ambiente suportar.

MEMORY

Caches devem possuir eviction.

Nunca manter mesh de todas as LODs de todas as frames indefinidamente.

Spatial index deve atualizar incrementalmente.

TIMELINE VIRTUALIZATION

Renderize apenas viewport visível + overscan.

Scrolling horizontal e vertical precisam permanecer smooth.

Scrub não pode causar React/framework rerender de cada célula.

TEST STRATEGY

Obrigatório:

unit
property
integration
visual regression
E2E
performance
manual hardware

UNIT TESTS — GEOMETRY

- quadratic evaluation;
- splitting;
- extrema;
- bounds;
- intersections;
- topology;
- point-in-fill;
- winding;
- merge drawing;
- edge deletion;
- fill reconstruction;
- stroke expansion;
- hit testing.

PROPERTY TESTS

Gerar random:

lines;
quadratics;
rectangles;
ovals;
transforms.

Invariants:

no NaN;
no dangling invalid references;
split preserves curve;
area approximately preserved where operation requires;
undo restores canonical serialized state.

UNDO TESTING

Para toda Command importante:

before = canonicalSnapshot()

apply()
revert()

after = canonicalSnapshot()

assert(after === before)

E também:

apply
undo
redo

deve equivaler ao primeiro apply.

TWEEN TESTING

Classic:
known transforms at start/middle/end.

Motion:
property tracks
easing
motion path
rotation.

Shape:
known correspondence.

IK:
constraints
pose interpolation.

PEN AUTOMATION

Crie synthetic PointerEvent adapter.

Simule:

mouse;
pen;
pressure ramp;
tilt;
twist;
barrel;
eraser;
coalesced samples;
predicted samples;
pointercancel;
lost capture;
touch while pen active.

Assertions:

- predicted sample nunca persistido;
- eraser restores previous tool;
- pressure curve correct;
- no duplicate coalesced samples;
- palm heuristic correct;
- completed stroke generates exactly one undo transaction.

HARDWARE TESTING

Synthetic testing NÃO substitui hardware testing.

Crie checklist manual reproduzível.

VISUAL REGRESSION

Golden scenes:

vector primitives
gradients
stroke joins
masks
filters
onion skin
symbols
tweens
3D
IK
text

Capture renderer output em resolution/DPR fixos.

Tolerance explícita.

PERFORMANCE TESTS

CI não deve depender de FPS exato de GPU virtualizada.

Separar:

algorithm benchmark CI
real-machine graphics benchmark

Regression thresholds devem ser documentados.

MILESTONES

Cada milestone só termina quando:

- compila;
- roda;
- testes passam;
- acceptance criteria passam;
- docs atualizadas;
- known limitations atualizadas;
- demo project fornecido.

MILESTONE — FOUNDATION

Entregáveis:

monorepo;
Tauri shell;
TypeScript config;
Rust backend;
lint;
format;
unit tests;
E2E bootstrap;
CI;
logging;
error boundary;
capability detection;
docs structure;
license checker.

Sem feature fake.

MILESTONE — UI SHELL + STAGE

Implementar:

menu system;
dockable panels;
floating panels;
document tabs;
Tools shell;
Properties;
Library shell;
Timeline shell;
Stage;
pasteboard;
camera;
zoom;
pan;
rotate;
mirror;
rulers;
guides;
grid;
snap basics;
themes;
workspace save/load.

Acceptance:

- resize contínuo sem flicker grave;
- cursor-anchored zoom matematicamente correto;
- workspace persistence;
- panel docking functional;
- Stage renders via WebGL2;
- Canvas2D fallback funciona;
- keyboard command registry funciona.

MILESTONE — VECTOR CORE

Implementar:

Selection;
Subselection;
Lasso;
Pen;
Line;
Rectangle;
Oval;
Pencil;
Brush;
Ink Bottle;
Paint Bucket;
Eyedropper;
Eraser;
Free Transform;
Gradient Transform;

Merge Drawing;
Object Drawing;
fills;
strokes;
gradients;
swatches;
Color panel.

Acceptance:

todos os geometry topology tests passam.

Nenhuma shape central é representada apenas por DOM SVG.

MILESTONE — TABLET PROFESSIONAL

Não adie tablet support para o final.

Integrar aqui porque Brush architecture depende dele.

Implementar:

pressure;
curve editor;
tilt;
twist;
eraser;
barrel;
hover preview;
coalesced;
predicted;
palm heuristic;
stabilization;
calibration panel;
touch gestures.

Acceptance:

synthetic suite completa;
pelo menos um tablet físico validado antes de considerar finalizado;
fallback mouse perfeito.

MILESTONE — TIMELINE

Implementar:

layers;
folders;
guide;
mask;
frames;
keyframes;
blank keyframes;
playback;
scrub;
onion;
fps;
scenes;
timeline virtualization.

Acceptance:

50 × 500 timeline UI não cria 25k expensive interactive DOM cells;
playback determinístico;
frame editing undoable.

MILESTONE — SYMBOLS + LIBRARY

MovieClip;
Graphic;
Button;
nested timelines;
edit-in-place;
library management;
instances;
color effects;
blend modes;
initial filters.

Acceptance:

nested symbol recursion protected;
instance transform independent of definition;
definition edits update all instances.

MILESTONE — TWEENING

Classic tween;
motion tween;
Motion Editor;
property tracks;
ease;
motion path;
motion guides;
shape tween;
shape hints.

Acceptance:

automated interpolation suite;
editing property keys undoable;
scrub matches playback;
export matches Stage evaluation.

MILESTONE — ADVANCED CS4-ERA TOOLS

Bone;
Bind;
IK;
pose layers;
3D translation;
3D rotation;
Deco;
Spray Brush.

Acceptance:

IK constraints deterministic;
procedural tools deterministic by seed;
advanced tools survive save/reload/undo.

MILESTONE — TEXT + SCRIPTING + PUBLISH

Text;
editor scripting API;
PNG;
PNG sequence;
SVG;
GIF;
HTML5;
WebM;
MP4 when legal/capability backend available.

Acceptance:

export runs asynchronously;
cancel export works;
frame output deterministic;
unsupported codec gives explicit diagnostic.

MILESTONE — COMPATIBILITY

SWF subset;
XFL subset.

Build corpus.

Never call compatibility "complete" solely because basic files open.

MILESTONE — POLISH

Performance;
accessibility;
high DPI;
keyboard parity;
workspace parity;
themes;
crash recovery;
autosave;
docs;
installers;
profiling;
memory;
hardware matrix.

DEPENDENCY POLICY

Allowed license families:

MIT
Apache-2.0
BSD-2-Clause
BSD-3-Clause

Qualquer outra licença exige decisão explícita e aprovação antes de uso.

Não aceite dependency transitiva desconhecida silenciosamente.

Crie:

docs/licensing.md
THIRD_PARTY_NOTICES.md

Automatize audit do lockfile.

Candidate permitido após verificação de versão/licença:

Tauri — MIT/Apache-2.0
lyon — MIT/Apache-2.0
perfect-freehand — MIT, preferencialmente como referência/benchmark e não como código necessário ao core

Projetos como Krita/Synfig podem ser estudados como referência de UX/comportamento, mas seu código GPL não será incorporado.

Para QUALQUER dependency nova:

registre:

name
version
purpose
direct/transitive
license
source
reason selected
replacement difficulty

Não adicione library apenas para economizar 30 linhas triviais.

PROJECT TREE PROPOSTA

/
  apps/
    desktop/
      src/
        app/
        commands/
        panels/
        stage/
        timeline/
        tools-ui/
        workspace/
        dialogs/
        settings/
        platform/
  packages/
    document-model/
    geometry/
      math/
      curves/
      intersections/
      topology/
      boolean/
      hit-test/
      stroke/
      fitting/
      spatial/
    renderer-core/
    renderer-webgl2/
    renderer-canvas2d/
    input/
      pointer/
      pen/
      touch/
      gestures/
      calibration/
    timeline-engine/
    tween-engine/
    ik-engine/
    tools/
    library-model/
    file-format/
    import-swf/
    import-xfl/
    export-core/
    scripting/
    command-system/
    test-fixtures/
    benchmarks/
    shared/
  workers/
    geometry/
    export/
    thumbnails/
  src-tauri/
    src/
      commands/
      filesystem/
      platform/
      tablet/
      codecs/
  docs/
  adr/
  tests/
    unit/
    integration/
    e2e/
    visual/
    performance/
    tablet/
    compatibility/

MODULE DEPENDENCY RULES

document-model:
MUST NOT depend on renderer.

geometry:
MUST NOT depend on DOM.

timeline-engine:
MUST NOT depend on UI framework.

renderer:
MAY read immutable evaluated scene representation.

tools:
MAY invoke document commands.

UI:
MAY dispatch commands.
MUST NOT perform geometry mutation itself.

file-format:
MUST serialize model DTOs.
MUST NOT serialize renderer cache.

input:
MUST output normalized events.
MUST NOT know document serialization.

PERFORMANCE ARCHITECTURE

Main-thread priority order while pen is active:

1. consume input;
2. draw ink preview;
3. present frame;
4. minimal interaction logic;
5. everything else.

Defer:

autosave;
thumbnail updates;
heavy panel updates;
background indexing;
expensive diagnostics.

Do not freeze Properties panel entirely;
throttle noncritical numeric updates.

ERROR HANDLING

Nunca:

catch(error) {}

Todo erro deve:

- ser tratado;
- ser surfaced;
- ou registrado com contexto.

Project loading errors precisam indicar:

file
version
section
recoverability.

No malformed project should crash the whole application.

DATA VALIDATION

Todo arquivo externo é untrusted.

Validate:

project JSON
XML
images
SWF
scripts

Proteja contra:

path traversal
zip bombs
oversized assets
recursive symbol cycles
malformed lengths
resource exhaustion

TAURI SECURITY

Use mínimo conjunto de capabilities.

Não expose shell arbitrary execution.

Não expose unrestricted filesystem.

Script API não recebe acesso automático às commands nativas.

OBSERVABILITY

Dev build:

structured logs.

Categorias:

input
geometry
renderer
timeline
fileio
export
tablet
performance

Não logue milhares de pointer samples por default.

Permita diagnostic capture voluntário.

REFERENCE DOCUMENTS A PRODUZIR

docs/vector-model.md deve incluir desenhos/diagramas ASCII ou Mermaid de:

shared merge graph
object drawing
edges/faces
fill-left/right
intersection splitting
selection.

docs/timeline-model.md:

document
scene
timeline
layer
frame spans
symbols
tweens.

docs/tablet-input.md:

OS
WebView
PointerEvent
native fallback.

docs/rendering.md:

document model
-> evaluated scene
-> tessellation cache
-> GPU buffers
-> WebGL.

DECISION TABLE OBRIGATÓRIA

Em docs/research.md inclua pelo menos:

Decision
Options
Evidence
Pros
Cons
Compatibility
License impact
Performance impact
Choice
Revisit condition

RISK REGISTER OBRIGATÓRIO

Inclua:

RISK
Likelihood
Impact
Mitigation
Owner/module
Trigger
Status

Riscos mínimos:

merge topology complexity;
Bezier numeric robustness;
shape tween correspondence;
WebView tablet inconsistency;
driver quirks;
OffscreenCanvas support;
high-DPI memory;
GPU context loss;
video codec availability;
codec licensing/patent review;
XFL variation;
SWF parser security;
legacy shortcut uncertainty;
font differences;
nested timeline recursion;
large project memory;
undo memory growth;
performance regression;
corrupted project recovery.

GPU CONTEXT LOSS

WebGL context can be lost.

Implemente restoration.

GPU buffers são caches.

Documento não pode ser perdido por context loss.

DETERMINISM

Mesmo projeto + mesmo frame + mesmo seed deve gerar mesma cena lógica.

Procedural tools usam seeded RNG.

Export não depende de wall clock.

Tween evaluation não depende de previous frame.

Scrub frame 100 diretamente deve dar o mesmo resultado que tocar frames 0–100.

NUMERIC POLICY

Document coordinates:
use precisão suficiente em CPU.

GPU may use float32.

Não arredonde document geometry para pixels durante edição.

Serialization deve evitar drift desnecessário.

CANONICAL SNAPSHOT

Crie serializer canônico para tests.

Ordenação estável.

Usado para:

undo equality;
save/load equality;
migration tests.

IMPORTANTE: NÃO IMPLEMENTAR "FAKE FEATURES"

Uma feature não está pronta se:

button exists but does nothing;
menu item exists but no behavior;
tool only draws placeholder;
Motion Editor only displays empty panel;
Bone Tool just draws lines;
3D controls only alter CSS;
Export generates blank frames;
Tablet setting just displays pressure without affecting brush.

Feature incompleta deve ser marcada explicitamente:

NOT IMPLEMENTED
PARTIAL
EXPERIMENTAL

DEFINITION OF DONE

Uma feature está DONE somente quando:

1. model exists;
2. editor behavior exists;
3. undo/redo exists;
4. save/load exists;
5. renderer handles it;
6. relevant export handles it or reports unsupported;
7. tests exist;
8. docs exist;
9. performance is acceptable;
10. accessibility/keyboard considered;
11. known deviations recorded.

OUTPUT FORMAT APÓS CADA MILESTONE

Sempre entregue:

STATUS

COMPLETED
PARTIAL
BLOCKED

IMPLEMENTED

descrição concreta.

FILES CHANGED

principais arquivos.

HOW TO RUN

comandos exatos.

HOW TO TEST

comandos exatos.

AUTOMATED TEST RESULTS

quantidade/pass/fail.

MANUAL TESTS

checklist.

PERFORMANCE RESULTS

quando relevante.

HISTORICAL PARITY

matched
approximate
different intentionally.

KNOWN LIMITATIONS

lista precisa.

LICENSE CHANGES

dependencies adicionadas/removidas.

NEXT MILESTONE

passos seguintes.

NÃO PERGUNTE AO USUÁRIO DECISÕES QUE VOCÊ PODE TOMAR

Quando houver ambiguidade:

1. pesquise;
2. escolha alternativa defensável;
3. registre em docs/assumptions.md ou ADR;
4. continue.

Pergunte somente se uma decisão externa realmente impedir qualquer progresso.

SOURCE CONTROL

Commits pequenos por subsystem.

Nunca misture:

huge refactor
+
large feature
+
dependency upgrade

no mesmo commit quando evitável.

CI

Obrigatório:

typecheck
lint
unit
integration
build frontend
build Rust
license audit
schema validation
selected E2E

Platforms no CI quando possível:

Windows
macOS
Linux.

RESEARCH REFERENCES TO STUDY

Prioridade:

Documentação histórica do editor de referência;
SWF File Format Specification;
documentação pública de XFL/Animate;
W3C Pointer Events;
Khronos WebGL;
WHATWG Canvas/OffscreenCanvas;
Tauri architecture/docs.

Behavioral/open-source comparison:

Krita
Synfig
Pencil2D
Tahoma2D
OpenToonz
Penpot
Excalidraw
perfect-freehand
lyon

Estudar:
workflow;
architecture concepts;
UX patterns;
performance techniques.

Não copiar código incompatível com a clean-room policy.

PHASE ZERO EXIT GATE

Não sair da research phase até possuir:

- feature matrix;
- panel inventory;
- tools inventory;
- menus inventory;
- verified/provisional shortcut matrix;
- Merge Drawing behavior spec;
- Object Drawing behavior spec;
- vector data model ADR;
- timeline behavior spec;
- tween comparison;
- symbols behavior;
- IK behavior;
- 3D behavior;
- XFL/SWF decision;
- Pointer Events capability matrix;
- native tablet fallback decision;
- renderer comparison;
- license inventory;
- risk register;
- test plan;
- benchmark plan.

PHASE ONE EXIT GATE

Antes de M1:

- folder tree;
- interfaces principais;
- schema;
- command system design;
- worker boundaries;
- renderer abstraction;
- tablet abstraction;
- performance budgets;
- save format v1;
- ADRs.

FINAL PRODUCT EXPECTATION

O resultado deve parecer, para um animador experiente, um descendente moderno e extremamente responsivo do workflow clássico de animação vetorial por timeline.

O usuário deve conseguir:

abrir o programa;
desenhar com mouse ou stylus;
editar vetores;
usar Merge Drawing;
usar Object Drawing;
criar layers;
criar keyframes;
desenhar frame-by-frame;
usar onion skin;
criar symbols;
editar nested timelines;
criar classic tweens;
criar motion tweens;
editar curvas no Motion Editor;
usar shape tween;
usar guides;
usar masks;
usar bones;
editar poses;
usar ferramentas 3D;
trabalhar rapidamente por atalhos;
salvar;
reabrir sem perda;
exportar.

Ao usar uma pen tablet, o usuário também deve conseguir:

variar espessura por pressão;
variar opacity e flow;
usar tilt;
usar twist quando disponível;
virar a caneta e apagar;
usar barrel buttons;
ver hover cursor;
usar stabilization;
pan/zoom com touch;
repousar a mão com rejeição best-effort;
calibrar pressure;
diagnosticar capabilities;
desenhar sem lag visual perceptível quando hardware/API permitirem.

QUALITY BAR

Não optimize para produzir rapidamente screenshots bonitos.

Optimize para:

correctness;
editability;
low latency;
determinism;
recoverability;
testability;
maintainability;
historical workflow parity.

PRIORIDADE DE ENGENHARIA

Quando houver conflito:

1. document integrity;
2. correct geometry;
3. undo correctness;
4. input correctness;
5. renderer correctness;
6. interaction latency;
7. historical workflow fidelity;
8. polish;
9. visual cosmetics.

Nunca sacrifique document integrity para esconder uma feature incompleta.

PRIMEIRA EXECUÇÃO

Comece agora pela Phase Zero.

Sua primeira entrega deverá conter, no mínimo:

docs/research.md
docs/feature-matrix.md
docs/historical-shortcuts.md
docs/vector-model.md
docs/tablet-input.md
docs/rendering.md
docs/file-format.md
docs/licensing.md
docs/assumptions.md
docs/performance.md
docs/testing.md

adr/ADR-vector-model.md
adr/ADR-renderer.md
adr/ADR-native-file-format.md
adr/ADR-tablet-backends.md

Depois entregue Phase One architecture.

Somente então implemente o primeiro milestone executável.

Não pule diretamente para uma UI mockup.

Não substitua pesquisa por suposições.

Não encerre uma resposta com promessas vagas.

Sempre produza código, documentação, testes ou decisões verificáveis correspondentes à fase atual.
```

## Critérios de paridade que eu acrescentaria ao projeto

A especificação acima torna “réplica” mensurável em vez de subjetiva. O ponto central é criar uma **matriz de paridade**, porque simplesmente possuir um botão chamado Brush, Bone ou Motion Tween não significa reproduzir o comportamento correspondente. O modelo de drawing é um bom exemplo: a diferença entre Merge e Object Drawing envolve efetivamente topologia e ownership, não apenas um booleano de UI. citeturn8view0

Eu trataria cinco conjuntos de arquivos como testes de referência permanentes.

**Corpus de geometria.** Deve conter interseções de linhas, curvas, círculos/ovais, fills sobrepostos, strokes atravessando fills, formas tangentes, holes, self intersections, Paint Bucket, Ink Bottle, Eraser e sequências de undo. O output a verificar não é só screenshot: é também uma serialização canônica do grafo após cada operação. Isso é particularmente importante porque o formato histórico representa shapes por edges e styles, inclusive com fills dos dois lados das edges. citeturn4view1turn4view3

**Corpus de timeline.** Deve testar held frames, keyframes, blank keyframes, nested symbols, Graphic versus MovieClip, scenes, masks, guide layers e onion skin. Motion e classic tween devem possuir testes separados porque seus modelos são estruturalmente diferentes. citeturn9view0 O Motion Editor também precisa ter testes de property keys e curves, não apenas de resultado final. citeturn9view1

**Corpus de IK.** Deve verificar cadeias simples e ramificadas, limits de rotação, mudanças de pose e interpolação entre poses. A razão para manter isso separado do tween comum é que armatures e pose layers constituem um modelo de animação específico. citeturn9view2turn9view3

**Corpus de input.** Deve gravar sequências normalizadas de stylus e depois “replayá-las” nos testes. Pressure, tilt, twist, barrel, eraser, coalesced samples, predictions e cancelamentos precisam ser exercitados independentemente. Pointer Events define os valores padronizados de barrel/eraser e as propriedades de pen necessárias para esse sistema. citeturn14view0turn14view2 Predictions precisam aparecer no preview sem contaminar o documento persistido. citeturn14view3

**Corpus de performance.** Deve ser versionado junto do código. “50 layers / 500 frames” é insuficiente sozinho porque 500 frames vazios e 500 frames com milhões de edges têm custos completamente diferentes. O benchmark deve especificar layers, frames, quantidade de edges visíveis, gradients, masks, nested symbols, onion layers, tamanho do Stage, DPR e número de samples de pen por segundo.

Uma boa regra para o renderer é considerar qualquer GPU data como **cache descartável**. O documento existe independentemente do WebGL context. WebGL2 trabalha com drawing buffers e pode ser associado a canvas/offscreen canvas, mas o modelo da aplicação não deve depender da sobrevivência desses recursos gráficos. citeturn23view1 Se o contexto cair, a aplicação recria meshes e buffers a partir do modelo.

Outro acréscimo importante é um painel de **Input Diagnostics**. Como o Tauri usa engines diferentes em Windows, macOS e Linux, o mesmo código TypeScript pode receber capabilities distintas dependendo da plataforma. citeturn17view0 Em vez de o usuário reportar apenas “minha Huion não tem pressão”, o painel deve mostrar algo como:

```text
Input backend: WebPointerBackend
pointerType: pen
pressure: YES
tiltX/Y: YES
twist: NO DATA
hover: YES
eraser button: YES
barrel button: YES
coalesced events: YES
predicted events: NO
pointerrawupdate: NO

Observed sampling:
median: 126 Hz
p95 interval: 10.4 ms

Current pressure:
raw: 0.617
calibrated: 0.703
```

Isso converte problemas de driver em dados reproduzíveis e evita criar “workarounds Wacom/Huion/XP-Pen” sem evidência.

Também não usaria `perfect-freehand` como o núcleo permanente do brush apenas porque já resolve pressure outlines. Ele é uma excelente referência MIT e aceita pressão real, mas o brush proposto aqui precisa integrar tilt, opacity/flow, prediction, fitting, quadratic conversion, merge semantics e edição posterior do stroke. citeturn16view1 O mais coerente é um `InkStroke` próprio e usar bibliotecas desse tipo como benchmark/referência.

Já `lyon` faz sentido como dependência real porque existe uma separação arquitetural clara: ele pode receber um path e produzir triangles para a GPU sem controlar o significado do documento. citeturn16view0 Assim, trocar `lyon` futuramente não altera `ShapeGraph`, timeline, arquivo ou undo.

## Base de pesquisa e fontes prioritárias para o próprio projeto

A pesquisa futura do projeto deveria seguir uma hierarquia explícita. Para o comportamento vetorial, a documentação Adobe sobre drawing modes é uma fonte particularmente importante porque descreve de maneira direta a diferença entre Merge Drawing e Object Drawing, inclusive o corte causado por overlaps e a separabilidade de stroke/fill. citeturn8view0 Para o formato de shapes, a especificação SWF é ainda mais importante: ela documenta registros de shapes, FillStyles, LineStyles, StraightEdgeRecords, CurvedEdgeRecords e curvas quadráticas. citeturn4view1turn4view3

Para animação, a documentação da linhagem Animate é útil para formalizar conceitos que continuam presentes, como a distinção estrutural de classic/motion tween e o funcionamento por property curves do Motion Editor. citeturn9view0turn9view1 Para saber exatamente o que existia em 2008, porém, ela deve ser cruzada com material específico de CS4; *The Essential Guide to Flash CS4* cobre drawing tools, animation, inverse kinematics e 3D, e funciona como uma boa fonte histórica complementar. citeturn22search18

Para tablet, a fonte normativa deve ser Pointer Events Level 3. Ela fornece o modelo unificado para mouse/touch/pen, propriedades específicas de caneta, estados de botões, coalesced events e predicted events. citeturn11view0turn14view0turn14view3 Em especial, essa fonte impede duas implementações erradas comuns: tratar predictions como pontos definitivos e presumir que palm rejection é totalmente comandada pela aplicação. citeturn14view0turn14view3

Para deployment, a arquitetura oficial do Tauri confirma que uma aplicação Tauri utiliza o WebView nativo de cada plataforma, em vez de embarcar necessariamente o mesmo engine em todos os sistemas. citeturn17view0 Isso justifica o `capabilities.ts`, o fallback Canvas2D, o backend de pen abstraído e a proibição de assumir Chromium-only APIs.

Para a camada gráfica, a especificação WebGL2 deve ser usada como contrato do backend GPU. WebGL2 fornece um rendering context próximo do OpenGL ES 3.0 e aceita canvas e OffscreenCanvas. citeturn23view1 `lyon` é uma referência/dependência permissiva adequada para a fase de tessellation porque sua própria documentação o descreve como um mecanismo que transforma paths complexos em vertex/index geometry destinada a APIs de GPU. citeturn16view0

No estudo de projetos open source, é essencial manter a fronteira de licença. Krita e Synfig são GPL-3.0 e, portanto, devem ser tratados como referências de comportamento dentro desta política clean-room. citeturn18view0turn18view1 Excalidraw e perfect-freehand usam MIT, sendo úteis para estudar canvas, local-first editing, zoom/pan, freehand e pressure strokes; ainda assim, a regra “write from scratch” continua recomendando que o núcleo específico deste produto seja implementado independentemente. citeturn17view3turn16view1

Por fim, a decisão de **não tornar XFL o modelo nativo** é deliberada. A documentação Adobe atual identifica XFL como introduzido no fluxo de documentos a partir de CS5, enquanto formatos CS4 e anteriores permaneciam na antiga família binária; ao mesmo tempo, havia intercâmbio XFL com CS4 em ferramentas como After Effects. citeturn20search10turn20search24 Um formato próprio, aberto, versionado e documentado oferece compatibilidade histórica sem amarrar toda a nova arquitetura às limitações de um formato externo.