---
title: "Catálogo de Estilos UI/UX para Ancla"
author: "Hermes (investigación)"
date: "2026-08-30"
total_estilos: 30
fuente_principal: "styles.refero.design + conocimiento de la industria"
---

## 1. Aurora UI

**🎨 Paletas comunes**
- #00F5FF, #FF00FF, #FFFF00, #000000, #FFFFFF (neón puro sobre negro)
- #0D0D0D, #1A1A2E, #16213E, #0F3460, #E94560 (azules profundos + acento rosa)
- #00D4FF, #7B2FFF, #FF6B6B, #4ECDC4, #FFE66D (gradientes aurora boreal)
- #0A0A0A, #111111, #00FFFF, #FF00AA, #AAFF00 (alto contraste cibernético)
- #121212, #1E1E1E, #BB86FC, #03DAC6, #CF6679 (Material You dark + aurora)

**🔗 Ejemplo representativo**
- https://awwwards.com/sites/aurora (URL de marco referencial)

**✨ 5 características principales**
1. Fondos oscuros con gradientes radiales animados que simulan auroras boreales
2. Tipografía variable con efectos de glow/blur en estados hover
3. Glassmorphism extremo: paneles translúcidos con backdrop-filter blur ≥ 40px
4. Microinteracciones basadas en partículas WebGL que siguen al cursor
5. Paleta restringida a 3-4 colores neón saturados sobre base #000000

**📖 Objetivo y filosofía**
Aurora UI busca evocar la magia de lo inexplorado mediante luz sobre oscuridad. Su filosofía centra la experiencia en la maravilla visual: cada interacción debe sentirse como descubrir un fenómeno natural en la noche. Rechaza la utilidad pura por la resonancia emocional, usando gradientes vivos y movimiento orgánico para crear interfaces que respiran. Es diseño como performance, donde el usuario es espectador y participante de un espectáculo lumínico.

**📅 Época predominante**
2022-2025 (post-pandemia, auge de WebGL/Three.js en landing pages)

**🎯 Usos típicos**
**Portfolios creativos**, **sitios de agencias digitales**, landing pages de **productos tech premium**, eventos/festivales, marcas de moda vanguardista

---

## 2. Bauhaus Digital

**🎨 Paletas comunes**
- #FF0000, #FFFF00, #0000FF, #FFFFFF, #000000 (primarios puros + B/N)
- #D32F2F, #F9A825, #1976D2, #F5F5F5, #212121 (primarios Material + neutros)
- #E53935, #FFB300, #1E88E5, #E0E0E0, #121212 (variación dark mode)
- #C62828, #F57F17, #0D47A1, #FFFFFF, #000000 (versión impresión/alto contraste)
- #B71C1C, #FF6F00, #01579B, #FAFAFA, #000000 (tonos profundos para UI densa)

**🔗 Ejemplo representativo**
- https://www.bauhaus.de/ (fundación Bauhaus - marco referencial)

**✨ 5 características principales**
1. Geometría estricta: círculos, triángulos, rectángulos sin border-radius (o ≤ 2px)
2. Tipografía sans-serif geométrica (Futura, Geometria, DM Sans) en jerarquía extrema
3. Composición asimétrica en grid modular: regla de tercios + proporción áurea
4. Color plano sin gradientes, sombras ni texturas — solo forma y contrapeso
5. Espacio negativo como elemento activo: el vacío tiene peso visual igual al lleno

**📖 Objetivo y filosofía**
Bauhaus Digital traslada la escuela de Weimar al lienzo digital: forma sigue a función, ornamentación es delito. Busca claridad comunicativa absoluta mediante reducción a lo esencial. Cada pixel debe justificar su existencia. La asimetría controlada crea tensión visual que guía la mirada sin jerarquías obvias. Es diseño honesto, industrial, democrático — interfaces que cualquiera puede entender sin manual.

**📅 Época predominante**
1919-1933 (original) → renacimiento digital 2018-presente (frameworks UI, design systems)

**🎯 Usos típicos**
**Design systems corporativos**, **dashboards analíticos**, **documentación técnica**, señalética digital, interfaces de **productos industriales/SaaS B2B**

---

## 3. Bento Grid

**🎨 Paletas comunes**
- #FFFFFF, #F8F9FA, #E9ECEF, #212529, #0D6EFD (Apple/iOS: blanco, grises, azul sistema)
- #000000, #1C1C1E, #2C2C2E, #3A3A3C, #007AFF (iOS dark: negros escalonados + azul)
- #FAFAFA, #F5F5F5, #E0E0E0, #1A1A1A, #1976D2 (Material: surface, surface-variant, outline, on-surface, primary)
- #0F0F0F, #1A1A1A, #2D2D2D, #FFFFFF, #00D4AA (Linear.app: dark profundo, verde menta acento)
- #FFFFFF, #F7F7F8, #E4E4E7, #18181B, #3B82F6 (shadcn/ui: zinc, zinc-50, zinc-200, zinc-900, blue-500)

**🔗 Ejemplo representativo**
- https://linear.app (referencial - dashboard Bento por excelencia)

**✨ 5 características principales**
1. Grid de contenedores rectangulares de tamaños variables (1x1, 2x1, 1x2, 2x2) tipo caja bento japonesa
2. border-radius consistente 12-16px en todos los contenedores; box-shadow sutil (0 1px 3px rgba(0,0,0,0.08))
3. Cada "compartimento" es un widget autosuficiente: métrica, gráfico, lista, acción rápida
4. Densidad alta: ≤ 8px gap entre contenedores; padding interno 16px estándar
5. Responsive por reflow: contenedores se reordenan en móvil manteniendo proporciones relativas

**📖 Objetivo y filosofía**
Bento Grid organiza complejidad en porciones digeribles. Inspirado en la lonchera japonesa, cada compartimento tiene propósito único y tamaño proporcional a su importancia. Rechaza el scroll infinito por la visión total: todo lo crítico cabe en una pantalla. La filosofía es "comida para la mente" — nutrición informativa balanceada, sin desperdicio, donde el espacio en blanco es tan nutritivo como el dato.

**📅 Época predominante**
2021-presente (popularizado por Linear, Notion, Raycast, Vercel Dashboard)

**🎯 Usos típicos**
**Dashboards SaaS**, **paneles de control**, **apps de productividad**, **analytics**, **herramientas para desarrolladores**, **CRMs**

---

## 4. Brutalismo Web

**🎨 Paletas comunes**
- #FFFFFF, #000000, #FF0000, #00FF00, #0000FF (B/N + primarios crudos)
- #FFFF00, #000000, #FFFFFF, #FF00FF, #00FFFF (amarillo/negro/blanco + magenta/cian)
- #808080, #000000, #FFFFFF, #FF4444, #44FF44 (grises industriales + acentos saturados)
- #FFF8E7, #1A1A1A, #FF3333, #33FF33, #3333FF (papel envejecido + RGB puro)
- #000000, #FFFFFF, #FF6600, #00CC00, #0066FF (monocromo + naranja/verde/azul eléctricos)

**🔗 Ejemplo representativo**
- https://brutalistwebsites.com/ (curador del estilo - marco referencial)

**✨ 5 características principales**
1. HTML semántico expuesto: sin CSS framework, estilos inline o hoja mínima (< 5KB)
2. Tipografía de sistema (system-ui, monospace) en tamaños crudos: 12px, 16px, 24px, 48px — sin escala modular
3. Ausencia total de border-radius, box-shadow, transiciones, animaciones — instantaneidad brutal
4. Layouts rotos intencionalmente: overlapping, negative margins, z-index caótico
5. Imágenes sin optimizar, sin lazy-load, sin aspect-ratio — peso visible como declaración

**📖 Objetivo y filosofía**
Brutalismo Web es reacción anti-diseño: rechaza la suavidad corporativa, el "delight", la fricción cero. Expone la maquinaria: HTML, HTTP, ancho de banda, jerarquía de etiquetas. Honestidad radical sobre estética. El usuario ve la verdad del medio — enlaces azules subrayados, formularios grises, tablas sin estilo. Es punk digital: feo a propósito para ser libre. La usabilidad surge de la familiaridad nativa del navegador, no de capas de abstracción.

**📅 Época predominante**
1995-2005 (web temprana) → resurgimiento 2014-presente (reacción a Flat/Material/Design Systems)

**🎯 Usos típicos**
**Sitios personales/artísticos**, **archivos digitales**, **manifiestos**, **proyectos experimentales**, **crítica cultural**, **web archival**

---

## 5. Claymorphism

**🎨 Paletas comunes**
- #E0E5EC, #FFFFFF, #A3B1C6, #6B7A99, #2D3A5A (base arcilla + sombras suaves)
- #F0F0F0, #FFFFFF, #CCCCCC, #888888, #444444 (neutros cálidos)
- #FFE5E5, #FFFFFF, #FFB3B3, #FF8080, #CC0000 (rosa arcilla)
- #E5F5E5, #FFFFFF, #B3E5B3, #80D480, #006600 (verde menta arcilla)
- #E5E5FF, #FFFFFF, #CCCCFF, #9999FF, #333399 (lila arcilla)

**🔗 Ejemplo representativo**
- https://dribbble.com/shots/14391725-Claymorphism-UI-Kit (marco referencial Dribbble)

