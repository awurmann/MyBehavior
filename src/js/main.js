// ============================================
// DATA MANAGEMENT
// ============================================

// Sample data structure
const appData = {
    students: [
        { id: 1, name: 'Juan Pérez', class: '6A', score: 9.5, sanction: 'Ninguna', category: 'excellent' },
        { id: 2, name: 'Diego Rodríguez', class: '7B', score: 2.1, sanction: 'Suspensión 3 días', category: 'insufficient' },
        { id: 3, name: 'María García', class: '6A', score: 9.2, sanction: 'Ninguna', category: 'excellent' },
        { id: 4, name: 'Laura Fernández', class: '8A', score: 3.5, sanction: 'Amonestación', category: 'warning' },
        { id: 5, name: 'Carlos López', class: '9C', score: 8.8, sanction: 'Ninguna', category: 'good' },
        { id: 6, name: 'Felipe Gómez', class: '7B', score: 4.0, sanction: 'Amonestación', category: 'warning' },
        { id: 7, name: 'Sofía Torres', class: '8A', score: 4.2, sanction: 'Advertencia', category: 'warning' },
        { id: 8, name: 'Mateo Reyes', class: '6A', score: 4.8, sanction: 'Amonestación', category: 'warning' },
        { id: 9, name: 'Ana Martínez', class: '9C', score: 8.5, sanction: 'Ninguna', category: 'good' },
        { id: 10, name: 'Roberto Silva', class: '7B', score: 8.3, sanction: 'Ninguna', category: 'good' }
    ],
    decisions: [],
    measures: {},
    history: {}
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadCharts();
});

function initializeApp() {
    setupNavigation();
    populateStudentsTable();
    initializeDecisions();
}

// ============================================
// NAVEGACIÓN
// ============================================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            switchSection(sectionId);
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// ============================================
// GRÁFICOS
// ============================================

