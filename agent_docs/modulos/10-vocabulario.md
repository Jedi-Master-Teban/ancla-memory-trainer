# Módulo 10 — Vocabulario (alfa)

Estado: **propuesta con investigación**, rama `alpha/vocabulario`. Nada de esto
está en `main`. Decisión de fondo en ADR-037. Investigación del 2026-10-25;
todo lo marcado «verificado» se comprobó ese día contra la fuente (petición
real, código fuente o texto del artículo) y lo marcado «sin verificar» no.

## 1. Qué es y qué no es

Una categoría para aprender **palabras sueltas, sin orden**: un idioma, o un
tema («cocina», «anatomía»). Cada palabra es una tarjeta independiente con su
propio calendario FSRS.

| | Listas (módulo 04) | Vocabulario |
|---|---|---|
| Orden | Importa: una cadena de eslabones | No importa |
| Unidad de estudio | La cadena entera | Cada palabra |
| Técnica | Cadena de asociaciones | Imagen (y, opcional, palabra clave) |
| Agrupación | Por lista | Por tema |

**Nombre: «Vocabulario».** En Ancla «palabra» ya significa la palabra del
colgadero; usarla también aquí confundiría.

No se siembra contenido (regla del proyecto: no inventar contenido de
dominio). El usuario crea sus palabras; una importación (§9) cubre «todo un
idioma».

## 2. La técnica de la palabra clave (qué es la «nota opcional»)

Es lo que ofrece el campo opcional «Truco para recordarla». Verificado en el
texto de Atkinson y Raugh (1975, informe técnico de acceso abierto): el método
divide el estudio de cada palabra en **dos enlaces**.

1. **Enlace acústico:** se liga la palabra extranjera a una palabra de tu
   idioma —la *palabra clave*— que **suena como una parte** de ella.
2. **Enlace de imagen:** se imagina la palabra clave **interactuando** con el
   significado.

Criterios que ellos aplican a la palabra clave: (a) suena lo más posible a
una parte de la palabra extranjera, (b) es fácil formar una imagen que la una
al significado, (c) es distinta de las demás palabras clave del vocabulario.

Ejemplos del propio informe (ruso → inglés): *vnimanie* («pneumonia») =
ATTENTION; *delo* («jello») = AFFAIR.

Ejemplo adaptado para quien habla español y aprende inglés: **rope**
(cuerda) suena a «ropa» → se imagina una cuerda tendida llena de ropa.

El campo es **opcional** porque muchas palabras (cognados, sustantivos
concretos con buena foto) no lo necesitan.

### Lo que dice la evidencia (y lo que no)

Verificado en el informe de Atkinson y Raugh (1975):
- 120 palabras rusas, tres días de estudio, grupo con el método contra grupo
  de control sin instrucciones. En la prueba global, **72 % contra 46 %**.
  Hubo además una prueba sorpresa 30–60 días después (promedio 43), en la que
  el grupo del método volvió a superar al de control.
- El método rindió **igual con palabras poco imaginables**: del nivel más
  imaginable al menos, el grupo del método acertó .75, .71, .71 y .72 (sin
  diferencia significativa entre niveles); el de control, .55, .45, .48 y .38.
  Es la base de la recomendación para palabras abstractas (§8).
- Límites que **ellos mismos** señalan: las palabras clave las eligió un
  comité, no los alumnos; la prueba fue ruso→inglés (reconocer el
  significado); y el método «puede ser útil solo en las primeras etapas del
  aprendizaje de un idioma y más para unas clases de palabras que otras», y
  «puede no ser apropiado para todos los alumnos».

Referencias cuya existencia se verificó en Crossref (no se leyó su texto, así
que no se cita ningún resultado de ellas):
- Atkinson (1975), *Mnemotechnics in second-language learning*, American
  Psychologist, doi:10.1037/h0077029.
- Pressley, Levin y Delaney (1982), *The mnemonic keyword method*, Review of
  Educational Research, doi:10.3102/00346543052001061.
