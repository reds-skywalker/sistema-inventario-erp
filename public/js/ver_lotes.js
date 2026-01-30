const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

document.addEventListener('DOMContentLoaded', () => {
    cargarLotes();
});

// 1. Cargar la lista
async function cargarLotes() {
    try {
        const response = await fetch('/api/lotes', { headers: { 'Authorization': token } });
        const lotes = await response.json();
        const container = document.getElementById('listaLotes');
        container.innerHTML = '';

        if (lotes.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay lotes registrados.</div>';
            return;
        }

        lotes.forEach(lote => {
            const fecha = new Date(lote.fecha_compra).toLocaleDateString();
            const costo = parseFloat(lote.costo_compra).toFixed(2);
            // Calculamos porcentaje visualmente
            const factor = lote.factor ? (lote.factor * 100).toFixed(1) : '0.0';

            const item = `
                <a href="/lote_workspace.html?id=${lote.id}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">${lote.nombre}</h5>
                        <small class="text-muted">Fecha: ${fecha}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-success rounded-pill">$${costo} Inv.</span>
                        <span class="badge bg-secondary rounded-pill">${factor}% Recup.</span>
                    </div>
                </a>
            `;
            container.innerHTML += item;
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar lotes</div>';
    }
}

// 2. Abrir Modal
window.abrirModalNuevoLote = () => {
    document.getElementById('formNuevoLote').reset();
    document.getElementById('fechaLote').valueAsDate = new Date();
    new bootstrap.Modal(document.getElementById('modalNuevoLote')).show();
};

// 3. Crear Lote (Solo cabecera) y redirigir
window.crearLoteInicial = async () => {
    const nombre = document.getElementById('nombreLote').value;
    const fecha = document.getElementById('fechaLote').value;
    const costo = document.getElementById('costoLote').value;

    if (!nombre || !costo) return alert("Completa los datos");

    try {
        const response = await fetch('/api/lotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ nombre, fecha_compra: fecha, costo_compra: costo })
        });

        const data = await response.json();
        
        if (response.ok) {
            // ¡Éxito! Nos vamos a la mesa de trabajo con el ID nuevo
            window.location.href = `/lote_workspace.html?id=${data.lote_id}`;
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        alert("Error de conexión");
    }
};