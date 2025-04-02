// Preguntas del checklist
const questions = [
    {
        question: "DOCUMENTOS: ¿Tiene de forma física Licencia de transito, tarjeta de operación, Polizas RCC y RCE, SOAT, RTM, Licencia de conducción y Cedula de Ciudadanía?",
        type: "si-no"
    },
    {
        question: "EQUIPO DE SEGURIDAD: ¿El vehículo cuenta con Extintor? Manometro legible, cargado, etiqueta y fecha de vigencia.",
        type: "si-no"
    },
    {
        question: "EQUIPO DE SEGURIDAD: ¿El vehículo cuenta con cinturón de seguridad de 3 puntos y se encuentra en condiciones de uso?",
        type: "si-no"
    },
    {
        question: "SISTEMA DE CARROCERIA: ¿El vehículo cuenta con carrocería en buen estado?, Parabrisas, Limpiabrisas, Retrovisores, Apertura y Cierre de Puertas.",
        type: "si-no"
    },
    {
        question: "SISTEMA DE MOTOR: ¿El Nivel de Refrigerante, Liquido de Frenos, y aceite de motor son adecuados?",
        type: "si-no"
    },
    {
        question: "SISTEMA DE RODAMIENTO: ¿Las Llantas se encuentran bien infladas y en buen estado? Traseras, delanteras y repuesto.",
        type: "si-no"
    },
    {
        question: "SISTEMA ELECTRICO: ¿El Stop, Luces de Freno, Luz de Placa, Pito, Timbre, Luz de Reversa, Estacionarias, Direccionales delanteras y traseras, luces altas y luces bajas y luces interiores funcionan correctamente?",
        type: "si-no"
    }
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

// Función para detectar dispositivo
function detectarDispositivo() {
    const userAgent = navigator.userAgent;
    userAgentInfo = userAgent;
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        deviceType = "móvil";
    } else {
        deviceType = "escritorio";
    }
    
    let os = "desconocido";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Macintosh")) os = "Mac";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iOS")) os = "iOS";
    
    document.getElementById('deviceInfo').textContent = `Dispositivo: ${deviceType} (${os})`;
    
    return {
        tipo: deviceType,
        os: os,
        userAgent: userAgent
    };
}

// Función para obtener ubicación
async function obtenerUbicacion() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Geolocalización no soportada en este navegador");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitud: position.coords.latitude,
                    longitud: position.coords.longitude,
                    precision: position.coords.accuracy,
                    timestamp: new Date(position.timestamp)
                });
            },
            (error) => {
                let mensajeError;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        mensajeError = "Usuario denegó la solicitud de geolocalización";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        mensajeError = "Información de ubicación no disponible";
                        break;
                    case error.TIMEOUT:
                        mensajeError = "La solicitud de ubicación expiró";
                        break;
                    default:
                        mensajeError = "Error desconocido al obtener ubicación";
                }
                reject(mensajeError);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// Función para obtener ubicación con permisos
async function obtenerUbicacionConPermiso() {
    if (navigator.permissions && navigator.permissions.query) {
        const permiso = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permiso.state === 'denied') {
            throw new Error("El usuario ha bloqueado permanentemente la geolocalización");
        }

        if (permiso.state === 'prompt') {
            const confirmacion = confirm("El checklist requiere su ubicación para validar el lugar de inspección. ¿Desea compartir su ubicación?");
            
            if (!confirmacion) {
                throw new Error("Usuario canceló la solicitud de ubicación");
            }
        }
    }

    return await obtenerUbicacion();
}

// Cargar datos de empleados desde Google Sheets
async function cargarDatosEmpleados() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vSq0XPtekFVeLicE1lyjtTkf6UdxkE6ZStfiCoVIwqRKz2F-g-lQC9riOEk_YwXUDl4Ut3qTbhzUatD/pub?gid=1632152405&single=true&output=csv');
        const csvData = await response.text();
        
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(',');
            if (currentLine.length >= 2) {
                empleadosData.push({
                    identificacion: currentLine[0].trim(),
                    nombreCompleto: currentLine[1].trim()
                });
            }
        }
        
        console.log('Datos de empleados cargados:', empleadosData);
    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar datos de empleados. Por favor recargue la página.');
    }
}