- Wang, Thomas y Ouellette (1992), *Keyword mnemonic and retention of
  second-language vocabulary words*, J. Educational Psychology,
  doi:10.1037/0022-0663.84.4.520.
- Wyra, Lawson y Hungi (2007), *The mnemonic keyword method: the effects of
  bidirectional retrieval training and of ability to image on foreign language
  vocabulary recall*, Learning and Instruction,
  doi:10.1016/j.learninstruc.2007.02.008.
- Hulstijn (1996), capítulo en *Second Language Vocabulary Acquisition*,
  doi:10.1017/cbo9781139524643.015.
- Nakata (2011), *Computer-assisted second language vocabulary learning in a
  paired-associate paradigm: a critical investigation of flashcard software*,
  CALL, doi:10.1080/09588221.2010.520675; Kaitsu y Nakata (2025), *Analysis of
  smartphone-based flashcard apps for second language vocabulary acquisition*,
  CALL, doi:10.1080/09588221.2025.2481396. **Lectura pendiente antes de
  diseñar los modos de repaso.**

Lorayne: su capítulo de idiomas se conoce solo por resúmenes de terceros
(sustituir la palabra extranjera por una palabra o frase que suene parecida y
formar una imagen absurda). **No se cita su texto**, igual que en ADR-031.

## 3. Datos (migración 009, aditiva)

`Categoria` gana `'vocabulario'` y **reemplaza a la reservada
`'palabra_clave'`** (MODELO-DATOS §1.3: sin `CHECK`, no hay reconstrucción de
tabla). Un mazo sembrado vacío, como Listas y Números (ADR-020).

```
vocabulario_tema(id TEXT PK, nombre TEXT, creado_en TEXT)

tarjeta (categoria='vocabulario')
  contenido_frente   la palabra que se aprende («rope»)
  contenido_reverso  el significado («cuerda»)
  metadata_categoria { temaId, truco?: string, imagenId?: string }

imagen(id TEXT PK, mime TEXT, ancho INT, alto INT, bytes BLOB,
       origen TEXT  -- 'propia' | 'openverse' | 'wikimedia'
       titulo, autor, licencia, licencia_url, enlace_origen, creada_en)
```

**Imágenes dentro de SQLite (BLOB).** `expo-sqlite` acepta `Uint8Array` como
valor enlazado (`SQLiteBindValue`, verificado en `node_modules`). Así las
copias automáticas, el respaldo a archivo y la recuperación (ADR-029) cubren
las imágenes sin trabajo extra, y los créditos viajan con la imagen.

Costo y por qué es una apuesta de la alfa: cada copia automática serializa la
base entera en memoria. **Presupuesto de la alfa: 300 imágenes** (≈ 15–30 MB).
Antes de subirlo hay que medir `serializeAsync` en WebKit (spike S1). Si no
alcanza, las imágenes pasan a archivos de OPFS y entran al respaldo como
paquete aparte.

## 4. Imagen: tamaño y formato (ensayo hecho)

Se probaron 4 fotos reales de Openverse en Chromium y en **WebKit (el motor
del iPhone)**, a 400, 640 y 800 px, calidad 0.82.

| Ancho | JPEG en Chromium | JPEG en WebKit |
|---|---|---|
| 400 px | 18–25 KB | 33–47 KB |
| 640 px | 38–56 KB | 68–100 KB |
| 800 px | 55–81 KB | 91–141 KB |

- **No usar WebP.** `canvas.toBlob('image/webp')` en WebKit **devuelve PNG**
  (272 KB a 400 px, 902 KB a 800 px): Safari no sabe codificar WebP. JPEG es
  el único formato razonable.
- A 260 px de ancho en pantalla 3x la diferencia entre 400, 640 y 800 px es
  sutil: se nota solo en detalles finos (pelaje, rayos de la bici); 800 px no
  aporta sobre 640.
