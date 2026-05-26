// ============================================
// DATA MANAGEMENT WITH LOCAL STORAGE
// ============================================

const appData = {
    students: [
        { id: 1, name: 'Juan Pérez', class: '6A', score: 9.5, sanction: 'Ninguna', category: 'excellent', weekHistory: [8.5, 8.8, 9.2, 9.5], trend: 'up' },
        { id: 2, name: 'Diego Rodríguez', class: '7B', score: 2.1, sanction: 'Suspensión 3 días', category: 'insufficient', weekHistory: [3.0, 2.8, 2.3, 2.1], trend: 'down' },
        { id: 3, name: 'María García', class: '6A', score: 9.2, sanction: 'Ninguna', category: 'excellent', weekHistory: [8.0, 8.5, 8.9, 9.2], trend: 'up' },
        { id: 4, name: 'Laura Fernández', class: '8A', score: 3.5, sanction: 'Amonestación', category: 'warning', weekHistory: [4.2, 3.9, 3.7, 3.5], trend: 'down' },
        { id: 5, name: 'Carlos López', class: '9C', score: 8.8, sanction: 'Ninguna', category: 'good', weekHistory: [8.0, 8.2, 8.5, 8.8], trend: 'up' },
        { id: 6, name: 'Felipe Gómez', class: '7B', score: 4.0, sanction: 'Amonestación', category: 'warning', weekHistory: [4.5, 4.2, 4.1, 4.0], trend: 'down' },
        { id: 7, name: 'Sofía Torres', class: '8A', score: 4.2, sanction: 'Advertencia', category: 'warning', weekHistory: [3.8, 4.0, 4.1, 4.2], trend: 'up' },
        { id: 8, name: 'Mateo Reyes', class: '6A', score: 4.8, sanction: 'Amonestación', category: 'warning', weekHistory: [4.0, 4.3, 4.5, 4.8], trend: 'up' },
        { id: 9, name: 'Ana Martínez', class: '9C', score: 8.5, sanction: 'Ninguna', category: 'good', weekHistory: [7.5, 7.9, 8.2, 8.5], trend: 'up' },
        { id: 10, name: 'Roberto Silva', class: '7B', score: 8.3, sanction: 'Ninguna', category: 'good', weekHistory: [7.5, 7.8, 8.0, 8.3], trend: 'up' }
    ],
    decisions: [],
    measures: {},
    history: {},
    weeklyStats: {
        current: { total: 76.8, positive: 520, negative: 198, avg: 7.7 },
        previous: { total: 67.3, positive: 456, negative: 234, avg: 6.7 }
    }
};

// Load from localStorage
function loadData() {
    const saved = localStorage.getItem('myBehaviorData');
    if (saved) {
        Object.assign(appData, JSON.parse(saved));
    }
}

// Save to localStorage
function saveData() {
    localStorage.setItem('myBehaviorData', JSON.stringify(appData));
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeApp();
    loadCharts();
    updateAllStats();
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
// GRÁFICOS MEJORADOS
// ============================================

function loadCharts() {
    loadTrendChart();
    loadCategoryTrendChart();
    loadConductChart();
    loadFrequencyChart();
}

function loadTrendChart() {
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
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#2563eb',
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: true, labels: { usePointStyle: true } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, titleFont: { size: 14 } }
                },
                scales: {
                    y: { beginAtZero: true, max: 10, ticks: { stepSize: 2 } }
                }
            }
        });
    }
}

function loadCategoryTrendChart() {
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
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        borderWidth: 0
                    },
                    {
                        label: 'Conductas Negativas',
                        data: [234, 198],
                        backgroundColor: '#ef4444',
                        borderRadius: 6,
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, labels: { usePointStyle: true } }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function loadConductChart() {
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
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 15 } }
                }
            }
        });
    }
}

