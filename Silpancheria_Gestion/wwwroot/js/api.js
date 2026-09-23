// ============================================
// API Functions - Silpancheria Gestion
// ============================================

const API_BASE = 'https://localhost:5001/api';

// ============================================
// FUNCIONES GENÉRICAS
// ============================================

async function obtenerDatos(endpoint) {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error en ${endpoint}:`, error);
        return [];
    }
}

async function guardarDato(endpoint, datos, metodo = 'POST') {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error guardando en ${endpoint}:`, error);
        return null;
    }
}

// ============================================
// PRODUCTOS
// ============================================

async function cargarProductos() {
    const datos = await obtenerDatos('productos');
    const tbody = document.getElementById('tbProductos');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.tipo || 'N/A'}</td>
            <td>Bs. ${(p.precio || 0).toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>${p.stock_minimo}</td>
            <td><span class="badge bg-success">${p.estado || 'Activo'}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarProducto(${p.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${p.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" class="text-center">No hay productos</td></tr>';
}

// ============================================
// CATEGORÍAS
// ============================================

async function cargarCategorias() {
    const datos = await obtenerDatos('categorias');
    const tbody = document.getElementById('tbCategorias');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.nombre}</td>
            <td>${c.descripcion || 'N/A'}</td>
            <td><span class="badge bg-success">${c.estado || 'Activo'}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarCategoria(${c.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarCategoria(${c.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="5" class="text-center">No hay categorías</td></tr>';
}

// ============================================
// PERSONAS
// ============================================

async function cargarPersonas() {
    const datos = await obtenerDatos('personas');
    const tbody = document.getElementById('tbPersonas');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre} ${p.apellido}</td>
            <td>${p.cedula}</td>
            <td>${p.email}</td>
            <td>${p.telefono}</td>
            <td><span class="badge bg-success">${p.estado || 'Activo'}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarPersona(${p.id})">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center">No hay personas</td></tr>';
}

// ============================================
// EMPLEADOS
// ============================================

async function cargarEmpleados() {
    const datos = await obtenerDatos('empleados');
    const tbody = document.getElementById('tbEmpleados');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(e => `
        <tr>
            <td>${e.id}</td>
            <td>${e.numero_empleado}</td>
            <td>${e.cargo}</td>
            <td>${e.departamento}</td>
            <td>Bs. ${(e.salario || 0).toFixed(2)}</td>
            <td>${new Date(e.fecha_ingreso).toLocaleDateString()}</td>
            <td><span class="badge bg-success">${e.estado || 'Activo'}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarEmpleado(${e.id})">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" class="text-center">No hay empleados</td></tr>';
}

// ============================================
// COCINEROS
// ============================================

async function cargarCocineros() {
    const datos = await obtenerDatos('cocineros');
    const tbody = document.getElementById('tbCocineros');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.id_empleado}</td>
            <td>${c.nivel_especialidad}</td>
            <td>${c.especialidades}</td>
            <td>${c.fecha_certificacion ? new Date(c.fecha_certificacion).toLocaleDateString() : 'N/A'}</td>
            <td><span class="badge bg-success">${c.estado || 'Activo'}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarCocinero(${c.id})">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center">No hay cocineros</td></tr>';
}

// ============================================
// VENTAS
// ============================================

async function cargarVentas() {
    const datos = await obtenerDatos('ventas');
    const tbody = document.getElementById('tbVentas');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(v => `
        <tr>
            <td>${v.id}</td>
            <td>${v.numero_venta}</td>
            <td>${new Date(v.fecha_venta).toLocaleDateString()}</td>
            <td>Bs. ${(v.monto_total || 0).toFixed(2)}</td>
            <td>${v.metodo_pago}</td>
            <td><span class="badge bg-success">${v.estado || 'Completada'}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verDetalleVenta(${v.id})">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center">No hay ventas</td></tr>';
}

// ============================================
// COMPRAS
// ============================================

async function cargarCompras() {
    const datos = await obtenerDatos('compras');
    const tbody = document.getElementById('tbCompras');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${new Date(c.fecha_compra).toLocaleDateString()}</td>
            <td>Bs. ${(c.monto_total || 0).toFixed(2)}</td>
            <td>${c.estado}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verDetalleCompra(${c.id})">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="5" class="text-center">No hay compras</td></tr>';
}

// ============================================
// PROVEEDORES
// ============================================

async function cargarProveedores() {
    const datos = await obtenerDatos('proveedores');
    const tbody = document.getElementById('tbProveedores');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.email}</td>
            <td>${p.telefono}</td>
            <td>${p.direccion}</td>
            <td><span class="badge bg-success">${p.estado || 'Activo'}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarProveedor(${p.id})">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center">No hay proveedores</td></tr>';
}

// ============================================
// RECETAS
// ============================================

async function cargarRecetas() {
    const datos = await obtenerDatos('recetas');
    const tbody = document.getElementById('tbRecetas');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${r.id_plato}</td>
            <td>${r.id_ingrediente}</td>
            <td>${r.cantidad}</td>
            <td>${r.unidad_medida}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarReceta(${r.id})">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="text-center">No hay recetas</td></tr>';
}

// ============================================
// MOVIMIENTOS DE STOCK
// ============================================

async function cargarMovimientos() {
    const datos = await obtenerDatos('movimientosstock');
    const tbody = document.getElementById('tbMovimientos');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(m => `
        <tr>
            <td>${m.id}</td>
            <td>${new Date(m.fecha_movimiento).toLocaleDateString()}</td>
            <td>${m.tipo_movimiento}</td>
            <td>${m.cantidad}</td>
            <td>${m.motivo}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verDetalleMovimiento(${m.id})">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="text-center">No hay movimientos</td></tr>';
}

// ============================================
// REPORTES
// ============================================

async function cargarReportes() {
    const datos = await obtenerDatos('reportes');
    const tbody = document.getElementById('tbReportes');
    if (!tbody) return;

    tbody.innerHTML = datos.length > 0 ? datos.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${r.titulo}</td>
            <td>${r.tipo}</td>
            <td>${new Date(r.fecha_generacion).toLocaleDateString()}</td>
            <td><span class="badge bg-success">${r.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="descargarReporte(${r.id})">
                    <i class="bi bi-download"></i>
                </button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="6" class="text-center">No hay reportes</td></tr>';
}

// ============================================
// FUNCIONES DE EDICIÓN/ELIMINACIÓN
// ============================================

function editarProducto(id) { alert('Editar Producto ' + id); }
function eliminarProducto(id) { alert('Eliminar Producto ' + id); }
function editarCategoria(id) { alert('Editar Categoría ' + id); }
function eliminarCategoria(id) { alert('Eliminar Categoría ' + id); }
function editarPersona(id) { alert('Editar Persona ' + id); }
function editarEmpleado(id) { alert('Editar Empleado ' + id); }
function editarCocinero(id) { alert('Editar Cocinero ' + id); }
function verDetalleVenta(id) { alert('Ver Detalle Venta ' + id); }
function verDetalleCompra(id) { alert('Ver Detalle Compra ' + id); }
function editarProveedor(id) { alert('Editar Proveedor ' + id); }
function editarReceta(id) { alert('Editar Receta ' + id); }
function verDetalleMovimiento(id) { alert('Ver Detalle Movimiento ' + id); }
function descargarReporte(id) { alert('Descargar Reporte ' + id); }
