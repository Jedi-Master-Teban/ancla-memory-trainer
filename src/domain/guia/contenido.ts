import type { Calificacion } from '../fsrs/scheduler';

/**
 * Contenido de la Guía (ADR-031). Datos puros: los lee `app/guia/`.
 *
 * Reglas de este archivo:
 * - Las técnicas se describen como las implementa Ancla (tabla fonética de
 *   agent_docs/decodificacion-fonetica.md, reglas de naipes de
 *   agent_docs/seeds/naipes-52.md). Las pruebas comprueban los ejemplos contra
 *   el decodificador real.
 * - Toda afirmación de investigación lleva su fuente, verificada en Crossref o
 *   Europe PMC el 2026-09-28. Lo que viene del método de Lorayne o de las
 *   reglas de la app lleva su propia etiqueta, para no hacerlo pasar por
 *   evidencia experimental.
 * - Del libro de Lorayne no se citan frases: no hay texto verificado a mano.
 */

export type IdCapitulo = 'fundamentos' | 'alfabeto' | 'colgadero' | 'naipes' | 'cadena' | 'numeros';

/** De dónde sale un consejo: se muestra como etiqueta junto a él. */
export type BaseConsejo = 'investigacion' | 'lorayne' | 'fsrs' | 'ancla';

export type Practica = 'calificar' | 'decodificar' | 'colgadero' | 'naipe' | 'cadena' | 'numero';

export interface Fuente {
  cita: string;
  url: string;
}

export interface Consejo {
  titulo: string;
  texto: string;
  base: BaseConsejo;
  fuentes: string[];
}

export interface Capitulo {
  id: IdCapitulo;
  titulo: string;
  /** Una línea, para la lista de capítulos. */
  resumen: string;
  minutos: number;
  paraQue: string[];
  pasos: { titulo: string; texto: string }[];
  practica: Practica;
  consejos: Consejo[];
  fuentes: string[];
  /** La pantalla de la app donde se practica lo que enseña el capítulo. */
  practicarEn?: { etiqueta: string; ruta: string };
}

export const ETIQUETA_BASE: Record<BaseConsejo, string> = {
  investigacion: 'Investigación',
  lorayne: 'Lorayne',
  fsrs: 'FSRS',
  ancla: 'Regla de Ancla',
};

export const FUENTES: Record<string, Fuente> = {
  lorayne1957: {
    cita: 'Lorayne, H. (1957). How to Develop a Super-Power Memory. En español: Cómo adquirir una supermemoria.',
    url: 'https://en.wikipedia.org/wiki/Harry_Lorayne',
  },
  lorayneLucas1974: {
    cita: 'Lorayne, H. y Lucas, J. (1974). The Memory Book.',
    url: 'https://openlibrary.org/search?q=The+Memory+Book+Lorayne+Lucas',
  },
  roediger1980: {
    cita: 'Roediger, H. L. (1980). The effectiveness of four mnemonics in ordering recall. Journal of Experimental Psychology: Human Learning and Memory, 6(5), 558–567.',
    url: 'https://doi.org/10.1037/0278-7393.6.5.558',
  },
  roedigerKarpicke2006: {
    cita: 'Roediger, H. L. y Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.',
    url: 'https://doi.org/10.1111/j.1467-9280.2006.01693.x',
  },
  cepeda2006: {
    cita: 'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T. y Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.',
    url: 'https://doi.org/10.1037/0033-2909.132.3.354',
  },
  mcdaniel1995: {
    cita: 'McDaniel, M. A., Einstein, G. O., DeLosh, E. L., May, C. P. y Brady, P. (1995). The bizarreness effect: It’s not surprising, it’s complex. Journal of Experimental Psychology: Learning, Memory, and Cognition, 21(2), 422–435.',
    url: 'https://doi.org/10.1037/0278-7393.21.2.422',
  },
  putnam2015: {
    cita: 'Putnam, A. L. (2015). Mnemonics in education: Current research and applications. Translational Issues in Psychological Science, 1(2), 130–139.',
    url: 'https://doi.org/10.1037/tps0000023',
  },
  pattonLantzy1987: {
    cita: 'Patton, G. W. R. y Lantzy, P. D. (1987). Testing the limits of the phonetic mnemonic system. Applied Cognitive Psychology, 1(4), 263–271.',
    url: 'https://doi.org/10.1002/acp.2350010405',
  },
  konrad2013: {
    cita: 'Konrad, B. N. (2013). Characteristics and neuronal correlates of superior memory performance. Tesis doctoral, Universidad Ludwig Maximilian de Múnich.',
    url: 'https://edoc.ub.uni-muenchen.de/16636/',
  },
  fsrs: {
    cita: 'Open Spaced Repetition. Tutorial de FSRS, el algoritmo de repaso que usa Ancla.',
    url: 'https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md',
  },
};

