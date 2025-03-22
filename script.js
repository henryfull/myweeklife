// Variables globales
let currentAge = 0;
let lifeExpectancy = 90;
let activities = [];
let weekElements = [];
let isGridGenerated = false;
let currentBoardId = null;
let currentBoardName = "";
let currentChartSort = "default"; // Valor por defecto para ordenación
const WEEKS_PER_YEAR = 52;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_YEAR = 365.25;
const HOURS_PER_WEEK = HOURS_PER_DAY * DAYS_PER_WEEK; // 168 horas en una semana
const DAYS_PER_MONTH = 30.44; // Promedio de días por mes
const HOURS_PER_MONTH = HOURS_PER_DAY * DAYS_PER_MONTH; // ~730.56 horas por mes
const RETIREMENT_AGE = 65; // Edad de jubilación
const STORAGE_KEY = 'mividaensemanas_boards';

// Variables para el tiempo disponible
let totalRemainingWeeks = 0;
let totalRemainingHours = 0;
let usedHours = 0;

// Variables para los gráficos
let barChart = null;
let pieChart = null;

// Función para generar un ID único
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Función para generar color aleatorio
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Función para guardar los datos en localStorage
function saveToLocalStorage() {
    // Obtener tableros existentes
    const existingBoards = getStoredBoards();
    
    // Si no hay un ID de tablero actual, generar uno nuevo
    if (!currentBoardId) {
        currentBoardId = generateId();
    }
    
    // Crear objeto de tablero
    const boardData = {
        id: currentBoardId,
        name: currentBoardName,
        currentAge: currentAge,
        lifeExpectancy: lifeExpectancy,
        activities: activities,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Verificar si el tablero ya existe para actualizarlo
    const boardIndex = existingBoards.findIndex(board => board.id === currentBoardId);
    if (boardIndex !== -1) {
        existingBoards[boardIndex] = boardData;
    } else {
        existingBoards.push(boardData);
    }
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingBoards));
    
    // Actualizar la lista de tableros
    updateBoardsList();
    
    return boardData;
}

// Función para cargar los tableros guardados
function getStoredBoards() {
    const boards = localStorage.getItem(STORAGE_KEY);
    return boards ? JSON.parse(boards) : [];
}

// Función para cargar un tablero específico
function loadBoard(boardId) {
    const boards = getStoredBoards();
    const board = boards.find(b => b.id === boardId);
    
    if (board) {
        // Cargar datos del tablero
        currentBoardId = board.id;
        currentBoardName = board.name;
        currentAge = board.currentAge;
        lifeExpectancy = board.lifeExpectancy;
        activities = [...board.activities];
        
        // Actualizar UI
        $("#board-name").val(board.name);
        $("#current-age").val(board.currentAge);
        $("#life-expectancy").val(board.lifeExpectancy);
        $("#board-owner").text(board.name);
        $("#board-title").text("Tu Vida en Semanas");
        
        // Calcular valores derivados
        const remainingYears = lifeExpectancy - currentAge;
        totalRemainingWeeks = remainingYears * WEEKS_PER_YEAR;
        totalRemainingHours = remainingYears * DAYS_PER_YEAR * HOURS_PER_DAY;
        
        // Recalcular horas usadas
        usedHours = activities.reduce((total, activity) => total + activity.hours, 0);
        
        // Mostrar interfaz completa
        showFullUI();
        
        // Renderizar grid
        renderLifeGrid();
        updateActivityTable();
        updateActivityLegend();
        updateRemainingTime();
        updateBoardsList();
        
        // Actualizar los gráficos
        updateCharts();
        
        // Resaltar el tablero activo
        $(".board-item").removeClass("active");
        $(`.board-item[data-id="${boardId}"]`).addClass("active");
        
        return true;
    }
    return false;
}

// Función para eliminar un tablero
function deleteBoard(boardId) {
    const boards = getStoredBoards();
    const filteredBoards = boards.filter(board => board.id !== boardId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredBoards));
    
    // Si el tablero actual es el que se está eliminando, limpiar la interfaz
    if (currentBoardId === boardId) {
        resetUI();
    }
    
    updateBoardsList();
}

// Función para mostrar la interfaz completa
function showFullUI() {
    $("#activities-section").show();
    $("#activities-list").show();
    $("#life-grid-container").show();
    $("#remaining-time-container").show();
    $("#color-legend").show();
    $("#hours-calculator").show();
    $("#export-section").show();
    $("#update-btn").show();
    $("#save-board-btn").show();
    isGridGenerated = true;
}

// Función para resetear la interfaz
function resetUI() {
    currentBoardId = null;
    currentBoardName = "";
    activities = [];
    usedHours = 0;
    isGridGenerated = false;
    
    $("#board-name").val("");
    $("#current-age").val("");
    $("#life-expectancy").val("90");
    $("#board-owner").text("");
    $("#board-title").text("Tu Vida en Semanas");
    
    $("#activities-section").hide();
    $("#activities-list").hide();
    $("#life-grid-container").hide();
    $("#remaining-time-container").hide();
    $("#color-legend").hide();
    $("#hours-calculator").hide();
    $("#export-section").hide();
    $("#update-btn").hide();
    $("#save-board-btn").hide();
    
    $(".board-item").removeClass("active");
}