// Configurar autocompletado de cédula
function setupAutocomplete() {
    const cedulaInput = document.getElementById('cedula');
    const nombreInput = document.getElementById('nombre');
    const autocompleteContainer = document.getElementById('cedulaAutocomplete');
    
    cedulaInput.addEventListener('input', function(e) {
        const inputVal = this.value;
        autocompleteContainer.innerHTML = '';
        
        if (!inputVal || inputVal.length < 3) return;
        
        const matches = empleadosData.filter(emp => 
            emp.identificacion.includes(inputVal)
        ).slice(0, 5);
        
        if (matches.length > 0) {
            matches.forEach(match => {
                const div = document.createElement('div');
                div.innerHTML = `<strong>${match.identificacion}</strong> - ${match.nombreCompleto}`;
                div.addEventListener('click', function() {
                    cedulaInput.value = match.identificacion;
                    nombreInput.value = match.nombreCompleto;
                    autocompleteContainer.innerHTML = '';
                    document.getElementById('cedulaError').style.display = 'none';
                    cedulaInput.classList.remove('is-invalid');
                });
                autocompleteContainer.appendChild(div);
            });
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.id !== 'cedula') {
            autocompleteContainer.innerHTML = '';
        }
    });
}

// Mostrar errores de validación
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    const errorElement = document.getElementById(elementId + 'Error');
    
    element.classList.add('is-invalid');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Limpiar errores
function clearError(elementId) {
    const element = document.getElementById(elementId);
    const errorElement = document.getElementById(elementId + 'Error');
    
    element.classList.remove('is-invalid');
    errorElement.style.display = 'none';
}

// Iniciar temporizador
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

// Actualizar temporizador
function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `Tiempo: ${minutes}:${seconds}`;
}

// Actualizar barra de progreso
function updateProgressBar() {
    const progress = (currentQuestionIndex / questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

// Generar pregunta actual
function generateQuiz() {
    const quizContainer = document.getElementById('quiz');
    const q = questions[currentQuestionIndex];
    
    let html = `
        <div class="question bold-title mb-3">${currentQuestionIndex + 1}. ${q.question}</div>
        <div class="options-container">
            <div class="form-check">
                <input class="form-check-input" type="radio" name="question" id="optionSi" value="Sí">
                <label class="form-check-label" for="optionSi">Sí - Cumple con el requisito</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="question" id="optionNo" value="No">
                <label class="form-check-label" for="optionNo">No - Requiere atención</label>
            </div>
        </div>`;
    
    quizContainer.innerHTML = html;
    
    document.getElementById('observationContainer').style.display = 'none';
    document.getElementById('observation').value = '';
    document.getElementById('observation').classList.remove('is-invalid');
    
    const restantes = questions.length - currentQuestionIndex;
    document.getElementById('preguntasRestantes').textContent = 
        `Preguntas: ${currentQuestionIndex + 1} de ${questions.length}`;
    
    document.getElementById('optionSi').addEventListener('change', function() {
        document.getElementById('observationContainer').style.display = 'none';
    });
    
    document.getElementById('optionNo').addEventListener('change', function() {
        document.getElementById('observationContainer').style.display = 'block';
    });
}

// Verificar respuestas y avanzar
function checkAnswers() {
    const selectedOption = document.querySelector('input[name="question"]:checked');
    const observation = document.getElementById('observation').value.trim();
    
    if (!selectedOption) {
        alert('Por favor seleccione una respuesta (Sí o No).');
        return;
    }
    
    if (selectedOption.value === "No" && observation === "") {
        document.getElementById('observation').classList.add('is-invalid');
        alert('Debe describir el problema encontrado cuando selecciona "No".');
        return;
    }
    
    userResponses.push({
        pregunta: questions[currentQuestionIndex].question,
        respuesta: selectedOption.value,
        observacion: selectedOption.value === "No" ? observation : null,
        timestamp: new Date().toLocaleString()
    });
    
    const alertDiv = document.getElementById('alert');
    alertDiv.style.display = 'block';
    
    if (selectedOption.value === "Sí") {
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = '<i class="bi bi-check-circle"></i> Registrado correctamente';
    } else {
        alertDiv.className = 'alert alert-warning';
        alertDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Se registró una anomalía';
    }
    
    currentQuestionIndex++;
    updateProgressBar();
    
    if (currentQuestionIndex < questions.length) {
        setTimeout(() => {
            alertDiv.style.display = 'none';
            generateQuiz();
        }, 1000);
    } else {
        finalizarChecklist();
    }
}

// Finalizar checklist y generar PDF
async function finalizarChecklist() {
    clearInterval(timerInterval);
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('alert').style.display = 'none';
    document.getElementById('progressBar').style.width = '100%';
    
    const downloadSection = document.getElementById('downloadSection');
    downloadSection.innerHTML = `
        <div class="alert alert-info mb-3">
            <h4 class="alert-heading">Guardando resultados...</h4>
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Obteniendo ubicación...</p>
        </div>
    `;
    downloadSection.style.display = 'block';
    
    try {
        userLocation = await obtenerUbicacionConPermiso();
        console.log("Ubicación obtenida:", userLocation);
        
        downloadSection.innerHTML = `
            <div class="alert alert-success mb-3">
                <h4 class="alert-heading">¡Checklist completado exitosamente!</h4>
                <p>Ubicación registrada: ${userLocation.latitud.toFixed(6)}, ${userLocation.longitud.toFixed(6)}</p>
            </div>
            <button class="btn btn-success btn-lg" onclick="generatePDF()">
                <i class="bi bi-download"></i> Descargar Reporte
            </button>
        `;
        
        for (let i = 0; i < 100; i++) {
            createConfetti();
        }
    } catch (error) {
        console.warn("Error al obtener ubicación:", error);
        
        downloadSection.innerHTML = `
            <div class="alert alert-warning mb-3">
                <h4 class="alert-heading">Checklist completado</h4>
                <p>No se pudo obtener la ubicación: ${error}</p>
            </div>
            <button class="btn btn-success btn-lg" onclick="generatePDF()">
                <i class="bi bi-download"></i> Descargar Reporte
            </button>
        `;
        
        for (let i = 0; i < 50; i++) {
            createConfetti();
        }
    }
}

// Generar PDF con jsPDF
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Logo
    const logoUrl = 'https://www.wikomm.com/card/assets/images/users/log1680625540.jpg';
    
    // Encabezado
    doc.setFontSize(18);
    doc.setTextColor(40, 53, 147);
    doc.text('CHECKLIST PREOPERACIONAL - COMBUSES', 105, 20, { align: 'center' });
    
    // Información del conductor
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Conductor: ${nombre}`, 20, 40);
    doc.text(`Cédula: ${cedula}`, 20, 50);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 60);
    doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 20, 70);
    doc.text(`Dispositivo: ${deviceType}`, 20, 80);
    
    let y = 90;
    if (userLocation) {
        doc.text(`Ubicación: Lat ${userLocation.latitud.toFixed(6)}, Long ${userLocation.longitud.toFixed(6)}`, 20, y);
        y += 10;
        doc.text(`Precisión: ±${Math.round(userLocation.precision)} metros`, 20, y);
        y += 15;
    } else {
        doc.text(`Ubicación: No disponible`, 20, y);
        y += 15;
    }
    
    doc.setFontSize(14);
    doc.text('RESULTADOS DE INSPECCIÓN:', 20, y);
    y += 10;
    
    userResponses.forEach((item, index) => {
        if (y > 260) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${item.pregunta}`, 20, y);
        y += 7;
        
        if (item.respuesta === "Sí") {
            doc.setTextColor(0, 128, 0);
            doc.text(`✓ ${item.respuesta} - Cumple`, 25, y);
        } else {
            doc.setTextColor(255, 0, 0);
            doc.text(`✗ ${item.respuesta} - No cumple`, 25, y);
            y += 7;
            doc.setTextColor(0, 0, 0);
            doc.text(`Observación: ${item.observacion}`, 30, y);
        }
        
        y += 10;
    });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Documento generado automáticamente por el sistema de checklist preoperacional de Combuses', 105, 285, { align: 'center' });
    
    try {
        doc.save(`Checklist_Preoperacional_${nombre.replace(/ /g, '_')}_${cedula}.pdf`);
    } catch (error) {
        console.error('Error al generar PDF:', error);
        const pdfDataUri = doc.output('datauristring');
        const link = document.createElement('a');
        link.href = pdfDataUri;
        link.download = `Checklist_Preoperacional_${nombre.replace(/ /g, '_')}_${cedula}.pdf`;
        link.click();
    }
}

