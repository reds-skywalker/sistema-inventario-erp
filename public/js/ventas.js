const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

let carrito = [];
let catalogo = []; // Aquí guardaremos info completa (nombre, stock) para validar

document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogo();
});

// 1. Cargar productos para el Select
async function cargarCatalogo() {
    try {
        // Usamos el endpoint de stock para saber cuánto hay disponible realmente
        const response = await fetch('/api/productos/stock', { 
            headers: { 'Authorization': token } 
        });
        catalogo = await response.json();
        
        const select = document.getElementById('selProducto');
        select.innerHTML = '<option value="">Seleccione un producto...</option>';
        
        catalogo.forEach(prod => {
            // Solo mostramos si tiene stock > 0 (opcional, pero recomendado)
            if (prod.stock_total > 0) {
                const option = document.createElement('option');
                option.value = prod.id;
                option.text = `${prod.nombre} (Stock: ${prod.stock_total})`;
                select.appendChild(option);
            }
        });

    } catch (error) {
        console.error(error);
        alert("Error cargando productos");
    }
}

// 2. Evento al seleccionar producto (Mostrar stock)
document.getElementById('selProducto').addEventListener('change', (e) => {
    const id = e.target.value;
    const infoStock = document.getElementById('infoStock');
    
    if (!id) {
        infoStock.classList.add('d-none');
        return;
    }

    const prod = catalogo.find(p => p.id == id);
    if (prod) {
        document.getElementById('stockDisplay').textContent = prod.stock_total;
        infoStock.classList.remove('d-none');
        // Opcional: Podríamos pre-llenar el precio si tuvieramos un "precio sugerido"
    }
});

// 3. Agregar al Carrito
document.getElementById('formAgregarCarrito').addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('selProducto').value;
    const cantidad = parseInt(document.getElementById('txtCantidad').value);
    const precio = parseFloat(document.getElementById('txtPrecio').value);

    // Validaciones
    if (!id || cantidad <= 0 || isNaN(precio)) return alert("Datos inválidos");

    const prod = catalogo.find(p => p.id == id);
    
    // Validar Stock
    const stockDisponible = parseInt(prod.stock_total);
    
    // Verificar si ya tengo ese producto en el carrito para sumar cantidades
    const itemEnCarrito = carrito.find(item => item.producto_id == id);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

    if ((cantidad + cantidadEnCarrito) > stockDisponible) {
        return alert(`¡No tienes suficiente stock! Disponible: ${stockDisponible}, Intentas vender: ${cantidad + cantidadEnCarrito}`);
    }

    // Agregar o Actualizar Carrito
    if (itemEnCarrito) {
        itemEnCarrito.cantidad += cantidad;
        // Si el precio cambió, podrías decidir actualizarlo o crear una línea nueva. 
        // Por simplicidad, actualizamos al último precio ingresado.
        itemEnCarrito.precio_venta = precio;
    } else {
        carrito.push({
            producto_id: id,
            nombre: prod.nombre, // Solo visual
            cantidad: cantidad,
            precio_venta: precio
        });
    }

    renderizarCarrito();
    document.getElementById('formAgregarCarrito').reset();
    document.getElementById('infoStock').classList.add('d-none');
});

// 4. Dibujar Carrito
function renderizarCarrito() {
    const tbody = document.getElementById('tablaCarrito');
    tbody.innerHTML = '';
    let total = 0;

    carrito.forEach((item, index) => {
        const subtotal = item.cantidad * item.precio_venta;
        total += subtotal;

        tbody.innerHTML += `
            <tr>
                <td>${item.nombre}</td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-end">$${item.precio_venta.toFixed(2)}</td>
                <td class="text-end">$${subtotal.toFixed(2)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarDelCarrito(${index})">&times;</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('totalTicket').textContent = `$${total.toFixed(2)}`;
}

window.eliminarDelCarrito = (index) => {
    carrito.splice(index, 1);
    renderizarCarrito();
};

// 5. FINALIZAR VENTA (POST al Backend)
window.finalizarVenta = async () => {
    if (carrito.length === 0) return alert("El carrito está vacío");

    if (!confirm("¿Confirmar venta? Esto descontará el inventario.")) return;

    try {
        // Estructura que espera el backend: { productos: [ ... ] }
        const payload = {
            productos: carrito.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_venta: item.precio_venta
            }))
        };

        const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`✅ ¡Venta registrada con éxito! ID Venta: ${result.venta_id}`);
            carrito = []; // Limpiar carrito
            renderizarCarrito();
            cargarCatalogo(); // Recargar catálogo para actualizar stocks visuales
        } else {
            alert("Error: " + (result.message || "Error desconocido"));
        }

    } catch (error) {
        console.error(error);
        alert("Error de conexión");
    }
};