**✨ 5 características principales**
1. Dual-shadow interno/externo: box-shadow: 20px 20px 60px #a3b1c6, -20px -20px 60px #ffffff (inset + outset)
2. border-radius ≥ 24px (a menudo 50% en botones, 32px en tarjetas) — forma orgánica, redondeada
3. background: #E0E5EC (color base "arcilla") — nunca blanco puro ni negro
4. Efecto "pressed" en active: sombra invertida (inset dominante) simulando hundimiento táctil
5. Ausencia de bordes (border: none) — la forma la definen solo las sombras

**📖 Objetivo y filosofía**
Claymorphism busca tactilidad digital: interfaces que invitan a ser tocadas, apretadas, moldeadas. Emula arcilla polimérica — suave, maleable, cálida. Rechaza la frialdad del vidrio (glassmorphism) y la planitud del flat. La filosofía es "soft tech": tecnología que se siente humana, accesible, jugable. Las sombras duales crean profundidad sin jerarquía agresiva; el usuario "siente" el peso de cada elemento antes de clickear.

**📅 Época predominante**
2020-2022 (pico Dribbble/Behance) → legado en design systems accesibles 2023-presente

**🎯 Usos típicos**
**Apps de salud/bienestar**, **apps infantiles/educativas**, **fintech amigable**, **smart home**, **wearables UI**, **onboarding flows**

---

## 6. Dark Mode First

**🎨 Paletas comunes**
- #000000, #121212, #1E1E1E, #2D2D2D, #FFFFFF (Material You dark: surface, surface-variant, elevation)
- #000000, #0D0D0D, #1A1A1A, #262626, #FAFAFA (GitHub dark: canvas, default, subtle, muted, fg-default)
- #000000, #0E0E10, #18181B, #27272A, #FAFAFA (Zinc/Tailwind dark: 950, 900, 800, 700, 50)
- #0D1117, #161B22, #21262D, #30363D, #E6EDF3 (GitHub dark dimmed: canvas, default, subtle, muted, fg)
- #111827, #1F2937, #374151, #4B5563, #F9FAFB (Gray/Tailwind dark: 900, 800, 700, 600, 50)

**🔗 Ejemplo representativo**
- https://github.com (referencial - dark mode nativo por defecto)

**✨ 5 características principales**
1. Diseño nace en dark: #000000 o #0D0D0D base; light mode es derivado (inversión controlada)
2. Escalas de grises con 10-12 pasos (50-950) para profundidad sin color; acento único (blue/indigo/emerald)
3. Contraste WCAG AA mínimo 4.5:1 en texto; 3:1 en UI no textual — validado en ambos temas
4. Preferencia del sistema (prefers-color-scheme) detectada y respetada sin flash (CSS @media + JS sync)
5. Imágenes/ilustraciones con variantes dark: transparencias, filtros invertidos, o assets dedicados

**📖 Objetivo y filosofía**
Dark Mode First invierte la jerarquía histórica: la oscuridad es el lienzo natural de la luz emitida (pantallas), no el papel reflejado. Reduce fatiga visual, ahorra batería en OLED, y eleva el contenido sobre el chrome. La filosofía es "respeto al contexto": hora del día, entorno, preferencia del usuario. No es estética — es ergonomía. El color surge como acento funcional, nunca decorativo. La tipografía y el espacio negativo hacen el trabajo pesado.

**📅 Época predominante**
2018-2019 (macOS Mojave, Android 10, iOS 13) → estándar de facto 2020-presente

**🎯 Usos típicos**
**Sistemas operativos**, **IDEs/editores de código**, **apps de lectura larga**, **dashboards 24/7**, **apps de desarrollador**, **cualquier producto SaaS moderno**

---

## 7. Diseño Editorial

**🎨 Paletas comunes**
- #000000, #FFFFFF, #F5F5F0, #333333, #999999 (B/N + papel cálido + grises tipográficos)
- #1A1A1A, #FAFAFA, #F0EBE3, #666666, #CC0000 (negro suave, blanco hueso, papel, gris medio, rojo acento)
- #0D0D0D, #FFFFFF, #E8E4DD, #4A4A4A, #0066CC (editorial digital: tinta, papel, gris, azul link)
- #2D2D2D, #FEFEFE, #F5F0E8, #888888, #8B0000 (revista impresa: tinta densa, papel, gris foto, rojo editorial)
- #000000, #FFFFFF, #FAF8F5, #555555, #D4A017 (lujo editorial: oro viejo como único acento cromático)

**🔗 Ejemplo representativo**
- https://www.nytimes.com (referencial - periodismo digital editorial)

**✨ 5 características principales**
1. Tipografía serif para cuerpo (Merriweather, Playfair, Source Serif, Georgia) 18-21px, line-height 1.6-1.8
2. Jerarquía tipográfica extrema: 5-6 niveles (display, h1-h3, lead, body, caption, footnote) sin color — solo peso/tamaño/espacio
3. Columnas fluidas: max-width 65-75ch; grid asimétrico para pull-quotes, sidebars, figuras
4. Espacio vertical rítmico: baseline grid 4px/8px; márgenes generosos (padding ≥ 64px lateral en desktop)
5. Imágenes tratadas como figuras editoriales: caption obligatorio, crédito, ratio fijo (4:3, 3:2, 16:9)

**📖 Objetivo y filosofía**
Diseño Editorial trae la disciplina del impreso a la web: legibilidad, ritmo, autoridad. El contenido manda; el diseño se invisibiliza para servir la lectura profunda. Rechaza el "engagement" por la comprensión. Cada decisión — kerning, leading, measure, escala — optimiza para cognición sostenida. Es diseño que envejece bien: un artículo bien maquetado hoy se leerá igual de bien en 10 años. La marca vive en la consistencia tipográfica, no en colores o efectos.

**📅 Época predominante**
1450-presente (imprenta) → adaptación web 2012-presente (Medium, NYT, The Guardian, Substack)

**🎯 Usos típicos**
**Publicaciones digitales**, **blogs de largo aliento**, **documentación técnica**, **casos de estudio**, **whitepapers**, **newsletters premium**

---

## 8. Diseño Maximalista

**🎨 Paletas comunes**
- #FF0000, #00FF00, #0000FF, #FFFF00, #FF00FF, #00FFFF, #FFFFFF, #000000 (RGB/CMYK completos)
- #FF3366, #FF9900, #33CC33, #0099FF, #CC00FF, #FFCC00, #FF66CC, #66FFCC (neón pastel saturado)
- #800080, #FF1493, #00FF7F, #FFD700, #FF4500, #00BFFF, #FF69B4, #32CD32 (joya + neón)
- #1A1A2E, #16213E, #0F3460, #E94560, #FF00FF, #00FFFF, #FFFF00, #FFFFFF (dark maximalista)
- #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3, #FFFFFF (arcoíris completo ROYGBIV)

**🔗 Ejemplo representativo**
- https://awwwards.com/sites/maximalist (marco referencial)

**✨ 5 características principales**
1. Densidad visual extrema: ≤ 4px gap entre elementos; capas superpuestas (z-index 10-100+)
2. Patrones/texturas repetitivos de fondo (SVG pattern, CSS background-image) + gradientes múltiples
3. Tipografía expresiva: display fonts decorativas, outline text, texto en curva, mezcla 3-4 familias
4. Animaciones simultáneas: parallax, scroll-triggered, hover-reveal, loop ambientales — todo a la vez
5. Colisión intencional: elementos "rompen" contenedores, overflow visible, negative margins agresivos

**📖 Objetivo y filosofía**
Maximalismo celebra la abundancia: más es más. Reacciona contra la austeridad del minimalismo corporativo (Apple, Google, Airbnb) con exceso deliberado. La filosofía es "sorpresa sostenida": cada scroll revela nueva capa, nuevo detalle, nueva combinación. No busca eficiencia — busca memoria. El usuario no "usa" la interfaz; la explora como un mundo. Riesgo alto: puede abrumar. Éxito cuando la complejidad tiene lógica interna descubrible (Easter eggs, narrativa visual).

**📅 Época predominante**
2018-presente (reacción a Flat 2.0 / Material / diseño sistémico homogéneo)

**🎯 Usos típicos**
**Marcas de moda/lujo**, **festivales/eventos**, **portfolios creativos**, **sitios de entretenimiento**, **arte digital**, **campañas de lanzamiento**

---

## 9. Diseño Suizo / Tipográfico Internacional

**🎨 Paletas comunes**
- #000000, #FFFFFF, #CCCCCC, #666666, #FF0000 (B/N + gris medio + rojo acento único)
- #1A1A1A, #FAFAFA, #E0E0E0, #757575, #D32F2F (dark mode suizo: negro suave, blanco, gris, rojo Material)
- #000000, #FFFFFF, #F5F5F5, #9E9E9E, #000000 (monocromo estricto: solo peso tipográfico diferencia)
- #212121, #FFFFFF, #EEEEEE, #BDBDBD, #C62828 (versión impresión: tinta, papel, grises, rojo corporativo)
- #000000, #FFFFFF, #CCCCCC, #666666, #0066CC (azul corporativo como único acento no neutro)

**🔗 Ejemplo representativo**
- https://www.swissdesign.org (museo/archivo - marco referencial)

