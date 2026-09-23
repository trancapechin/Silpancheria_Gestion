// ==========================================================
// api.js — Conecta los módulos del panel con el backend (.NET + Supabase)
// Cada función hace fetch a su Controller y pinta la tabla correspondiente.
// ==========================================================

function filaError(tbodyId, colspan, err) {
    document.getElementById(tbodyId).innerHTML =
        `<tr><td colspan="${colspan}" class="text-center text-danger">Error al cargar: ${err.message}</td></tr>`;
    console.error(err);
}

// Lee el body de una respuesta con error y arma un mensaje legible.
// Tus Controllers devuelven { mensaje, error } cuando algo falla en Supabase,
// así que mostramos eso en vez de solo "HTTP 500".
async function mensajeError(resp) {
    try {
        const body = await resp.json();
        return `${resp.status} - ${body.mensaje ?? ''} ${body.error ?? ''}`.trim();
    } catch {
        return 'HTTP ' + resp.status;
    }
}

// ---------- PRODUCTOS ----------
async function cargarProductos() {
    const tbody = document.getElementById('tbProductos');
    try {
        const resp = await fetch('/api/Productos');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(p => `
      <tr>
        <td>${p.id}</td><td>${p.nombre}</td><td>${p.tipo ?? '-'}</td>
        <td>Bs. ${Number(p.precio ?? 0).toFixed(2)}</td>
        <td>${p.stock} ${p.unidadMedida ?? ''}</td><td>${p.stockMinimo}</td>
        <td>${p.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="8" class="text-center">Sin productos registrados</td></tr>';
    } catch (err) { filaError('tbProductos', 8, err); }
}

// ---------- CATEGORIAS ----------
async function cargarCategorias() {
    const tbody = document.getElementById('tbCategorias');
    try {
        const resp = await fetch('/api/Categorias');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(c => `
      <tr>
        <td>${c.id}</td><td>${c.nombre}</td><td>${c.descripcion ?? '-'}</td><td>${c.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="5" class="text-center">Sin categorías registradas</td></tr>';
    } catch (err) { filaError('tbCategorias', 5, err); }
}

// ---------- PERSONAS ----------
async function cargarPersonas() {
    const tbody = document.getElementById('tbPersonas');
    try {
        const resp = await fetch('/api/Personas');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(p => `
      <tr>
        <td>${p.id}</td><td>${p.nombre} ${p.apellido ?? ''}</td><td>${p.cedula ?? '-'}</td>
        <td>${p.email ?? '-'}</td><td>${p.telefono ?? '-'}</td><td>${p.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="7" class="text-center">Sin personas registradas</td></tr>';
    } catch (err) { filaError('tbPersonas', 7, err); }
}

// ---------- EMPLEADOS ----------
async function cargarEmpleados() {
    const tbody = document.getElementById('tbEmpleados');
    try {
        const resp = await fetch('/api/Empleados');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(e => `
      <tr>
        <td>${e.id}</td><td>${e.numeroEmpleado}</td><td>${e.cargo}</td><td>${e.departamento}</td>
        <td>Bs. ${Number(e.salario).toFixed(2)}</td>
        <td>${new Date(e.fechaIngreso).toLocaleDateString()}</td><td>${e.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="8" class="text-center">No hay empleados registrados</td></tr>';
    } catch (err) { filaError('tbEmpleados', 8, err); }
}

// ---------- COCINEROS ----------
// OJO: tu controller se llama "CocinersController" (sin la "e" de Cocineros),
// así que la ruta real que genera .NET es /api/Cociners, no /api/Cocineros.
// Te conviene renombrar el archivo/clase a CocinerosController más adelante.
async function cargarCocineros() {
    const tbody = document.getElementById('tbCocineros');
    try {
        const resp = await fetch('/api/Cociners');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(c => `
      <tr>
        <td>${c.id}</td><td>${c.idEmpleado}</td><td>${c.nivelEspecialidad ?? '-'}</td>
        <td>${c.especialidades ?? '-'}</td>
        <td>${c.fechaCertificacion ? new Date(c.fechaCertificacion).toLocaleDateString() : '-'}</td>
        <td>${c.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="7" class="text-center">Sin cocineros registrados</td></tr>';
    } catch (err) { filaError('tbCocineros', 7, err); }
}

// ---------- VENTAS (historial) ----------
async function cargarVentas() {
    const tbody = document.getElementById('tbVentas');
    try {
        const resp = await fetch('/api/Ventas');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(v => `
      <tr>
        <td>${v.id}</td><td>${v.numeroVenta}</td>
        <td>${new Date(v.fechaVenta).toLocaleString()}</td>
        <td>Bs. ${Number(v.montoTotal).toFixed(2)}</td><td>${v.metodoPago ?? '-'}</td><td>${v.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="7" class="text-center">Sin ventas registradas</td></tr>';
    } catch (err) { filaError('tbVentas', 7, err); }
}

// ---------- COMPRAS ----------
async function cargarCompras() {
    const tbody = document.getElementById('tbCompras');
    try {
        const resp = await fetch('/api/Compras');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(c => `
      <tr>
        <td>${c.id}</td><td>${new Date(c.fecha).toLocaleDateString()}</td>
        <td>Bs. ${Number(c.total).toFixed(2)}</td><td>${c.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="5" class="text-center">Sin compras registradas</td></tr>';
    } catch (err) { filaError('tbCompras', 5, err); }
}

// ---------- PROVEEDORES ----------
async function cargarProveedores() {
    const tbody = document.getElementById('tbProveedores');
    try {
        const resp = await fetch('/api/Proveedores');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(p => `
      <tr>
        <td>${p.id}</td><td>${p.nombre}</td><td>${p.email ?? '-'}</td>
        <td>${p.telefono ?? '-'}</td><td>${p.direccion ?? '-'}</td><td>${p.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="7" class="text-center">Sin proveedores registrados</td></tr>';
    } catch (err) { filaError('tbProveedores', 7, err); }
}

// ---------- RECETAS ----------
async function cargarRecetas() {
    const tbody = document.getElementById('tbRecetas');
    try {
        const resp = await fetch('/api/Recetas');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(r => `
      <tr>
        <td>${r.id}</td><td>${r.idPlato}</td><td>${r.idIngrediente}</td>
        <td>${r.cantidad}</td><td>${r.unidadMedida ?? '-'}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="6" class="text-center">Sin recetas registradas</td></tr>';
    } catch (err) { filaError('tbRecetas', 6, err); }
}

// ---------- MOVIMIENTOS DE STOCK ----------
async function cargarMovimientos() {
    const tbody = document.getElementById('tbMovimientos');
    try {
        const resp = await fetch('/api/MovimientosStock');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(m => `
      <tr>
        <td>${m.id}</td><td>${new Date(m.fecha).toLocaleDateString()}</td><td>${m.tipo}</td>
        <td>${m.cantidad}</td><td>${m.motivo ?? '-'}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="6" class="text-center">Sin movimientos registrados</td></tr>';
    } catch (err) { filaError('tbMovimientos', 6, err); }
}

// ---------- REPORTES (los que vienen de la tabla "reportes" en Supabase) ----------
// Esta tabla vive en la sección "sec-reportesdb" (la renombré porque tenías
// dos secciones con el mismo id "sec-reportes"). Por ahora no tiene tab en el
// menú -- avisame cuando quieras habilitarla y le agregamos el botón de nav.
async function cargarReportesDB() {
    const tbody = document.getElementById('tbReportes');
    try {
        const resp = await fetch('/api/Reportes');
        if (!resp.ok) throw new Error(await mensajeError(resp));
        const items = await resp.json();
        tbody.innerHTML = items.length ? items.map(r => `
      <tr>
        <td>${r.id}</td><td>${r.titulo}</td><td>${r.tipo ?? '-'}</td>
        <td>${new Date(r.fechaGeneracion).toLocaleDateString()}</td><td>${r.estado}</td>
        <td><button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button></td>
      </tr>`).join('') : '<tr><td colspan="6" class="text-center">Sin reportes registrados</td></tr>';
    } catch (err) { filaError('tbReportes', 6, err); }
}

// La pestaña "Reportes" de tu menú usa tu dashboard local (actualizarReportes),
// así que acá dejamos un alias vacío para que cambiarModulo('reportes') no truene
// si en algún momento decide llamar a cargarReportes() en vez de actualizarReportes().
function cargarReportes() { /* el dashboard real se actualiza con actualizarReportes() */ }