// Función para actualizar la lista de tableros
function updateBoardsList() {
    const boards = getStoredBoards();
    const boardsListElement = $("#boards-list");
    
    // Limpiar lista existente
    boardsListElement.empty();
    
    if (boards.length === 0) {
        boardsListElement.append('<p class="text-muted" id="no-boards-message">No hay tableros guardados</p>');
    } else {
        boards.forEach(board => {
            // Formatear fecha
            const updatedDate = new Date(board.updatedAt);
            const formattedDate = updatedDate.toLocaleDateString();
            
            // Crear elemento de tablero
            const boardItem = $(`
                <div class="board-item ${board.id === currentBoardId ? 'active' : ''}" data-id="${board.id}">
                    <div class="board-item-title">${board.name}</div>
                    <div class="board-item-actions">
                        <button class="btn btn-sm btn-primary load-board" data-id="${board.id}">Cargar</button>
                        <button class="btn btn-sm btn-danger delete-board" data-id="${board.id}">Eliminar</button>
                    </div>
                </div>
            `);
            
            boardsListElement.append(boardItem);
        });
    }
}

// Función para exportar a PDF
function exportToPDF() {
    // Crear un clon del contenedor para no afectar el original
    const gridContainer = $("#life-grid-container").clone();
    
    // Ajustar el estilo para la exportación
    gridContainer.css({
        'width': '210mm',
        'padding': '10mm'
    });
    
    // Añadir información adicional al PDF
    const infoDiv = $('<div class="export-info"></div>');
    infoDiv.append(`<h3>${currentBoardName}</h3>`);
    infoDiv.append(`<p>Edad: ${currentAge} años | Expectativa de vida: ${lifeExpectancy} años</p>`);
    infoDiv.append(`<p>Generado el: ${new Date().toLocaleDateString()}</p>`);
    
    // Crear una tabla con las actividades
    const activitiesTable = $('<table class="table table-bordered mt-3"></table>');
    const tableHeader = $(`
        <thead>
            <tr>
                <th>Actividad</th>
                <th>Horas</th>
                <th>Color</th>
            </tr>
        </thead>
    `);
    const tableBody = $('<tbody></tbody>');
    
    activities.forEach(activity => {
        const row = $(`
            <tr>
                <td>${activity.name}</td>
                <td>${Math.round(activity.hours).toLocaleString()}</td>
                <td><div style="width: 20px; height: 20px; background-color: ${activity.color}; display: inline-block; margin-right: 5px;"></div></td>
            </tr>
        `);
        tableBody.append(row);
    });
    
    activitiesTable.append(tableHeader).append(tableBody);
    infoDiv.append(activitiesTable);
    
    // Añadir la información antes del grid
    gridContainer.find('.card-body').prepend(infoDiv);
    
    // Crear opciones para html2pdf
    const options = {
        margin: 10,
        filename: `mi-vida-en-semanas-${currentBoardName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    // Generar el PDF
    html2pdf().from(gridContainer[0]).set(options).save();
}

// Función para exportar un tablero a JSON
function exportToJSON() {
    if (!currentBoardId) {
        alert("No hay un tablero activo para exportar.");
        return;
    }
    
    // Buscar el tablero actual
    const boards = getStoredBoards();
    const currentBoard = boards.find(b => b.id === currentBoardId);
    
    if (!currentBoard) {
        alert("Error: No se pudo encontrar el tablero para exportar.");
        return;
    }
    
    // Crear un objeto de datos para la exportación
    const exportData = {
        boardData: currentBoard,
        exportedAt: new Date().toISOString(),
        appVersion: "1.0" // Para control de versiones futuras
    };
    
    // Convertir a cadena JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Crear un blob con el contenido
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Crear URL para el blob
    const url = URL.createObjectURL(blob);
    
    // Crear un elemento de enlace para descargar
    const a = document.createElement('a');
    a.href = url;
    a.download = `tablero-${currentBoard.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    // Simular clic para descargar
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Función para importar un tablero desde JSON
function importFromJSON(file) {
    if (!file) {
        alert("Por favor, selecciona un archivo para importar.");
        return;
    }
    
    // Verificar tipo de archivo
    if (file.type !== "application/json") {
        alert("El archivo debe ser de tipo JSON.");
        return;
    }
    
    // Leer el archivo
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Parsear el JSON
            const importData = JSON.parse(e.target.result);
            
            // Validar que tenga la estructura correcta
            if (!importData.boardData || !importData.boardData.id || 
                !importData.boardData.name || !importData.boardData.activities) {
                throw new Error("El archivo no tiene un formato válido de tablero.");
            }
            
            // Obtener los tableros existentes
            const existingBoards = getStoredBoards();
            
            // Verificar si ya existe un tablero con el mismo ID
            const existingBoardIndex = existingBoards.findIndex(b => b.id === importData.boardData.id);
            
            // Generar nuevo ID para evitar colisiones
            const boardToImport = {
                ...importData.boardData,
                id: generateId(), // Nuevo ID para evitar conflictos
                importedAt: new Date().toISOString()
            };
            
            // Añadir " (importado)" al nombre para distinguirlo si hay duplicados
            if (existingBoards.some(b => b.name === boardToImport.name)) {
                boardToImport.name += " (importado)";
            }
            
            // Añadir a la lista de tableros
            existingBoards.push(boardToImport);
            
            // Guardar en localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existingBoards));
            
            // Actualizar la lista de tableros
            updateBoardsList();
            
            // Mostrar mensaje de éxito
            alert(`Tablero "${boardToImport.name}" importado correctamente.`);
            
            // Preguntar si desea cargar el tablero importado
            if (confirm(`¿Deseas cargar el tablero "${boardToImport.name}" ahora?`)) {
                loadBoard(boardToImport.id);
            }
            
        } catch (error) {
            console.error("Error al importar:", error);
            alert("Error al importar el tablero: " + error.message);
        }
    };
    
    reader.onerror = function() {
        alert("Error al leer el archivo.");
    };
    
    reader.readAsText(file);
}

// Inicializar la aplicación cuando el DOM esté listo
$(document).ready(function() {
    // Inicializar el selector de color
    $("#activity-color").spectrum({
        preferredFormat: "hex",
        showInput: true,
        showPalette: true,
        palette: [
            ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3"],
            ["#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39"],
            ["#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"]
        ],
        color: getRandomColor()
    });

    // Cargar tableros guardados
    updateBoardsList();
    
    // Manejar el botón de nuevo tablero
    $("#new-board-btn").on("click", function() {
        resetUI();
        // Enfocar el campo del nombre para facilitar la entrada de datos
        $("#board-name").focus();
    });
    
    // Manejar la carga de tableros (delegación de eventos)
    $("#boards-list").on("click", ".load-board", function() {
        const boardId = $(this).data("id");
        loadBoard(boardId);
    });
    
    // Manejar eliminación de tableros (delegación de eventos)
    $("#boards-list").on("click", ".delete-board", function(e) {
        e.stopPropagation();
        const boardId = $(this).data("id");
        const boardName = getStoredBoards().find(b => b.id === boardId)?.name || "desconocido";
        
        // Configurar el modal
        $("#board-to-delete-name").text(boardName);
        
        // Guardar el ID del tablero a eliminar en el botón de confirmación
        $("#confirm-delete-btn").data("boardId", boardId);
        
        // Mostrar el modal
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        deleteModal.show();
    });
    
    // Manejar confirmación de eliminación
    $("#confirm-delete-btn").on("click", function() {
        const boardId = $(this).data("boardId");
        deleteBoard(boardId);
        
        // Cerrar el modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        deleteModal.hide();
    });
    
    // Manejar el botón de guardar tablero
    $("#save-board-btn").on("click", function() {
        const boardData = saveToLocalStorage();
        if (boardData) {
            alert(`Tablero "${boardData.name}" guardado correctamente.`);
        }
    });
    
    // Manejar el botón de exportar a PDF
    $("#export-pdf-btn").on("click", function() {
        exportToPDF();
    });
    
    // Manejar el botón de exportar a JSON
    $("#export-json-btn").on("click", function() {
        exportToJSON();
    });
    
    // Manejar el botón de importar desde JSON
    $("#import-json-btn").on("click", function() {
        const fileInput = document.getElementById('import-json-file');
        if (fileInput.files.length > 0) {
            importFromJSON(fileInput.files[0]);
        } else {
            alert("Por favor, selecciona un archivo para importar.");
        }
    });

    // Manejar el envío del formulario de vida
    $("#life-form").on("submit", function(e) {
        e.preventDefault();
        
        // Validar que haya un nombre para el tablero
        const boardName = $("#board-name").val().trim();
        if (!boardName) {
            alert("Por favor, ingresa un nombre para el tablero.");
            $("#board-name").focus();
            return;
        }
        
        // Guardar el nombre del tablero
        currentBoardName = boardName;
        
        // Actualizar el título del tablero
        $("#board-owner").text(currentBoardName);
        
        // Verificar edad y expectativa
        const edad = parseInt($("#current-age").val());
        const expectativa = parseInt($("#life-expectancy").val());
        
        if (isNaN(edad) || isNaN(expectativa)) {
            alert("Por favor, ingresa valores numéricos válidos para la edad y expectativa de vida.");
            return;
        }
        
        if (edad > expectativa) {
            alert("La edad actual debe ser menor que la expectativa de vida.");
            return;
        }
        
        // Continuar con la configuración
        setupLifeGrid();
    });
    
    // Manejar el botón de actualización
    $("#update-btn").on("click", function() {
        updateLifeConfiguration();
    });
    
    // Manejar el botón de calcular en la calculadora
    $("#calculate-btn").on("click", function() {
        calculateHours();
    });
    
    // Manejar el botón de usar cálculo
    $("#use-calculation-btn").on("click", function() {
        useCalculationResult();
    });

    // Manejar el envío del formulario de actividad
    $("#activity-form").on("submit", function(e) {
        e.preventDefault();
        const name = $("#activity-name").val();
        const hours = parseInt($("#activity-hours").val());
        
        // Validar que las horas sean válidas y no excedan el tiempo disponible
        if (hours <= 0) {
            alert("Las horas deben ser un valor positivo");
            return;
        }
        
        if (hours > getRemainingHours()) {
            alert("No tienes suficientes horas disponibles para esta actividad. Te quedan " + Math.round(getRemainingHours()).toLocaleString() + " horas.");
            return;
        }
        
        // Obtener color o generar uno aleatorio
        let color = $("#activity-color").spectrum("get").toHexString();
        if (!color) {
            color = getRandomColor();
        }
        
        // Crear nueva actividad
        const activity = {
            id: generateId(), // Usar ID único
            name: name,
            hours: hours,
            color: color
        };
        
        // Actualizar horas usadas
        usedHours += hours;
        
        // Agregar a la lista y actualizar UI
        activities.push(activity);
        addActivityToList(activity);
        updateActivityLegend();
        updateWeeks();
        updateRemainingTime();
        
        // Guardar cambios automáticamente
        if (currentBoardId) {
            saveToLocalStorage();
        }
        
        // Reiniciar formulario
        $("#activity-name").val('');
        $("#activity-hours").val('');
        $("#activity-color").spectrum("set", getRandomColor());
    });
    
    // Delegación de eventos para botones de edición/eliminación de actividades
    $("#activities-table-body").on("click", ".btn-edit", function() {
        const activityId = $(this).data("id");
        editActivity(activityId);
    });
    
    $("#activities-table-body").on("click", ".btn-delete", function() {
        const activityId = $(this).data("id");
        deleteActivity(activityId);
    });

    // Manejar cambios en la opción de ordenación
    $("#chart-sort-option").on("change", function() {
        currentChartSort = $(this).val();
        updateCharts();
    });
});

// Función para calcular las horas en la calculadora
function calculateHours() {
    const calculationType = $("#activity-calculator-type").val();
    const amount = parseFloat($("#activity-calculator-hours").val());
    const years = $("#activity-calculator-years").val() ? parseFloat($("#activity-calculator-years").val()) : null;
    
    if (!amount || isNaN(amount) || amount <= 0) {
        alert("Por favor, ingresa una cantidad válida mayor que cero.");
        return;
    }
    
    // Si se especificó años, validar
    if (years !== null && (isNaN(years) || years <= 0)) {
        alert("Por favor, ingresa un número válido de años mayor que cero.");
        return;
    }
    
    // Calcular las horas totales según el tipo de cálculo
    let totalHours = 0;
    let calculationExplanation = "";
    
    // Si no se especificó años, usar toda la vida restante
    const yearsToUse = years !== null ? years : (lifeExpectancy - currentAge);
    
    switch (calculationType) {
        case "daily":
            totalHours = amount * yearsToUse * DAYS_PER_YEAR;
            calculationExplanation = `${amount} horas al día durante ${yearsToUse.toFixed(1)} años = ${amount} × ${DAYS_PER_YEAR.toFixed(1)} días × ${yearsToUse.toFixed(1)} años`;
            break;
        case "weekly":
            totalHours = amount * WEEKS_PER_YEAR * yearsToUse;
            calculationExplanation = `${amount} horas a la semana durante ${yearsToUse.toFixed(1)} años = ${amount} × ${WEEKS_PER_YEAR} semanas × ${yearsToUse.toFixed(1)} años`;
            break;
        case "monthly":
            totalHours = amount * 12 * yearsToUse;
            calculationExplanation = `${amount} horas al mes durante ${yearsToUse.toFixed(1)} años = ${amount} × 12 meses × ${yearsToUse.toFixed(1)} años`;
            break;
        case "yearly":
            totalHours = amount * yearsToUse;
            calculationExplanation = `${amount} horas al año durante ${yearsToUse.toFixed(1)} años = ${amount} × ${yearsToUse.toFixed(1)} años`;
            break;
    }
    
    // Mostrar el resultado
    const formattedHours = Math.round(totalHours).toLocaleString();
    const weeksEquivalent = Math.round(totalHours / HOURS_PER_WEEK).toLocaleString();
    const yearsEquivalent = (totalHours / (HOURS_PER_DAY * DAYS_PER_YEAR)).toFixed(1);
    
    let resultText = `<strong>${formattedHours} horas totales</strong><br>`;
    resultText += `(${calculationExplanation})<br>`;
    resultText += `Equivale a ${weeksEquivalent} semanas o ${yearsEquivalent} años`;
    
    $("#calculator-result-text").html(resultText);
    $("#calculator-result").show();
}

// Función para usar el resultado del cálculo
function useCalculationResult() {
    // Extraer el número de horas del texto del resultado
    const resultText = $("#calculator-result-text").text();
    const hoursMatch = resultText.match(/(\d+[\d,]*) horas totales/);
    
    if (hoursMatch && hoursMatch[1]) {
        // Eliminar las comas y convertir a número
        const hours = parseInt(hoursMatch[1].replace(/,/g, ''));
        $("#activity-hours").val(hours);
        
        // Ocultar el resultado
        $("#calculator-result").hide();
    }
}

// Función para configurar la cuadrícula de vida
function setupLifeGrid() {
    currentAge = parseInt($("#current-age").val());
    lifeExpectancy = parseInt($("#life-expectancy").val());
    
    if (currentAge <= lifeExpectancy) {
        // Limpiar actividades previas si las hubiera
        activities = [];
        usedHours = 0;
        
        // Calcular años restantes
        const remainingYears = lifeExpectancy - currentAge;
        
        // Calcular semanas restantes
        totalRemainingWeeks = remainingYears * WEEKS_PER_YEAR;
        
        // Calculamos horas totales de la vida restante
        totalRemainingHours = remainingYears * DAYS_PER_YEAR * HOURS_PER_DAY;
        
        // 1. Añadir automáticamente la actividad de dormir (un tercio de la vida)
        const totalSleepHours = totalRemainingHours / 3;
        
        const sleepActivity = {
            id: generateId(),
            name: "Dormir",
            hours: totalSleepHours,
            color: "#1a237e" // Azul oscuro
        };
        
        activities.push(sleepActivity);
        usedHours += totalSleepHours;
        
        // 2. Añadir automáticamente el trabajo (8 horas diarias, 5 días a la semana, hasta jubilación)
        if (currentAge < RETIREMENT_AGE) {
            const yearsUntilRetirement = Math.min(RETIREMENT_AGE - currentAge, remainingYears);
            const workDaysUntilRetirement = yearsUntilRetirement * DAYS_PER_YEAR * (5/7); // 5 días de trabajo por semana
            const totalWorkHours = workDaysUntilRetirement * 8; // 8 horas diarias
            
            const workActivity = {
                id: generateId(),
                name: "Trabajo",
                hours: totalWorkHours,
                color: "#ff5722" // Naranja
            };
            
            activities.push(workActivity);
            usedHours += totalWorkHours;
        }
        
        // 3. Añadir automáticamente la hora de comer (1 hora diaria para el resto de la vida)
        const totalEatingHours = remainingYears * DAYS_PER_YEAR * 1; // 1 hora al día
        
        const eatingActivity = {
            id: generateId(),
            name: "Comer",
            hours: totalEatingHours,
            color: "#4caf50" // Verde
        };
        
        activities.push(eatingActivity);
        usedHours += totalEatingHours;
        
        // Renderizar la cuadrícula
        renderLifeGrid();
        
        // Mostrar secciones
        showFullUI();
        
        // Cambiar los botones
        $("#generate-btn").parent().parent().removeClass("bg-primary").addClass("bg-secondary");
        
        // Actualizar UI
        updateActivityTable();
        updateActivityLegend();
        updateRemainingTime();
        
        // Inicializar los gráficos
        updateCharts();
        
        // Guardar el tablero automáticamente al crearlo
        saveToLocalStorage();
    } else {
        alert("La edad actual debe ser menor que la expectativa de vida");
    }
}

// Función para actualizar la configuración de vida
function updateLifeConfiguration() {
    // Guardar actividades personalizadas (excluyendo las automáticas)
    const customActivities = activities.filter(a => 
        a.name !== "Dormir" && 
        a.name !== "Trabajo" && 
        a.name !== "Comer"
    );
    
    // Obtener los nuevos valores
    const newCurrentAge = parseInt($("#current-age").val());
    const newLifeExpectancy = parseInt($("#life-expectancy").val());
    
    if (newCurrentAge > newLifeExpectancy) {
        alert("La edad actual debe ser menor que la expectativa de vida");
        return;
    }
    
    // Actualizar las variables globales
    currentAge = newCurrentAge;
    lifeExpectancy = newLifeExpectancy;
    
    // Reiniciar contadores
    activities = [];
    usedHours = 0;
    
    // Calcular nuevos valores
    const remainingYears = lifeExpectancy - currentAge;
    totalRemainingWeeks = remainingYears * WEEKS_PER_YEAR;
    totalRemainingHours = remainingYears * DAYS_PER_YEAR * HOURS_PER_DAY;
    
    // Añadir actividades automáticas
    // 1. Dormir
    const totalSleepHours = totalRemainingHours / 3;
    activities.push({
        id: Date.now(),
        name: "Dormir",
        hours: totalSleepHours,
        color: "#1a237e" // Azul oscuro
    });
    usedHours += totalSleepHours;
    
    // 2. Trabajo
    if (currentAge < RETIREMENT_AGE) {
        const yearsUntilRetirement = Math.min(RETIREMENT_AGE - currentAge, remainingYears);
        const workDaysUntilRetirement = yearsUntilRetirement * DAYS_PER_YEAR * (5/7);
        const totalWorkHours = workDaysUntilRetirement * 8;
        
        activities.push({
            id: Date.now() + 1,
            name: "Trabajo",
            hours: totalWorkHours,
            color: "#ff5722" // Naranja
        });
        usedHours += totalWorkHours;
    }
    
    // 3. Comer
    const totalEatingHours = remainingYears * DAYS_PER_YEAR * 1;
    activities.push({
        id: Date.now() + 2,
        name: "Comer",
        hours: totalEatingHours,
        color: "#4caf50" // Verde
    });
    usedHours += totalEatingHours;
    
    // Verificar si las actividades personalizadas aún caben
    const horasRestantes = totalRemainingHours - usedHours;
    const horasPersonalizadas = customActivities.reduce((total, act) => total + act.hours, 0);
    
    if (horasPersonalizadas > horasRestantes) {
        if (confirm("Las actividades personalizadas existentes exceden el tiempo disponible con la nueva configuración. ¿Deseas continuar sin ellas?")) {
            // Continuar sin actividades personalizadas
            renderLifeGrid();
            updateActivityTable();
            updateActivityLegend();
            updateRemainingTime();
        } else {
            // Restaurar valores anteriores
            return;
        }
    } else {
        // Añadir las actividades personalizadas
        customActivities.forEach(activity => {
            activities.push({
                ...activity,
                id: Date.now() + Math.random() * 1000 // Nuevo ID para evitar colisiones
            });
            usedHours += activity.hours;
        });
        
        // Renderizar
        renderLifeGrid();
        updateActivityTable();
        updateActivityLegend();
        updateRemainingTime();
        
        alert("Configuración actualizada correctamente.");
    }

    // Después de actualizar, guardar automáticamente
    saveToLocalStorage();
}

// Función para obtener semanas restantes
function getRemainingWeeks() {
    const usedWeeks = usedHours / HOURS_PER_WEEK;
    return totalRemainingWeeks - usedWeeks;
}

// Función para obtener días restantes
function getRemainingDays() {
    return getRemainingWeeks() * DAYS_PER_WEEK;
}

// Función para obtener horas restantes
function getRemainingHours() {
    return totalRemainingHours - usedHours;
}

// Función para actualizar el contador de tiempo disponible
function updateRemainingTime() {
    $("#remaining-weeks").text(Math.round(getRemainingWeeks()).toLocaleString());
    $("#remaining-days").text(Math.round(getRemainingDays()).toLocaleString());
    $("#remaining-hours").text(Math.round(getRemainingHours()).toLocaleString());
}

// Función para renderizar la cuadrícula de vida
function renderLifeGrid() {
    const weeksGrid = $("#weeks-grid");
    weeksGrid.empty();
    weekElements = [];
    
    // Calcular semanas vividas
    const weeksLived = currentAge * WEEKS_PER_YEAR;
    
    // Para cada año de vida esperada
    for (let year = 0; year < lifeExpectancy; year++) {
        // Crear fila de año
        const yearRow = $("<div>").addClass("year-row");
        
        // Añadir etiqueta del año
        const yearLabel = $("<div>").addClass("year-label").text(year);
        yearRow.append(yearLabel);
        
        // Contenedor de semanas para este año
        const weeksContainer = $("<div>").addClass("weeks-container");
        
        // Añadir cada semana
        for (let week = 0; week < WEEKS_PER_YEAR; week++) {
            const weekIndex = year * WEEKS_PER_YEAR + week;
            const weekElement = $("<div>").addClass("week");
            
            // Marcar semanas vividas
            if (weekIndex < weeksLived) {
                weekElement.addClass("week-lived");
            }
            
            // Almacenar referencia al elemento
            weekElements[weekIndex] = weekElement;
            
            // Añadir al contenedor
            weeksContainer.append(weekElement);
        }
        
        yearRow.append(weeksContainer);
        weeksGrid.append(yearRow);
    }
    
    // Actualizar semanas con las actividades existentes
    updateWeeks();
}

// Función para generar colores más claros para los gráficos
function getLighterColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (
        0x1000000 + 
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + 
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + 
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

// Función para ordenar los datos de los gráficos según el criterio seleccionado
function sortChartData(data, sortOption) {
    // Crear copia de los arrays para no modificar los originales
    const indices = Array.from(data.indices || [...Array(data.labels.length).keys()]);
    const labels = [...data.labels];
    const hours = [...data.hours];
    const colors = [...data.colors];
    const borderColors = [...data.borderColors];
    const percentages = data.percentages ? [...data.percentages] : null;
    
    // Crear array de objetos para ordenar todo junto
    let items = indices.map((index, i) => ({
        index,
        label: labels[i],
        hour: hours[i],
        color: colors[i],
        borderColor: borderColors[i],
        percentage: percentages ? percentages[i] : null
    }));
    
    // Ordenar según la opción seleccionada
    switch(sortOption) {
        case "hours-desc":
            items.sort((a, b) => b.hour - a.hour);
            break;
        case "hours-asc":
            items.sort((a, b) => a.hour - b.hour);
            break;
        case "alpha-asc":
            items.sort((a, b) => a.label.localeCompare(b.label));
            break;
        case "alpha-desc":
            items.sort((a, b) => b.label.localeCompare(a.label));
            break;
        default:
            // Mantener orden original basado en índices
            items.sort((a, b) => a.index - b.index);
            break;
    }
    
    // Reconstruir los arrays ordenados
    const sortedData = {
        indices: items.map(item => item.index),
        labels: items.map(item => item.label),
        hours: items.map(item => item.hour),
        colors: items.map(item => item.color),
        borderColors: items.map(item => item.borderColor)
    };
    
    // Añadir porcentajes si existen
    if (percentages) {
        sortedData.percentages = items.map(item => item.percentage);
    }
    
    return sortedData;
}

// Función para generar los gráficos
function updateCharts() {
    // Si no hay actividades, no hacemos nada
    if (!activities || activities.length === 0) return;
    
    // Preparar datos para gráficos
    const labels = activities.map(a => a.name);
    const hours = activities.map(a => Math.round(a.hours));
    const colors = activities.map(a => a.color);
    const borderColors = activities.map(a => getLighterColor(a.color, 20));
    
    // Calcular total de horas para porcentajes
    const totalHours = hours.reduce((sum, current) => sum + current, 0);
    const percentages = hours.map(h => ((h / totalHours) * 100).toFixed(1));
    
    // Crear objeto con todos los datos
    const chartData = {
        labels,
        hours,
        colors,
        borderColors,
        percentages
    };
    
    // Ordenar los datos según la opción seleccionada
    const sortedData = sortChartData(chartData, currentChartSort);
    
    // Actualizar gráficos con los datos ordenados
    updateBarChart(
        sortedData.labels, 
        sortedData.hours, 
        sortedData.colors, 
        sortedData.borderColors
    );
    
    updatePieChart(
        sortedData.labels, 
        sortedData.hours, 
        sortedData.colors, 
        sortedData.borderColors, 
        sortedData.percentages
    );
}

// Actualizar la tabla de actividades
function updateActivityTable() {
    const tableBody = $("#activities-table-body");
    tableBody.empty();
    
    activities.forEach(activity => {
        addActivityToList(activity);
    });
    
    // Actualizar los gráficos cuando se actualiza la tabla
    updateCharts();
}

// Añadir actividad a la lista en la UI
function addActivityToList(activity) {
    // Formatear el número de horas para mostrarlo mejor
    let hoursDisplay = activity.hours;
    
    // Si es un número grande de horas, mostrar también en años
    if (hoursDisplay > 10000) {
        const years = (hoursDisplay / (HOURS_PER_DAY * DAYS_PER_YEAR)).toFixed(1);
        hoursDisplay = Math.round(hoursDisplay).toLocaleString() + " horas (" + years + " años)";
    } else if (hoursDisplay > 1000) {
        hoursDisplay = Math.round(hoursDisplay).toLocaleString() + " horas totales";
    } else {
        hoursDisplay = activity.hours + " horas";
    }

    const row = `
        <tr data-id="${activity.id}">
            <td>${activity.name}</td>
            <td>${hoursDisplay}</td>
            <td><div class="activity-color" style="background-color: ${activity.color}"></div>${activity.color}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-edit btn-action" data-id="${activity.id}">Editar</button>
                <button class="btn btn-sm btn-danger btn-delete btn-action" data-id="${activity.id}">Eliminar</button>
            </td>
        </tr>
    `;
    $("#activities-table-body").append(row);
}

// Actualizar la leyenda de actividades
function updateActivityLegend() {
    const legendContainer = $(".weeks-legend");
    
    // Limpiar leyenda existente excepto la primera entrada (semanas vividas)
    legendContainer.find("div:not(:first-child)").remove();
    
    // Añadir leyenda para cada actividad
    activities.forEach(activity => {
        // Formatear horas para la leyenda
        let hoursDisplay = activity.hours;
        
        // Calcular semanas para esta actividad
        const weeks = Math.max(1, Math.round(activity.hours / HOURS_PER_WEEK));
        
        if (hoursDisplay > 10000) {
            const years = (hoursDisplay / (HOURS_PER_DAY * DAYS_PER_YEAR)).toFixed(1);
            hoursDisplay = Math.round(hoursDisplay).toLocaleString() + " h (" + years + " años)";
        } else if (hoursDisplay > 1000) {
            hoursDisplay = Math.round(hoursDisplay).toLocaleString() + " h totales";
        } else {
            hoursDisplay = activity.hours + " h";
        }

        const legendItem = `
            <div class="d-flex align-items-center mb-2">
                <div class="week me-2" style="background-color: ${activity.color}"></div>
                <span>${activity.name} (${hoursDisplay} = ${weeks} semanas)</span>
            </div>
        `;
        legendContainer.append(legendItem);
    });
}

// Editar una actividad
function editActivity(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
        // Guardar horas originales para restaurar si es necesario
        const originalHours = activity.hours;
        
        // Crear un modal para la edición
        const modalId = "editActivityModal";
        
        // Eliminar modal anterior si existe
        $(`#${modalId}`).remove();
        
        // Crear modal dinámicamente
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${modalId}Label">Editar Actividad</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-activity-form">
                                <div class="mb-3">
                                    <label for="edit-activity-name" class="form-label">Nombre de la actividad</label>
                                    <input type="text" class="form-control" id="edit-activity-name" value="${activity.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-activity-hours" class="form-label">Horas totales</label>
                                    <input type="number" class="form-control" id="edit-activity-hours" min="1" value="${activity.hours}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-activity-color" class="form-label">Color</label>
                                    <input type="text" class="form-control" id="edit-activity-color" value="${activity.color}">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="save-activity-edit">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir al DOM
        $("body").append(modalHTML);
        
        // Inicializar el selector de color
        $("#edit-activity-color").spectrum({
            preferredFormat: "hex",
            showInput: true,
            showPalette: true,
            palette: [
                ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3"],
                ["#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39"],
                ["#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"]
            ],
            color: activity.color
        });
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        
        // Manejar guardado
        $("#save-activity-edit").on("click", function() {
            const newName = $("#edit-activity-name").val();
            const newHours = parseInt($("#edit-activity-hours").val());
            
            if (newName && !isNaN(newHours) && newHours > 0) {
                // Verificar si hay suficientes horas disponibles
                const hoursDiff = newHours - originalHours;
                if (hoursDiff > 0 && hoursDiff > getRemainingHours()) {
                    alert("No tienes suficientes horas disponibles para este cambio. Te quedan " + Math.round(getRemainingHours()).toLocaleString() + " horas.");
                    return;
                }
                
                // Obtener color
                const newColor = $("#edit-activity-color").spectrum("get").toHexString();
                
                // Actualizar horas usadas
                usedHours = usedHours - originalHours + newHours;
                
                // Actualizar actividad
                activity.name = newName;
                activity.hours = newHours;
                activity.color = newColor;
                
                // Actualizar UI
                updateActivityTable();
                updateActivityLegend();
                updateWeeks();
                updateRemainingTime();
                
                // Cerrar modal
                modal.hide();
            } else {
                alert("Por favor, completa todos los campos correctamente.");
            }
        });
    }

    // Después de editar, guardar automáticamente si hay un tablero activo
    if (currentBoardId) {
        saveToLocalStorage();
    }
    
    // Actualizar los gráficos al editar una actividad
    updateCharts();
}

// Eliminar una actividad
function deleteActivity(activityId) {
    if (confirm("¿Estás seguro de que deseas eliminar esta actividad?")) {
        const activity = activities.find(a => a.id === activityId);
        if (activity) {
            // Actualizar horas usadas
            usedHours -= activity.hours;
        }
        
        // Eliminar la actividad
        activities = activities.filter(a => a.id !== activityId);
        
        // Actualizar UI
        updateActivityTable();
        updateActivityLegend();
        updateWeeks();
        updateRemainingTime();
    }

    // Después de eliminar, guardar automáticamente si hay un tablero activo
    if (currentBoardId) {
        saveToLocalStorage();
    }
    
    // Actualizar los gráficos al eliminar una actividad
    updateCharts();
}

// Actualizar las semanas con los colores de las actividades
function updateWeeks() {
    if (weekElements.length === 0) return;
    
    // Primero, resetear todos los colores (excepto las semanas vividas)
    weekElements.forEach(weekElement => {
        if (weekElement.hasClass("week-lived")) {
            weekElement.css("background-color", "");
        } else {
            weekElement.css("background-color", "#e0e0e0");
        }
        
        // Remover título y atributos de datos
        weekElement.attr("title", "");
        weekElement.removeAttr("data-activity-id");
        
        // Remover manejadores de eventos existentes
        weekElement.off("click");
    });
    
    // Calcular semanas vividas
    const weeksLived = currentAge * WEEKS_PER_YEAR;
    
    // Posición donde empezar a pintar (justo después de las semanas vividas)
    let currentPosition = weeksLived;
    
    // Para cada actividad, calcular el número exacto de semanas
    activities.forEach(activity => {
        // Convertir las horas a semanas, garantizando al menos 1 semana
        const weeksNeeded = Math.max(1, Math.round(activity.hours / HOURS_PER_WEEK));
        
        // Pintar el número calculado de semanas
        for (let i = 0; i < weeksNeeded && currentPosition < weekElements.length; i++) {
            weekElements[currentPosition].css("background-color", activity.color);
            
            // Añadir información en el título
            weekElements[currentPosition].attr("title", activity.name);
            
            // Añadir el ID de la actividad como atributo de datos
            weekElements[currentPosition].attr("data-activity-id", activity.id);
            
            // Añadir manejador de clic para mostrar detalles de la actividad
            weekElements[currentPosition].on("click", function() {
                showActivityDetails(activity.id);
            });
            
            // Avanzar a la siguiente posición
            currentPosition++;
        }
    });
}

// Función para mostrar detalles de una actividad al hacer clic en un cuadrado
function showActivityDetails(activityId) {
    // Buscar la actividad por ID
    const activity = activities.find(a => a.id === activityId);
    
    if (!activity) return;
    
    // Remover cualquier resaltado anterior
    $("tr.highlighted-activity").removeClass("highlighted-activity");
    
    // Resaltar la fila de la actividad en la tabla
    const activityRow = $(`tr[data-id="${activityId}"]`);
    activityRow.addClass("highlighted-activity");
    
    // Hacer scroll hacia la tabla de actividades y asegurarse de que está visible
    $("#table-tab").tab("show");
    
    // Mostrar un tooltip personalizado con información detallada
    const weeksUsed = Math.round(activity.hours / HOURS_PER_WEEK);
    const yearsUsed = (activity.hours / (HOURS_PER_DAY * DAYS_PER_YEAR)).toFixed(1);
    const percentageOfTotal = ((activity.hours / (totalRemainingHours + usedHours)) * 100).toFixed(1);
    
    // Crear un toast para mostrar la información
    const toastId = "activity-toast";
    $("#" + toastId).remove(); // Eliminar toast anterior si existe
    
    const toastHTML = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="5000">
                <div class="toast-header" style="background-color: ${activity.color}; color: white;">
                    <strong class="me-auto">${activity.name}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    <div class="mb-2">
                        <strong>Horas totales:</strong> ${Math.round(activity.hours).toLocaleString()}
                    </div>
                    <div class="mb-2">
                        <strong>Semanas:</strong> ${weeksUsed}
                    </div>
                    <div class="mb-2">
                        <strong>Años equivalentes:</strong> ${yearsUsed}
                    </div>
                    <div>
                        <strong>Porcentaje del total:</strong> ${percentageOfTotal}%
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-primary edit-from-toast" data-id="${activity.id}">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $("body").append(toastHTML);
    
    // Inicializar y mostrar el toast
    const toast = new bootstrap.Toast(document.getElementById(toastId));
    toast.show();
    
    // Manejar el botón de editar en el toast
    $(".edit-from-toast").on("click", function() {
        const id = $(this).data("id");
        editActivity(id);
    });
}

// Función para actualizar el gráfico de barras
function updateBarChart(labels, hours, colors, borderColors) {
    const ctx = document.getElementById('bar-chart').getContext('2d');
    
    // Si ya existe un gráfico de barras, destruirlo
    if (barChart) {
        barChart.destroy();
    }
    
    // Formatear números grandes (millones, miles)
    const formatter = new Intl.NumberFormat('es-ES', { 
        notation: 'compact',
        compactDisplay: 'short'
    });
    
    // Crear gráfico de barras
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas',
                data: hours,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatter.format(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const totalYears = (value / (HOURS_PER_DAY * DAYS_PER_YEAR)).toFixed(1);
                            return [
                                `${value.toLocaleString()} horas`,
                                `${totalYears} años`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Función para actualizar el gráfico circular
function updatePieChart(labels, hours, colors, borderColors, percentages) {
    const ctx = document.getElementById('pie-chart').getContext('2d');
    
    // Si ya existe un gráfico circular, destruirlo
    if (pieChart) {
        pieChart.destroy();
    }
    
    // Crear nuevas etiquetas con porcentajes
    const labelsWithPercentages = labels.map((label, i) => `${label} (${percentages[i]}%)`);
    
    // Crear gráfico circular
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labelsWithPercentages,
            datasets: [{
                data: hours,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const index = context.dataIndex;
                            return [
                                `${value.toLocaleString()} horas`,
                                `${percentages[index]}% del tiempo total`
                            ];
                        }
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 10
                    }
                }
            }
        }
    });
} 