**✨ 5 características principales**
1. Grid modular estricto: 12/16 columnas, baseline grid 4pt, márgenes matemáticos (proporción áurea/raíz de 2)
2. Tipografía sans-serif neo-grotesk (Helvetica, Univers, Akzidenz, Inter, IBM Plex Sans) — una familia, 3-4 pesos
3. Alineación flush-left / ragged-right universal; justificación solo en columna ancha ≥ 60ch
4. Jerarquía por tamaño/peso/espacio — nunca color, cursiva, subrayado, mayúsculas (salvo acrónimos)
5. Fotografía tratada como elemento gráfico: recortes geométricos, sangrado full-bleed, silencio visual alrededor

**📖 Objetivo y filosofía**
Estilo Suizo (International Typographic Style) busca comunicación objetiva, universal, atemporal. "El diseño es invisible" — el mensaje importa, no el diseñador. Grid como ley moral: orden racional contra caos emocional. Neutralidad suiza: sin ornamento, sin expresión personal, sin cultura local. Funciona en Tokio, Nueva York, Zúrich sin traducción visual. Es diseño como ingeniería: preciso, reproducible, democrático. La belleza emerge de la restricción extrema.

**📅 Época predominante**
1950-1970 (Escuela de Basilea/Zurich) → canon del diseño gráfico moderno; base de design systems 2010-presente

**🎯 Usos típicos**
**Identidad corporativa**, **señalética/wayfinding**, **design systems**, **documentación técnica**, **interfaces gubernamentales**, **editorial científica**

---

## 10. E-Ink / Papel

**🎨 Paletas comunes**
- #000000, #FFFFFF, #E0E0E0, #B0B0B0, #808080 (16 niveles de gris: e-ink 16-tone)
- #1A1A1A, #F5F5F0, #E8E0D0, #CCC0B0, #999080 (papel cálido: tinta, página, bordes, margen, nota)
- #0D0D0D, #FEFEFE, #F0EDE5, #D0C8B8, #888078 (Kindle/Kobo: 4-16 grises + papel texturizado)
- #000000, #FFFFFF, #D9D9D9, #A6A6A6, #737373 (grises puros escalados 0, 255, 217, 166, 115)
- #111111, #FAFAFA, #EDEDED, #CACACA, #888888 (remarkable/reMarkable: tinta, papel, grises UI)

**🔗 Ejemplo representativo**
- https://remarkable.com (referencial - tablet papel digital)

**✨ 5 características principales**
1. Paleta exclusivamente grises (0-255 en pasos de 16-64); cero color — simulando tinta electrónica
2. Textura de papel sutil: background-image ruido SVG (opacity 3-5%) o pattern papel ligero
3. Tipografía optimizada para bajo contraste: serif de alto x-height (Source Serif, Literata, Merriweather) 16-18px
4. Transiciones lentas intencionales (300-500ms) emulando refresco e-ink; sin animaciones fluidas 60fps
5. Modo "página" no scroll: paginación física, márgenes generosos, números de página, viñetas

**📖 Objetivo y filosofía**
E-Ink / Papel replica la experiencia de lectura en papel sobre pantalla emisiva. Reduce luz azul, parpadeo, fatiga. La filosofía es "invisibilidad del medio": el dispositivo desaparece, solo queda el texto. Lento a propósito: la fricción del cambio de página crea pausas cognitivas que mejoran retención. Rechaza la inmediatez web por la contemplación analógica. Es diseño para leer, no para navegar.

**📅 Época predominante**
2007-presente (Kindle 1) → renacimiento "digital wellbeing" 2020-presente (reMarkable, Boox, apps reading mode)

**🎯 Usos típicos**
**E-readers/tabletas tinta**, **apps modo lectura** (Pocket, Instapaper, Safari Reader), **documentos legales/académicos**, **diarios digitales**, **apps de concentración**

---

## 11. Flat Design 2.0 (con profundidad sutil)

**🎨 Paletas comunes**
- #007AFF, #34C759, #FF9F0A, #FF3B30, #AF52DE (iOS system: blue, green, orange, red, purple)
- #1976D2, #388E3C, #F57C00, #D32F2F, #7B1FA2 (Material: primary, success, warning, error, secondary)
- #3B82F6, #10B981, #F59E0B, #EF4444, #8B5CF6 (Tailwind: blue-500, emerald-500, amber-500, red-500, violet-500)
- #0066CC, #00AA44, #FF8800, #CC0000, #8844CC (web-safe flat: azul, verde, naranja, rojo, púrpura)
- #0D0D0D, #FFFFFF, #F2F2F7, #E5E5EA, #8E8E93 (iOS neutros: label, background, secondary, tertiary, quaternary)

**🔗 Ejemplo representativo**
- https://developer.apple.com/design/human-interface-guidelines/ (referencial - HIG Apple)

**✨ 5 características principales**
1. Color plano sin gradientes, pero con elevation tokens: shadow-1 (0 1px 2px), shadow-2 (0 4px 8px), shadow-3 (0 12px 24px) rgba(0,0,0,0.08-0.16)
2. border-radius sistemático: 8px (botones), 12px (tarjetas), 16px (modales), 50% (FAB/avatar) — escala coherente
3. Tipografía san-serif system-ui (SF Pro, Roboto, Inter) con escala tipográfica 8pt base (12, 14, 16, 20, 24, 32, 48)
4. Espaciado escala 4px/8px: gap-4, gap-8, gap-16, gap-24, gap-32 — ritmo vertical/horizontal unificado
5. Estados interactivos sutiles: hover +2px elevation, active scale(0.98), focus-visible ring-2 offset-2 — sin color fill change

**📖 Objetivo y filosofía**
Flat 2.0 (Material Design 2/3, iOS 7+, Fluent 2) madura el flat original: recupera profundidad jerárquica sin skeuomorfismo. La filosofía es "claridad con dimensión": el usuario entiende qué flota, qué está fijo, qué es accionable — por sombras y elevación, no por texturas. Color funcional (semántico: success/error/warning), no decorativo. Movimiento significativo: transiciones 150-250ms easing estándar comunican causalidad. Es el lenguaje común de la industria: predecible, accesible, escalable.

**📅 Época predominante**
2014-2018 (Material Design, iOS 7) → refinamiento 2.0: 2018-presente (Material You, iOS 15+, Fluent 2)

**🎯 Usos típicos**
**Apps móviles nativas**, **design systems corporativos**, **SaaS B2B**, **e-commerce**, **apps productividad**, **cualquier interfaz mainstream**

---

## 12. Glassmorphism

**🎨 Paletas comunes**
- rgba(255,255,255,0.1), rgba(255,255,255,0.05), rgba(0,0,0,0.1), #FFFFFF, #000000 (vidrio sobre dark)
- rgba(255,255,255,0.25), rgba(255,255,255,0.1), rgba(0,0,0,0.05), #F5F5F5, #1A1A1A (vidrio sobre light)
- rgba(255,255,255,0.15), rgba(255,255,255,0.08), rgba(30,30,60,0.2), #E0E0FF, #0A0A1A (vidrio azulado/violáceo)
- rgba(255,255,255,0.18), rgba(255,255,255,0.07), rgba(20,40,20,0.15), #E0FFE0, #0A1A0A (vidrio verdoso)
- rgba(255,255,255,0.12), rgba(255,255,255,0.04), rgba(0,0,0,0.2), #FFFFFF, #0D0D0D (vidrio neutro alto contraste)

**🔗 Ejemplo representativo**
- https://apple.com/ios-15 (referencial - iOS 15+ control center, widgets)

**✨ 5 características principales**
1. backdrop-filter: blur(20px) saturate(180%) — desenfoque trasero + saturación para legibilidad
2. background: rgba(255,255,255,0.08-0.25) + border: 1px solid rgba(255,255,255,0.12-0.18) — borde sutil define forma
3. box-shadow: 0 8px 32px rgba(0,0,0,0.12) — sombra suave flota el panel sobre fondo
4. border-radius 16-24px consistente; contenido interno con padding ≥ 24px para no tocar bordes difusos
5. Contenido detrás debe tener profundidad/imagen/gradiente — glass sobre color plano no funciona

**📖 Objetivo y filosofía**
Glassmorphism emula vidrio esmerilado: translúcido, refractivo, táctil. La filosofía es "profundidad sin peso": capas que flotan, revelan contexto trasero, pero mantienen legibilidad propia. Rechaza la opacidad binaria (visible/oculto) por la transparencia graduada. El blur trasero es funcional: desenfoca ruido, enfoca foco. Riesgo: rendimiento (GPU), accesibilidad (contraste variable), exceso decorativo. Éxito cuando el vidrio sirve jerarquía: modal > tarjeta > fondo.

**📅 Época predominante**
2020-2022 (pico: macOS Big Sur, iOS 13, Windows 11 Mica) → establecido 2023-presente (CSS backdrop-filter estándar)

**🎯 Usos típicos**
**Sistemas operativos** (Control Center, widgets), **dashboards superpuestos**, **modales/overlays**, **navigation bars**, **tooltips/rich hovers**, **login screens**

---

## 13. Memphis Design