- Las fuentes ya entregan tamaños útiles: Openverse `/thumb/` da **600 px**
  (medido en una; 17–46 KB en las cuatro) y Wikimedia **500 px** (≈ 47 KB). **Se guardan tal cual,
  sin recomprimir** (recomprimir un JPEG lo degrada).
- Fotos propias (12 MP o más): reducir a **640 px** de lado largo, JPEG 0.82
  (≈ 70–100 KB en iPhone).
- La orientación EXIF de las fotos del iPhone debe respetarse al reducir
  (spike S2).

**Decisión del operador (2026-10-25): 400 px de ancho máximo, JPEG, para
todas las imágenes** —las de las bibliotecas y las fotos propias—, calidad
0.82. Una nota para cuando se implemente: el codificador de Safari deja un
JPEG de 400 px en ≈ 33–47 KB, casi lo mismo que pesan los originales de 600 px
que entrega Openverse (17–46 KB) y más que ellos; el 400 se elige por
uniformidad y por decisión de diseño, no porque ahorre espacio. Si más
adelante se prefiere más nitidez al mismo peso, guardar el original de
Openverse tal cual es la alternativa.

## 5. Búsqueda en bibliotecas abiertas

Verificado con peticiones reales desde el origen de GitHub Pages:

| | Openverse | Wikimedia Commons |
|---|---|---|
| Clave | No | No |
| CORS | `*` | `*` (con `origin=*`) |
| Límite | Anónimo: 20/min y 200/día (cabeceras `x-ratelimit`) | No se observó cabecera de límite |
| Bytes de la imagen desde el navegador | Sí: `/v1/images/{id}/thumb/` (600 px) y `?full_size=true` (1024 px) con CORS `*` | Sí: `thumb.wikimedia.org` con CORS `*` |
| Metadatos de crédito | `creator`, `license`, `license_version`, `license_url`, `foreign_landing_url` y una cadena `attribution` ya redactada | `extmetadata`: `Artist` (HTML), `LicenseShortName`, `LicenseUrl`, `AttributionRequired` |

- **Las imágenes originales de Flickr y similares no tienen CORS**, así que
  solo se pueden guardar a través del *proxy* de miniaturas de Openverse.
- Wikimedia entrega solo anchos estándar: pedir 400 px devolvió el archivo de
  **500 px**.
- La política de Wikimedia pide identificar el cliente con un encabezado
  `Api-User-Agent` (política conocida, **sin verificar hoy**). Su respuesta de
  verificación previa (preflight) a ese encabezado **no trajo cabeceras CORS**
  en la prueba, así que un navegador lo bloquearía. La alfa no envía cabeceras
  propias; riesgo aceptado: si Wikimedia limita, se usa solo Openverse.
- Claves de API (Unsplash, Pexels, Pixabay): descartadas; en una app
  estática la clave sería pública.

**Filtro de licencias por defecto:** `license_type=commercial,modification`
(Openverse), es decir CC0, dominio público, CC BY y CC BY-SA. Excluye las
licencias NC (no comercial) y ND (sin obras derivadas) para no depender de si
reducir o recortar cuenta como adaptación. Es una decisión de prudencia, no
una opinión legal.

**Contenido sensible:** `mature=false`.

**Comportamiento:** solo se busca al pulsar «Buscar» (nunca al teclear), con
12 resultados por búsqueda, resultados en memoria y mensaje claro ante un 429
(«Se alcanzó el límite gratuito de búsquedas. Vuelve a intentarlo en un
minuto o sube tu propia foto»). La consulta que se propone es el
**significado en español**, editable, porque las bibliotecas indexan mejor
los sustantivos concretos.

## 6. Créditos

Verificado en las mejores prácticas de atribución de Creative Commons y en el
texto legal 4.0:
- Se atribuye «de cualquier manera razonable según el medio, los medios y el
  contexto» (BY-ND 4.0, §3(a)(2)).
- Elementos: título (si hay), autor, fuente (enlace) y licencia (nombre y
  enlace); el único obligatorio es nombrar la licencia (según la propia guía).
