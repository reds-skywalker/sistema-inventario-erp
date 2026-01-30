
const loginForm = document.getElementById('loginForm');
const errorAlert = document.getElementById('errorAlert');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // ¡ÉXITO!
            // 1. Guardamos el token en el navegador (Local Storage)
            localStorage.setItem('token', data.token);
            
            // 2. Redirigimos al Dashboard (que crearemos en el siguiente paso)
            window.location.href = '/dashboard.html';
        } else {
            // ERROR (Contraseña mal, etc)
            mostrarError(data.message);
        }

    } catch (error) {
        mostrarError('Error de conexión con el servidor');
    }
});

function mostrarError(mensaje) {
    errorAlert.textContent = mensaje;
    errorAlert.classList.remove('d-none');
}