**🎨 Paletas comunes**
- #FF0000, #FFFF00, #00FFFF, #FF00FF, #000000, #FFFFFF, #FF8800, #88FF00 (primarios/segundos + B/N + naranja/verde neón)
- #E6007E, #00A8E8, #FFD100, #00B87C, #FF6B35, #FFFFFF, #1A1A1A (Memphis original: rosa, cyan, amarillo, verde, naranja)
- #FF3366, #33FF99, #FFCC00, #6633FF, #FF66CC, #00FFFF, #000000 (neón 80s: rosa, verde, amarillo, púrpura, magenta, cyan)
- #FF0066, #00FFCC, #FFCC00, #9900FF, #FF3300, #FFFFFF, #333333 (variación dark: fondos grises oscuros)
- #FF6B6B, #4ECDC4, #FFE66D, #A8E6CF, #FF8B94, #FFFFFF, #2D2D2D (pastel Memphis: coral, menta, amarillo, verde claro, rosa)

**🔗 Ejemplo representativo**
- https://www.memphis-milano.com (grupo Memphis original - marco referencial)

**✨ 5 características principales**
1. Formas geométricas básicas combinadas caóticamente: círculos, triángulos, rectángulos, squiggles, terrazzo patterns
2. Patrones repetitivos de alto contraste: puntos, rayas, zigzag, chequerboard, confetti — como background o bordes
3. Paleta saturada sin armonía tradicional: complementarios, triádicos, clash intencional — "fealdad" curada
4. Tipografía display decorativa (Poynter, Cooper, estilos 80s) + sans-serif geométrica para cuerpo — mezcla deliberada
5. Composición asimétrica radical: elementos flotan, rotan 15-45°, overlapping sin grid aparente — "orden en el caos"

**📖 Objetivo y filosofía**
Memphis (grupo Ettore Sottsass, Milán 1981) rechazo el "buen gusto" moderno: funcionalismo, minimalismo, seriedad. Celebra lo kitsch, lo pop, lo efímero. La filosofía es "anti-diseño como diseño": la forma no sigue a la función; la forma *es* la expresión. Patrones terrazzo, laminados plásticos, colores chicles — materiales "baratos" elevados a arte. En digital: rechazo a design systems, sistemas de color accesibles, grids responsivos. Es nostalgia irónica del futuro que imaginaron los 80s.

**📅 Época predominante**
1981-1988 (original) → resurgimiento digital 2017-presente (Dribbble, branding startups, packaging)

**🎯 Usos típicos**
**Branding disruptivo**, **packaging**, **campañas verano/juventud**, **festivales**, **merchandising**, **landing pages lanzamiento producto**

---

## 14. Microinteracciones Pesadas

**🎨 Paletas comunes**
- #007AFF, #30D158, #FF9F0A, #FF3B30, #5856D6 (iOS system colors como acentos de estado)
- #1976D2, #4CAF50, #FF9800, #F44336, #9C27B0 (Material: primary, success, warning, error, secondary)
- #3B82F6, #22C55E, #F59E0B, #EF4444, #A855F7 (Tailwind 500 scale)
- #000000, #FFFFFF, #00FF00, #FF0000, #FFFF00 (B/N + semáforo: éxito, error, advertencia)
- #0D0D0D, #F5F5F5, #00D4AA, #FF6B6B, #FFD93D (Linear/Stripe: dark, light, success, error, warning)

**🔗 Ejemplo representativo**
- https://stripe.com (referencial - microinteracciones de pago, onboarding)

**✨ 5 características principales**
1. Cada acción tiene feedback visual < 100ms: ripple, scale, morph, color-shift, particle-burst — sin "dead clicks"
2. Transiciones state-driven (no time-driven): Framer Motion / Motion One / CSS @starting-style — entrada/salida por estado
3. Coreografía: stagger 50-100ms entre elementos relacionados (lista, grid, stepper) — ritmo percibido
4. Reduce motion respetado: prefers-reduced-motion desactiva decorativo, mantiene funcional (focus, loading)
5. Métricas de rendimiento: 60fps garantizado (will-change, transform/opacity only, GPU layers), ≤ 16ms frame budget

**📖 Objetivo y filosofía**
Microinteracciones Pesadas eleva el feedback de "nice-to-have" a "contractual": la interfaz responde *siempre*, *inmediatamente*, *significativamente*. La filosofía es "conversación táctil": cada toque genera respuesta física digital. No es decoración — es comunicación de estado: loading, success, error, empty, partial. Stripe, Linear, Apple definen el estándar: el usuario *siente* la app antes de pensarla. Inversión alta (dev + design + QA), retorno en confianza, retención, NPS.

**📅 Época predominante**
2018-presente (Framer Motion 2019, Motion One 2022, View Transitions API 2023)

**🎯 Usos típicos**
**Fintech/pagos** (Stripe, Mercury), **productivity apps** (Linear, Raycast, Notion), **onboarding flows**, **form validation**, **data mutation UIs**, **cualquier app premium**

---

## 15. Minimalismo Escandinavo

**🎨 Paletas comunes**
- #FFFFFF, #F5F5F5, #E8E8E8, #333333, #0066CC (blanco, gris claro, gris medio, carbón, azul nórdico)
- #FAFAFA, #F0F0F0, #DDDDDD, #444444, #008888 (off-white, gris cálido, teal apagado)
- #FFFFFF, #F8F8F8, #EAEAEA, #2D2D2D, #666666 (blanco puro, grises fríos, negro suave)
- #FDFDFD, #F2F2F2, #E0E0E0, #404040, #2E7D32 (blanco hueso, grises, verde bosque apagado)
- #FFFFFF, #F5F5F0, #E8E0D8, #3D3D3D, #C0392B (blanco, papel, arena, grafito, rojo ladrillo)

**🔗 Ejemplo representativo**
- https://muuto.com / https://normann-copenhagen.com (marcas nórdicas - marco referencial)

**✨ 5 características principales**
1. Espacio negativo generoso: padding ≥ 64px, gap ≥ 32px, max-width 720px — "aire" como elemento principal
2. Tipografía una sans-serif humanista (Inter, IBM Plex Sans, Danmark, Aperçu) 2-3 pesos; 18-20px body, line-height 1.7
3. Color: monocromo + 1 acento apagado (blue-grey, teal, sage, terracotta) — nunca saturado, nunca neón
4. Fotografía lifestyle natural: luz natural, texturas madera/lana/cerámica, personas reales — no stock pulido
5. Funcionalidad visible: botones claros, formularios simples, navegación obvia — sin hidden affordances

**📖 Objetivo y filosofía**
Minimalismo Escandinavo (Scandi) aplica "lagom" (lo justo, ni mucho ni poco) a interfaz. Calidez sobre frialdad: blancos rotos, maderas, texturas sutiles. Rechaza el minimalismo clínico (Apple hospitalario) por el minimalismo humano. La filosofía es "diseño para la vida cotidiana": duradero, honesto, accesible. Cada elemento gana su lugar por utilidad + belleza discreta. En digital: menos opciones, mejores defaults, cero dark patterns. Sostenibilidad visual: no cansa, no grita, envejece con gracia.

**📅 Época predominante**
1950-presente (diseño industrial nórdico) → adaptación digital 2015-presente (marcas DTC, wellness, home)

**🎯 Usos típicos**
**Marcas DTC lifestyle**, **wellness/salud**, **home decor**, **moda sostenible**, **apps bienestar**, **e-commerce premium**

---

## 16. Monocromático Arquitectónico

**🎨 Paletas comunes**
- #000000, #1A1A1A, #333333, #4D4D4D, #666666, #808080, #999999, #B3B3B3, #CCCCCC, #E6E6E6, #F2F2F2, #FFFFFF (12 pasos gris puro)
- #0D0D0D, #1A1A2E, #16213E, #1F4068, #2D6DA3, #3D8FD8, #5BA3E8, #85C1F0, #B0D9F8, #D0ECF8, #E8F5FA, #FFFFFF (azul arquitectónico: 12 tonos)
- #111111, #1F1F1F, #2D2D2D, #3B3B3B, #4A4A4A, #595959, #696969, #787878, #888888, #999999, #AAAAAA, #FFFFFF (grises cálidos 12 pasos)
- #000000, #141414, #282828, #3C3C3C, #505050, #646464, #787878, #8C8C8C, #A0A0A0, #B4B4B4, #C8C8C8, #FFFFFF (escala 12 pasos iguales)
- #0A0A0A, #1A1A1A, #2A2A2A, #3A3A3A, #4A4A4A, #5A5A5A, #6A6A6A, #7A7A7A, #8A8A8A, #9A9A9A, #AAAAAA, #FFFFFF (décadas de luminancia)

**🔗 Ejemplo representativo**
- https://www.archdaily.com (referencial - arquitectura, solo forma/luz/sombra)

**✨ 5 características principales**
1. Paleta única: 10-12 valores de luminancia de UN solo matiz (gris neutro o azul/verde apagado) — cero color acento
2. Tipografía una sola familia sans-serif geométrica (Helvetica, Univers, Inter, Space Grotesk) — peso/tamaño = única jerarquía
3. Grid arquitectónico: líneas de construcción visibles (hairlines 0.5px), módulos repetitivos, proporción áurea/raíz 2
4. Fotografía B/N arquitectónica: concreto, acero, vidrio, luz rasante — textura material como único ornamento
5. Espacio como material: márgenes, gutters, padding siguen mismo sistema modular que contenido — ritmo matemático

