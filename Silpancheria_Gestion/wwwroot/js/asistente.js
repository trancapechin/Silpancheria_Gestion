/**
 * SILPANCHARÍA — Asistente de voz (Web Speech API)
 * Botón flotante abajo a la derecha
 */
(function () {
    'use strict';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let escuchando = false;

    const COMANDOS = [
        { palabras: ['dashboard', 'inicio', 'principal', 'panel'], accion: () => irA('dashboard') },
        { palabras: ['productos', 'producto', 'inventario'], accion: () => irA('productos') },
        { palabras: ['categorías', 'categorias', 'categoría', 'categoria'], accion: () => irA('categorias') },
        { palabras: ['almacenes', 'almacén', 'almacen', 'bodega'], accion: () => irA('almacenes') },
        { palabras: ['personas', 'persona', 'clientes'], accion: () => irA('personas') },
        { palabras: ['empleados', 'empleado', 'personal'], accion: () => irA('empleados') },
        { palabras: ['compras', 'compra', 'pedidos'], accion: () => irA('compras') },
        { palabras: ['proveedores', 'proveedor'], accion: () => irA('proveedores') },
        { palabras: ['recetas', 'receta', 'platos'], accion: () => irA('recetas') },
        { palabras: ['movimientos', 'movimiento', 'kardex', 'stock'], accion: () => irA('movimientos') },
        { palabras: ['reportes', 'reporte', 'informes', 'informe'], accion: () => irA('reportes') },
        { palabras: ['ayuda', 'comandos', 'qué puedo decir', 'que puedo decir'], accion: mostrarAyuda }
    ];

    function irA(modulo) {
        if (typeof cambiarModulo === 'function') {
            cambiarModulo(modulo);
            hablar('Abriendo ' + modulo);
        }
    }

    function hablar(texto) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = 'es-ES';
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
    }

    function mostrarAyuda() {
        const msg = 'Puedes decir: dashboard, productos, categorías, almacenes, personas, empleados, compras, proveedores, recetas, movimientos o reportes.';
        mostrarEstado(msg, 'info');
        hablar(msg);
    }

    function mostrarEstado(texto, tipo) {
        let el = document.getElementById('asistenteEstado');
        if (!el) {
            el = document.createElement('div');
            el.id = 'asistenteEstado';
            el.className = 'asistente-toast';
            document.body.appendChild(el);
        }
        el.textContent = texto;
        el.className = 'asistente-toast show ' + (tipo || '');
        clearTimeout(el._timer);
        el._timer = setTimeout(function () { el.classList.remove('show'); }, 4000);
    }

    function procesarTexto(texto) {
        const t = (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (!t) return;

        mostrarEstado('Escuché: "' + texto + '"', 'info');

        for (var i = 0; i < COMANDOS.length; i++) {
            var cmd = COMANDOS[i];
            for (var j = 0; j < cmd.palabras.length; j++) {
                var pNorm = cmd.palabras[j].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (t.indexOf(pNorm) !== -1) {
                    cmd.accion();
                    return;
                }
            }
        }

        if (t.indexOf('buscar') !== -1 || t.indexOf('busca') !== -1) {
            var q = t.replace(/buscar?|busca/g, '').trim();
            var input = document.getElementById('busquedaGlobal');
            if (input && q) {
                input.value = q;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                mostrarEstado('Buscando: ' + q, 'info');
                hablar('Buscando ' + q);
                return;
            }
        }

        mostrarEstado('No reconocí el comando. Di "ayuda" para ver opciones.', 'warn');
        hablar('No entendí. Di ayuda para ver los comandos.');
    }

    function actualizarBoton() {
        var btn = document.getElementById('btnAsistenteVoz');
        if (!btn) return;
        var label = btn.querySelector('.fab-asistente-label');
        if (escuchando) {
            btn.classList.add('escuchando');
            btn.title = 'Escuchando… haz clic para detener';
            btn.setAttribute('aria-pressed', 'true');
            if (label) label.textContent = 'Escuchando…';
        } else {
            btn.classList.remove('escuchando');
            btn.title = 'Asistente de voz (Web Speech API)';
            btn.setAttribute('aria-pressed', 'false');
            if (label) label.textContent = 'Hablar';
        }
    }

    function iniciarReconocimiento() {
        if (!SpeechRecognition) {
            mostrarEstado('Tu navegador no soporta Web Speech API. Usa Chrome o Edge.', 'error');
            return;
        }
        if (escuchando && recognition) {
            recognition.stop();
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = function () {
            escuchando = true;
            actualizarBoton();
            mostrarEstado('Escuchando… habla ahora', 'info');
        };

        recognition.onresult = function (event) {
            procesarTexto(event.results[0][0].transcript);
        };

        recognition.onerror = function (event) {
            escuchando = false;
            actualizarBoton();
            var map = {
                'not-allowed': 'Permiso de micrófono denegado.',
                'no-speech': 'No se detectó voz. Intenta de nuevo.',
                'network': 'Error de red en el reconocimiento.',
                'aborted': 'Reconocimiento cancelado.'
            };
            if (event.error !== 'aborted') {
                mostrarEstado(map[event.error] || ('Error: ' + event.error), 'error');
            }
        };

        recognition.onend = function () {
            escuchando = false;
            actualizarBoton();
        };

        try {
            recognition.start();
        } catch (e) {
            escuchando = false;
            actualizarBoton();
            mostrarEstado('No se pudo iniciar el micrófono.', 'error');
        }
    }

    function init() {
        var btn = document.getElementById('btnAsistenteVoz');
        if (!btn) return;

        if (!SpeechRecognition) {
            btn.title = 'Web Speech API no disponible en este navegador';
            btn.disabled = true;
            btn.style.opacity = '0.5';
            return;
        }

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            iniciarReconocimiento();
        });

        document.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
                e.preventDefault();
                iniciarReconocimiento();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.AsistenteVoz = {
        iniciar: iniciarReconocimiento,
        ayuda: mostrarAyuda
    };
})();