const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

// Modal de Bootstrap
let modalDetalle;

document.addEventListener('DOMContentLoaded', () => {
    modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));
    cargarVentas();
});

async function cargarVentas() {
    try {
        const res = await fetch('/api/ventas', { headers: { 'Authorization': token } });
        const ventas = await res.json();
        
        const tbody = document.getElementById('tablaVentas');
        tbody.innerHTML = '';

        if (ventas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay ventas registradas</td></tr>';
            return;
        }

        let sumaTotal = 0;

        ventas.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString();
            const total = parseFloat(v.total);
            sumaTotal += total;

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

        // Actualizar tarjeta superior
        document.getElementById('totalHistorico').textContent = `$${sumaTotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;

    } catch (error) {
        console.error(error);
        alert("Error cargando historial");
    }
}

window.verDetalle = async (ventaId, totalVenta) => {
    try {
        const res = await fetch(`/api/ventas/${ventaId}`, { headers: { 'Authorization': token } });
        const detalles = await res.json();

        const tbody = document.getElementById('tablaDetalle');
        tbody.innerHTML = '';

        detalles.forEach(d => {
            const subtotal = d.cantidad * d.precio_venta;
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
        console.error(error);
        alert("Error cargando detalles");
    }
};