// ==========================================
// CONFIGURACIÓN DE ENDPOINTS
// ==========================================
const API_URL = '/api';
// Ruta relativa: funciona en local y en producción
const API_BASE = '/api';
const ENDPOINTS = {
    productos: `${API_BASE}/Productos`,
    categorias: `${API_BASE}/Categorias`,
    almacenes: `${API_BASE}/Almacenes`,
    personas: `${API_BASE}/Personas`,
    empleados: `${API_BASE}/Empleados`,
    compras: `${API_BASE}/Compras`,
    proveedores: `${API_BASE}/Proveedores`,
    recetas: `${API_BASE}/Recetas`,
    movimientos: `${API_BASE}/Movimientos`
};

/** Badge de estado (diseño Silpancharía) */
function badgeEstado(estado) {
    const e = (estado || '').toString().toUpperCase();
    if (e === 'ACTIVO' || e === 'COMPLETADO' || e === 'CONFIRMADA' || e === 'PAGADA')
        return `<span class="badge-status badge-activo">${estado || 'Activo'}</span>`;
    if (e === 'PENDIENTE')
        return `<span class="badge-status badge-pendiente">${estado}</span>`;
    if (e.includes('BAJO'))
        return `<span class="badge-status badge-bajo">${estado}</span>`;
    if (e.includes('AGOT') || e === 'CANCELADO' || e === 'INACTIVO')
        return `<span class="badge-status badge-agotado">${estado || 'Inactivo'}</span>`;
    return `<span class="badge-status badge-inactivo">${estado || '—'}</span>`;
}

function badgeTipo(tipo) {
    const t = (tipo || '').toString().toLowerCase();
    let cls = 'badge-tipo';
    if (t.includes('plato')) cls += ' plato';
    else if (t.includes('bebida')) cls += ' bebida';
    return `<span class="${cls}">${tipo || 'General'}</span>`;
}