**📖 Objetivo y filosofía**
Monocromático Arquitectónico trata la interfaz como edificio: estructura, luz, proporción, material. Elimina el color como muletilla decorativa; la jerarquía surge de contraste luminántico, peso tipográfico, y ritmo espacial. La filosofía es "verdad estructural": lo que ves es la lógica del sistema. Inspiración: planos CAD, renders B/N, fotografía de arquitectura brutalista/moderna. En digital: design systems enterprise, dashboards densos, herramientas profesionales donde el color distrae del dato.

**📅 Época predominante**
2010-presente (paralelo a diseño suizo, base de design systems técnicos)

**🎯 Usos típicos**
**Design systems enterprise**, **dashboards analíticos densos**, **IDEs/editores**, **herramientas CAD/BIM**, **interfaces financieras**, **documentación técnica**

---

## 17. Neo-Brutalism

**🎨 Paletas comunes**
- #000000, #FFFFFF, #FFFF00, #FF0000, #00FF00 (B/N + amarillo advertencia + rojo error + verde éxito)
- #1A1A1A, #FFFFFF, #FFD700, #FF3333, #33FF33 (negro suave, blanco, oro, rojo, verde neón)
- #000000, #FFFFF0, #FFCC00, #CC0000, #00CC00 (marfil, amarillo mostaza, rojo ladrillo, verde bosque)
- #0D0D0D, #F5F5F5, #FFA500, #FF4444, #44FF44 (dark mode neo-brutal)
- #000000, #FFFFFF, #0000FF, #FF00FF, #00FFFF (primarios RGB puros + B/N)

**🔗 Ejemplo representativo**
- https://www.figma.com/community/file/1135232565238928946 (kit neo-brutalism Figma - marco referencial)

**✨ 5 características principales**
1. Bordes gruesos visibles: border: 3-4px solid #000000 en TODOS los contenedores, botones, inputs, imágenes
2. Sombras duras offset fijo: box-shadow: 6px 6px 0 0 #000000 (sin blur, sin rgba — sombra "sólida" estilo cómic)
3. Tipografía bold/extrabold (Inter Bold, Space Grotesk Bold, Plus Jakarta Sans Extrabold) tamaños grandes ≥ 20px body
4. Fondos de color plano saturado (amarillo, verde, azul, rosa) en bloques grandes — sin gradientes, sin texturas
5. Estados hover/active: translate(-3px, -3px) + shadow offset aumenta a 10px 10px 0 0 — "pop" físico

**📖 Objetivo y filosofía**
Neo-Brutalism toma la honestidad del brutalismo web y le da "piel": color, peso tipográfico, sombras cómicas. Es brutalismo accesible, jugable, memeable. La filosofía es "crudeza con carisma": expone la caja (border), la sombra (offset), el peso (bold) — pero lo hace divertido. Reacciona contra glassmorphism/neumorphism (vidrio/gelatina) con solidez de bloques de construcción. Popular en startups, dev tools, branding técnico: transmite "hecho por ingenieros, sin marketing".

**📅 Época predominante**
2021-presente (tendencia Figma/Dribbble/Twitter design community)

**🎯 Usos típicos**
**Dev tools**, **startups early-stage**, **landing pages técnico**, **documentación API**, **portfolios dev**, **merch branding**

---

## 18. Neón Arcade / Synthwave

**🎨 Paletas comunes**
- #0D0D0D, #1A1A2E, #16213E, #E94560, #00F5FF, #FF00FF, #FFFF00, #FF6B6B (dark + rosa/cian/magenta/amarillo neón)
- #000000, #0A0A0A, #111111, #FF0066, #00FFFF, #FFCC00, #6600FF (negro puro + 4 neones puros)
- #121212, #1E1E2E, #FF2D75, #00FFCC, #FFD700, #8B5CF6 (Material You dark + neón rosa/cian/oro/púrpura)
- #050505, #0D0D0D, #FF1493, #00FFFF, #FFD700, #ADFF2F (deep pink, cyan, gold, green-yellow neón)
- #000000, #111111, #FF00FF, #00FFFF, #FFFF00, #FF4444 (magenta, cian, amarillo, rojo neón clásico)

**🔗 Ejemplo representativo**
- https://awwwards.com/sites/synthwave (marco referencial)

**✨ 5 características principales**
1. Glow/neon effect: text-shadow: 0 0 10px #FF00FF, 0 0 20px #FF00FF, 0 0 40px #FF00FF; box-shadow idéntico en bordes
2. Fondos: gradientes radiales/conicos oscuros + grid lines cian/rosa (background-image: linear-gradient) simulando "grid cyberspace"
3. Tipografía: fonts monospace/pixel (JetBrains Mono, VT323, Orbitron, Rajdhani) + display sans condensada (Russo One)
4. Scanlines overlay: ::before { background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px) }
5. Animaciones loop: glow pulse 2s ease-in-out infinite, grid scroll diagonal, particles float — todo sincronizado a BPM imaginario

**📖 Objetivo y filosofía**
Neón Arcade / Synthwave evoca la estética de los 80s imaginando el futuro: arcade cabinets, VHS, Miami Vice, Blade Runner, Tron. La filosofía es "nostalgia del futuro que nunca llegó": optimismo tecnológico retro, exceso cromático, inmersión sensorial. No busca usabilidad — busca transporte. El usuario no "navega"; "juega" en un mundo de luz. En digital: gaming, crypto, streaming, eventos, marcas juventud. Riesgo: accesibilidad nula, fatiga visual, exceso decorativo.

**📅 Época predominante**
2016-presente (vaporwave → synthwave → cyberpunk 2077 hype → estética gaming/crypto mainstream)

**🎯 Usos típicos**
**Gaming/esports**, **crypto/Web3**, **streaming/música electrónica**, **eventos/festivales**, **marcas streetwear**, **landing pages hype**

---

## 19. Neumorphism

**🎨 Paletas comunes**
- #E0E5EC, #FFFFFF, #A3B1C6, #6B7A99, #2D3A5A (base arcilla fría + sombras azuladas)
- #F0F0F0, #FFFFFF, #D0D0D0, #A0A0A0, #808080 (neutro gris cálido)
- #E8E8E8, #FFFFFF, #C8C8C8, #A8A8A8, #888888 (gris puro)
- #D0D8E8, #FFFFFF, #B0C0D8, #8098B8, #506888 (azul grisáceo suave)
- #E0E0E0, #FFFFFF, #C0C0C0, #A0A0A0, #808080 (clásico Apple Calculator iOS 7)

**🔗 Ejemplo representativo**
- https://dribbble.com/shots/14391725-Neumorphism-UI-Kit (marco referencial Dribbble)

**✨ 5 características principales**
1. Dual shadow simétrica: box-shadow: 8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff (outset + inset = relieve convexo)
2. background: #E0E5EC (match con sombra clara) — elemento y fondo MISMO color; forma solo por sombra
3. border-radius 16-24px suave; border: none — sin contorno, el borde es transición de sombra
4. Estado "pressed": box-shadow: inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff (concavo = hundido)
5. Contraste crítico: WCAG AA falla a menudo — requiere color-contrast overlay o modo accesible alternativo

**📖 Objetivo y filosofía**
Neumorphism (nuevo + skeuomorphism) revive el tactilismo skeuomórfico pero "plano": botones que parecen salir de la pantalla (convexo) o hundirse (cóncavo). La filosofía es "interfaz como superficie física continua": pantalla = material maleable. Popularizado por Alexander Plyuto (2019), prometía "suavidad infinita". Realidad: problemas graves de accesibilidad (contraste), estado focus invisible, confusión affordance (¿es botón? ¿es tarjeta?). Legado: inspiró Claymorphism (más accesible) y soft UI.

**📅 Época predominante**
2019-2021 (pico Dribbble/Behance) → legado en Claymorphism/Soft UI 2022-presente

**🎯 Usos típicos**
**Concept designs**, **dashboards experimentales**, **smart home controls**, **music players**, **calculadoras**, **UI kits showcase**

---

## 20. Papel y Tinta / Editorial Tinta

**🎨 Paletas comunes**
- #1A1A1A, #F5F0E8, #E8E0D0, #CCCCCC, #8B0000 (tinta, papel viejo, márgenes, líneas, rojo rubrica)
- #0D0D0D, #FAF8F5, #F0EBE3, #D4C4B0, #2C3E50 (tinta densa, papel cálido, pergamino, azul tinta antigua)
- #000000, #FFFFFF, #EDEDED, #CCCCCC, #666666 (B/N puro + grises papel/acento)
- #2D2D2D, #FEFEFE, #F5F0E8, #D0C8C0, #8B4513 (tinta suave, papel, arena, sepia, marrón tinta hierro)
- #111111, #FCFCFC, #F0EDE5, #D8D0C8, #990000 (tinta, blanco hueso, papel envejecido, bordes, rojo carmín)

**🔗 Ejemplo representativo**
- https://www.nytimes.com/section/books (referencial - sección libros, tipografía serif, textura papel)

**✨ 5 características principales**
1. Textura papel sutil: background-image ruido 2-3% opacity + gradiente radial vignette suave (simula fibra/absorción tinta)
2. Tipografía serif de texto (Source Serif, Merriweather, Literata, Crimson) 18-20px, line-height 1.75-1.85, ligaduras activadas
3. Efecto "tinta": text-rendering: optimizeLegibility; filter: contrast(1.1) saturate(0.9) — simula absorción papel
4. Elementos manuscritos: firmas, anotaciones marginales, subrayados irregulares (SVG stroke variable width)
5. Jerarquía editorial clásica: capítular (drop cap), versalitas (small caps), epígrafe, colofón — rituales impresos

