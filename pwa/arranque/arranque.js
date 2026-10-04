/* Pantalla de arranque de Ancla (ADR-030).
 *
 * Va en línea dentro de index.html, antes del JavaScript de la app, así que
 * escucha desde el primer instante:
 *   - `ancla:arranque` {etapa: app | datos | lista}: la app avisa por dónde va
 *     (src/arranque/senales.ts). Con `lista`, la pantalla se desvanece y se quita.
 *   - `ancla:error` {titulo, detalle}: la app no pudo abrir la base de datos.
 *   - Un <script> que no carga, o un arranque que no termina: también error.
 * En error ofrece Reintentar (recarga la página principal) y, plegado, el
 * detalle técnico y «Forzar actualización» (vacía la caché de la app, nunca
 * los datos). Esto sustituye al antiguo banner amarillo de diagnóstico.
 */
(function () {
  var TEXTOS = {
    app: 'Ordenando tus tarjetas…',
    datos: 'Abriendo tus datos…',
    lista: '¡Listo!',
  };
  var METAS = { app: 0.55, datos: 0.8, lista: 1 }; // solo la página de propuestas (demo)

  // La barra se llena sola, de izquierda a derecha, en DURACION_MS: tiempo
  // suficiente para verla. Pero no promete más de lo que la app ha avisado:
  // hasta dónde puede llegar depende de la última señal. Si la app tarda más
  // de lo previsto, la barra espera en su tope; si está lista antes, igual
  // termina de llenarse. Una prueba o un diagnóstico pueden cambiar la
  // duración con window.__ANCLA_ARRANQUE_MS__ (0 = sin espera).
  var DURACION_MS = 2750; // + los 250 ms de la escena: llena a los 3 s de abrir
  var ESCENA_MS = 250; // la escena aparece a los 250 ms (CSS)
  var TOPES = { ninguno: 0.6, app: 0.8, datos: 0.95, lista: 1 };
  var PASO_MAX = 0.03; // lo más que avanza en un tic (30 ms): sin saltos

  function iniciar(raiz, opciones) {
    opciones = opciones || {};
    var base = opciones.base || window.__ANCLA_BASE__ || '/';
    var estado = raiz.querySelector('.aa-estado');
    var piezas = raiz.querySelectorAll('.aa-cadena i, .aa-tarjetas i');
    var cinta = raiz.querySelector('.aa-cinta i');
    var progreso = 0;
    var lista = false;
    var conError = false;
    var tope = TOPES.ninguno;
    var inicio = Date.now();
    var duracion = typeof window.__ANCLA_ARRANQUE_MS__ === 'number' ? window.__ANCLA_ARRANQUE_MS__ : DURACION_MS;
    var reloj = null;

    function pintar(p) {
      if (cinta) {
        cinta.style.width = Math.round(p * 100) + '%';
        return;
      }
      // Cada pieza se llena a su turno: la variable --aa-f (0 a 1) es cuánto
      // de la tarjeta está lleno, y la cadena de Ancla enciende sus eslabones.
      for (var i = 0; i < piezas.length; i++) {
        var f = Math.max(0, Math.min(1, p * piezas.length - i));
        piezas[i].style.setProperty('--aa-f', f.toFixed(3));
        piezas[i].classList.toggle('aa-lleno', f >= 1);
      }
    }

    function avanzar(p) {
      if (p > progreso) {
        progreso = Math.min(1, p);
        pintar(progreso);
      }
    }

    function decir(texto) {
      if (estado) estado.textContent = texto;
    }

    // Mientras llega el JavaScript de la app nadie avisa: la barra avanza sola
    // hasta el 40 % y ahí espera, para no prometer más de lo que sabe.
    var arrastre = null;
    if (opciones.demo) {
      arrastre = setInterval(function () {
        if (progreso < 0.4) avanzar(progreso + 0.05);
        else clearInterval(arrastre);
      }, 250);
    }

    function textoPara(p) {
      if (p >= 1) return TEXTOS.lista;
      if (p >= 0.66) return TEXTOS.datos;
      if (p >= 0.33) return TEXTOS.app;
      return 'Preparando tu memoria…';
    }

    function tic() {
      if (conError) return clearInterval(reloj);
      var linea = duracion > 0 ? (Date.now() - inicio - ESCENA_MS) / duracion : 1;
      var objetivo = Math.min(Math.max(linea, 0), tope);
      if (objetivo > progreso) avanzar(duracion > 0 ? Math.min(objetivo, progreso + PASO_MAX) : objetivo);
      decir(textoPara(progreso));
      if (lista && progreso >= 1) {
        clearInterval(reloj);
        terminar();
      }
    }
    if (!opciones.demo) reloj = setInterval(tic, 30);

    function etapa(nombre) {
      if (!(nombre in METAS) || conError || lista) return;
      if (opciones.demo) {
        decir(TEXTOS[nombre]);
        avanzar(METAS[nombre]);
        if (nombre === 'lista') terminar();
        return;
      }
      // Solo sube el tope; la barra llega a él al ritmo de la línea de tiempo.
      tope = TOPES[nombre];
      if (nombre === 'lista') lista = true;
    }

    function terminar() {
      lista = true;
      clearInterval(arrastre);
      clearInterval(reloj);
      if (opciones.demo) return;
      setTimeout(function () {
        raiz.classList.add('aa-saliendo');
        setTimeout(function () {
          if (raiz.parentNode) raiz.parentNode.removeChild(raiz);
        }, 320);
      }, 220);
    }

    function error(titulo, texto, detalle) {
      if (lista || conError) return;
      conError = true;
      clearInterval(arrastre);
      clearInterval(reloj);
      raiz.setAttribute('data-estado', 'error');
      var sinRed = navigator.onLine === false;
      raiz.querySelector('.aa-error-titulo').textContent = titulo || (sinRed ? 'Sin conexión' : 'Algo no cargó bien');
      raiz.querySelector('.aa-error-texto').textContent =
        texto ||
        (sinRed
          ? 'Esta versión de Ancla todavía no está guardada para usarse sin internet. Conéctate un momento y vuelve a intentarlo. Tus datos siguen en este teléfono.'
          : 'Tus datos siguen guardados en este teléfono. Vuelve a intentarlo.');
      raiz.querySelector('.aa-detalle-texto').textContent = detalle || '';
      if (!opciones.demo) {
        var boton = raiz.querySelector('[data-accion="reintentar"]');
        if (boton) boton.focus();
      }
    }

    function reiniciar() {
      conError = false;
      lista = false;
      progreso = 0;
      tope = TOPES.ninguno;
      inicio = Date.now();
      if (!opciones.demo) {
        clearInterval(reloj);
        reloj = setInterval(tic, 30);
      }
      raiz.setAttribute('data-estado', 'cargando');
      raiz.classList.remove('aa-con-detalle');
      decir('Preparando tu memoria…');
      pintar(0);
    }

    function forzarActualizacion() {
      var tareas = [];
      if ('serviceWorker' in navigator) {
        tareas.push(
          navigator.serviceWorker.getRegistrations().then(function (registros) {
            return Promise.all(registros.map(function (r) { return r.unregister(); }));
          }),
        );
      }
      // Solo las cachés de la app (Cache Storage). La base de datos y las
      // copias viven en OPFS e IndexedDB, que esto no toca.
      if (window.caches) {
        tareas.push(
          caches.keys().then(function (claves) {
            return Promise.all(claves.map(function (c) { return caches.delete(c); }));
          }),
        );
      }
      Promise.all(tareas)
        .catch(function () {})
        .then(function () { location.replace(base + '?actualizar=' + Date.now()); });
    }

    raiz.addEventListener('click', function (e) {
      var boton = e.target && e.target.closest ? e.target.closest('[data-accion]') : null;
      if (!boton) return;
      var accion = boton.getAttribute('data-accion');
      if (accion === 'detalles') {
        var abierto = raiz.classList.toggle('aa-con-detalle');
        boton.setAttribute('aria-expanded', String(abierto));
      } else if (opciones.demo) {
        if (opciones.alPulsar) opciones.alPulsar(accion);
      } else if (accion === 'reintentar') {
        location.replace(base);
      } else if (accion === 'forzar') {
        forzarActualizacion();
      }
    });

    if (!opciones.demo) {
      window.addEventListener('ancla:arranque', function (e) {
        etapa(e.detail && e.detail.etapa);
      });
      window.addEventListener('ancla:error', function (e) {
        var d = e.detail || {};
        error(
          d.titulo || 'No pude abrir tus datos',
          d.texto || 'Tus datos no se borran por esto. Vuelve a intentarlo en un momento.',
          d.detalle,
        );
      });
      var ultimoError = '';
      window.addEventListener(
        'error',
        function (e) {
          if (lista) return;
          var t = e.target;
          if (t && t !== window && t.tagName === 'SCRIPT') {
            error(null, null, 'No se pudo cargar ' + String(t.src || 'un archivo').split('/').pop());
          } else if (e.message) {
            ultimoError = String(e.message);
          }
        },
        true,
      );
      window.addEventListener('unhandledrejection', function (e) {
        if (!lista) ultimoError = String((e.reason && e.reason.message) || e.reason);
      });
      // Si en 25 s no hubo `lista`, algo se atascó. Con la página aún
      // descargando (red lenta), se espera más, hasta un minuto.
      var inicio = Date.now();
      (function vigilar() {
        setTimeout(function () {
          if (lista || conError) return;
          if (document.readyState !== 'complete' && Date.now() - inicio < 60000) return vigilar();
          error(null, null, ultimoError || 'La app no terminó de arrancar.');
        }, 25000);
      })();
    }

    return { etapa: etapa, avanzar: avanzar, decir: decir, error: error, reiniciar: reiniciar };
  }

  window.AnclaArranque = { iniciar: iniciar };
  var raiz = document.getElementById('ancla-arranque');
  if (raiz) iniciar(raiz);
})();
