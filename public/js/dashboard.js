const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

let modalBootstrap;
let productoIdActual = null; // Variable para saber si estamos creando o editando

document.addEventListener('DOMContentLoaded', () => {
    modalBootstrap = new bootstrap.Modal(document.getElementById('modalProducto'));
    cargarInventario();
});

// --- CARGAR DATOS ---
async function cargarInventario() {
    try {
        const response = await fetch('/api/productos/stock', {
            headers: { 'Authorization': token }
        });
        
        const data = await response.json();
        renderizarTabla(data.detalle_productos, data.resumen_financiero);

    } catch (error) {
        console.error("Error al cargar inventario:", error);
    }
}

function renderizarTabla(productos, resumen) {
    console.log("Datos exactos del primer producto:", productos[0]);
    const tbody = document.getElementById('tablaProductos');
    const totalDinero = document.getElementById('totalDinero');
    
    tbody.innerHTML = '';

    productos.forEach(prod => {
        const fila = `
            <tr>
                <td><img src="${prod.imagen_url || 'https://via.placeholder.com/40'}" width="40" height="40" class="rounded"></td>
                <td>${prod.nombre}<br><small class="text-muted">${prod.marca || ''}</small></td>
                <td>${prod.sku || '-'}</td>
                <td class="text-end">
                    <span class="badge ${prod.stock_total > 0 ? 'bg-success' : 'bg-secondary'}">
                        ${prod.stock_total}
                    </span>
                </td>
                <td class="text-end">$${parseFloat(prod.valor_inventario).toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary me-2" 
                        onclick="abrirModalEditar('${prod.id}', '${prod.nombre}', '${prod.marca}', '${prod.sku}', '${prod.imagen_url}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${prod.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });

    totalDinero.innerHTML = `
        $${Number(resumen.valor_total_mxn).toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN
        <br>
        <small style="color: #28a745; font-size: 0.5em;">≈ $${resumen.valor_total_usd} USD</small>
    `;
}

// --- NUEVAS FUNCIONES FALTANTES (CRUD) ---

// Abrir modal para producto nuevo (Se llama desde el botón "+ Producto" en tu HTML)
window.abrirModalNuevo = () => {
    productoIdActual = null; // Limpiamos el ID
    document.getElementById('formProducto').reset(); // Limpiamos el formulario
    modalBootstrap.show();
};

// Abrir modal para editar 
window.abrirModalEditar = (id, nombre, marca, sku, imagen_url) => {
    productoIdActual = id;
    document.getElementById('txtNombre').value = (nombre !== 'undefined' && nombre !== 'null') ? nombre : '';
    document.getElementById('txtMarca').value = (marca !== 'undefined' && marca !== 'null') ? marca : '';
    //document.getElementById('txtSku').value = (sku !== 'undefined' && sku !== 'null') ? sku : '';
    //document.getElementById('txtImagen').value = (imagen_url !== 'undefined' && imagen_url !== 'null') ? imagen_url : '';
    modalBootstrap.show();
};

// --- Guardar (Crear o Editar) ---
window.guardarProducto = async () => {
    // Validamos que el nombre no esté vacío
    const nombre = document.getElementById('txtNombre').value;
    if (!nombre) {
        alert("El nombre del producto es obligatorio");
        return;
    }

    const data = {
        nombre: nombre,
        marca: document.getElementById('txtMarca').value,
        sku: document.getElementById('txtSku').value,
        imagen_url: document.getElementById('txtImagen').value
    };

    const url = productoIdActual ? `/api/productos/${productoIdActual}` : '/api/productos';
    const method = productoIdActual ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            modalBootstrap.hide();
            cargarInventario(); // Recargamos la tabla automáticamente
        } else {
            alert('Error al guardar el producto. Verifica tu conexión.');
        }
    } catch (error) {
        console.error("Error guardando:", error);
        alert("Error de red al intentar guardar.");
    }
};

// Eliminar
window.eliminarProducto = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    
    try {
        const res = await fetch(`/api/productos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        if (res.ok) {
            cargarInventario();
        } else {
            alert('Error al eliminar. Puede que tenga lotes activos.');
        }
    } catch (error) {
        console.error("Error eliminando:", error);
    }
};

window.cerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
};