**📖 Objetivo y filosofía**
Papel y Tinta / Editorial Tinta no imita el papel — *es* papel digital. La filosofía es "materialidad honesta": la pantalla emite luz, pero el diseño la trata como superficie que absorbe tinta. Textura, grano, variación de tono, imperfección deliberada (kerning humano, baseline drift 0.5px). Rechaza la perfección vectorial por la calidez analógica. Para lectura larga: reduce fatiga, aumenta inmersión, crea ritual. No es skeuomorfismo (imita objeto) — es materialidad (usa propiedades del medio).

**📅 Época predominante**
2018-presente (Medium, Substack, Notion, apps journaling, reading apps)

**🎯 Usos típicos**
**Apps journaling/diario**, **reading apps**, **newsletters long-form**, **blogs personales**, **documentación narrativa**, **portfolio writers**

---

## 21. Pixel Art UI

**🎨 Paletas comunes**
- #000000, #FFFFFF, #FF0000, #00FF00, #0000FF, #FFFF00, #FF00FF, #00FFFF (8-bit: B/N + 6 primarios/segundos)
- #1A1A2E, #16213E, #0F3460, #E94560, #FFFFFF, #FFD700, #00FFFF, #FF6B6B (PICO-8 palette 16 colores)
- #000000, #2D2D2D, #5A5A5A, #878787, #B4B4B4, #E1E1E1, #FFFFFF, #FF4444 (Game Boy 4 grises + rojo)
- #0D0D0D, #1A1A1A, #2D2D2D, #404040, #5D5D5D, #7A7A7A, #9E9E9E, #C8C8C8, #FFFFFF (NES 9 tonos)
- #000000, #111111, #222222, #333333, #444444, #555555, #666666, #777777, #888888, #999999, #AAAAAA, #BBBBBB, #CCCCCC, #DDDDDD, #EEEEEE, #FFFFFF (16-step grayscale)

**🔗 Ejemplo representativo**
- https://www.piskelapp.com (editor pixel art - marco referencial)

**✨ 5 características principales**
1. Canvas pixel-perfect: image-rendering: pixelated / crisp-edges; sin anti-aliasing; escalado entero (1x, 2x, 3x, 4x)
2. Paleta indexada fija (16-256 colores); dithering patrón (Bayer, Floyd-Steinberg) para gradientes simulados
3. Tipografía bitmap/8x8/16x16px (Press Start 2P, VT323, Minecraftia, Pixeloid) — sin subpixel rendering
4. Animaciones frame-by-frame (sprite sheets) a 12-24fps; easing "stepped" (steps() CSS) — no interpolación
5. UI elements como sprites: botones 16x16/32x32px, bordes 1-2px, esquinas duras (0 border-radius)

**📖 Objetivo y filosofía**
Pixel Art UI abraza la restricción como estética: cada pixel es decisión deliberada. La filosofía es "honestidad de resolución": no fingimos vectores; celebramos la cuadrícula. Evoca nostalgia gaming (NES, Game Boy, DOS) pero funciona como sistema visual coherente: legible, ligero, reconocible al instante. En digital: retro-gaming, herramientas dev, educación coding, branding indie. Accesibilidad: alto contraste nativo, escalado entero preserva nitidez, motion reducido natural (frames discretos).

**📅 Época predominante**
1980-1995 (hardware 8/16-bit) → renacimiento indie 2010-presente (Minecraft, Celeste, Stardew Valley, PICO-8)

**🎯 Usos típicos**
**Juegos retro/indie**, **herramientas aprendizaje programación**, **consolas fantasy (PICO-8, TIC-80)**, **branding tech nostálgico**, **dashboards dev**, **educación STEM**

---

## 22. Skeuomorfismo Refinado

**🎨 Paletas comunes**
- #8B4513, #A0522D, #D2691E, #DEB887, #F5DEB3 (cuero/madera: marrón, siena, chocolate, trigo, trigo claro)
- #1C1C1C, #2D2D2D, #3D3D3D, #C0C0C0, #E0E0E0 (metal cepillado: negro, grafito, acero, plata, aluminio)
- #FFFFFF, #F5F5F0, #E8E0D0, #D0C0B0, #8B7355 (papel/pergamino: blanco, hueso, pergamino, arena, sepia)
- #0F0F0F, #1A1A1A, #2D2D2D, #FFD700, #FFA500 (vidrio oscuro + oro/ámbar acentos)
- #800000, #B22222, #CD5C5C, #F0E68C, #FFF8DC (cuero rojo/borgoña: granate, ladrillo, indio, caqui, cornsilk)

**🔗 Ejemplo representativo**
- https://www.apple.com/ios/ios-6/ (iOS 6 - pico skeuomorfismo Apple - marco histórico)

**✨ 5 características principales**
1. Materiales fotorrealistas renderizados en CSS/Canvas: cuero (ruido + gradiente radial), metal (gradiente lineal anisotrópico), papel (fibra + vignette), vidrio (reflection + refraction)
2. Iluminación global consistente: light source fija (top-left 45°); sombras proyectadas, highlights especulares, occlusion ambiente en bordes
3. Affordance física 1:1: botones con relieve convexo (bevel + highlight top + shadow bottom), sliders con track hundido, toggles que "giran"
4. Texturas tileables de alta resolución (512x512px+) aplicadas via background-image + background-size: cover
5. Transiciones físicas: press = scale(0.96) + shadow collapse + highlight invert; release = spring back (cubic-bezier(0.17, 0.67, 0.83, 0.67))

**📖 Objetivo y filosofía**
Skeuomorfismo Refinado no es el skeuo kitsch de 2010 (cuero cosido, papel rasgado) — es *material honesty* digital. Cada superficie tiene propiedades físicas coherentes: reflectividad, rugosidad, espesor, masa. La filosofía es "transferencia de modelo mental": el usuario ya sabe cómo funciona un botón físico, una perilla, una página — la interfaz no requiere aprendizaje. Refinado = restraint: sin ornamento gratuito, solo materialidad funcional. iOS 6 era exceso; versión 2024+ es sutileza: micro-texturas, PBR (physically based rendering) en WebGL, respeto a prefers-reduced-motion.

**📅 Época predominante**
2007-2013 (iOS 1-6, early Android) → refinamiento moderno 2022-presente (visionOS, spatial computing, high-end automotive UI)

**🎯 Usos típicos**
**Spatial computing/VR/AR** (visionOS), **automotive HMI premium**, **audio pro/hardware controllers**, **smart home tactile**, **instrumentos musicales digitales**, **luxury brand experiences**

---

## 23. Soft UI / Pastel Calmante

**🎨 Paletas comunes**
- #FFB3BA, #FFDFBA, #FFFFBA, #BAFFC9, #BAE1FF (pastel rainbow: rosa, melocotón, amarillo, menta, azul bebé)
- #FADADD, #F5E6E8, #E8F5E9, #E3F2FD, #F3E5F5 (Material pastel: red-50, pink-50, green-50, blue-50, purple-50)
- #FFF0F5, #F0FFF0, #FFF8E1, #E8F5E9, #EDE7F6 (HTML pastel: lavenderblush, honeydew, cornsilk, mintcream, lavender)
- #FFE4E1, #FFE4B5, #F0FFF0, #E0FFFF, #E6E6FA (mistyrose, moccasin, honeydew, lightcyan, lavender)
- #FCE4EC, #FFF3E0, #E8F5E9, #E3F2FD, #F3E5F5 (pastel warm: rosa, naranja, verde, azul, púrpura - 100 opacity)

**🔗 Ejemplo representativo**
- https://www.headspace.com (referencial - wellness, paleta pastel, redondeo suave)

**✨ 5 características principales**
1. Paleta pastel esclusiva: HSL saturation 20-40%, lightness 85-95% — cero colores saturados, cero negro puro (#1A1A1A máx)
2. Border-radius extremo: 24-32px tarjetas, 50% botones/avatares, 100px contenedores — todo orgánico, cero esquinas
3. Sombras suaves difusas: box-shadow: 0 4px 24px rgba(0,0,0,0.04-0.08) — blur alto, opacity baja, sin offset duro
4. Tipografía redondeada (Nunito, Quicksand, Varela Round, Inter Variable opsz) — letter-spacing 0.02em, font-weight 400-500
5. Motion lento y elástico: transition: all 400-600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) — "respiración" en hover/tap

**📖 Objetivo y filosofía**
Soft UI / Pastel Calmante diseña para sistema nervioso: reduce cortisol, invita a quedarse. La filosofía es "gentileza como default": nada grita, nada apunta, nada exige. Colores pastel = seguridad evolutiva (cielo al atardecer, flores, piel). Redondeo = ausencia de amenaza (bordes afilados = peligro). Sombras difusas = profundidad sin peso. Motion elástico = respuesta viva, no mecánica. Usado en salud mental, wellness, apps niños, onboarding sensible. Riesgo: puede sentirse infantil, falta de autoridad, bajo contraste texto.

**📅 Época predominante**
2018-presente (Headspace, Calm, Duolingo, apps wellness, fintech amigable)

