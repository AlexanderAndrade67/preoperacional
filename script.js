// Preguntas del checklist
const questions = [
    {
        question: "DOCUMENTOS: ¿Tiene de forma física Licencia de transito, tarjeta de operación, Polizas RCC y RCE, SOAT, RTM, Licencia de conducción y Cedula de Ciudadanía?",
        type: "si-no"
    },
    // ... resto de las preguntas ...
];

// Variables globales
let empleadosData = [];
let nombre = "";
let cedula = "";
let startTime;
let timerInterval;
let currentQuestionIndex = 0;
let userResponses = [];
let userLocation = null;
let deviceType = "desconocido";
let userAgentInfo = "";

// Funciones (se mantienen igual)
function detectarDispositivo() { /* ... */ }
async function obtenerUbicacion() { /* ... */ }
async function cargarDatosEmpleados() { /* ... */ }
function setupAutocomplete() { /* ... */ }
function showError() { /* ... */ }
// ... resto de las funciones ...

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async function() {
    const dispositivo = detectarDispositivo();
    await cargarDatosEmpleados();
    setupAutocomplete();
    
    // Configurar el formulario de inicio
    const startForm = document.getElementById('startForm');
    startForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // ... lógica del formulario ...
    });
});