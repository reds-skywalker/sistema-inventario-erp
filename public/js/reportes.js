const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

// Modal de Bootstrap
let modalDetalle;

document.addEventListener('DOMContentLoaded', () => {
    modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));
    cargarVentas();
});

// --- 1. CARGAR HISTORIAL DE VENTAS ---
async function cargarVentas() {
    try {
        const res = await fetch('/api/ventas', { 
            headers: { 'Authorization': token } 
        });
        
        if (res.status === 401) return window.location.href = '/index.html';
        
        // CORRECCIÓN: El backend ahora envía un objeto { ventas, total_general }
        const data = await res.json();
        const listaVentas = data.ventas; // Extraemos la lista real

        const tbody = document.getElementById('tablaVentas');
        tbody.innerHTML = '';

        if (!listaVentas || listaVentas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay ventas registradas</td></tr>';
            return;
        }

        listaVentas.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString();
            const total = parseFloat(v.total);

            const fila = `
                <tr>
                    <td><strong>#${v.id}</strong></td>
                    <td>${fecha}</td>
                    <td class="text-end fw-bold text-success">$${total.toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalle(${v.id}, ${total})">
                            <i class="fas fa-eye"></i> Ver Ticket
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += fila;
        });

        // CORRECCIÓN: Usamos el total que ya calculó el backend para la tarjeta superior
        const totalHistorico = data.total_general || 0;
        document.getElementById('totalHistorico').textContent = `$${Number(totalHistorico).toLocaleString('es-MX', {minimumFractionDigits: 2})}`;

    } catch (error) {
        console.error("Error al cargar reportes:", error);
        alert("Error cargando historial");
    }
}

// --- 2. VER DETALLE DE UN TICKET ESPECÍFICO ---
window.verDetalle = async (ventaId, totalVenta) => {
    try {
        const res = await fetch(`/api/ventas/${ventaId}`, { 
            headers: { 'Authorization': token } 
        });
        
        // El detalle suele venir como una lista directa de productos de esa venta
        const detalles = await res.json();

        const tbody = document.getElementById('tablaDetalle');
        tbody.innerHTML = '';

        detalles.forEach(d => {
            const subtotal = d.cantidad * parseFloat(d.precio_venta);
            tbody.innerHTML += `
                <tr>
                    <td>${d.producto}<br><small class="text-muted">${d.sku || ''}</small></td>
                    <td class="text-center">${d.cantidad}</td>
                    <td class="text-end">$${parseFloat(d.precio_venta).toFixed(2)}</td>
                    <td class="text-end">$${subtotal.toFixed(2)}</td>
                </tr>
            `;
        });

        document.getElementById('lblIdVenta').textContent = ventaId;
        document.getElementById('lblTotalVenta').textContent = `$${parseFloat(totalVenta).toFixed(2)}`;
        
        modalDetalle.show();

    } catch (error) {
        console.error("Error al cargar detalle del ticket:", error);
        alert("Error cargando detalles");
    }
};