/**
 * El alfabeto fonético tal como lo aplica Ancla (decodificacion-fonetica.md §1).
 * El ejemplo de cada fila es la palabra del colgadero semilla para ese dígito.
 */
export const TABLA_FONETICA: { digito: number; sonidos: string; truco: string; ejemplo: string }[] = [
  { digito: 1, sonidos: 'T, D', truco: 'La T tiene un palo vertical', ejemplo: 'Tea' },
  { digito: 2, sonidos: 'N, Ñ', truco: 'La N tiene dos palos', ejemplo: 'Noé' },
  { digito: 3, sonidos: 'M', truco: 'La M tiene tres palos', ejemplo: 'Amo' },
  { digito: 4, sonidos: 'C (ca, co, cu), K, Q', truco: 'C es la inicial de «cuatro»', ejemplo: 'Oca' },
  { digito: 5, sonidos: 'L, LL', truco: 'L vale 50 en números romanos', ejemplo: 'Ley' },
  { digito: 6, sonidos: 'S, Z, C (ce, ci)', truco: 'S es la inicial y la final de «seis»', ejemplo: 'Oso' },
  { digito: 7, sonidos: 'F, J, G (ge, gi)', truco: 'Una F al revés se parece a un 7', ejemplo: 'Fea' },
  { digito: 8, sonidos: 'CH, G (ga, go, gu)', truco: 'La CH tiene la forma cerrada del 8', ejemplo: 'Hucha' },
  { digito: 9, sonidos: 'V, B, P', truco: 'Una P al revés se parece a un 9', ejemplo: 'Ave' },
  { digito: 0, sonidos: 'R, RR', truco: 'El cero es redondo como una rueda', ejemplo: 'Oro' },
];