function loadFrequencyChart() {
    const frequencyCtx = document.getElementById('frequencyChart');
    if (frequencyCtx) {
        new Chart(frequencyCtx, {
            type: 'horizontalBar',
            data: {
                labels: ['Responsabilidad', 'Respeto', 'Colaboración', 'Impuntualidad', 'Indisciplina'],
                datasets: [{
                    label: 'Frecuencia',
                    data: [245, 312, 198, 145, 89],
                    backgroundColor: '#3b82f6',
                    borderRadius: 6,
                    borderWidth: 0
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
// ESTADÍSTICAS MEJORADAS
// ============================================

function updateAllStats() {
    updateWeeklyComparison();
    updateRiskAlerts();
}

function updateWeeklyComparison() {
    const weeklyDiv = document.getElementById('weeklyStatsDiv');
    if (!weeklyDiv) return;

    const stats = appData.weeklyStats;
    const totalChange = ((stats.current.total - stats.previous.total) / stats.previous.total * 100).toFixed(1);
    const positiveChange = stats.current.positive - stats.previous.positive;
    const negativeChange = stats.previous.negative - stats.current.negative;

    weeklyDiv.innerHTML = `
        <div class="stat-card">
            <strong>${totalChange}%</strong> Mejora general
        </div>
        <div class="stat-card">
            <strong>+${positiveChange}</strong> Conductas positivas
        </div>
        <div class="stat-card">
            <strong>-${negativeChange}</strong> Conductas negativas
        </div>
    `;
}

function updateRiskAlerts() {
    const atRisk = appData.students.filter(s => s.score < 5.0);
    const riskDiv = document.getElementById('riskAlertsDiv');
    
    if (riskDiv) {
        if (atRisk.length === 0) {
            riskDiv.innerHTML = '<p style="color: #10b981;">✅ No hay estudiantes en riesgo</p>';
        } else {
            riskDiv.innerHTML = atRisk.map(s => `
                <div style="padding: 10px; background: #fee2e2; border-left: 4px solid #ef4444; margin: 5px 0; border-radius: 4px;">
                    <strong>${s.name}</strong> - Puntuación: <span style="color: #ef4444;">${s.score}</span>
                    <button onclick="openStudentDetail('${s.name}')" style="float: right; padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Intervenir</button>
                </div>
            `).join('');
        }
    }
}

// ============================================
// TABLA DE ESTUDIANTES
// ============================================

function populateStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    appData.students.forEach(student => {
        const row = document.createElement('tr');
        const trendIcon = student.trend === 'up' ? '📈' : '📉';
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td><strong>${student.score}</strong> ${trendIcon}</td>
            <td><span class="badge ${student.category}">${getCategoryLabel(student.category)}</span></td>
            <td>${student.sanction}</td>
            <td><button class="btn-detail" onclick="openStudentDetail('${student.name}')">📊 Ver</button></td>
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
        'excellent': '⭐ Excelente',
        'good': '✅ Bueno',
        'regular': '⚠️ Regular',
        'warning': '⚠️ Alerta',
        'insufficient': '🔴 Crítico'
    };
    return map[category] || 'Regular';
}

// ============================================
// MODAL DE ESTUDIANTE MEJORADO
// ============================================

function openStudentDetail(studentName) {
    const student = appData.students.find(s => s.name === studentName);
    if (!student) return;

    const modal = document.getElementById('studentModal');
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentClass').textContent = student.class;
    document.getElementById('studentScore').innerHTML = `<strong>${student.score}</strong>/10`;
    document.getElementById('studentCategory').innerHTML = `<span class="badge ${student.category}">${getCategoryLabel(student.category)}</span>`;
    document.getElementById('studentSanction').textContent = student.sanction || 'Ninguna';

    // Initialize simulator
    resetSimulator(student);

    // Load student history
    loadStudentHistory(student.id);
    loadStudentMeasures(student.id);
    loadStudentChart(student);

    // Switch to profile tab
    switchTab('profile');

    modal.classList.add('active');
    
    // Store current student for updates
    window.currentStudent = student;
}

function closeStudentDetail() {
    document.getElementById('studentModal').classList.remove('active');
    window.currentStudent = null;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function resetSimulator(student) {
    document.getElementById('simCurrent').textContent = student.score;
    updateSimulator(student.score);
}

function loadStudentChart(student) {
    const canvas = document.getElementById('studentScoreChart');
    if (!canvas) return;

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
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 2
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
    if (!historyDiv) return;
    
    historyDiv.innerHTML = `
        <div class="history-item">
            <span class="date">2026-05-25</span>
            <span class="type positiva">✅ Positiva</span>
            <p><strong>Responsabilidad:</strong> Cumplió con tarea de investigación</p>
        </div>
        <div class="history-item">
            <span class="date">2026-05-24</span>
            <span class="type negativa">❌ Negativa</span>
            <p><strong>Indisciplina:</strong> No siguió instrucciones en clase</p>
        </div>
        <div class="history-item">
            <span class="date">2026-05-23</span>
            <span class="type positiva">✅ Positiva</span>
            <p><strong>Colaboración:</strong> Ayudó a compañero en proyecto</p>
        </div>
        <div class="history-item">
            <span class="date">2026-05-22</span>
            <span class="type positiva">✅ Positiva</span>
            <p><strong>Respeto:</strong> Buen comportamiento durante presentación</p>
        </div>
    `;
}

function loadStudentMeasures(studentId) {
    const measuresDiv = document.getElementById('measuresHistory');
    if (!measuresDiv) return;
    
    measuresDiv.innerHTML = `
        <div class="measure-item">
            <span class="date">2026-05-20</span>
            <span class="type">💬 Diálogo</span>
            <p><strong>Medida:</strong> Conversación sobre importancia de puntualidad</p>
        </div>
    `;
}

// ============================================
// SIMULADOR EN TIEMPO REAL
// ============================================

function addMeasure(event) {
    event.preventDefault();

    const type = document.getElementById('measureType').value;
    const reason = document.getElementById('measureReason').value;
    const studentName = document.getElementById('studentName').textContent;

    if (!type || !reason) {
        alert('⚠️ Por favor completa todos los campos');
        return;
    }

    const student = appData.students.find(s => s.name === studentName);
    if (!student) return;

    // Calculate impact
    const scoreImpact = calculateScoreImpact(type);
    const newScore = Math.max(0, Math.min(10, student.score + scoreImpact));

    // Update student
    student.score = newScore;
    student.category = calculateNewCategory(newScore);
    student.sanction = calculateSanction(newScore);
    student.trend = scoreImpact > 0 ? 'up' : 'down';

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

    // Save data
    saveData();

    // Show success message
    showNotification(`✅ Medida aplicada a ${studentName}. Nueva puntuación: ${newScore.toFixed(1)}`);

    // Update everything
    populateStudentsTable();
    updateAllStats();
    
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
// ACTUALIZAR SIMULADOR EN TIEMPO REAL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const measureType = document.getElementById('measureType');
    if (measureType) {
        measureType.addEventListener('change', () => {
            const currentScore = parseFloat(document.getElementById('simCurrent').textContent);
            updateSimulator(currentScore);
        });
    }
});

function updateSimulator(currentScore) {
    const type = document.getElementById('measureType').value;
    if (!type) return;

    const impact = calculateScoreImpact(type);
    const newScore = Math.max(0, Math.min(10, currentScore + impact));

    document.getElementById('simProjected').textContent = newScore.toFixed(1);
    document.getElementById('simCategory').textContent = getCategoryLabel(calculateNewCategory(newScore));
    document.getElementById('simSanction').textContent = calculateSanction(newScore);

    // Probability based on impact
    const probability = impact > 0 ? '📈 70%' : (impact < 0 ? '📉 20%' : '➡️ 50%');
    document.getElementById('simProbability').textContent = probability;

    // Color the projected score
    const projElement = document.getElementById('simProjected');
    if (newScore > currentScore) {
        projElement.style.color = '#10b981';
    } else if (newScore < currentScore) {
        projElement.style.color = '#ef4444';
    } else {
        projElement.style.color = '#2563eb';
    }
}

// ============================================
// DECISIONES MEJORADAS
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
        alert('⚠️ Por favor completa todos los campos');
        return;
    }

    const decision = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-ES'),
        summary: summary,
        type: type,
        affected: affected,
        author: 'Director/a'
    };

    appData.decisions.push(decision);
    saveData();

    showNotification('✅ Decisión registrada correctamente');
    loadDecisions();
    document.getElementById('decisionForm').reset();
}

function loadDecisions() {
    const container = document.getElementById('decisionsContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (appData.decisions.length === 0) {
        container.innerHTML = '<p class="text-muted">📋 No hay decisiones registradas aún.</p>';
        return;
    }

    // Show latest decisions first
    [...appData.decisions].reverse().forEach(decision => {
        const div = document.createElement('div');
        div.className = 'decision-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <span class="date">${decision.date} ${decision.time}</span>
                    <span class="type">${decision.type}</span>
                    <p><strong>${decision.summary}</strong></p>
                    <p class="text-muted">👥 Afectados: ${decision.affected}</p>
                    <p class="text-muted">👤 ${decision.author}</p>
                </div>
                <button onclick="deleteDecision(${decision.id})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function deleteDecision(id) {
    if (confirm('¿Eliminar esta decisión?')) {
        appData.decisions = appData.decisions.filter(d => d.id !== id);
        saveData();
        loadDecisions();
        showNotification('✅ Decisión eliminada');
    }
}

// ============================================
// FILTRADO DE ESTUDIANTES
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
    if (!tbody) return;

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
// NOTIFICACIONES
// ============================================

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