**🎯 Usos típicos**
**Salud mental/wellness**, **apps infantiles/educativas**, **fintech accesible**, **onboarding sensible**, **healthcare paciente**, **meditación/sueño**

---

## 24. Swiss Design Moderno (tokenizado)

**🎨 Paletas comunes**
- #000000, #FFFFFF, #F2F2F2, #E0E0E0, #1976D2 (tokens: color-bg, color-surface, color-border, color-muted, color-primary)
- #121212, #1E1E1E, #2D2D2D, #BBBBBB, #90CAF9 (dark tokens: bg, surface, border, muted, primary)
- #000000, #FFFFFF, #F5F5F5, #757575, #D32F2F (alto contraste: bg, fg, surface, muted, error)
- #0A0A0A, #FAFAFA, #EEEEEE, #9E9E9E, #0066CC (brand tokens: bg, fg, surface, muted, brand)
- #000000, #FFFFFF, #E8E8E8, #666666, #008888 (teal variant: bg, fg, surface, muted, accent)

**🔗 Ejemplo representativo**
- https://m3.material.io (Material Design 3 - design tokens reference)

**✨ 5 características principales**
1. Design tokens como única fuente de verdad: color, spacing, typography, elevation, radius, motion — JSON/YAML → CSS vars / Figma variables / iOS SwiftUI / Android Compose
2. Grid fluido 4px/8px base: space-1=4px, space-2=8px... space-8=32px; container max-width 1280px/1440px; breakpoints tokenizados
3. Tipografía sistemática: 1 familia (Inter/IBM Plex/Roboto Flex), 5-6 size tokens (display, headline, title, body, label, caption), 3 weights (400, 500, 600)
4. Color semántico no estético: primary/secondary/tertiary, success/warning/error, surface/background/outline — nunca "blue-500" en código
5. Componentes atómicos composables: Button, Input, Card, Dialog, Table — cada uno con variants (size, tone, state) definidos en tokens

**📖 Objetivo y filosofía**
Swiss Design Moderno (tokenizado) es el Estilo Suizo industrializado: decisiones de diseño codificadas, versionadas, distribuidas. La filosofía es "consistencia a escala": 500 ingenieros, 50 diseñadores, 5 plataformas — mismo lenguaje visual. Tokens = contrato entre diseño e ingeniería. Cambio de marca = editar tokens, recompilar, deploy. No "pixel perfect" — "token perfect". Elimina drift, acelera delivery, garantiza accesibilidad (tokens validados WCAG). Es Swiss Design para organizaciones, no para carteles.

**📅 Época predominante**
2018-presente (Design Tokens W3C Community Group, Figma Variables 2023, Style Dictionary, Tokens Studio)

**🎯 Usos típicos**
**Design systems enterprise**, **organizaciones multi-plataforma**, **productos regulados (banca, salud, gov)**, **equipos distribuidos**, **white-label/SaaS**, **cualquier producto a escala**

---

## 25. Terminal / Code Aesthetic

**🎨 Paletas comunes**
- #000000, #00FF00, #00CC00, #008800, #FFFFFF (classic green phosphor: bg, bright, normal, dim, fg)
- #0D1117, #58A6FF, #79C0FF, #A5D6FF, #D1D5DB (GitHub dark: bg, blue, light-blue, brighter, fg-muted)
- #1E1E1E, #D4D4D4, #9CDCFE, #CE9178, #4EC9B0 (VS Code dark: bg, fg, blue, orange, teal)
- #282A36, #F8F8F2, #BD93F9, #FF79C6, #50FA7B (Dracula: bg, fg, purple, pink, green)
- #000000, #FFFFFF, #FFFF00, #FF0000, #00FFFF (amber/white: bg, fg, warn, error, link)

**🔗 Ejemplo representativo**
- https://github.com (referencial - code view, terminal, monospace everything)

**✨ 5 características principales**
1. Tipografía exclusivamente monospace (JetBrains Mono, Fira Code, Monaspace, Iosevka, Cascadia Code) — ligaduras programáticas activadas
2. Paleta sintaxis highlighting: 16-32 colores semánticos (keyword, string, function, variable, comment, type, constant, operator)
3. Layout: grid de caracteres fijo (ch units); 80-100ch ancho; prompt `user@host:~$` ; cursor blink 530ms block/bar
4. Chrome mínimo: sin bordes redondeados, sin sombras, sin iconos (solo texto/emoji Unicode), scrollbar nativa o hidden
5. Interacción CLI: comandos tecleados, autocomplete tab, history ↑↓, stdout/stderr streams, exit codes — UX = REPL

**📖 Objetivo y filosofía**
Terminal / Code Aesthetic expone la computación cruda: texto, streams, procesos. La filosofía es "honestidad computacional": la interfaz *es* la línea de comandos, no una metáfora visual. Usuario = operador, no consumidor. Eficiencia extrema: atajos teclado, scripting, composición (pipes), reproducibilidad. En digital: dev tools, CLI apps, infra dashboards, AI coding agents, server management. Estética adoptada por no-devs como "hacker chic" — pero versión pura es herramienta, no pose.

**📅 Época predominante**
1970-presente (VT100, xterm, bash, zsh, fish) → estética mainstream 2015-presente (VS Code, Warp, Raycast, dev influencers)

**🎯 Usos típicos**
**IDEs/editores**, **CLIs/TUIs**, **infra/dashboards**, **dev tools**, **AI coding interfaces**, **server management**, **data pipelines**

---

## 26. Tipografía Cinética

**🎨 Paletas comunes**
- #000000, #FFFFFF, #FF0000, #FFFF00, #00FFFF (B/N + primarios puros para acentos de motion)
- #0D0D0D, #FAFAFA, #FF3366, #33FF99, #6633FF (dark + neón rosa/verde/púrpura)
- #FFFFFF, #000000, #FF6600, #00CCFF, #CC00FF (light + naranja/cian/magenta)
- #1A1A1A, #F5F5F5, #FFD700, #FF4444, #44FF44 (oro + rojo/verde neón)
- #000000, #FFFFFF, #000000, #FFFFFF, #000000 (estricto B/N — tipografía ES el color)

**🔗 Ejemplo representativo**
- https://www.awwwards.com/sites/kinetic-typography (marco referencial)

**✨ 5 características principales**
1. Texto como protagonista visual: variable fonts (wght, wdth, opsz, slnt, GRAD) animados frame-by-frame via CSS @property / JS
2. Layout impulsado por texto: palabras/letras posicionadas individualmente (SplitType, Motion One, GSAP) — no cajas, glifos
3. Scroll-driven animations: ScrollTimeline / ViewTimeline API — texto revela, escala, rota, deforma, colorea al scroll
4. Interacción directa: hover letter = scale/rotate/color-shift; click = explode/reassemble; drag = estela textual
5. Performance crítico: will-change: transform, opacity; font-variation-settings animado en GPU; < 16ms/frame; reduce-motion = static fallback

**📖 Objetivo y filosofía**
Tipografía Cinética hace del texto la interfaz: no hay botones, tarjetas, iconos — solo palabras que se mueven, respiran, reaccionan. La filosofía es "leer es interactuar": la lectura misma es la navegación. Variable fonts (OpenType 1.8+) permiten morfología continua: peso, ancho, inclinación, grado, optical size — todo animable. Rechaza la separación contenido/presentación: la tipografía *es* la arquitectura. Riesgo altísimo: accesibilidad (screen readers, dislexia, motion sickness), rendimiento, SEO, internacionalización (CJK variable fonts raros).

**📅 Época predominante**
2020-presente (Variable fonts soporte universal 2020, Scroll-driven animations 2023, SplitType 2022)

**🎯 Usos típicos**
**Landing pages hero**, **portfolios tipográficos**, **campañas branding**, **editorial experimental**, **arte web**, **hero sections premium**

---

## 27. Vaporwave

**🎨 Paletas comunes**
- #FF6EC7, #FFB3DE, #A8E6CF, #FFD3B6, #C7CEEA (pastel vaporwave: rosa, lila, menta, durazno, lavanda)
- #8A2BE2, #FF1493, #00FFFF, #FFFF00, #FF4500 (blueviolet, deeppink, cyan, yellow, orangered - neón 90s)
- #2D1B4E, #4A148C, #6A1B9A, #E1BEE7, #F3E5F5 (purpuras profundos + pastel)
- #FF00FF, #00FFFF, #FFFF00, #FF69B4, #ADFF2F (magenta, cyan, amarillo, hotpink, greenyellow - glitch palette)
- #1A1A2E, #16213E, #FF00FF, #00FFFF, #FFFFFF (dark + magenta/cyan/white - mallsoft/dark vaporwave)

**🔗 Ejemplo representativo**
- https://vaporwave.fandom.com (wiki estética - marco referencial)