- La guía **no trata** esquinas, subtítulos ni «tocar para ver»: es el
  criterio de «razonable» el que los admite o no. No es asesoría legal.
- Un recorte simple se anota («recortada»); un cambio que altera el sentido
  es adaptación.
- 4.0 §2(a)(4): las modificaciones técnicas necesarias nunca producen obra
  adaptada.

**Diseño:** en la tarjeta, una línea pequeña en la esquina inferior de la
imagen («CC BY · Autor»), sobre una banda semitransparente para que se lea; y
un botón «i» que abre el detalle completo (título, autor, enlace a la fuente,
licencia con enlace, «reducida de tamaño»). Las imágenes CC0, de dominio
público y las fotos propias no muestran línea.

## 7. Transparencia

Antes de la **primera búsqueda** se muestra una explicación (una sola vez; se
puede volver a ver en Ajustes):
- Qué sale del teléfono: el texto que buscas y tu dirección IP, como en
  cualquier sitio web.
- A quién: Openverse y Wikimedia Commons.
- Qué se guarda: una copia de la imagen y sus créditos, en tu teléfono.
- Que puedes usar solo tus fotos y no se envía nada.

Es la primera función de Ancla que habla con un tercero; debe ser siempre una
acción pedida por el usuario.

## 8. Repaso y Guía

**Modos** (mismo patrón que Colgadero: **una tarjeta, un estado FSRS**, dos
direcciones):
- «Palabra → significado»: frente = la palabra; reverso = imagen, significado
  y truco.
- «Significado → palabra»: frente = imagen y significado; reverso = la
  palabra. El informe original solo midió la dirección extranjera→propia, así
  que esta dirección tiene su propio modo y no se da por cubierta por la
  evidencia.

Entra en «Practicar ahora» (`mezcla.ts`) como una categoría más.

**Guía, capítulo 7 «Vocabulario y la palabra clave»**, con ejercicio: dado un
par palabra/significado, elegir entre palabras clave candidatas; y estos
consejos con su etiqueta de origen:
- *Palabras abstractas* («aunque», «ya», «desde»): sin imagen directa, usa la
  palabra clave o una mini-escena propia; en el experimento de Atkinson y
  Raugh el método rindió igual con palabras de baja imaginabilidad
  (investigación).
- *Cognados y sustantivos concretos*: a menudo basta la foto.
- *Tu propia imagen suele ser mejor que la de otro*: sin evidencia verificada
  en esta investigación; se presenta como práctica, no como hecho.
- El método puede servir sobre todo al empezar un idioma (palabras de los
  autores).

El formulario enlaza a la Guía con `EnlaceGuia`.

## 9. Funciones tipo Anki

- Alfa: tarjetas independientes, temas, dos modos, imagen, truco.
- Beta: **importar CSV** (palabra, significado, tema) —lo más útil para «todo
  un idioma»— y exportar CSV.
- Después: pronunciación con la API de voz del navegador (sin verificar en
  iOS), importar paquetes de Anki. No se siembra ninguna lista de frecuencia.

## 10. Alcance de código (estimado desde `grep lista_item`)

Archivos que mencionan `lista_item` y habría que revisar: `src/db/tipos.ts`,
`src/db/repository.ts` (9 sitios), `src/domain/categorias/registro.ts`,
`src/domain/sesion/mezcla.ts`, `src/domain/estadisticas/{retencion,
retencion-categorias,insights}.ts`, `app/{index,editar,estadisticas,practicar}.tsx`,
`app/crear/[categoria].tsx`, `src/components/{TarjetasProblematicas,
TarjetaHojear,hojear-logic,FAB,fab-logic}`. Nuevos: migración 009,
`src/domain/vocabulario/` (lógica pura y *mappers* de las respuestas de las
APIs, con pruebas primero), `src/imagenes/` (red y canvas, solo web),
`app/vocabulario/…`.

