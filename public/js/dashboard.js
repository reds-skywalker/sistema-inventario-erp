const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

// Variable global para manejar el modal de Bootstrap
let modalBootstrap;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializamos el modal
    modalBootstrap = new bootstrap.Modal(document.getElementById('modalProducto'));
    cargarInventario();
});

// --- 1. CARGAR DATOS (READ) ---
async function cargarInventario() {
    try {
        const response = await fetch('/api/productos/stock', {
            headers: { 'Authorization': token }
        });
        
        if (response.status === 401) return cerrarSesion();
        
        const productos = await response.json();
        renderizarTabla(productos);

    } catch (error) {
        console.error(error);
        alert('Error al cargar datos');
    }
}

function renderizarTabla(productos) {
    const tbody = document.getElementById('tablaProductos');
    const totalDinero = document.getElementById('totalDinero');
    tbody.innerHTML = '';
    let sumaTotal = 0;

    productos.forEach(prod => {
        sumaTotal += parseFloat(prod.valor_inventario);
        
        // Truco: Guardamos los datos en el botón de editar como atributos data-*
        // Para no tener que hacer otra petición al servidor
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

    totalDinero.textContent = `$${sumaTotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
}

// --- 2. PREPARAR MODAL (CREATE vs UPDATE) ---

// A. Abrir para CREAR (Limpio)
window.abrirModalCrear = () => {
    document.getElementById('tituloModal').textContent = "Nuevo Producto";
    document.getElementById('formProducto').reset();
    document.getElementById('prodId').value = ""; // ID vacío = CREAR
    modalBootstrap.show();
};

// B. Abrir para EDITAR (Relleno)
window.abrirModalEditar = (id, nombre, marca, sku, imagen) => {
    document.getElementById('tituloModal').textContent = "Editar Producto";
    document.getElementById('prodId').value = id; // ID con valor = EDITAR
    document.getElementById('prodNombre').value = nombre;
    document.getElementById('prodMarca').value = (marca === 'null' || marca === 'undefined') ? '' : marca;
    document.getElementById('prodSku').value = (sku === 'null' || sku === 'undefined') ? '' : sku;
    document.getElementById('prodImagen').value = (imagen === 'null' || imagen === 'undefined') ? '' : imagen;
    modalBootstrap.show();
};

// --- 3. GUARDAR (DECIDIR SI ES POST O PUT) ---
window.guardarProducto = async () => {
    const id = document.getElementById('prodId').value;
    const data = {
        nombre: document.getElementById('prodNombre').value,
        marca: document.getElementById('prodMarca').value,
        sku: document.getElementById('prodSku').value,
        imagen_url: document.getElementById('prodImagen').value
    };

    // Validar
    if (!data.nombre) return alert('El nombre es obligatorio');

    try {
        let url = '/api/productos';
        let method = 'POST';

        // Si hay ID, cambiamos a modo EDICIÓN
        if (id) {
            url += `/${id}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            modalBootstrap.hide();
            cargarInventario(); // Recargar tabla
            alert(id ? 'Producto actualizado' : 'Producto creado');
        } else {
            alert('Error al guardar');
        }

    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
};

// --- 4. ELIMINAR (DELETE) ---
window.eliminarProducto = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;

    try {
        const response = await fetch(`/api/productos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        if (response.ok) {
            cargarInventario(); // El producto desaparecerá de la lista
        } else {
            alert('No se pudo eliminar');
        }
    } catch (error) {
        console.error(error);
    }
};

window.cerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
};