function fmtStock(valor, unidad) {
    if (valor === null || valor === undefined || valor === '' || Number.isNaN(Number(valor)))
        return ('0 ' + (unidad || '')).trim();
    return (Number(valor) + ' ' + (unidad || '')).trim();
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

async function mensajeError(resp) {
    try {
        const texto = await resp.text();
        return texto || `Error HTTP: ${resp.status}`;
    } catch {
        return `Error HTTP: ${resp.status}`;
    }
}

// ==========================================
// 1. MÓDULO PRODUCTOS
// ==========================================
async function cargarProductos() {
    const tbody = document.getElementById('tablaProductos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Cargando productos...</td></tr>';

    // Cargar almacenes en el select
    cargarSelectAlmacenes();

    try {
        const resp = await fetch(ENDPOINTS.productos);
        if (!resp.ok) throw new Error(`Error ${resp.status}: No se pudieron obtener los productos.`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Sin productos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(p => {
            const stock = p.stockActual ?? p.stock ?? 0;
            const min = p.stockMinimo ?? p.stock_minimo ?? 0;
            const unidad = p.unidadMedida || p.unidad_medida || '';
            const stockNum = Number(stock);
            const minNum = Number(min);
            let stockBadge;
            if (stockNum <= 0) stockBadge = `<span class="badge-status badge-agotado">${fmtStock(stock, unidad)}</span>`;
            else if (stockNum <= minNum) stockBadge = `<span class="badge-status badge-bajo">${fmtStock(stock, unidad)}</span>`;
            else stockBadge = `<span class="badge-status badge-activo">${fmtStock(stock, unidad)}</span>`;
            return `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td>${escapeHTML(p.nombre)}</td>
                <td>${badgeTipo(p.tipo)}</td>
                <td>${parseFloat(p.precio || 0).toFixed(2)} Bs</td>
                <td>${stockBadge}</td>
                <td>${fmtStock(min, unidad)}</td>
                <td>${badgeEstado(p.estado)}</td>
                <td class="text-end text-nowrap">
                    <button type="button" class="btn-action edit me-1" title="Editar producto" onclick="editarProducto(${p.id}, '${escapeHTML(p.codigoBarras || '')}', '${escapeHTML(p.nombre)}', '${p.tipo}', ${p.precio || 0}, '${unidad}', ${stockNum}, ${minNum}, ${p.almacenId || p.almacen_id || 0}, '${p.estado}')"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn-action delete" title="Eliminar producto" onclick="eliminarProducto(${p.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarProducto(e) {
    e.preventDefault(); // Evita que la página recargue
    const id = document.getElementById('prodId').value;
    const payload = {
        id: id ? parseInt(id) : 0,
        codigoBarras: document.getElementById('codigoBarras').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        tipo: document.getElementById('tipo').value,
        precio: parseFloat(document.getElementById('precio').value) || 0,
        unidadMedida: document.getElementById('unidadMedida').value,
        stockActual: parseInt(document.getElementById('stockActual').value) || 0,
        stockMinimo: parseInt(document.getElementById('stockMinimo').value) || 0,
        almacenId: parseInt(document.getElementById('almacenId').value) || null,
        estado: document.getElementById('estado').value
    };

    const url = id ? `${ENDPOINTS.productos}/${id}` : ENDPOINTS.productos;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) {
            const errData = await resp.json();
            throw new Error(JSON.stringify(errData));
        }
        alert('Producto guardado con éxito');
        limpiarFormularioProducto();
        cargarProductos();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function editarProducto(id, codigo, nombre, tipo, precio, unidad, stockAct, stockMin, almacenId, estado) {
    document.getElementById('prodId').value = id;
    document.getElementById('codigoBarras').value = codigo;
    document.getElementById('nombre').value = nombre;
    document.getElementById('tipo').value = tipo;
    document.getElementById('precio').value = precio;
    document.getElementById('unidadMedida').value = unidad;
    document.getElementById('stockActual').value = stockAct;
    document.getElementById('stockMinimo').value = stockMin;
    document.getElementById('almacenId').value = almacenId;
    document.getElementById('estado').value = estado;
    document.getElementById('prodFormTitulo').innerText = `Editar Producto #${id}`;
}

async function eliminarProducto(id) {
    if (!confirm(`¿Deseas eliminar el producto #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.productos}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarProductos();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function limpiarFormularioProducto() {
    const safeSet = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    safeSet('prodId', '');
    safeSet('codigoBarras', '');
    safeSet('nombre', '');
    safeSet('tipo', 'Insumo');
    safeSet('precio', '0');
    safeSet('unidadMedida', 'Kg');
    safeSet('stockActual', '0');
    safeSet('stockMinimo', '1');
    safeSet('almacenId', '');
    safeSet('estado', 'ACTIVO');

    const titulo = document.getElementById('prodFormTitulo');
    if (titulo) titulo.innerText = '+ Nuevo Producto';
}

async function cargarSelectAlmacenes() {
    const select = document.getElementById('almacenId');
    if (!select) return;
    try {
        const resp = await fetch(ENDPOINTS.almacenes);
        if (resp.ok) {
            const lista = await resp.json();
            select.innerHTML = '<option value="">Seleccione un almacén...</option>' +
                lista.map(a => `<option value="${a.id}">${escapeHTML(a.nombre)}</option>`).join('');
        }
    } catch (e) {
        console.error("Error al cargar select de almacenes:", e);
    }
}

// ==========================================
// 2. MÓDULO CATEGORÍAS
// ==========================================
async function cargarCategorias() {
    const tbody = document.getElementById('tablaCategorias');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Cargando categorías...</td></tr>';

    try {
        const resp = await fetch(ENDPOINTS.categorias);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin categorías registradas</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(c => `
            <tr>
                <td><strong>#${c.id}</strong></td>
                <td>${escapeHTML(c.nombre)}</td>
                <td>${c.descripcion ? escapeHTML(c.descripcion) : '<span class="text-muted">-</span>'}</td>
                <td>${badgeEstado(c.estado)}</td>
                <td class="text-end text-nowrap">
                    <button type="button" class="btn-action edit me-1" title="Editar" onclick="editarCategoria(${c.id}, '${escapeHTML(c.nombre)}', '${escapeHTML(c.descripcion || '')}', '${c.estado}')"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn-action delete" title="Eliminar" onclick="eliminarCategoria(${c.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarCategoria(e) {
    e.preventDefault();
    const id = document.getElementById('catId').value;
    const payload = {
        id: id ? parseInt(id) : 0,
        nombre: document.getElementById('catNombre').value.trim(),
        descripcion: document.getElementById('catDescripcion').value.trim() || null,
        estado: document.getElementById('catEstado').value
    };

    const url = id ? `${ENDPOINTS.categorias}/${id}` : ENDPOINTS.categorias;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        limpiarFormularioCategoria();
        cargarCategorias();
        alert('Categoría guardada.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function editarCategoria(id, nombre, descripcion, estado) {
    document.getElementById('catId').value = id;
    document.getElementById('catNombre').value = nombre;
    document.getElementById('catDescripcion').value = descripcion;
    document.getElementById('catEstado').value = estado;
    document.getElementById('catFormTitulo').innerText = `Editar Categoría #${id}`;
}

async function eliminarCategoria(id) {
    if (!confirm(`¿Eliminar categoría #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.categorias}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarCategorias();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function limpiarFormularioCategoria() {
    const form = document.getElementById('formCategoria');
    if (form) form.reset();
    document.getElementById('catId').value = '';
    const titulo = document.getElementById('catFormTitulo');
    if (titulo) titulo.innerText = 'Nueva Categoría';
}

// ==========================================
// 3. MÓDULO ALMACENES
// ==========================================
async function cargarAlmacenes() {
    const tbody = document.getElementById('tablaAlmacenes');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Cargando almacenes...</td></tr>';

    try {
        const resp = await fetch(ENDPOINTS.almacenes);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin almacenes registrados</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(a => `
            <tr>
                <td><strong>#${a.id}</strong></td>
                <td>${escapeHTML(a.nombre)}</td>
                <td>${a.ubicacion ? escapeHTML(a.ubicacion) : '<span class="text-muted">-</span>'}</td>
                <td>${badgeEstado(a.estado)}</td>
                <td class="text-end text-nowrap">
                    <button type="button" class="btn-action edit me-1" title="Editar" onclick="editarAlmacen(${a.id}, '${escapeHTML(a.nombre)}', '${escapeHTML(a.ubicacion || '')}', '${a.estado}')"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn-action delete" title="Eliminar" onclick="eliminarAlmacen(${a.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarAlmacen(e) {
    e.preventDefault();
    const id = document.getElementById('almId').value;
    const payload = {
        id: id ? parseInt(id) : 0,
        nombre: document.getElementById('almNombre').value.trim(),
        ubicacion: document.getElementById('almUbicacion').value.trim() || null,
        estado: document.getElementById('almEstado').value
    };

    const url = id ? `${ENDPOINTS.almacenes}/${id}` : ENDPOINTS.almacenes;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        limpiarFormularioAlmacen();
        cargarAlmacenes();
        alert('Almacén guardado exitosamente.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function editarAlmacen(id, nombre, ubicacion, estado) {
    document.getElementById('almId').value = id;
    document.getElementById('almNombre').value = nombre;
    document.getElementById('almUbicacion').value = ubicacion;
    document.getElementById('almEstado').value = estado;
}

async function eliminarAlmacen(id) {
    if (!confirm(`¿Estás seguro de eliminar el almacén #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.almacenes}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarAlmacenes();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function limpiarFormularioAlmacen() {
    const form = document.getElementById('formAlmacen');
    if (form) form.reset();
    document.getElementById('almId').value = '';
}

// ==========================================
// 4. MÓDULO PERSONAS
// ==========================================
async function cargarPersonas() {
    const tbody = document.getElementById('tablaPersonas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Cargando personas...</td></tr>';

    try {
        const resp = await fetch(ENDPOINTS.personas);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Sin personas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(p => `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td>${escapeHTML(p.nombre_completo || p.nombre || '')}</td>
                <td>${escapeHTML(p.cedula || '')}</td>
                <td>${escapeHTML(p.email || '')}</td>
                <td>${escapeHTML(p.telefono || '')}</td>
                <td><span class="badge ${p.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">${p.estado}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="editarPersona(${p.id}, '${escapeHTML(p.nombre_completo || p.nombre || '')}', '${escapeHTML(p.cedula || '')}', '${escapeHTML(p.email || '')}', '${escapeHTML(p.telefono || '')}', '${p.estado}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarPersona(${p.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarPersona(e) {
    e.preventDefault();
    const id = document.getElementById('perId') ? document.getElementById('perId').value : '';

    const payload = {
        Id: id ? parseInt(id) : 0,
        NombreCompleto: document.getElementById('perNombre').value.trim(),
        Cedula: document.getElementById('perCedula').value.trim() || null,
        Email: document.getElementById('perEmail').value.trim() || null,
        Telefono: document.getElementById('perTelefono').value.trim() || null,
        Estado: document.getElementById('perEstado').value
    };

    const url = id ? `${ENDPOINTS.personas}/${id}` : ENDPOINTS.personas;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        limpiarFormularioPersona();
        cargarPersonas();
        alert('Persona guardada exitosamente.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function editarPersona(id, nombre, cedula, email, telefono, estado) {
    if (document.getElementById('perId')) document.getElementById('perId').value = id;
    if (document.getElementById('perNombre')) document.getElementById('perNombre').value = nombre;
    if (document.getElementById('perCedula')) document.getElementById('perCedula').value = cedula;
    if (document.getElementById('perEmail')) document.getElementById('perEmail').value = email;
    if (document.getElementById('perTelefono')) document.getElementById('perTelefono').value = telefono;
    if (document.getElementById('perEstado')) document.getElementById('perEstado').value = estado;
}

async function eliminarPersona(id) {
    if (!confirm(`¿Estás seguro de eliminar a la persona #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.personas}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarPersonas();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function limpiarFormularioPersona() {
    const form = document.getElementById('formPersona');
    if (form) form.reset();
    if (document.getElementById('perId')) document.getElementById('perId').value = '';
}

// ==========================================
// 5. MÓDULO EMPLEADOS
// ==========================================

// Carga las personas registradas en el desplegable (Select)
async function cargarSelectPersonas() {
    const select = document.getElementById('empPersona') || document.getElementById('empPersonaId');
    if (!select) return;

    try {
        const resp = await fetch(ENDPOINTS.personas);
        if (!resp.ok) return;
        const personas = await resp.json();

        let options = '<option value="">-- Seleccione una Persona --</option>';
        personas.forEach(p => {
            const nombre = p.nombre_completo || p.NombreCompleto || p.nombre || '';
            const id = p.id || p.Id;
            const cedula = p.cedula || p.Cedula || 'S/N';
            options += `<option value="${id}">${escapeHTML(nombre)} (CI: ${escapeHTML(cedula)})</option>`;
        });
        select.innerHTML = options;
    } catch (err) {
        console.error('Error al cargar personas:', err);
    }
}

async function cargarEmpleados() {
    const tbody = document.getElementById('tablaEmpleados');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Cargando empleados...</td></tr>';

    // Poblar también el desplegable de Personas
    cargarSelectPersonas();

    try {
        const resp = await fetch(ENDPOINTS.empleados);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin empleados registrados</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(e => {
            const id = e.id || e.Id;
            const nro = e.nro_empleado || e.nroEmpleado || e.NroEmpleado || e.codigo || '-';
            const cargo = e.cargo || e.Cargo || '-';
            const salario = e.salario !== undefined ? e.salario : (e.Salario || 0);
            const estado = e.estado || e.Estado || 'ACTIVO';
            const personaId = e.persona_id || e.personaId || e.PersonaId || '';

            return `
                <tr>
                    <td><strong>#${id}</strong></td>
                    <td>${escapeHTML(nro)}</td>
                    <td>${escapeHTML(cargo)}</td>
                    <td>Bs. ${parseFloat(salario).toFixed(2)}</td>
                    <td><span class="badge ${estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">${estado}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarEmpleado(${id}, '${personaId}', '${escapeHTML(nro)}', '${escapeHTML(cargo)}', ${salario}, '${estado}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarEmpleado(${id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function cargarSelectPersonas() {
    const select = document.getElementById('empPersona') || document.getElementById('empPersonaId');
    if (!select) return;

    try {
        const resp = await fetch(ENDPOINTS.personas);
        if (!resp.ok) return;
        const personas = await resp.json();

        let options = '<option value="">-- Seleccione una Persona --</option>';
        personas.forEach(p => {
            const id = p.id || p.Id || p.ID;
            const nombre = p.nombreCompleto || p.NombreCompleto || p.nombre_completo || p.nombre || p.Nombre || '';
            const cedula = p.cedula || p.Cedula || 'S/N';
            options += `<option value="${id}">${escapeHTML(nombre)} (CI: ${escapeHTML(cedula)})</option>`;
        });
        select.innerHTML = options;
    } catch (err) {
        console.error('Error al cargar personas:', err);
    }
}

async function guardarEmpleado(e) {
    e.preventDefault();
    const idElem = document.getElementById('empId');
    const id = idElem ? idElem.value : '';

    const personaSelect = document.getElementById('empPersona') || document.getElementById('empPersonaId');
    const nroInput = document.getElementById('empNroEmpleado') || document.getElementById('empCodigo');
    const cargoInput = document.getElementById('empCargo');
    const salarioInput = document.getElementById('empSalario');
    const estadoSelect = document.getElementById('empEstado');

    const personaIdVal = personaSelect && personaSelect.value ? parseInt(personaSelect.value) : 0;

    const payload = {
        Id: id ? parseInt(id) : 0,
        IdPersona: personaIdVal,       // Mapeo exacto para el backend C# (id_persona)
        PersonaId: personaIdVal,
        id_persona: personaIdVal,
        NumeroEmpleado: nroInput ? nroInput.value.trim() : '',
        Cargo: cargoInput ? cargoInput.value.trim() : '',
        Salario: salarioInput ? parseFloat(salarioInput.value) || 0 : 0,
        Estado: estadoSelect ? estadoSelect.value : 'ACTIVO'
    };

    const url = id ? `${ENDPOINTS.empleados}/${id}` : ENDPOINTS.empleados;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        limpiarFormularioEmpleado();
        cargarEmpleados();
        alert('Empleado guardado exitosamente.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
function editarEmpleado(id, personaId, nro, cargo, salario, estado) {
    if (document.getElementById('empId')) document.getElementById('empId').value = id;

    const personaSelect = document.getElementById('empPersona') || document.getElementById('empPersonaId');
    if (personaSelect) personaSelect.value = personaId;

    const nroInput = document.getElementById('empNroEmpleado') || document.getElementById('empCodigo');
    if (nroInput) nroInput.value = nro;

    if (document.getElementById('empCargo')) document.getElementById('empCargo').value = cargo;
    if (document.getElementById('empSalario')) document.getElementById('empSalario').value = salario;
    if (document.getElementById('empEstado')) document.getElementById('empEstado').value = estado;
}

async function eliminarEmpleado(id) {
    if (!confirm(`¿Estás seguro de eliminar al empleado #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.empleados}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarEmpleados();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function limpiarFormularioEmpleado() {
    const form = document.getElementById('formEmpleado');
    if (form) form.reset();
    if (document.getElementById('empId')) document.getElementById('empId').value = '';
}
// ==========================================
// MÓDULO COMPRAS
// ==========================================

// Carga los proveedores en el desplegable (Select)
async function cargarSelectProveedores() {
    const select = document.getElementById('compProveedor') || document.getElementById('compProveedorId');
    if (!select) return;

    try {
        const resp = await fetch(ENDPOINTS.proveedores);
        if (!resp.ok) return;
        const proveedores = await resp.json();

        let options = '<option value="">-- Seleccione un Proveedor --</option>';
        proveedores.forEach(p => {
            const id = p.id || p.Id || p.ID;
            const nombre = p.nombre || p.Nombre || p.nombreEmpresa || p.razonSocial || '';
            const nit = p.nit || p.Nit || p.cedula || 'S/N';
            options += `<option value="${id}">${escapeHTML(nombre)} (NIT/CI: ${escapeHTML(nit)})</option>`;
        });
        select.innerHTML = options;
    } catch (err) {
        console.error('Error al cargar proveedores:', err);
    }
}

// Carga los almacenes en el desplegable (Select)
async function cargarSelectAlmacenes() {
    const select = document.getElementById('compAlmacen') || document.getElementById('compAlmacenId');
    if (!select) return;

    try {
        const resp = await fetch(ENDPOINTS.almacenes);
        if (!resp.ok) return;
        const almacenes = await resp.json();

        let options = '<option value="">-- Seleccione un Almacén --</option>';
        almacenes.forEach(a => {
            const id = a.id || a.Id || a.ID;
            const nombre = a.nombre || a.Nombre || '';
            options += `<option value="${id}">${escapeHTML(nombre)}</option>`;
        });
        select.innerHTML = options;
    } catch (err) {
        console.error('Error al cargar almacenes:', err);
    }
}

async function cargarCompras() {
    const tbody = document.getElementById('tablaCompras');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Cargando compras...</td></tr>';

    // Poblar los desplegables necesarios
    cargarSelectProveedores();
    cargarSelectAlmacenes();

    try {
        const resp = await fetch(ENDPOINTS.compras);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin compras registradas</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(c => {
            const id = c.id || c.Id;
            const factura = c.numeroFactura || c.NumeroFactura || c.numero_factura || c.factura || '-';
            const total = c.total !== undefined ? c.total : (c.Total || 0);
            const estado = c.estado || c.Estado || 'COMPLETADO';
            const proveedorId = c.proveedorId || c.ProveedorId || c.proveedor_id || '';
            const almacenId = c.almacenId || c.AlmacenId || c.almacen_id || '';

            return `
                <tr>
                    <td><strong>#${id}</strong></td>
                    <td>${escapeHTML(factura)}</td>
                    <td>Bs. ${parseFloat(total).toFixed(2)}</td>
                    <td><span class="badge ${estado === 'COMPLETADO' ? 'bg-success' : 'bg-secondary'}">${estado}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarCompra(${id}, '${proveedorId}', '${almacenId}', '${escapeHTML(factura)}', ${total}, '${estado}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarCompra(${id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarCompra(e) {
    if (e) e.preventDefault();
    const idElem = document.getElementById('compId');
    const id = idElem ? idElem.value : '';

    const proveedorSelect = document.getElementById('compProveedor') || document.getElementById('compProveedorId');
    const almacenSelect = document.getElementById('compAlmacen') || document.getElementById('compAlmacenId');
    const facturaInput = document.getElementById('compFactura') || document.getElementById('compNumeroFactura');
    const totalInput = document.getElementById('compTotal');
    const estadoSelect = document.getElementById('compEstado');

    const proveedorIdVal = proveedorSelect && proveedorSelect.value ? parseInt(proveedorSelect.value) : null;
    const almacenIdVal = almacenSelect && almacenSelect.value ? parseInt(almacenSelect.value) : null;

    const payload = {
        Id: id ? parseInt(id) : 0,
        ProveedorId: proveedorIdVal,
        proveedorId: proveedorIdVal,
        AlmacenId: almacenIdVal,
        almacenId: almacenIdVal,
        NumeroFactura: facturaInput ? facturaInput.value.trim() : '',
        numeroFactura: facturaInput ? facturaInput.value.trim() : '',
        Total: totalInput ? parseFloat(totalInput.value) || 0 : 0,
        total: totalInput ? parseFloat(totalInput.value) || 0 : 0,
        Estado: estadoSelect ? estadoSelect.value : 'COMPLETADO',
        estado: estadoSelect ? estadoSelect.value : 'COMPLETADO',
        detalles: []
    };

    const url = id ? `${ENDPOINTS.compras}/${id}` : ENDPOINTS.compras;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        limpiarFormularioCompra();
        cargarCompras();
        alert('Compra guardada exitosamente.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function editarCompra(id, proveedorId, almacenId, factura, total, estado) {
    if (document.getElementById('compId')) document.getElementById('compId').value = id;

    const proveedorSelect = document.getElementById('compProveedor') || document.getElementById('compProveedorId');
    if (proveedorSelect) proveedorSelect.value = proveedorId;

    const almacenSelect = document.getElementById('compAlmacen') || document.getElementById('compAlmacenId');
    if (almacenSelect) almacenSelect.value = almacenId;

    const facturaInput = document.getElementById('compFactura') || document.getElementById('compNumeroFactura');
    if (facturaInput) facturaInput.value = factura;

    if (document.getElementById('compTotal')) document.getElementById('compTotal').value = total;
    if (document.getElementById('compEstado')) document.getElementById('compEstado').value = estado;
}

async function eliminarCompra(id) {
    if (!confirm(`¿Estás seguro de eliminar la compra #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.compras}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarCompras();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function limpiarFormularioCompra() {
    const form = document.getElementById('formCompra');
    if (form) form.reset();
    if (document.getElementById('compId')) document.getElementById('compId').value = '';
}
// ==========================================
// MÓDULO PROVEEDORES
// ==========================================

async function cargarProveedores() {
    const tbody = document.getElementById('tablaProveedores');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Cargando proveedores...</td></tr>';

    try {
        const resp = await fetch(ENDPOINTS.proveedores);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin proveedores registrados</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(p => {
            const id = p.id || p.Id;
            const nombre = p.nombre || p.Nombre || p.nombreEmpresa || p.razonSocial || '-';
            const nit = p.nit || p.Nit || p.cedula || 'S/N';
            const contacto = p.contacto || p.Contacto || '';
            const telefono = p.telefono || p.Telefono || '-';
            const direccion = p.direccion || p.Direccion || '';
            const estado = p.estado || p.Estado || 'ACTIVO';

            return `
                <tr>
                    <td><strong>#${id}</strong></td>
                    <td>${escapeHTML(nombre)}</td>
                    <td>${escapeHTML(nit)}</td>
                    <td>${escapeHTML(telefono)}</td>
                    <td><span class="badge ${estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">${estado}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarProveedor(${id}, '${escapeHTML(nombre)}', '${escapeHTML(nit)}', '${escapeHTML(contacto)}', '${escapeHTML(telefono)}', '${escapeHTML(direccion)}', '${estado}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarProveedor(${id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarProveedor(e) {
    if (e) e.preventDefault();
    const idElem = document.getElementById('provId');
    const id = idElem ? idElem.value : '';

    const nombreInput = document.getElementById('provNombre');
    const nitInput = document.getElementById('provNit');
    const contactoInput = document.getElementById('provContacto');
    const telefonoInput = document.getElementById('provTelefono');
    const direccionInput = document.getElementById('provDireccion');
    const estadoSelect = document.getElementById('provEstado');

    const payload = {
        Id: id ? parseInt(id) : 0,
        Nombre: nombreInput ? nombreInput.value.trim() : '',
        nombre: nombreInput ? nombreInput.value.trim() : '',
        Nit: nitInput ? nitInput.value.trim() : '',
        nit: nitInput ? nitInput.value.trim() : '',
        Contacto: contactoInput ? contactoInput.value.trim() : '',
        contacto: contactoInput ? contactoInput.value.trim() : '',
        Telefono: telefonoInput ? telefonoInput.value.trim() : '',
        telefono: telefonoInput ? telefonoInput.value.trim() : '',
        Direccion: direccionInput ? direccionInput.value.trim() : '',
        direccion: direccionInput ? direccionInput.value.trim() : '',
        Estado: estadoSelect ? estadoSelect.value : 'ACTIVO',
        estado: estadoSelect ? estadoSelect.value : 'ACTIVO'
    };

    const url = id ? `${ENDPOINTS.proveedores}/${id}` : ENDPOINTS.proveedores;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        limpiarFormularioProveedor();
        cargarProveedores();
        alert('Proveedor guardado exitosamente.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function editarProveedor(id, nombre, nit, contacto, telefono, direccion, estado) {
    if (document.getElementById('provId')) document.getElementById('provId').value = id;
    if (document.getElementById('provNombre')) document.getElementById('provNombre').value = nombre;
    if (document.getElementById('provNit')) document.getElementById('provNit').value = nit;
    if (document.getElementById('provContacto')) document.getElementById('provContacto').value = contacto;
    if (document.getElementById('provTelefono')) document.getElementById('provTelefono').value = telefono;
    if (document.getElementById('provDireccion')) document.getElementById('provDireccion').value = direccion;
    if (document.getElementById('provEstado')) document.getElementById('provEstado').value = estado;

    const titulo = document.getElementById('provFormTitulo');
    if (titulo) titulo.textContent = 'Editar Proveedor #' + id;
}

async function eliminarProveedor(id) {
    if (!confirm(`¿Estás seguro de eliminar el proveedor #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.proveedores}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarProveedores();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function limpiarFormularioProveedor() {
    const form = document.getElementById('formProveedor');
    if (form) form.reset();
    if (document.getElementById('provId')) document.getElementById('provId').value = '';
    const titulo = document.getElementById('provFormTitulo');
    if (titulo) titulo.textContent = '+ Nuevo Proveedor';
}
// ==========================================
// MÓDULO RECETAS
// ==========================================

async function cargarRecetas() {
    const tbody = document.getElementById('tablaRecetas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Cargando recetas...</td></tr>';

    try {
        const resp = await fetch(ENDPOINTS.recetas);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin recetas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(r => {
            const id = r.id || r.Id;
            const nombre = r.nombre || r.Nombre || '-';
            const descripcion = r.descripcion || r.Descripcion || '-';
            const precio = r.precio !== undefined ? r.precio : (r.Precio || 0);
            const estado = r.estado || r.Estado || 'ACTIVO';

            return `
                <tr>
                    <td><strong>#${id}</strong></td>
                    <td>${escapeHTML(nombre)}</td>
                    <td>${escapeHTML(descripcion)}</td>
                    <td>Bs. ${parseFloat(precio).toFixed(2)}</td>
                    <td><span class="badge ${estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">${estado}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarReceta(${id}, '${escapeHTML(nombre)}', '${escapeHTML(descripcion)}', ${precio}, '${estado}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarReceta(${id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarReceta(e) {
    if (e) e.preventDefault();
    const idElem = document.getElementById('recId');
    const id = idElem ? idElem.value : '';

    const nombreInput = document.getElementById('recNombre');
    const descripcionInput = document.getElementById('recDescripcion');
    const precioInput = document.getElementById('recPrecio');
    const estadoSelect = document.getElementById('recEstado');

    const payload = {
        Id: id ? parseInt(id) : 0,
        Nombre: nombreInput ? nombreInput.value.trim() : '',
        nombre: nombreInput ? nombreInput.value.trim() : '',
        Descripcion: descripcionInput ? descripcionInput.value.trim() : '',
        descripcion: descripcionInput ? descripcionInput.value.trim() : '',
        Precio: precioInput ? parseFloat(precioInput.value) || 0 : 0,
        precio: precioInput ? parseFloat(precioInput.value) || 0 : 0,
        Estado: estadoSelect ? estadoSelect.value : 'ACTIVO',
        estado: estadoSelect ? estadoSelect.value : 'ACTIVO'
    };

    const url = id ? `${ENDPOINTS.recetas}/${id}` : ENDPOINTS.recetas;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        limpiarFormularioReceta();
        cargarRecetas();
        alert('Receta guardada exitosamente.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function editarReceta(id, nombre, descripcion, precio, estado) {
    if (document.getElementById('recId')) document.getElementById('recId').value = id;
    if (document.getElementById('recNombre')) document.getElementById('recNombre').value = nombre;
    if (document.getElementById('recDescripcion')) document.getElementById('recDescripcion').value = descripcion;
    if (document.getElementById('recPrecio')) document.getElementById('recPrecio').value = precio;
    if (document.getElementById('recEstado')) document.getElementById('recEstado').value = estado;

    const titulo = document.getElementById('recFormTitulo');
    if (titulo) titulo.textContent = 'Editar Receta #' + id;
}

async function eliminarReceta(id) {
    if (!confirm(`¿Estás seguro de eliminar la receta #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.recetas}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarRecetas();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function limpiarFormularioReceta() {
    const form = document.getElementById('formReceta');
    if (form) form.reset();
    if (document.getElementById('recId')) document.getElementById('recId').value = '';
    const titulo = document.getElementById('recFormTitulo');
    if (titulo) titulo.textContent = '+ Nueva Receta';
}
// ==========================================
// MÓDULO MOVIMIENTOS
// ==========================================

async function cargarMovimientos() {
    const tbody = document.getElementById('tablaMovimientos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Cargando movimientos...</td></tr>';

    try {
        const resp = await fetch(ENDPOINTS.movimientos);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin movimientos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(m => {
            const id = m.id || m.Id;
            const tipo = m.tipo || m.Tipo || '-';
            const cantidad = m.cantidad !== undefined ? m.cantidad : (m.Cantidad || 0);
            const fecha = m.fecha || m.Fecha || '';
            const fechaFormateada = fecha ? fecha.split('T')[0] : '-';
            const obs = m.observaciones || m.Observaciones || '-';

            let badgeColor = 'bg-secondary';
            if (tipo.includes('INGRESO')) badgeColor = 'bg-success';
            else if (tipo.includes('EGRESO')) badgeColor = 'bg-danger';
            else if (tipo.includes('AJUSTE')) badgeColor = 'bg-warning text-dark';

            return `
                <tr>
                    <td><strong>#${id}</strong></td>
                    <td><span class="badge ${badgeColor}">${escapeHTML(tipo)}</span></td>
                    <td>${cantidad}</td>
                    <td>${fechaFormateada}</td>
                    <td>${escapeHTML(obs)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarMovimiento(${id}, '${escapeHTML(tipo)}', ${cantidad}, '${fechaFormateada}', '${escapeHTML(obs)}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarMovimiento(${id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarMovimiento(e) {
    if (e) e.preventDefault();
    const idElem = document.getElementById('movId');
    const id = idElem ? idElem.value : '';

    const tipoSelect = document.getElementById('movTipo');
    const cantidadInput = document.getElementById('movCantidad');
    const fechaInput = document.getElementById('movFecha');
    const obsInput = document.getElementById('movObservacion');

    const payload = {
        Id: id ? parseInt(id) : 0,
        Tipo: tipoSelect ? tipoSelect.value : '',
        tipo: tipoSelect ? tipoSelect.value : '',
        Cantidad: cantidadInput ? parseFloat(cantidadInput.value) || 0 : 0,
        cantidad: cantidadInput ? parseFloat(cantidadInput.value) || 0 : 0,
        Fecha: fechaInput ? fechaInput.value : null,
        fecha: fechaInput ? fechaInput.value : null,
        Observaciones: obsInput ? obsInput.value.trim() : '',
        observaciones: obsInput ? obsInput.value.trim() : '',
        Estado: 'ACTIVO',
        estado: 'ACTIVO'
    };

    const url = id ? `${ENDPOINTS.movimientos}/${id}` : ENDPOINTS.movimientos;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        limpiarFormularioMovimiento();
        cargarMovimientos();
        alert('Movimiento guardado exitosamente.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function editarMovimiento(id, tipo, cantidad, fecha, observaciones) {
    if (document.getElementById('movId')) document.getElementById('movId').value = id;
    if (document.getElementById('movTipo')) document.getElementById('movTipo').value = tipo;
    if (document.getElementById('movCantidad')) document.getElementById('movCantidad').value = cantidad;
    if (document.getElementById('movFecha')) document.getElementById('movFecha').value = fecha;
    if (document.getElementById('movObservacion')) document.getElementById('movObservacion').value = observaciones;

    const titulo = document.getElementById('movFormTitulo');
    if (titulo) titulo.textContent = 'Editar Movimiento #' + id;
}

async function eliminarMovimiento(id) {
    if (!confirm(`¿Estás seguro de eliminar el movimiento #${id}?`)) return;
    try {
        const resp = await fetch(`${ENDPOINTS.movimientos}/${id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(await mensajeError(resp));
        cargarMovimientos();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function limpiarFormularioMovimiento() {
    const form = document.getElementById('formMovimiento');
    if (form) form.reset();
    if (document.getElementById('movId')) document.getElementById('movId').value = '';
    const titulo = document.getElementById('movFormTitulo');
    if (titulo) titulo.textContent = '+ Nuevo Movimiento';

    const hoy = new Date().toISOString().split('T')[0];
    if (document.getElementById('movFecha')) document.getElementById('movFecha').value = hoy;
}

// Guardar o Actualizar Movimiento
async function guardarMovimiento(event) {
    event.preventDefault();

    const id = document.getElementById("movId").value;
    const datos = {
        tipo: document.getElementById("movTipo").value,
        cantidad: parseFloat(document.getElementById("movCantidad").value),
        fecha: document.getElementById("movFecha").value,
        observaciones: document.getElementById("movObservacion").value
    };

    const metodo = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/movimientos/${id}` : `${API_URL}/movimientos`;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            limpiarFormularioMovimiento();
            cargarMovimientos();
        } else {
            const errData = await res.json();
            alert("Error: " + JSON.stringify(errData));
        }
    } catch (error) {
        alert("Error de conexión: " + error.message);
    }
}

// Editar Movimiento
function editarMovimiento(mov) {
    document.getElementById("movId").value = mov.id;
    document.getElementById("movTipo").value = mov.tipo || "";
    document.getElementById("movCantidad").value = mov.cantidad || "";
    document.getElementById("movFecha").value = mov.fecha ? mov.fecha.split("T")[0] : "";
    document.getElementById("movObservacion").value = mov.observaciones || mov.motivo || "";

    document.getElementById("movFormTitulo").innerText = "Editar Movimiento #" + mov.id;
}

// Limpiar Formulario
function limpiarFormularioMovimiento() {
    document.getElementById("formMovimiento").reset();
    document.getElementById("movId").value = "";
    document.getElementById("movFormTitulo").innerText = "+ Nuevo Movimiento";

    // Poner la fecha actual en el campo de fecha
    const hoy = new Date().toISOString().split("T")[0];
    document.getElementById("movFecha").value = hoy;
}

// ==========================================
// MÓDULO REPORTES Y GENERACIÓN DE PDF
// ==========================================

// 1. Cargar Vista Previa en la Tabla
async function cargarVistaPreviaReporte() {
    const modulo = document.getElementById('repModulo').value;
    const titulo = document.getElementById('repTituloVistaPrevia');
    const thead = document.getElementById('headVistaPrevia');
    const tbody = document.getElementById('bodyVistaPrevia');

    if (!tbody || !thead) return;

    tbody.innerHTML = '<tr><td class="text-center text-muted">Cargando datos...</td></tr>';

    try {
        const resp = await fetch(ENDPOINTS[modulo]);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const datos = await resp.json();

        titulo.textContent = `Vista Previa: ${modulo.toUpperCase()}`;

        if (!datos || datos.length === 0) {
            tbody.innerHTML = '<tr><td class="text-center text-muted">Sin registros disponibles</td></tr>';
            return;
        }

        // Renderizar encabezados y filas según el módulo
        if (modulo === 'compras') {
            thead.innerHTML = `<tr><th>ID</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>`;
            tbody.innerHTML = datos.map(d => `
                <tr>
                    <td>#${d.id || d.Id}</td>
                    <td>${(d.fecha || d.Fecha || '').split('T')[0]}</td>
                    <td>Bs. ${parseFloat(d.total || d.Total || 0).toFixed(2)}</td>
                    <td>${d.estado || d.Estado || 'COMPLETADO'}</td>
                </tr>
            `).join('');
        } else if (modulo === 'proveedores') {
            thead.innerHTML = `<tr><th>ID</th><th>Nombre / Razón Social</th><th>NIT / CI</th><th>Teléfono</th></tr>`;
            tbody.innerHTML = datos.map(d => `
                <tr>
                    <td>#${d.id || d.Id}</td>
                    <td>${escapeHTML(d.nombre || d.Nombre || '-')}</td>
                    <td>${escapeHTML(d.nit || d.Nit || '-')}</td>
                    <td>${escapeHTML(d.telefono || d.Telefono || '-')}</td>
                </tr>
            `).join('');
        } else if (modulo === 'recetas') {
            thead.innerHTML = `<tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Estado</th></tr>`;
            tbody.innerHTML = datos.map(d => `
                <tr>
                    <td>#${d.id || d.Id}</td>
                    <td>${escapeHTML(d.nombre || d.Nombre || '-')}</td>
                    <td>Bs. ${parseFloat(d.precio || d.Precio || 0).toFixed(2)}</td>
                    <td>${d.estado || d.Estado || 'ACTIVO'}</td>
                </tr>
            `).join('');
        } else if (modulo === 'movimientos') {
            thead.innerHTML = `<tr><th>ID</th><th>Tipo</th><th>Cantidad</th><th>Fecha</th></tr>`;
            tbody.innerHTML = datos.map(d => `
                <tr>
                    <td>#${d.id || d.Id}</td>
                    <td>${escapeHTML(d.tipo || d.Tipo || '-')}</td>
                    <td>${d.cantidad || d.Cantidad || 0}</td>
                    <td>${(d.fecha || d.Fecha || '').split('T')[0]}</td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td class="text-center text-danger">${err.message}</td></tr>`;
    }
}

// 2. Descargar PDF del Módulo Seleccionado
async function descargarPDFSeleccionado() {
    const modulo = document.getElementById('repModulo').value;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    try {
        const resp = await fetch(ENDPOINTS[modulo]);
        const datos = await resp.json();

        // Encabezado del PDF
        doc.setFontSize(18);
        doc.text(`Reporte de ${modulo.toUpperCase()}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 28);

        let headers = [];
        let rows = [];

        if (modulo === 'compras') {
            headers = [['ID', 'Fecha', 'Total (Bs.)', 'Estado']];
            rows = datos.map(d => [d.id || d.Id, (d.fecha || d.Fecha || '').split('T')[0], parseFloat(d.total || d.Total || 0).toFixed(2), d.estado || d.Estado || 'COMPLETADO']);
        } else if (modulo === 'proveedores') {
            headers = [['ID', 'Nombre / Razón Social', 'NIT / CI', 'Contacto', 'Teléfono']];
            rows = datos.map(d => [d.id || d.Id, d.nombre || d.Nombre || '-', d.nit || d.Nit || '-', d.contacto || d.Contacto || '-', d.telefono || d.Telefono || '-']);
        } else if (modulo === 'recetas') {
            headers = [['ID', 'Nombre', 'Descripción', 'Precio (Bs.)', 'Estado']];
            rows = datos.map(d => [d.id || d.Id, d.nombre || d.Nombre || '-', d.descripcion || d.Descripcion || '-', parseFloat(d.precio || d.Precio || 0).toFixed(2), d.estado || d.Estado || 'ACTIVO']);
        } else if (modulo === 'movimientos') {
            headers = [['ID', 'Tipo', 'Cantidad', 'Fecha', 'Observaciones']];
            rows = datos.map(d => [d.id || d.Id, d.tipo || d.Tipo || '-', d.cantidad || d.Cantidad || 0, (d.fecha || d.Fecha || '').split('T')[0], d.observaciones || d.Observaciones || '-']);
        }

        // Generar Tabla en PDF
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 34,
            theme: 'grid',
            headStyles: { fillColor: [240, 173, 78] } // Color warning / dorado
        });

        doc.save(`Reporte_${modulo}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        alert('Error al generar PDF: ' + err.message);
    }
}

// 3. Descargar Reporte General (Consolidado de todo el sistema)
async function descargarPDFGeneral() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("REPORTE GENERAL DEL SISTEMA", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

    let lastY = 32;

    const modulos = [
        { key: 'compras', title: '1. Compras', headers: [['ID', 'Fecha', 'Total (Bs.)', 'Estado']], map: d => [d.id || d.Id, (d.fecha || d.Fecha || '').split('T')[0], parseFloat(d.total || d.Total || 0).toFixed(2), d.estado || d.Estado || 'COMPLETADO'] },
        { key: 'proveedores', title: '2. Proveedores', headers: [['ID', 'Nombre', 'NIT / CI', 'Teléfono']], map: d => [d.id || d.Id, d.nombre || d.Nombre || '-', d.nit || d.Nit || '-', d.telefono || d.Telefono || '-'] },
        { key: 'recetas', title: '3. Recetas', headers: [['ID', 'Nombre', 'Precio (Bs.)', 'Estado']], map: d => [d.id || d.Id, d.nombre || d.Nombre || '-', parseFloat(d.precio || d.Precio || 0).toFixed(2), d.estado || d.Estado || 'ACTIVO'] },
        { key: 'movimientos', title: '4. Movimientos de Inventario', headers: [['ID', 'Tipo', 'Cantidad', 'Fecha']], map: d => [d.id || d.Id, d.tipo || d.Tipo || '-', d.cantidad || d.Cantidad || 0, (d.fecha || d.Fecha || '').split('T')[0]] }
    ];

    try {
        for (const mod of modulos) {
            const resp = await fetch(ENDPOINTS[mod.key]);
            const datos = await resp.json();

            if (lastY > 230) {
                doc.addPage();
                lastY = 20;
            }

            doc.setFontSize(14);
            doc.text(mod.title, 14, lastY + 10);

            doc.autoTable({
                head: mod.headers,
                body: datos.map(mod.map),
                startY: lastY + 14,
                theme: 'striped',
                headStyles: { fillColor: [52, 58, 64] }
            });

            lastY = doc.lastAutoTable.finalY + 10;
        }

        doc.save(`Reporte_General_Sistema_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        alert('Error al generar Reporte General: ' + err.message);
    }
}