// Animación de confeti
function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
    document.body.appendChild(confetti);
    
    setTimeout(() => {
        confetti.remove();
    }, 5000);
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async function() {
    const dispositivo = detectarDispositivo();
    await cargarDatosEmpleados();
    setupAutocomplete();
    
    const startForm = document.getElementById('startForm');
    startForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        nombre = document.getElementById('nombre').value.trim();
        cedula = document.getElementById('cedula').value.trim();
        
        clearError('nombre');
        clearError('cedula');
        
        let isValid = true;
        
        if (!cedula || cedula.length < 6 || !/^\d+$/.test(cedula)) {
            showError('cedula', 'Ingrese una cédula válida (mínimo 6 dígitos)');
            isValid = false;
        }
        
        if (!nombre || nombre.length < 3) {
            showError('nombre', 'Seleccione una cédula válida para autocompletar');
            isValid = false;
        }
        
        if (!isValid) {
            if (!cedula || cedula.length < 6) {
                document.getElementById('cedula').focus();
            } else {
                document.getElementById('nombre').focus();
            }
            return;
        }
        
        document.getElementById('userInfo').textContent = `Conductor: ${nombre} - Cédula: ${cedula}`;
        document.getElementById('startSection').style.display = 'none';
        document.getElementById('examSection').style.display = 'block';
        
        currentQuestionIndex = 0;
        userResponses = [];
        if (timerInterval) clearInterval(timerInterval);
        startTimer();
        updateProgressBar();
        generateQuiz();
    });
    
    document.getElementById('cedula').addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
    });
});