Las funciones de imagen son **solo web** (canvas y `fetch`). En nativo
(Expo Go) la categoría funcionaría sin imágenes.

## 11. Pruebas

- Jest (TDD): *mappers* de Openverse y Wikimedia con respuestas reales
  guardadas como fixtures; texto de crédito; filtro de licencias; cálculo de
  dimensiones.
- Migración 009 con una base v8 **con datos**; comprobar que respaldo y
  restauración conservan las imágenes (skill `db-migracion`).
- E2E: las APIs se simulan con `page.route` (las pruebas nunca tocan la
  red real); foto propia con `setInputFiles`; tarjeta con imagen y crédito
  visibles; mensaje de 429; aviso de transparencia la primera vez.

## 12. Spikes antes de escribir código

| | Pregunta | Por qué |
|---|---|---|
| S1 | ¿Cuánto tarda y cuánta memoria usa `serializeAsync` con 300 imágenes en WebKit? | Decide BLOB contra archivos |
| S2 | ¿`createImageBitmap(..., {imageOrientation:'from-image'})` respeta EXIF en WebKit? | Fotos del iPhone giradas |
| S3 | ¿Un `Uint8Array` hace ida y vuelta por `runAsync`/`getFirstAsync` en la web? | Base del diseño |
| S4 | `navigator.storage.estimate()` en la app instalada | Cuota: el origen puede usar hasta el 60 % del disco (WebKit, iOS 17), pero puede desalojarse por falta de uso o presión de almacenamiento |

## 13. Cómo probar la alfa sin riesgo para tus datos

**Riesgo verificado:** la base se llama `memory-trainer.db`, las copias
`ancla-copias` y la caché `ancla-v8`, y **todas las páginas de
`jedi-master-teban.github.io` comparten el origen**. Una alfa publicada ahí
migraría tu base real a la versión 9 y la app de producción (versión 8) ya no
podría abrirla.

Opciones:
1. **Alfa en `/ancla-memory-trainer/alpha/`** con nombres propios (base,
   copias, caché) y el service worker de producción ignorando esa ruta.
   Requiere un cambio previo y pequeño en `main`. Instalable como segundo
   ícono.
2. **Otro servicio de alojamiento** con otro origen (p. ej. una vista previa
   de rama): aislamiento total, pero es un servicio externo y una cuenta.
3. **Solo local** (`localhost`) hasta la beta. Seguro, pero sin probar en el
   iPhone: OPFS y service worker exigen HTTPS.

**Decidido por el operador (2026-10-25): opción 1.** Implementada en ADR-039
(`src/canal.ts`, `npm run build:pwa:alfa`, `scripts/desplegar.sh`) y probada en
`e2e/canales.spec.ts`. Hallazgo al hacerla: expo-sqlite web guarda todas las
bases en **un único grupo de archivos de OPFS** que bloquea quien lo abre
primero. Los datos no se mezclan, pero la app real y la alfa **no pueden estar
abiertas a la vez** (la segunda avisa). Para probar la alfa con tus datos:
restaurar un respaldo desde Ajustes → Tus datos.

## 14. Orden de trabajo de la alfa

1. Spikes S1–S3 (§12) con pruebas desechables; si S1 no sale bien, las
   imágenes pasan a archivos de OPFS antes de escribir la migración.
2. `src/domain/vocabulario/` con pruebas primero: *mappers* de Openverse y
   Wikimedia (fixtures reales), texto de crédito, filtro de licencias,
   dimensiones a 400 px.
3. Migración 009 + repositorio (tema, tarjeta, imagen) con prueba de
   supervivencia sobre una base v8 con datos.
4. Pantallas: lista de temas, alta de palabra con foto propia, repaso en los dos
   modos, imagen con crédito e «i».
5. Búsqueda en bibliotecas con el aviso de transparencia y manejo de 429.
6. Capítulo 7 de la Guía y su enlace desde el formulario.
7. E2E con las APIs simuladas; despliegue a `/alpha/`.
