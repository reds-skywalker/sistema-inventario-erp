const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

let modalBootstrap;

document.addEventListener('DOMContentLoaded', () => {
    modalBootstrap = new bootstrap.Modal(document.getElementById('modalProducto'));
    cargarInventario();
});

// CARGAR DATOS 
async function cargarInventario() {
    try {
        const response = await fetch('/api/productos/stock', {
            headers: { 'Authorization': token }
        });
        

        const data = await response.json();

        renderizarTabla(data.detalle_productos, data.resumen_financiero);

    } catch (error) {
        console.error(error);
        alert('Error al cargar datos');
    }
}

function renderizarTabla(productos, resumen) {
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


window.cerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
};