export const CAPITULOS: Capitulo[] = [
  {
    id: 'fundamentos',
    titulo: 'Cómo aprende tu memoria',
    resumen: 'Las cuatro ideas en las que se apoyan todas las técnicas de Ancla.',
    minutos: 4,
    paraQue: [
      'Recordar mucho es cuestión de método. Ancla junta dos cosas: las técnicas de Harry Lorayne, que convierten lo abstracto en imágenes fáciles de recordar, y la repetición espaciada, que decide cuándo repasar cada cosa para que no se te olvide.',
      'Estas cuatro ideas aparecen en todos los capítulos.',
    ],
    pasos: [
      {
        titulo: 'Conviértelo en imagen',
        texto:
          'Un número o una idea abstracta se olvidan; una imagen concreta, no. Lorayne y Lucas proponen imágenes tontas o ilógicas y con acción, porque una acción se recuerda mejor que una imagen quieta.',
      },
      {
        titulo: 'Engánchalo a algo que ya sabes',
        texto:
          'Cada técnica de Ancla asocia lo nuevo con algo que ya dominas: tus 100 palabras del colgadero, el objeto anterior de una lista o las reglas de los naipes.',
      },
      {
        titulo: 'Recuerda antes de mirar',
        texto:
          'Intentar recordar fija más que releer. En un experimento, releer ganó en una prueba a los 5 minutos, pero ponerse a prueba ganó a los 2 días y a la semana, aunque releer daba más sensación de dominio (Roediger y Karpicke, 2006). Por eso Ancla te muestra la pregunta y espera tu respuesta.',
      },
      {
        titulo: 'Repasa justo a tiempo',
        texto:
          'Repartir los repasos en el tiempo recuerda más que concentrarlos, y el mejor intervalo entre repasos crece cuanto más tiempo quieres recordar (Cepeda y colaboradores, 2006, con 317 experimentos). FSRS, el algoritmo de Ancla, calcula ese momento para cada tarjeta a partir de tus notas.',
      },
    ],
    practica: 'calificar',
    consejos: [
      {
        titulo: 'Califica solo por cuánto te costó',
        texto:
          '«Otra vez» si no te salió; «Difícil», «Bien» o «Fácil» solo si te salió, según el esfuerzo. Marcar «Difícil» cuando en realidad lo olvidaste es el único mal hábito al que FSRS no puede adaptarse: te programa la tarjeta demasiado lejos.',
        base: 'fsrs',
        fuentes: ['fsrs'],
      },
      {
        titulo: 'Usa «Fácil» cuando de verdad lo fue',
        texto: 'Evitarlo por costumbre llena tus días de repasos que no necesitas.',
        base: 'fsrs',
        fuentes: ['fsrs'],
      },
      {
        titulo: 'Poco cada día le gana a mucho de golpe',
        texto:
          'Una sesión corta diaria reparte los repasos, que es justo lo que la investigación muestra que funciona (Cepeda y colaboradores, 2006).',
        base: 'investigacion',
        fuentes: ['cepeda2006'],
      },
    ],
    fuentes: ['lorayneLucas1974', 'roedigerKarpicke2006', 'cepeda2006', 'fsrs'],
  },
  {
    id: 'alfabeto',
    titulo: 'El alfabeto fonético',
    resumen: 'Cómo convertir cualquier número en palabras que puedes imaginar.',
    minutos: 5,
    paraQue: [
      'Los números son difíciles de imaginar: el 37 no se parece a nada. Las palabras sí: «Mufa» es una imagen. El alfabeto fonético le asigna a cada dígito un sonido consonante, y así cualquier número se convierte en palabras.',
      'Es la base del colgadero, de los números importantes y de los naipes. Viene del libro de Harry Lorayne, adaptado a los sonidos del español.',
    ],
    pasos: [
      {
        titulo: 'Un sonido para cada dígito',
        texto: 'Cada dígito tiene uno o varios sonidos consonantes, con un truco para recordarlo. Están en la tabla.',
      },
      {
        titulo: 'Las vocales no cuentan',
        texto:
          'Las vocales, la h, la w, la x y la y no valen nada: solo rellenan para formar palabras. Por eso el 1 puede ser «Tea», «Té» o «Dúo».',
      },
      {
        titulo: 'Cuenta sonidos, no letras',
        texto:
          '«ch» es un solo sonido (8), igual que «ll» (5) y «rr» (0). En «que» y «qui» la u no suena (4), ni en «gue» y «gui» (8). La c antes de e o i suena como s (6), y la g antes de e o i suena como j (7).',
      },
      {
        titulo: 'Lee de izquierda a derecha',
        texto: '«Techo» es t (1) + ch (8) = 18. «Cheque» es ch (8) + qu (4) = 84.',
      },
    ],
    practica: 'decodificar',
    consejos: [
      {
        titulo: 'Hasta que sea automático',
        texto:
          'El sistema fonético falla cuando hay que pensar cada sonido o inventar la imagen sobre la marcha (Patton y Lantzy, 1987). Funciona cuando la tabla y tus palabras ya están aprendidas, y con práctica (Konrad, 2013).',
        base: 'investigacion',
        fuentes: ['pattonLantzy1987', 'konrad2013'],
      },
      {
        titulo: 'Piensa en sonidos, no en ortografía',
        texto: '«Hucha» es 8 aunque empiece por h: la h no suena. Si dudas, di la palabra en voz alta.',
        base: 'ancla',
        fuentes: [],
      },
    ],
    fuentes: ['lorayne1957', 'pattonLantzy1987', 'konrad2013'],
  },
  {
    id: 'colgadero',
    titulo: 'El colgadero',
    resumen: 'Tus 100 perchas: una palabra fija para cada número del 1 al 100.',
    minutos: 4,
    paraQue: [
      'El colgadero es una lista fija de 100 palabras, una por número: 1 es Tea, 2 es Noé, 3 es Amo. Cada palabra sale del alfabeto fonético, así que no se memoriza a ciegas: se deduce.',
      'Sirve para dos cosas: convierte números en imágenes y te da 100 perchas donde colgar cualquier cosa en orden. En un experimento clásico, las perchas rindieron tan bien como el palacio de la memoria al recordar en orden, y mejor que encadenar (Roediger, 1980).',
    ],
    pasos: [
      {
        titulo: 'Deduce cada palabra',
        texto: 'Tea es t (1). Noé es n (2). Mufa es m (3) + f (7): 37. Si recuerdas los sonidos, puedes reconstruir cualquier percha.',
      },
      {
        titulo: 'Fija una imagen concreta',
        texto:
          'Imagina siempre el mismo objeto para cada palabra: la misma tea encendida, el mismo Noé con su arca. Una imagen estable es un gancho fiable.',
      },
      {
        titulo: 'Cuelga lo que quieres recordar',
        texto:
          'Para una lista numerada, asocia el primer elemento con la tea, el segundo con Noé, y así. Haz cada escena exagerada y con acción.',
      },
      {
        titulo: 'Practícalo en las dos direcciones',
        texto:
          'En Ancla, «Flash» te pregunta la palabra de un número y «Reverso», el número de una palabra. «Velocidad» mide qué tan rápido responden tus perchas.',
      },
    ],
    practica: 'colgadero',
    consejos: [
      {
        titulo: 'Sobreaprende tus 100 palabras',
        texto:
          'El sistema fonético funciona bien con una tabla de 100 imágenes ya aprendida y práctica suficiente (Konrad, 2013). Es justo lo que repasas en Ancla.',
        base: 'investigacion',
        fuentes: ['konrad2013'],
      },
      {
        titulo: 'Primero exactitud, luego velocidad',
        texto:
          'Al empezar, el beneficio de las perchas aparece con 4 a 8 segundos por elemento, pero no con 2 (Bugelski y colaboradores, 1968, citados por Putnam, 2015). Sube la velocidad cuando ya no dudes.',
        base: 'investigacion',
        fuentes: ['putnam2015'],
      },
      {
        titulo: 'La estructura también se repasa',
        texto:
          'Las perchas se olvidan menos que otras mnemotecnias porque son siempre las mismas y están muy aprendidas (Putnam, 2015). Repasarlas con FSRS las mantiene así.',
        base: 'investigacion',
        fuentes: ['putnam2015'],
      },
    ],
    fuentes: ['roediger1980', 'konrad2013', 'putnam2015', 'lorayne1957'],
    practicarEn: { etiqueta: 'Practicar el colgadero', ruta: '/colgadero' },
  },
  {
    id: 'naipes',
    titulo: 'Naipes',
    resumen: 'Una palabra para cada una de las 52 cartas.',
    minutos: 4,
    paraQue: [
      'Memorizar una baraja barajada es el ejercicio clásico de los campeones de memoria y un gran entrenamiento de todo el sistema. El libro de Lorayne convierte cada carta en una palabra-imagen; Ancla lo adapta a los palos y los sonidos del español.',
    ],
    pasos: [
      {
        titulo: 'La primera letra es el palo',
        texto: 'Espadas empieza por E, Diamantes por D, Palos por P y Corazones por C.',
      },
      {
        titulo: 'El último sonido es el valor',
        texto:
          'El sonido consonante final sigue el alfabeto fonético: el As vale 1 (t o d), el 2 es n, y así hasta el 10, que es r.',
      },
      {
        titulo: 'Las figuras solo llevan el palo',
        texto: 'J, Q y K empiezan con la letra de su palo y no tienen sonido final fijo: su palabra se aprende tal cual.',
      },
      {
        titulo: 'Para una baraja entera, encadena',
        texto:
          'Recorre las cartas y asocia la palabra de cada una con la siguiente, o cuelga la primera carta de la tea, la segunda de Noé, y así con tu colgadero.',
      },
    ],
    practica: 'naipe',
    consejos: [
      {
        titulo: 'Primero las 52 palabras',
        texto:
          'Como con el colgadero, el sistema rinde cuando cada carta te da su palabra al instante (Konrad, 2013). Repásalas en «Flash» y «Reverso» antes de intentar una baraja completa.',
        base: 'investigacion',
        fuentes: ['konrad2013'],
      },
      {
        titulo: 'Para el orden, mejor perchas que cadena',
        texto:
          'Al recordar en orden, las perchas superan a la cadena (Roediger, 1980): si un eslabón falla, la cadena se corta; con perchas, cada carta tiene su propio gancho.',
        base: 'investigacion',
        fuentes: ['roediger1980'],
      },
      {
        titulo: 'Cuidado con los corazones',
        texto: 'Una palabra de Corazones empieza por c seguida de vocal: «ch» sería el sonido 8, no el palo.',
        base: 'ancla',
        fuentes: [],
      },
    ],
    fuentes: ['lorayne1957', 'roediger1980', 'konrad2013'],
    practicarEn: { etiqueta: 'Practicar los naipes', ruta: '/naipes' },
  },
  {
    id: 'cadena',
    titulo: 'Listas encadenadas',
    resumen: 'Recordar una lista en orden, cada elemento enganchado al siguiente.',
    minutos: 4,
    paraQue: [
      'El método de la cadena sirve para recordar una lista en orden sin papel: la compra, los pasos de una receta, los puntos de una charla. Es una de las técnicas centrales del libro de Lorayne y la más fácil de empezar a usar.',
    ],
    pasos: [
      { titulo: 'Imagina el primer elemento', texto: 'Velo con detalle: su forma, su color, su tamaño.' },
      {
        titulo: 'Engánchalo al segundo con una escena absurda',
        texto:
          'No «leche junto al pan», sino un pan gigante tomándose la leche con pitillo. Lorayne y Lucas piden imágenes ilógicas y con acción, porque se recuerdan mejor.',
      },
      {
        titulo: 'Suelta el primero y sigue',
        texto: 'Ahora engancha el segundo con el tercero, el tercero con el cuarto, y así. Cada escena une solo dos elementos.',
      },
      {
        titulo: 'Recorre la cadena',
        texto:
          'Para recordar, empieza por el primero: cada imagen te trae la siguiente. En Ancla cada par es una tarjeta, y se repasa también al revés.',
      },
    ],
    practica: 'cadena',
    consejos: [
      {
        titulo: 'Que cada escena se distinga',
        texto:
          'Una imagen rara ayuda sobre todo cuando destaca entre otras normales (McDaniel y colaboradores, 1995). Más que absurdas, haz tus escenas distintas entre sí.',
        base: 'investigacion',
        fuentes: ['mcdaniel1995'],
      },
      {
        titulo: 'Para listas largas, el colgadero',
        texto:
          'Al recordar en orden, la cadena supera a no usar técnica, pero rinde menos que las perchas (Roediger, 1980): si olvidas un eslabón, pierdes lo que sigue. En una lista larga, cuelga los elementos de tu colgadero.',
        base: 'investigacion',
        fuentes: ['roediger1980'],
      },
      {
        titulo: 'Repásala al día siguiente',
        texto:
          'Ponerte a prueba al día siguiente, y luego cada vez más espaciado, fija la lista (Roediger y Karpicke, 2006; Cepeda y colaboradores, 2006). Ancla programa esos repasos por ti.',
        base: 'investigacion',
        fuentes: ['roedigerKarpicke2006', 'cepeda2006'],
      },
    ],
    fuentes: ['lorayneLucas1974', 'roediger1980', 'mcdaniel1995'],
    practicarEn: { etiqueta: 'Crear una lista', ruta: '/listas' },
  },
  {
    id: 'numeros',
    titulo: 'Números importantes',
    resumen: 'Teléfonos, documentos y fechas convertidos en una escena.',
    minutos: 4,
    paraQue: [
      'Un número largo cuesta porque no significa nada. Con el colgadero, cada par de dígitos se vuelve una palabra, y unas pocas palabras forman una escena: 3141 es Mito y Codo.',
    ],
    pasos: [
      {
        titulo: 'Parte el número en pares',
        texto:
          'De izquierda a derecha: 3141 queda 31 · 41. Si sobra un dígito, va al final y se lee con el colgadero del 1 al 9, o como Oro si es un 0. Un par 00 es Rara.',
      },
      { titulo: 'Cambia cada par por su palabra', texto: '31 es Mito y 41 es Codo en el colgadero de Ancla.' },
      {
        titulo: 'Encadena las palabras',
        texto: 'Une las palabras en una escena con el método de la cadena: un mito griego dándose un golpe en el codo.',
      },
      {
        titulo: 'Engánchalo a su dueño',
        texto: 'Mete en la escena lo que el número identifica: si es la cédula de tu hermano, ponlo a él dentro.',
      },
    ],
    practica: 'numero',
    consejos: [
      {
        titulo: 'La práctica es lo que cuenta',
        texto:
          'En un estudio, quienes aprendieron el palacio de la memoria y una tabla fonética de 100 imágenes pasaron de 22 a 51 dígitos memorizados en 5 minutos tras seis semanas de práctica. Justo después del curso, sin practicar, no habían mejorado (Konrad, 2013).',
        base: 'investigacion',
        fuentes: ['konrad2013'],
      },
      {
        titulo: 'Siempre tus mismas palabras',
        texto:
          'El sistema funciona con palabras ya aprendidas, no inventadas sobre la marcha (Patton y Lantzy, 1987). Por eso Ancla parte los números con las de tu colgadero.',
        base: 'investigacion',
        fuentes: ['pattonLantzy1987'],
      },
    ],
    fuentes: ['lorayne1957', 'konrad2013', 'pattonLantzy1987'],
    practicarEn: { etiqueta: 'Guardar un número', ruta: '/numeros' },
  },
];

