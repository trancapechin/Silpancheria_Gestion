(function () {
    'use strict';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let escuchando = false;

    function toast(msg) {
        const el = document.getElementById('asistenteToast');
        if (el) {
            el.textContent = msg;
            el.classList.add('show');
            clearTimeout(el._t);
            el._t = setTimeout(function () { el.classList.remove('show'); }, 4000);
        }
        console.log('[Asistente]', msg);
    }

    function actualizarBoton() {
        const btn = document.getElementById('btnAsistenteVoz');
        if (!btn) return;
        const label = btn.querySelector('.fab-asistente-label');
        if (escuchando) {
            btn.classList.add('escuchando');
            if (label) label.textContent = 'Escuchando…';
        } else {
            btn.classList.remove('escuchando');
            if (label) label.textContent = 'Hablar';
        }
    }

    function irA(modulo) {
        if (typeof cambiarModulo === 'function') {
            cambiarModulo(modulo);
            toast('Abriendo: ' + modulo);
        } else {
            toast('No hay función cambiarModulo');
        }
    }

    function procesarTexto(texto) {
        const t = (texto || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        toast('Escuché: ' + texto);

        const mapa = [
            [['dashboard', 'inicio', 'panel'], 'dashboard'],
            [['productos', 'producto', 'inventario'], 'productos'],
            [['categorias', 'categoria'], 'categorias'],
            [['almacenes', 'almacen', 'bodega'], 'almacenes'],
            [['personas', 'persona'], 'personas'],
            [['empleados', 'empleado'], 'empleados'],
            [['compras', 'compra'], 'compras'],
            [['proveedores', 'proveedor'], 'proveedores'],
            [['recetas', 'receta'], 'recetas'],
            [['movimientos', 'movimiento', 'stock'], 'movimientos'],
            [['reportes', 'reporte'], 'reportes']
        ];

        for (let i = 0; i < mapa.length; i++) {
            const palabras = mapa[i][0];
            const modulo = mapa[i][1];
            for (let j = 0; j < palabras.length; j++) {
                if (t.indexOf(palabras[j]) !== -1) {
                    irA(modulo);
                    return;
                }
            }
        }
        toast('No reconocí el comando. Prueba: productos, dashboard, reportes');
    }

    function iniciar() {
        toast('Clic recibido');

        if (!SpeechRecognition) {
            alert('Este navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
            return;
        }

        if (escuchando && recognition) {
            try { recognition.stop(); } catch (e) { }
            escuchando = false;
            actualizarBoton();
            toast('Detenido');
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = function () {
            escuchando = true;
            actualizarBoton();
            toast('Escuchando… habla ahora');
        };

        recognition.onresult = function (event) {
            procesarTexto(event.results[0][0].transcript);
        };

        recognition.onerror = function (event) {
            escuchando = false;
            actualizarBoton();
            const mensajes = {
                'not-allowed': 'Micrófono bloqueado. Haz clic en el candado de la barra de dirección y permite el micrófono.',
                'no-speech': 'No se detectó voz. Intenta otra vez.',
                'network': 'Error de red del servicio de voz.',
                'aborted': 'Cancelado',
                'service-not-allowed': 'Voz no permitida en esta página.'
            };
            const msg = mensajes[event.error] || ('Error: ' + event.error);
            toast(msg);
            if (event.error === 'not-allowed') alert(msg);
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
            toast('Error al iniciar: ' + e.message);
            alert('Error al iniciar micrófono: ' + e.message);
        }
    }

    function init() {
        const btn = document.getElementById('btnAsistenteVoz');
        if (!btn) {
            console.error('No se encontró #btnAsistenteVoz');
            return;
        }
        btn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            iniciar();
        };
        console.log('Asistente de voz listo');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();