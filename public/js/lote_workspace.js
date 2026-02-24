const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

const params = new URLSearchParams(window.location.search);
const loteId = params.get('id');

if (!loteId) window.location.href = '/ver_lotes.html';

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    cargarCatalogo();
});

// --- CARGA DE DATOS ---
async function cargarDatos() {
    try {
        // 1. Traer todos los lotes para cabecera
        const resLotes = await fetch('/api/lotes', { headers: { 'Authorization': token } });
        const lotes = await resLotes.json();
        const miLote = lotes.find(l => l.id == loteId);

        // 2. Traer los detalles
        const resDetalles = await fetch(`/api/lotes/${loteId}`, { headers: { 'Authorization': token } });
        const detalles = await resDetalles.json();

        renderizar(miLote, detalles);
    } catch (error) {
        console.error(error);
    }
}

function renderizar(lote, items) {
    if (!lote) return;

    // Cabecera
    document.getElementById('lblNombre').textContent = lote.nombre;
    document.getElementById('lblCosto').textContent = `$${parseFloat(lote.costo_compra).toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
    
    const factor = lote.factor ? (lote.factor * 100).toFixed(2) + '%' : '---';
    document.getElementById('lblFactor').textContent = factor;

    // Tabla
    const tbody = document.getElementById('tablaItems');
    tbody.innerHTML = '';

    items.forEach(item => {
        const fila = `
            <tr>
                <td>
                    <span class="fw-bold">${item.producto_nombre}</span>
                    ${item.observaciones ? `<br><small class="text-muted">${item.observaciones}</small>` : ''}
                </td>
                <td class="text-center">${item.cantidad_inicial}</td>
                <td class="text-end">$${parseFloat(item.precio_referencia).toFixed(2)}</td>
                <td class="table-primary fw-bold text-end">$${parseFloat(item.costo_unitario).toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

// --- CARGA DEL CATÁLOGO CON SELECT2 (Versión Definitiva) ---
async function cargarCatalogo() {
    try {
        // Usamos la misma ruta del dashboard que sabemos que funciona perfecto
        const res = await fetch('/api/productos/stock', { 
            headers: { 'Authorization': token } 
        });
        const data = await res.json();
        
        // Extraemos la lista de productos exactamente igual que en el dashboard
        const prods = data.detalle_productos || data.productos || (Array.isArray(data) ? data : []);
        
        // Lo imprimimos en consola por si necesitamos investigar (F12)
        console.log("Productos encontrados para el select:", prods);

        const sel = $('#selProducto'); // Usamos jQuery para manipular Select2
        sel.empty(); // Limpiamos basura previa
        
        // Agregamos la opción por defecto (vacía)
        sel.append(new Option('Busca un producto...', '', true, true));
        
        // Llenamos las opciones reales
        prods.forEach(p => {
            const marca = p.marca ? ` - ${p.marca}` : ''; 
            const sku = p.sku ? ` [${p.sku}]` : '';
            const texto = `${p.nombre}${marca}${sku}`;
            
            // Creamos la opción y la agregamos al select
            sel.append(new Option(texto, p.id, false, false));
        });

        // Inicializamos Select2
        sel.select2({
            theme: 'bootstrap-5',
            placeholder: "Escribe para buscar...",
            allowClear: true,
            width: '100%'
        });

    } catch (error) {
        console.error("Error al cargar el catálogo:", error);
    }
}

// --- AGREGAR PRODUCTO ---
document.getElementById('formAgregarItem').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtenemos el valor directamente de jQuery para mayor seguridad con Select2
    const prodId = $('#selProducto').val(); 

    if (!prodId) return alert("Selecciona un producto");

    const data = {
        producto_id: prodId,
        cantidad: document.getElementById('txtCantidad').value,
        precio_referencia: document.getElementById('txtPrecioRef').value,
        observaciones: ''
    };

    try {
        const res = await fetch(`/api/lotes/${loteId}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            // Limpiar formulario
            document.getElementById('formAgregarItem').reset();
            
            // Resetear Select2
            $('#selProducto').val(null).trigger('change'); 
            $('#selProducto').select2('open'); // Abrir buscador para el siguiente

            // --- ¡ESTA ES LA LÍNEA QUE FALTABA! ---
            cargarDatos(); // Actualizar la tabla visualmente
            // ---------------------------------------
        } else {
            alert("Error al agregar");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión");
    }
});

// --- ELIMINAR PRODUCTO (Restaurado) ---
window.eliminarItem = async (detalleId) => {
    if (!confirm('¿Eliminar este producto? Los costos se recalcularán.')) return;

    try {
        const res = await fetch(`/api/lotes/${loteId}/productos/${detalleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        if (res.ok) {
            cargarDatos(); // Recargar tabla
        } else {
            alert("Error al eliminar");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión");
    }
};