export function capituloPorId(id: string | undefined): Capitulo | undefined {
  return CAPITULOS.find((c) => c.id === id);
}

export function siguienteCapitulo(id: IdCapitulo): Capitulo | undefined {
  const i = CAPITULOS.findIndex((c) => c.id === id);
  return i >= 0 ? CAPITULOS[i + 1] : undefined;
}

/** Ejercicio del capítulo de fundamentos: qué nota corresponde a cada situación. */
export const ESCENARIOS_CALIFICAR: { situacion: string; correcta: Calificacion; explicacion: string }[] = [
  {
    situacion: 'Pensaste unos segundos, no te salió y, al ver la respuesta, la reconociste.',
    correcta: 'otra_vez',
    explicacion: 'Reconocer no es recordar: no te salió antes de mirar. FSRS la traerá pronto de vuelta.',
  },
  {
    situacion: 'Te salió, pero dudaste y te costó bastante.',
    correcta: 'dificil',
    explicacion: 'La recordaste con esfuerzo: eso es «Difícil».',
  },
  {
    situacion: 'Te salió después de pensarlo un momento.',
    correcta: 'bien',
    explicacion: 'Lo normal cuando recuerdas: «Bien».',
  },
  {
    situacion: 'Te salió al instante, sin esfuerzo.',
    correcta: 'facil',
    explicacion: 'Si fue inmediato, «Fácil»: así no te la repite de más.',
  },
];

