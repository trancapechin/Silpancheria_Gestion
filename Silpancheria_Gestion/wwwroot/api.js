// ==========================================
// CONFIGURACIÓN DE ENDPOINTS
// ==========================================
let miGraficoStock = null;
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

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

async function mensajeError(resp) {
    try {
        const texto = await resp.text();
        return texto || `Error HTTP: ${resp.status}`;
    } catch {
        return `Error HTTP: ${resp.status}`;
    }
}

function badgeEstado(estado) {
    const e = (estado || '').toString().toUpperCase();
    if (e === 'ACTIVO' || e === 'COMPLETADO' || e === 'CONFIRMADA' || e === 'PAGADA') {
        return `<span class="badge-status badge-activo">${estado || 'Activo'}</span>`;
    }
    if (e === 'PENDIENTE') {
        return `<span class="badge-status badge-pendiente">${estado}</span>`;
    }
    if (e.includes('BAJO')) {
        return `<span class="badge-status badge-bajo">${estado}</span>`;
    }
    if (e.includes('AGOT') || e === 'CANCELADO' || e === 'INACTIVO') {
        return `<span class="badge-status badge-agotado">${estado || 'Inactivo'}</span>`;
    }
    return `<span class="badge-status badge-inactivo">${estado || '-'}</span>`;
}

function badgeTipo(tipo) {
    const t = (tipo || '').toString().toLowerCase();
    let cls = 'badge-tipo';
    if (t.includes('plato')) cls += ' plato';
    else if (t.includes('bebida')) cls += ' bebida';
    return `<span class="${cls}">${tipo || 'General'}</span>`;
}

function fmtStock(valor, unidad) {
    if (valor === null || valor === undefined || valor === '' || Number.isNaN(Number(valor))) {
        return ('0 ' + (unidad || '')).trim();
    }
    return (Number(valor) + ' ' + (unidad || '')).trim();
}