function loadCharts() {
    // Trend Chart
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                datasets: [
                    {
                        label: 'Promedio General',
                        data: [6.8, 6.9, 7.0, 7.2],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointBackgroundColor: '#2563eb'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: { beginAtZero: true, max: 10 }
                }
            }
        });
    }

    // Category Trend Chart
    const categoryTrendCtx = document.getElementById('categoryTrendChart');
    if (categoryTrendCtx) {
        new Chart(categoryTrendCtx, {
            type: 'bar',
            data: {
                labels: ['Sem Anterior', 'Sem Actual'],
                datasets: [
                    {
                        label: 'Conductas Positivas',
                        data: [456, 520],
                        backgroundColor: '#10b981'
                    },
                    {
                        label: 'Conductas Negativas',
                        data: [234, 198],
                        backgroundColor: '#ef4444'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Conduct Distribution Chart
    const conductCtx = document.getElementById('conductChart');
    if (conductCtx) {
        new Chart(conductCtx, {
            type: 'doughnut',
            data: {
                labels: ['Excelente', 'Bueno', 'Regular', 'Insuficiente'],
                datasets: [{
                    data: [32, 58, 38, 17],
                    backgroundColor: [
                        '#10b981',
                        '#3b82f6',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Frequency Chart
    const frequencyCtx = document.getElementById('frequencyChart');
    if (frequencyCtx) {
        new Chart(frequencyCtx, {
            type: 'horizontalBar',
            data: {
                labels: ['Responsabilidad', 'Respeto', 'Colaboración', 'Impuntualidad', 'Indisciplina'],
                datasets: [{
                    label: 'Frecuencia',
                    data: [245, 312, 198, 145, 89],
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    }
}

// ============================================
// TABLA DE ESTUDIANTES
// ============================================

function populateStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';

    appData.students.forEach(student => {
        const categoryClass = getCategoryClass(student.category);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td><strong>${student.score}</strong></td>
            <td><span class="badge ${student.category}">${getCategoryLabel(student.category)}</span></td>
            <td>${student.sanction}</td>
            <td><button class="btn-detail" onclick="openStudentDetail('${student.name}')">Detalle</button></td>
        `;
        tbody.appendChild(row);
    });
}

function getCategoryClass(category) {
    const map = {
        'excellent': 'excellent',
        'good': 'good',
        'regular': 'regular',
        'warning': 'warning',
        'insufficient': 'danger'
    };
    return map[category] || 'regular';
}

function getCategoryLabel(category) {
    const map = {
        'excellent': 'Excelente',
        'good': 'Bueno',
        'regular': 'Regular',
        'warning': 'Alerta',
        'insufficient': 'Crítico'
    };
    return map[category] || 'Regular';
}

// ============================================
// MODAL DE ESTUDIANTE
// ============================================

function openStudentDetail(studentName) {
    const student = appData.students.find(s => s.name === studentName);
    if (!student) return;

    const modal = document.getElementById('studentModal');
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentClass').textContent = student.class;
    document.getElementById('studentScore').innerHTML = `<strong>${student.score}</strong>/10`;
    document.getElementById('studentCategory').innerHTML = `<span class="badge ${student.category}">${getCategoryLabel(student.category)}</span>`;
    document.getElementById('studentSanction').textContent = student.sanction;

    // Populate simulate fields
    document.getElementById('simCurrent').textContent = student.score;
    document.getElementById('simProjected').textContent = (student.score - 1.5).toFixed(1);
    document.getElementById('simCategory').textContent = getCategoryLabel(calculateNewCategory(student.score - 1.5));
    document.getElementById('simSanction').textContent = calculateSanction(student.score - 1.5);
    document.getElementById('simProbability').textContent = '45%';

    // Load student history
    loadStudentHistory(student.id);
    loadStudentMeasures(student.id);
    loadStudentChart(student);

    // Switch to profile tab
    switchTab('profile');

    modal.classList.add('active');
}

function closeStudentDetail() {
    document.getElementById('studentModal').classList.remove('active');
}

function switchTab(tabName) {
    // Remove active from all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Add active to selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function loadStudentChart(student) {
    const canvas = document.getElementById('studentScoreChart');
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (canvas.chart) canvas.chart.destroy();

    const ctx = canvas.getContext('2d');
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
            datasets: [{
                label: 'Puntuación',
                data: [
                    student.score - 2,
                    student.score - 1.5,
                    student.score - 1,
                    student.score - 0.5,
                    student.score,
                    student.score,
                    student.score - 0.2,
                    student.score
                ],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true, max: 10 } }
        }
    });
}

function loadStudentHistory(studentId) {
    const historyDiv = document.getElementById('conductHistory');
    historyDiv.innerHTML = `
        <div class="history-item">
            <span class="date">2026-05-25</span>
            <span class="type">Positiva</span>
            <p><strong>Responsabilidad:</strong> Cumplió con tarea de investigación</p>
        </div>
        <div class="history-item">
            <span class="date">2026-05-24</span>
            <span class="type">Negativa</span>
            <p><strong>Indisciplina:</strong> No siguió instrucciones en clase</p>
        </div>
        <div class="history-item">
            <span class="date">2026-05-23</span>
            <span class="type">Positiva</span>
            <p><strong>Colaboración:</strong> Ayudó a compañero en proyecto</p>
        </div>
        <div class="history-item">
            <span class="date">2026-05-22</span>
            <span class="type">Positiva</span>
            <p><strong>Respeto:</strong> Buen comportamiento durante presentación</p>
        </div>
    `;
}

function loadStudentMeasures(studentId) {
    const measuresDiv = document.getElementById('measuresHistory');
    measuresDiv.innerHTML = `
        <div class="measure-item">
            <span class="date">2026-05-20</span>
            <span class="type">Diálogo</span>
            <p><strong>Medida:</strong> Conversación sobre importancia de puntualidad</p>
        </div>
    `;
}

// ============================================
// AGREGAR MEDIDA
// ============================================

function addMeasure(event) {
    event.preventDefault();

    const type = document.getElementById('measureType').value;
    const reason = document.getElementById('measureReason').value;
    const studentName = document.getElementById('studentName').textContent;

    if (!type || !reason) {
        alert('Por favor completa todos los campos');
        return;
    }

    // Get current score
    const student = appData.students.find(s => s.name === studentName);
    if (!student) return;

    // Calculate impact
    const scoreImpact = calculateScoreImpact(type);
    const newScore = Math.max(0, Math.min(10, student.score + scoreImpact));

    // Update student
    student.score = newScore;
    student.category = calculateNewCategory(newScore);
    student.sanction = calculateSanction(newScore);

    // Record measure
    const measure = {
        date: new Date().toISOString().split('T')[0],
        type: type,
        reason: reason,
        impact: scoreImpact,
        newScore: newScore
    };

    if (!appData.measures[studentName]) appData.measures[studentName] = [];
    appData.measures[studentName].push(measure);

    alert('✅ Medida aplicada correctamente');
    
    // Reload table
    populateStudentsTable();
    
    // Close modal
    closeStudentDetail();
    
    // Reset form
    document.getElementById('measureForm').reset();
}

function calculateScoreImpact(type) {
    const impacts = {
        'talk': 0.3,
        'alert': -0.5,
        'suspension': -1.0,
        'suspension3': -2.0,
        'work': 0.7,
        'parent': -1.5,
        'other': 0
    };
    return impacts[type] || 0;
}

function calculateNewCategory(score) {
    if (score >= 8.5) return 'excellent';
    if (score >= 7.0) return 'good';
    if (score >= 5.0) return 'regular';
    if (score >= 3.0) return 'warning';
    return 'insufficient';
}

function calculateSanction(score) {
    if (score >= 8.5) return 'Ninguna';
    if (score >= 7.0) return 'Ninguna';
    if (score >= 5.0) return 'Advertencia';
    if (score >= 3.0) return 'Amonestación';
    return 'Suspensión 3 días';
}

// ============================================
// DECISIONES
// ============================================

function initializeDecisions() {
    loadDecisions();
}

function addDecision(event) {
    event.preventDefault();

    const summary = document.getElementById('decisionSummary').value;
    const type = document.getElementById('decisionType').value;
    const affected = document.getElementById('decisionAffected').value;

    if (!summary || !type || !affected) {
        alert('Por favor completa todos los campos');
        return;
    }

    const decision = {
        date: new Date().toISOString().split('T')[0],
        summary: summary,
        type: type,
        affected: affected
    };

    appData.decisions.push(decision);

    alert('✅ Decisión registrada correctamente');
    loadDecisions();
    document.getElementById('decisionForm').reset();
}

function loadDecisions() {
    const container = document.getElementById('decisionsContainer');
    container.innerHTML = '';

    if (appData.decisions.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay decisiones registradas aún.</p>';
        return;
    }

    appData.decisions.forEach(decision => {
        const div = document.createElement('div');
        div.className = 'decision-item';
        div.innerHTML = `
            <span class="date">${decision.date}</span>
            <span class="type">${decision.type}</span>
            <p><strong>${decision.summary}</strong></p>
            <p class="text-muted">Afectados: ${decision.affected}</p>
        `;
        container.appendChild(div);
    });
}

// ============================================
// FILTRADO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchStudent');
    const filterClass = document.getElementById('filterClass');

    if (searchInput) {
        searchInput.addEventListener('keyup', filterStudents);
    }

    if (filterClass) {
        filterClass.addEventListener('change', filterStudents);
    }
});

function filterStudents() {
    const search = document.getElementById('searchStudent')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('filterClass')?.value || '';
    const tbody = document.getElementById('studentsTableBody');

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const className = row.cells[1].textContent;

        const matchesSearch = name.includes(search);
        const matchesClass = !classFilter || className === classFilter;

        row.style.display = matchesSearch && matchesClass ? '' : 'none';
    });
}

// ============================================
// ACTUALIZAR SIMULADOR EN TIEMPO REAL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const measureType = document.getElementById('measureType');
    if (measureType) {
        measureType.addEventListener('change', updateSimulator);
    }
});

function updateSimulator() {
    const currentScore = parseFloat(document.getElementById('simCurrent').textContent);
    const type = document.getElementById('measureType').value;

    const impact = calculateScoreImpact(type);
    const newScore = Math.max(0, Math.min(10, currentScore + impact));

    document.getElementById('simProjected').textContent = newScore.toFixed(1);
    document.getElementById('simCategory').textContent = getCategoryLabel(calculateNewCategory(newScore));
    document.getElementById('simSanction').textContent = calculateSanction(newScore);

    // Calculate probability of improvement
    const probability = impact > 0 ? '70%' : (impact < 0 ? '20%' : '50%');
    document.getElementById('simProbability').textContent = probability;
}
