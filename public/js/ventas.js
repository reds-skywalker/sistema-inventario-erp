const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

let carrito = [];
let catalogo = []; // Aquí guardaremos la lista de productos para validar stock

document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogo();
});

// 1. CARGAR CATÁLOGO (ACTUALIZADO PARA LA NUEVA ESTRUCTURA)
async function cargarCatalogo() {
    try {
        const response = await fetch('/api/productos/stock', { 
            headers: { 'Authorization': token } 
        });
        
        // El backend ahora devuelve { resumen_financiero, detalle_productos }
        const data = await response.json();
        
        // CORRECCIÓN: Extraemos solo la lista de productos para el catálogo
        catalogo = data.detalle_productos; 
        
        const select = document.getElementById('selProducto');
        select.innerHTML = '<option value="">Seleccione un producto...</option>';
        
        catalogo.forEach(prod => {
            // Mostramos solo productos con stock disponible
            if (parseInt(prod.stock_total) > 0) {
                const option = document.createElement('option');
                option.value = prod.id;
                option.text = `${prod.nombre} (Stock: ${prod.stock_total})`;
                select.appendChild(option);
            }
        });

    } catch (error) {
        console.error("Error al cargar el catálogo:", error);
        alert("Error cargando productos");
    }
}

// 2. EVENTO AL SELECCIONAR PRODUCTO (MOSTRAR STOCK)
document.getElementById('selProducto').addEventListener('change', (e) => {
    const id = e.target.value;
    const infoStock = document.getElementById('infoStock');
    
    if (!id) {
        infoStock.classList.add('d-none');
        return;
    }

    // Buscamos el producto seleccionado en nuestro catálogo local
    const prod = catalogo.find(p => p.id == id);
    if (prod) {
        document.getElementById('stockDisplay').textContent = prod.stock_total;
        infoStock.classList.remove('d-none');
    }
});

// 3. AGREGAR AL CARRITO (CON VALIDACIÓN DE STOCK)
document.getElementById('formAgregarCarrito').addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('selProducto').value;
    const cantidad = parseInt(document.getElementById('txtCantidad').value);
    const precio = parseFloat(document.getElementById('txtPrecio').value);

    if (!id || cantidad <= 0 || isNaN(precio)) return alert("Datos inválidos");

    const prod = catalogo.find(p => p.id == id);
    const stockDisponible = parseInt(prod.stock_total);
    
    // Verificar si el producto ya está en el carrito para sumar cantidades
    const itemEnCarrito = carrito.find(item => item.producto_id == id);
    const cantidadPrevia = itemEnCarrito ? itemEnCarrito.cantidad : 0;

    if ((cantidad + cantidadPrevia) > stockDisponible) {
        return alert(`Stock insuficiente. Disponible: ${stockDisponible}, En carrito: ${cantidadPrevia}`);
    }

    if (itemEnCarrito) {
        itemEnCarrito.cantidad += cantidad;
        itemEnCarrito.precio_venta = precio; // Actualizamos al precio más reciente
    } else {
        carrito.push({
            producto_id: id,
            nombre: prod.nombre,
            cantidad: cantidad,
            precio_venta: precio
        });
    }

    renderizarCarrito();
    document.getElementById('formAgregarCarrito').reset();
    document.getElementById('infoStock').classList.add('d-none');
});

// 4. DIBUJAR CARRITO
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

// 5. FINALIZAR VENTA (POST AL BACKEND)
window.finalizarVenta = async () => {
    if (carrito.length === 0) return alert("El carrito está vacío");
    if (!confirm("¿Confirmar venta? Se descontará el inventario.")) return;

    try {
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
            alert(`Venta registrada. ID Venta: ${result.venta_id}`);
            carrito = []; 
            renderizarCarrito();
            cargarCatalogo(); 
        } else {
            alert("Error: " + (result.message || "No se pudo procesar la venta"));
        }

    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("Error de conexión con el servidor");
    }
};