function renderizarGraficoInventario(normales, bajos, agotados) {
    const canvas = document.getElementById('graficoInventario');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (miGraficoStock) {
        miGraficoStock.destroy();
    }

    miGraficoStock = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Stock Normal', 'Stock Bajo', 'Agotados'],
            datasets: [{
                data: [normales, bajos, agotados],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// ==========================================
// 1. MÓDULO PRODUCTOS
// ==========================================
async function cargarProductos() {
    const tbody = document.getElementById('tablaProductos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Cargando productos...</td></tr>';

    cargarSelectAlmacenes();

    try {
        const resp = await fetch(ENDPOINTS.productos);
        if (!resp.ok) throw new Error(`Error ${resp.status}: No se pudieron obtener los productos.`);
        const lista = await resp.json();

        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Sin productos registrados</td></tr>';
            renderizarGraficoInventario(0, 0, 0);
            return;
        }

        let normales = 0, bajos = 0, agotados = 0;
        lista.forEach(p => {
            const stock = Number(p.stockActual ?? p.stock ?? 0);
            const min = Number(p.stockMinimo ?? p.stock_minimo ?? 0);
            if (stock <= 0) agotados++;
            else if (stock <= min) bajos++;
            else normales++;
        });

        renderizarGraficoInventario(normales, bajos, agotados);

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
                    <button type="button" class="btn-action edit me-1" title="Editar producto"
                    onclick="editarProducto(${p.id}, '${escapeHTML(p.codigoBarras || '')}', '${escapeHTML(p.nombre)}', '${p.tipo}', ${p.precio || 0}, '${unidad}', ${stockNum}, ${minNum}, ${p.almacenId || p.almacen_id || 0}, '${p.estado}')"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn-action delete" title="Eliminar producto"
                    onclick="eliminarProducto(${p.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarProducto(e) {
    e.preventDefault();
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
        if (!resp.ok) throw new Error(await mensajeError(resp));
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
        console.error('Error al cargar select de almacenes:', e);
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
        </tr>`).join('');
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
        </tr>`).join('');
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
            <td>${escapeHTML(p.nombre_completo || p.nombreCompleto || p.nombre || '')}</td>
            <td>${escapeHTML(p.cedula || '')}</td>
            <td>${escapeHTML(p.email || '')}</td>
            <td>${escapeHTML(p.telefono || '')}</td>
            <td>${badgeEstado(p.estado)}</td>
            <td class="text-end text-nowrap">
                <button class="btn-action edit me-1" onclick="editarPersona(${p.id}, '${escapeHTML(p.nombre_completo || p.nombreCompleto || p.nombre || '')}', '${escapeHTML(p.cedula || '')}', '${escapeHTML(p.email || '')}', '${escapeHTML(p.telefono || '')}', '${p.estado}')"><i class="bi bi-pencil"></i></button>
                <button class="btn-action delete" onclick="eliminarPersona(${p.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>`).join('');
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
async function cargarSelectPersonas() {
    const select = document.getElementById('empPersonaId');
    if (!select) return;
    try {
        const resp = await fetch(ENDPOINTS.personas);
        if (!resp.ok) return;
        const personas = await resp.json();
        let options = '<option value="">-- Seleccione una Persona --</option>';
        personas.forEach(p => {
            const id = p.id || p.Id;
            const nombre = p.nombreCompleto || p.NombreCompleto || p.nombre_completo || p.nombre || '';
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
            const nro = e.nro_empleado || e.nroEmpleado || e.NroEmpleado || e.numeroEmpleado || e.codigo || '-';
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
                <td>${badgeEstado(estado)}</td>
                <td class="text-end text-nowrap">
                    <button class="btn-action edit me-1" onclick="editarEmpleado(${id}, '${personaId}', '${escapeHTML(nro)}', '${escapeHTML(cargo)}', ${salario}, '${estado}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-action delete" onclick="eliminarEmpleado(${id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarEmpleado(e) {
    e.preventDefault();
    const id = document.getElementById('empId').value;
    const personaSelect = document.getElementById('empPersonaId');
    const nroInput = document.getElementById('empNumero');
    const cargoInput = document.getElementById('empCargo');
    const salarioInput = document.getElementById('empSalario');

    const personaIdVal = personaSelect && personaSelect.value ? parseInt(personaSelect.value) : 0;

    const payload = {
        Id: id ? parseInt(id) : 0,
        PersonaId: personaIdVal,
        NumeroEmpleado: nroInput ? nroInput.value.trim() : '',
        Cargo: cargoInput ? cargoInput.value.trim() : '',
        Salario: salarioInput ? parseFloat(salarioInput.value) || 0 : 0,
        Estado: 'ACTIVO'
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
    const personaSelect = document.getElementById('empPersonaId');
    if (personaSelect) personaSelect.value = personaId;
    const nroInput = document.getElementById('empNumero');
    if (nroInput) nroInput.value = nro;
    if (document.getElementById('empCargo')) document.getElementById('empCargo').value = cargo;
    if (document.getElementById('empSalario')) document.getElementById('empSalario').value = salario;
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
// 6. MÓDULO COMPRAS
// ==========================================
async function cargarSelectProveedores() {
    const select = document.getElementById('compProveedor');
    if (!select) return;
    try {
        const resp = await fetch(ENDPOINTS.proveedores);
        if (!resp.ok) return;
        const proveedores = await resp.json();
        let options = '<option value="">-- Seleccione un Proveedor --</option>';
        proveedores.forEach(p => {
            const id = p.id || p.Id;
            const nombre = p.nombre || p.Nombre || p.razonSocial || '';
            const nit = p.nit || p.Nit || 'S/N';
            options += `<option value="${id}">${escapeHTML(nombre)} (NIT/CI: ${escapeHTML(nit)})</option>`;
        });
        select.innerHTML = options;
    } catch (err) {
        console.error('Error al cargar proveedores:', err);
    }
}

async function cargarCompras() {
    const tbody = document.getElementById('tablaCompras');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Cargando compras...</td></tr>';

    cargarSelectProveedores();

    try {
        const resp = await fetch(ENDPOINTS.compras);
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const lista = await resp.json();
        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin compras registradas</td></tr>';
            return;
        }
        tbody.innerHTML = lista.map(c => {
            const id = c.id || c.Id;
            const factura = c.numeroFactura || c.NumeroFactura || c.numero_factura || '-';
            const total = c.total !== undefined ? c.total : (c.Total || 0);
            const estado = c.estado || c.Estado || 'COMPLETADO';
            const proveedorId = c.proveedorId || c.ProveedorId || '';
            const almacenId = c.almacenId || c.AlmacenId || '';

            return `
            <tr>
                <td><strong>#${id}</strong></td>
                <td>${escapeHTML(factura)}</td>
                <td>Bs. ${parseFloat(total).toFixed(2)}</td>
                <td>${badgeEstado(estado)}</td>
                <td class="text-end text-nowrap">
                    <button class="btn-action edit me-1" onclick="editarCompra(${id}, '${proveedorId}', '${almacenId}', '${escapeHTML(factura)}', ${total}, '${estado}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-action delete" onclick="eliminarCompra(${id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarCompra(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('compId').value;
    const proveedorSelect = document.getElementById('compProveedor');
    const almacenSelect = document.getElementById('compAlmacen');
    const facturaInput = document.getElementById('compFactura');
    const totalInput = document.getElementById('compTotal');
    const estadoSelect = document.getElementById('compEstado');

    const payload = {
        Id: id ? parseInt(id) : 0,
        ProveedorId: proveedorSelect && proveedorSelect.value ? parseInt(proveedorSelect.value) : null,
        AlmacenId: almacenSelect && almacenSelect.value ? parseInt(almacenSelect.value) : null,
        NumeroFactura: facturaInput ? facturaInput.value.trim() : '',
        Total: totalInput ? parseFloat(totalInput.value) || 0 : 0,
        Estado: estadoSelect ? estadoSelect.value : 'COMPLETADO'
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
    document.getElementById('compId').value = id;
    if (document.getElementById('compProveedor')) document.getElementById('compProveedor').value = proveedorId;
    if (document.getElementById('compAlmacen')) document.getElementById('compAlmacen').value = almacenId;
    if (document.getElementById('compFactura')) document.getElementById('compFactura').value = factura;
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
// 7. MÓDULO PROVEEDORES
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
            const nombre = p.nombre || p.Nombre || p.razonSocial || '-';
            const nit = p.nit || p.Nit || 'S/N';
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
                <td>${badgeEstado(estado)}</td>
                <td class="text-end text-nowrap">
                    <button class="btn-action edit me-1" onclick="editarProveedor(${id}, '${escapeHTML(nombre)}', '${escapeHTML(nit)}', '${escapeHTML(contacto)}', '${escapeHTML(telefono)}', '${escapeHTML(direccion)}', '${estado}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-action delete" onclick="eliminarProveedor(${id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarProveedor(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('provId').value;
    const payload = {
        Id: id ? parseInt(id) : 0,
        Nombre: document.getElementById('provNombre').value.trim(),
        Nit: document.getElementById('provNit').value.trim(),
        Contacto: document.getElementById('provContacto').value.trim(),
        Telefono: document.getElementById('provTelefono').value.trim(),
        Direccion: document.getElementById('provDireccion').value.trim(),
        Estado: document.getElementById('provEstado').value
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
    document.getElementById('provId').value = id;
    document.getElementById('provNombre').value = nombre;
    document.getElementById('provNit').value = nit;
    document.getElementById('provContacto').value = contacto;
    document.getElementById('provTelefono').value = telefono;
    document.getElementById('provDireccion').value = direccion;
    document.getElementById('provEstado').value = estado;
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
    document.getElementById('provId').value = '';
    const titulo = document.getElementById('provFormTitulo');
    if (titulo) titulo.textContent = '+ Nuevo Proveedor';
}

// ==========================================
// 8. MÓDULO RECETAS
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
                <td>${badgeEstado(estado)}</td>
                <td class="text-end text-nowrap">
                    <button class="btn-action edit me-1" onclick="editarReceta(${id}, '${escapeHTML(nombre)}', '${escapeHTML(descripcion)}', ${precio}, '${estado}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-action delete" onclick="eliminarReceta(${id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarReceta(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('recId').value;
    const payload = {
        Id: id ? parseInt(id) : 0,
        Nombre: document.getElementById('recNombre').value.trim(),
        Descripcion: document.getElementById('recDescripcion').value.trim(),
        Precio: parseFloat(document.getElementById('recPrecio').value) || 0,
        Estado: document.getElementById('recEstado').value
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
    document.getElementById('recId').value = id;
    document.getElementById('recNombre').value = nombre;
    document.getElementById('recDescripcion').value = descripcion;
    document.getElementById('recPrecio').value = precio;
    document.getElementById('recEstado').value = estado;
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
    document.getElementById('recId').value = '';
    const titulo = document.getElementById('recFormTitulo');
    if (titulo) titulo.textContent = '+ Nueva Receta';
}

// ==========================================
// 9. MÓDULO MOVIMIENTOS
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
                <td class="text-end text-nowrap">
                    <button class="btn-action edit me-1" onclick="editarMovimiento(${id}, '${escapeHTML(tipo)}', ${cantidad}, '${fechaFormateada}', '${escapeHTML(obs)}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-action delete" onclick="eliminarMovimiento(${id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function guardarMovimiento(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('movId').value;
    const payload = {
        Id: id ? parseInt(id) : 0,
        Tipo: document.getElementById('movTipo').value,
        Cantidad: parseFloat(document.getElementById('movCantidad').value) || 0,
        Fecha: document.getElementById('movFecha').value || null,
        Observaciones: document.getElementById('movObservacion').value.trim(),
        Estado: 'ACTIVO'
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
    document.getElementById('movId').value = id;
    document.getElementById('movTipo').value = tipo;
    document.getElementById('movCantidad').value = cantidad;
    document.getElementById('movFecha').value = fecha;
    document.getElementById('movObservacion').value = observaciones;
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
    document.getElementById('movId').value = '';
    const titulo = document.getElementById('movFormTitulo');
    if (titulo) titulo.textContent = '+ Nuevo Movimiento';
    const hoy = new Date().toISOString().split('T')[0];
    if (document.getElementById('movFecha')) document.getElementById('movFecha').value = hoy;
}

// ==========================================
// 10. MÓDULO REPORTES Y GENERACIÓN DE PDF
// ==========================================
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

        if (modulo === 'compras') {
            thead.innerHTML = `<tr><th>ID</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>`;
            tbody.innerHTML = datos.map(d => `
                <tr>
                    <td>#${d.id || d.Id}</td>
                    <td>${(d.fecha || d.Fecha || '').split('T')[0]}</td>
                    <td>Bs. ${parseFloat(d.total || d.Total || 0).toFixed(2)}</td>
                    <td>${d.estado || d.Estado || 'COMPLETADO'}</td>
                </tr>`).join('');
        } else if (modulo === 'proveedores') {
            thead.innerHTML = `<tr><th>ID</th><th>Nombre / Razón Social</th><th>NIT / CI</th><th>Teléfono</th></tr>`;
            tbody.innerHTML = datos.map(d => `
                <tr>
                    <td>#${d.id || d.Id}</td>
                    <td>${escapeHTML(d.nombre || d.Nombre || '-')}</td>
                    <td>${escapeHTML(d.nit || d.Nit || '-')}</td>
                    <td>${escapeHTML(d.telefono || d.Telefono || '-')}</td>
                </tr>`).join('');
        } else if (modulo === 'recetas') {
            thead.innerHTML = `<tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Estado</th></tr>`;
            tbody.innerHTML = datos.map(d => `
                <tr>
                    <td>#${d.id || d.Id}</td>
                    <td>${escapeHTML(d.nombre || d.Nombre || '-')}</td>
                    <td>Bs. ${parseFloat(d.precio || d.Precio || 0).toFixed(2)}</td>
                    <td>${d.estado || d.Estado || 'ACTIVO'}</td>
                </tr>`).join('');
        } else if (modulo === 'movimientos') {
            thead.innerHTML = `<tr><th>ID</th><th>Tipo</th><th>Cantidad</th><th>Fecha</th></tr>`;
            tbody.innerHTML = datos.map(d => `
                <tr>
                    <td>#${d.id || d.Id}</td>
                    <td>${escapeHTML(d.tipo || d.Tipo || '-')}</td>
                    <td>${d.cantidad || d.Cantidad || 0}</td>
                    <td>${(d.fecha || d.Fecha || '').split('T')[0]}</td>
                </tr>`).join('');
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td class="text-center text-danger">${err.message}</td></tr>`;
    }
}

async function descargarPDFSeleccionado() {
    const modulo = document.getElementById('repModulo').value;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    try {
        const resp = await fetch(ENDPOINTS[modulo]);
        const datos = await resp.json();

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

        doc.autoTable({
            head: headers,
            body: rows,
            startY: 34,
            theme: 'grid',
            headStyles: { fillColor: [240, 173, 78] }
        });

        doc.save(`Reporte_${modulo}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        alert('Error al generar PDF: ' + err.message);
    }
}

async function descargarPDFGeneral() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("REPORTE GENERAL DEL SISTEMA", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

    let lastY = 34;
    const modulos = [
        { key: 'compras', title: '1. Compras', headers: [['ID', 'Fecha', 'Total (Bs.)', 'Estado']], map: d => [d.id || d.Id, (d.fecha || d.Fecha || '').split('T')[0], parseFloat(d.total || d.Total || 0).toFixed(2), d.estado || d.Estado || 'COMPLETADO'] },
        { key: 'proveedores', title: '2. Proveedores', headers: [['ID', 'Nombre', 'NIT / CI', 'Teléfono']], map: d => [d.id || d.Id, d.nombre || d.Nombre || '-', d.nit || d.Nit || '-', d.telefono || d.Telefono || '-'] },
        { key: 'recetas', title: '3. Recetas', headers: [['ID', 'Nombre', 'Precio (Bs.)', 'Estado']], map: d => [d.id || d.Id, d.nombre || d.Nombre || '-', parseFloat(d.precio || d.Precio || 0).toFixed(2), d.estado || d.Estado || 'ACTIVO'] },
        { key: 'movimientos', title: '4. Movimientos de Inventario', headers: [['ID', 'Tipo', 'Cantidad', 'Fecha']], map: d => [d.id || d.Id, d.tipo || d.Tipo || '-', d.cantidad || d.Cantidad || 0, (d.fecha || d.Fecha || '').split('T')[0]] }
    ];

    try {
        for (const mod of modulos) {
            const resp = await fetch(ENDPOINTS[mod.key]);
            if (!resp.ok) continue;
            const datos = await resp.json();

            if (lastY > 220) {
                doc.addPage();
                lastY = 20;
            }

            doc.setFontSize(13);
            doc.text(mod.title, 14, lastY);

            doc.autoTable({
                head: mod.headers,
                body: datos.map(mod.map),
                startY: lastY + 4,
                theme: 'grid',
                headStyles: { fillColor: [240, 173, 78] }
            });

            lastY = doc.lastAutoTable.finalY + 12;
        }

        doc.save(`Reporte_General_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        alert('Error al generar Reporte General: ' + err.message);
    }
}