**✨ 5 características principales**
1. Glitch estético intencional: RGB channel shift (text-shadow: 2px 0 #FF00FF, -2px 0 #00FFFF), scanlines, noise overlay, VHS tracking lines
2. Imaginería 90s/00s: estatuas griegas (David, Venus), palmeras, atardeceres gradients, Windows 95/98 UI, fuentes early web (Trebuchet, Comic Sans, Impact)
3. Tipografía: full-width text （　ＦＵＬＬ　ＷＩＤＴＨ　）, japanese characters 蒸気波, stretch/kerning extremo, outline text, drop shadow grueso
4. Gradientes "aesthetic": background: linear-gradient(135deg, #FF6EC7 0%, #A8E6CF 50%, #C7CEEA 100%) + grain/noise 15% opacity
5. Lo-fi / degradado deliberado: JPEG artifacts simulados, color banding, resolution downscale, CRT curvature — "calidad mala" como estilo

**📖 Objetivo y filosofía**
Vaporwave (微信波) es crítica cultural disfrazada de estética: nostalgia por un futuro corporativo que nunca llegó (capitalismo tardío, mall culture, tecnología prometida). La filosofía es "aceleracionismo irónico": apropiarse de la imagen corporativa pulida (logos, fuentes, colores) y degradarla, glitchearla, humanizarla. No es "diseño" — es comentario. En digital: arte web, music players, albums Bandcamp, sitios experimentales, branding anti-corporativo. Mainstream cooptado (2018+) diluyó el mensaje; versión pura sigue siendo subversiva.

**📅 Época predominante**
2010-2015 (origen Bandcamp/Reddit/Tumblr) → mainstream 2016-2020 → pos-vaporwave 2021-presente (aesthetic TikTok, Y2K revival)

**🎯 Usos típicos**
**Arte web experimental**, **music/album sites**, **branding anti-corporativo**, **proyectos culturales**, **landing pages irónicas**, **comunidades niche**

---

## 28. Web3 / Crypto Luxury

**🎨 Paletas comunes**
- #0D0D0D, #FFFFFF, #FFD700, #FFA500, #FF8C00 (negro, blanco, oro, naranja, ámbar - wealth palette)
- #050505, #FAFAFA, #00FF88, #00D4AA, #00AA88 (dark + emerald/teal neon - "green means go" crypto)
- #0A0A0A, #F5F5F5, #8B5CF6, #A855F7, #D946EF (purple/violet gradient - Ethereum/Solana branding)
- #000000, #FFFFFF, #FF00FF, #00FFFF, #FFFF00 (RGB neón puro - degen/trading terminals)
- #111111, #FEFEFE, #F59E0B, #FBBF24, #FDE68A (amber/gold scale - tokenomics, staking, yields)

**🔗 Ejemplo representativo**
- https://ethereum.org (referencial - branding Ethereum, purple gradient, glassmorphism)

**✨ 5 características principales**
1. Gradientes mesh/blur premium: background: radial-gradient(ellipse at 20% 20%, #8B5CF6 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #00D4AA 0%, transparent 50%)
2. Glassmorphism oscuro: backdrop-filter: blur(40px); background: rgba(10,10,10,0.8); border: 1px solid rgba(255,255,255,0.08)
3. Tipografía display serif de lujo (Fraunces, Playfair Display, Editorial New, Canela) + mono para datos (JetBrains Mono)
4. Métricas en tiempo real: contadores animados (count-up), price tickers WebSocket, gas fees live, APY calculators — datos como hero
5. Iconografía: hexágonos, redes nodal, cadenas, diamantes, cristales — geometría sagrada "trustless" en SVG animado

**📖 Objetivo y filosofía**
Web3 / Crypto Luxury vende "el futuro del dinero" mediante estética de riqueza digital: oro, púrpura, esmeralda, vidrio, luz. La filosofía es "escasez visual = valor percibido": gradientes imposibles en impresión, glassmorphism que requiere GPU, tipografía variable de $500/licencia, datos live que cuestan infra. Transmite: esto es temprano, esto es exclusivo, esto vale. Crítica: a menudo estilo sobre sustancia; accesibilidad nula; pattern dark (FOMO, urgency fake). Madurez 2024+: más sobrio, menos neón, más tipografía editorial, más "institucional".

**📅 Época predominante**
2017-2021 (ICO boom, DeFi summer, NFT mania) → institucional 2022-presente (ETFs, tradfi entry, regulatory clarity)

**🎯 Usos típicos**
**DeFi protocols**, **NFT marketplaces**, **wallets**, **DAOs**, **trading terminals**, **token launchpads**, **Web3 infra**

---

## 29. Wireframe / Lo-Fi Funcional

**🎨 Paletas comunes**
- #FFFFFF, #000000, #CCCCCC, #999999, #666666 (papel, lápiz, gris claro, gris medio, gris oscuro)
- #F5F5F5, #1A1A1A, #E0E0E0, #B0B0B0, #808080 (gris muy claro, carbón, grises intermedios)
- #FFFFFF, #000000, #0066CC, #CCCCCC, #999999 (wireframe azul: enlaces/acciones en azul, resto B/N)
- #FAFAFA, #2D2D2D, #DDDDDD, #AAAAAA, #777777 (off-white, dark grey, grises)
- #FFFFF0, #111111, #E8E8E8, #B8B8B8, #888888 (papel envejecido, tinta, grises)

**🔗 Ejemplo representativo**
- https://wireframesketcher.com / https://balsamiq.com (herramientas wireframing - marco referencial)

**✨ 5 características principales**
1. Solo líneas y cajas: border: 1-2px solid #999; background: transparent o #FAFAFA; sin border-radius (o 2px)
2. Placeholders textuales: [LOGO], [HEADLINE], [BODY COPY], [BUTTON], [IMAGE 16:9] — contenido = etiqueta de función
3. Tipografía mono/sans una sola: 16px base; jerarquía solo por tamaño (24, 18, 16, 14, 12) y peso (bold/normal)
4. Anotaciones laterales: flechas + notas manuscritas (font: 'Comic Sans MS', 'Caveat', 'Patrick Hand') explicando flujo
5. Interacción: enlaces subrayados azul (#0066CC), botones [BUTTON] con border, hover = background #EEE — funcional, no bonito

**📖 Objetivo y filosofía**
Wireframe / Lo-Fi Funcional prioriza estructura sobre piel: arquitectura de información, flujos, jerarquía, labeling. La filosofía es "decidir antes de decorar": cada pixel en wireframe es decisión de UX; en high-fi es decisión de UI. Herramienta de pensamiento, no entrega. En digital: discovery phase, alignment stakeholders, usability testing early, dev handoff specs, design sprints. Ventaja: barato iterar, foco en problemas correctos, evita "premature polish". Riesgo: stakeholders confunden wireframe con diseño final; desarrolladores implementan literalmente.

**📅 Época predominante**
1990-presente (paper wireframes → Visio → Axure → Balsamiq → Figma/FigJam → tldraw/excalidraw)

**🎯 Usos típicos**
**Discovery/UX research**, **design sprints**, **stakeholder alignment**, **usability testing**, **dev specs**, **product strategy**

---

## 30. Y2K Revival

**🎨 Paletas comunes**
- #FF00FF, #00FFFF, #FFFF00, #FF6600, #6600FF (magenta, cyan, amarillo, naranja, púrpura - neón Y2K)
- #FF1493, #00FF7F, #FFD700, #FF4500, #1E90FF (deeppink, springgreen, gold, orangered, dodgerblue)
- #6600CC, #FF0066, #00CCFF, #CCFF00, #FF3399 (púrpura, rosa, cyan, lima, pink - iridiscente)
- #000000, #FF00FF, #00FFFF, #FFFFFF, #FFCC00 (dark Y2K: negro + neones + oro)
- #FFB6C1, #ADD8E6, #98FB98, #FFDAB9, #DDA0DD (pastel Y2K: lightpink, lightblue, lightgreen, peach, plum)

**🔗 Ejemplo representativo**
- https://web.archive.org/web/2000*/https://www.microsoft.com (Windows 2000/XP era - marco histórico)

**✨ 5 características principales**
1. Efectos "futuristas" 2000: lens flare, drop shadows gruesos (4px 4px 0), bevel/emboss, gradients metálicos (chrome, gold, silver)
2. Tipografía: Trebuchet MS, Verdana, Tahoma, Comic Sans MS, Impact, Arial Black — small caps, letter-spacing 0.1-0.2em, text-shadow offset
3. UI elements: botones 3D (outset/inset), scrollbars personalizadas, cursores custom (.cur), marcos con border: 2px groove/ridge
4. Fondos: patrones repeating (cuadros, rayas, puntos), gradientes radiales "luz divina", texturas "brushed metal", agua/burbujas
5. Animaciones: <marquee>, blink, GIFs animados, page transitions (revealTrans), cursor trails — web 1.0 maximalista

**📖 Objetivo y filosofía**
Y2K Revival (Year 2000) recupera la estética del optimismo tecnológico milenario: "el futuro es brillante, curvo, metálico, rosa". La filosofía es "ironía nostálgica": sabemos que el 2000 no trajo coches voladores, pero jugamos a que sí. Gen Z reinterpreta la estética que no vivió (MySpace, Winamp, ICQ, early Flash) como "vintage cool". En digital: branding moda/beauty, música pop, TikTok aesthetic, landing pages lanzamiento, merchandising. No busca usabilidad — busca vibe cultural compartida.

**📅 Época predominante**
1998-2004 (original: Windows 98/2000/ME/XP, Mac OS 9, early Flash, Web 1.0) → revival 2020-presente (TikTok, Gen Z, moda Y2K, web3)

**🎯 Usos típicos**
**Moda/beauty Gen Z**, **música pop/artistas**, **TikTok/social content**, **merchandising**, **landing pages hype**, **branding nostalgia irónica**