/** Lista de ejemplo del ejercicio de la cadena. Objetos comunes, no contenido del usuario. */
export const LISTA_DE_PRACTICA = ['Paraguas', 'Piña', 'Trompeta', 'Gato', 'Reloj'];

/** Una escena de muestra para el primer par; las demás las imagina el usuario. */
export const ESCENA_DE_MUESTRA = 'Un paraguas abierto del que, en vez de lluvia, caen piñas que rebotan en tu cabeza.';

/**
 * Tres opciones para «¿qué venía después de X?»: la correcta y dos de la
 * misma lista, sin repetir ni incluir X. `azar` devuelve un número en [0, 1).
 */
export function opcionesDeRecuerdo(lista: string[], indice: number, azar: () => number): string[] {
  const correcta = lista[indice + 1];
  const distractores = lista.filter((x, i) => i !== indice && i !== indice + 1);
  const barajar = <T,>(xs: T[]) => {
    const copia = [...xs];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };
  const elegidos = barajar(distractores).slice(0, 2);
  const opciones = [correcta, ...elegidos];
  // Una rotación que depende del azar: la correcta no queda siempre en el mismo sitio.
  const giro = Math.floor(azar() * opciones.length);
  return [...opciones.slice(giro), ...opciones.slice(0, giro)];
}
