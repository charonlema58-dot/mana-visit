// Données initiales
let visitors = [
    {
        id: 1,
        fullName: "Jean Kabasele",
        type: "adult",
        nationality: "Congolais",
        visitDate: "2023-05-15",
        arrivalTime: "09:30",
        phone: "+243810000000",
        email: "jean@example.com",
        comments: "Visite en famille",
        ticketPrice: 10
    },
    {
        id: 2,
        fullName: "Marie Mbuji",
        type: "child",
        nationality: "Congolais",
        visitDate: "2023-05-15",
        arrivalTime: "10:15",
        phone: "+243820000000",
        ticketPrice: 5
    },
    {
        id: 3,
        fullName: "École Les Petits Génies",
        type: "group",
        nationality: "Congolais",
        visitDate: "2023-05-14",
        arrivalTime: "11:00",
        phone: "+243830000000",
        comments: "Groupe scolaire de 25 élèves",
        ticketPrice: 200
    }
];

let ticketPrices = {
    adult: 10,
    child: 5,
    student: 7,
    group: 8
};

// Éléments DOM
const sections = {
    dashboard: document.getElementById("dashboard"),
    visitors: document.getElementById("visitors"),
    tickets: document.getElementById("tickets"),
    reports: document.getElementById("reports")
};

const navLinks = {
    dashboard: document.getElementById("dashboard-link"),
    visitors: document.getElementById("visitors-link"),
    tickets: document.getElementById("tickets-link"),
    reports: document.getElementById("reports-link")
};

const modals = {
    visitor: document.getElementById("visitor-modal"),
    price: document.getElementById("price-modal")
};

const closeButtons = document.querySelectorAll(".close-btn");

// Initialisation
document.addEventListener("DOMContentLoaded", function() {
    // Navigation
    setupNavigation();
    
    // Tableau de bord
    updateDashboard();
    
    // Gestion des visiteurs
    setupVisitorSection();
    
    // Gestion des billets
    setupTicketSection();
    
    // Rapports
    setupReportsSection();
    
    // Modals
    setupModals();
    
    // Afficher la section dashboard par défaut
    showSection('dashboard');
});

// Navigation
function setupNavigation() {
    for (const [sectionName, link] of Object.entries(navLinks)) {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            showSection(sectionName);
        });
    }
}

function showSection(sectionName) {
    // Masquer toutes les sections
    for (const section of Object.values(sections)) {
        section.classList.remove("active");
    }
    
    // Afficher la section demandée
    sections[sectionName].classList.add("active");
    
    // Mettre à jour la navigation active
    for (const link of Object.values(navLinks)) {
        link.classList.remove("active");
    }
    navLinks[sectionName].classList.add("active");
}

// Tableau de bord
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getMonth() + 1;
    const thisYear = new Date().getFullYear();
    
    // Visiteurs aujourd'hui
    const todayVisitors = visitors.filter(v => v.visitDate === today).length;
    document.getElementById("today-visitors").textContent = todayVisitors;
    
    // Visiteurs ce mois-ci
    const monthVisitors = visitors.filter(v => {
        const visitDate = new Date(v.visitDate);
        return visitDate.getMonth() + 1 === thisMonth && visitDate.getFullYear() === thisYear;
    }).length;
    document.getElementById("month-visitors").textContent = monthVisitors;
    
    // Recettes aujourd'hui
    const todayRevenue = visitors.filter(v => v.visitDate === today)
        .reduce((sum, visitor) => sum + visitor.ticketPrice, 0);
    document.getElementById("today-revenue").textContent = `$${todayRevenue}`;
    
    // Visiteurs récents
    const recentVisitorsTable = document.getElementById("recent-visitors-table").getElementsByTagName('tbody')[0];
    recentVisitorsTable.innerHTML = '';
    
    const recentVisitors = [...visitors].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)).slice(0, 5);
    
    recentVisitors.forEach(visitor => {
        const row = recentVisitorsTable.insertRow();
        row.insertCell(0).textContent = visitor.id;
        row.insertCell(1).textContent = visitor.fullName;
        row.insertCell(2).textContent = getVisitorTypeLabel(visitor.type);
        row.insertCell(3).textContent = visitor.arrivalTime || 'N/A';
        row.insertCell(4).textContent = `$${visitor.ticketPrice}`;
    });
}

// Gestion des visiteurs
function setupVisitorSection() {
    const addVisitorBtn = document.getElementById("add-visitor-btn");
    const visitorForm = document.getElementById("visitor-form");
    const searchBtn = document.getElementById("search-btn");
    
    addVisitorBtn.addEventListener("click", () => openVisitorModal());
    visitorForm.addEventListener("submit", handleVisitorFormSubmit);
    searchBtn.addEventListener("click", searchVisitors);
    
    updateVisitorsTable();
}

function updateVisitorsTable(filteredVisitors = null) {
    const visitorsTable = document.getElementById("visitors-table").getElementsByTagName('tbody')[0];
    visitorsTable.innerHTML = '';
    
    const visitorsToDisplay = filteredVisitors || visitors;
    
    visitorsToDisplay.forEach(visitor => {
        const row = visitorsTable.insertRow();
        row.insertCell(0).textContent = visitor.id;
        row.insertCell(1).textContent = visitor.fullName;
        row.insertCell(2).textContent = getVisitorTypeLabel(visitor.type);
        row.insertCell(3).textContent = visitor.nationality;
        row.insertCell(4).textContent = formatDate(visitor.visitDate);
        
        const actionsCell = row.insertCell(5);
        
        const editBtn = document.createElement("button");
        editBtn.textContent = "Modifier";
        editBtn.className = "edit-btn";
        editBtn.addEventListener("click", () => openVisitorModal(visitor));
        
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Supprimer";
        deleteBtn.className = "delete-btn";
        deleteBtn.addEventListener("click", () => deleteVisitor(visitor.id));
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

function openVisitorModal(visitor = null) {
    const modal = modals.visitor;
    const form = document.getElementById("visitor-form");
    const title = document.getElementById("modal-title");
    
    if (visitor) {
        // Mode édition
        title.textContent = "Modifier Visiteur";
        document.getElementById("visitor-id").value = visitor.id;
        document.getElementById("full-name").value = visitor.fullName;
        document.getElementById("visitor-type").value = visitor.type;
        document.getElementById("nationality").value = visitor.nationality;
        document.getElementById("visit-date").value = visitor.visitDate;
        document.getElementById("phone").value = visitor.phone || '';
        document.getElementById("email").value = visitor.email || '';
        document.getElementById("comments").value = visitor.comments || '';
    } else {
        // Mode création
        title.textContent = "Ajouter un Nouveau Visiteur";
        form.reset();
        document.getElementById("visit-date").value = new Date().toISOString().split('T')[0];
    }
    
    modal.style.display = "block";
}

function handleVisitorFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const visitorId = form.querySelector("#visitor-id").value;
    const isEditMode = !!visitorId;
    
    const visitorData = {
        fullName: form.querySelector("#full-name").value,
        type: form.querySelector("#visitor-type").value,
        nationality: form.querySelector("#nationality").value,
        visitDate: form.querySelector("#visit-date").value,
        phone: form.querySelector("#phone").value || undefined,
        email: form.querySelector("#email").value || undefined,
        comments: form.querySelector("#comments").value || undefined,
        arrivalTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        ticketPrice: calculateTicketPrice(
            form.querySelector("#visitor-type").value,
            form.querySelector("#visitor-type").value === 'group' ? 1 : 0
        )
    };
    
    if (isEditMode) {
        // Mise à jour du visiteur existant
        const index = visitors.findIndex(v => v.id == visitorId);
        if (index !== -1) {
            visitors[index] = { ...visitors[index], ...visitorData };
        }
    } else {
        // Création d'un nouveau visiteur
        const newId = visitors.length > 0 ? Math.max(...visitors.map(v => v.id)) + 1 : 1;
        visitorData.id = newId;
        visitors.push(visitorData);
    }
    
    modals.visitor.style.display = "none";
    updateVisitorsTable();
    updateDashboard();
}

function deleteVisitor(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce visiteur ?")) {
        visitors = visitors.filter(v => v.id !== id);
        updateVisitorsTable();
        updateDashboard();
    }
}

function searchVisitors() {
    const searchTerm = document.getElementById("visitor-search").value.toLowerCase();
    
    if (!searchTerm) {
        updateVisitorsTable();
        return;
    }
    
    const filteredVisitors = visitors.filter(v => 
        v.fullName.toLowerCase().includes(searchTerm) || 
        (v.phone && v.phone.includes(searchTerm)) ||
        (v.email && v.email.toLowerCase().includes(searchTerm))
    );
    
    updateVisitorsTable(filteredVisitors);
}

// Gestion des billets
function setupTicketSection() {
    // Mettre à jour les prix affichés
    updateTicketPricesDisplay();
    
    // Configurer les boutons de modification de prix
    const editPriceBtns = document.querySelectorAll(".edit-price-btn");
    editPriceBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const ticketType = e.target.getAttribute("data-type");
            openPriceModal(ticketType);
        });
    });
    
    // Configurer le formulaire de modification de prix
    document.getElementById("price-form").addEventListener("submit", handlePriceFormSubmit);
    
    // Initialiser le graphique
    initTicketSalesChart();
}

function updateTicketPricesDisplay() {
    document.getElementById("adult-price").textContent = ticketPrices.adult;
    document.getElementById("child-price").textContent = ticketPrices.child;
    document.getElementById("student-price").textContent = ticketPrices.student;
    document.getElementById("group-price").textContent = ticketPrices.group;
}

function openPriceModal(ticketType) {
    const modal = modals.price;
    document.getElementById("ticket-type").value = ticketType;
    document.getElementById("new-price").value = ticketPrices[ticketType];
    modal.style.display = "block";
}

function handlePriceFormSubmit(e) {
    e.preventDefault();
    
    const ticketType = document.getElementById("ticket-type").value;
    const newPrice = parseFloat(document.getElementById("new-price").value);
    
    ticketPrices[ticketType] = newPrice;
    modals.price.style.display = "none";
    updateTicketPricesDisplay();
}

function calculateTicketPrice(type, groupSize = 0) {
    if (type === 'group' && groupSize > 0) {
        return ticketPrices.group * groupSize;
    }
    return ticketPrices[type];
}

function initTicketSalesChart() {
    const ctx = document.getElementById('ticket-sales-chart').getContext('2d');
    
    // Données factices pour la démonstration
    const ticketTypes = ['Adulte', 'Enfant', 'Étudiant', 'Groupe'];
    const salesData = [45, 30, 20, 15];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ticketTypes,
            datasets: [{
                label: 'Ventes ce mois-ci',
                data: salesData,
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(155, 89, 182, 0.7)',
                    'rgba(26, 188, 156, 0.7)',
                    'rgba(241, 196, 15, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(155, 89, 182, 1)',
                    'rgba(26, 188, 156, 1)',
                    'rgba(241, 196, 15, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Rapports
function setupReportsSection() {
    const reportTypeSelect = document.getElementById("report-type");
    const generateReportBtn = document.getElementById("generate-report-btn");
    
    reportTypeSelect.addEventListener("change", (e) => {
        const customDateRange = document.getElementById("custom-date-range");
        if (e.target.value === 'custom') {
            customDateRange.classList.remove("hidden");
        } else {
            customDateRange.classList.add("hidden");
        }
    });
    
    generateReportBtn.addEventListener("click", generateReport);
}

function generateReport() {
    const reportType = document.getElementById("report-type").value;
    let startDate, endDate;
    
    // Déterminer la période du rapport
    const today = new Date();
    
    switch (reportType) {
        case 'daily':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
        case 'weekly':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6); // 7 jours incluant aujourd'hui
            endDate = new Date(today);
            break;
        case 'monthly':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'yearly':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
            break;
        case 'custom':
            startDate = new Date(document.getElementById("start-date").value);
            endDate = new Date(document.getElementById("end-date").value);
            break;
    }
    
    // Filtrer les visiteurs dans la période
    const filteredVisitors = visitors.filter(v => {
        const visitDate = new Date(v.visitDate);
        return visitDate >= startDate && visitDate <= endDate;
    });
    
    // Calculer les statistiques
    const totalVisitors = filteredVisitors.length;
    const totalRevenue = filteredVisitors.reduce((sum, v) => sum + v.ticketPrice, 0);
    
    const visitorsByType = {
        adult: filteredVisitors.filter(v => v.type === 'adult').length,
        child: filteredVisitors.filter(v => v.type === 'child').length,
        student: filteredVisitors.filter(v => v.type === 'student').length,
        group: filteredVisitors.filter(v => v.type === 'group').length
    };
    
    // Afficher le résumé
    const reportSummary = document.getElementById("report-summary");
    reportSummary.innerHTML = `
        <h3>Résumé du Rapport</h3>
        <p>Période: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
        <div class="report-stats">
            <div class="report-stat">
                <h4>Total Visiteurs</h4>
                <p>${totalVisitors}</p>
            </div>
            <div class="report-stat">
                <h4>Total Recettes</h4>
                <p>$${totalRevenue}</p>
            </div>
        </div>
        <div class="visitors-by-type">
            <h4>Visiteurs par Type</h4>
            <ul>
                <li>Adultes: ${visitorsByType.adult}</li>
                <li>Enfants: ${visitorsByType.child}</li>
                <li>Étudiants: ${visitorsByType.student}</li>
                <li>Groupes: ${visitorsByType.group}</li>
            </ul>
        </div>
    `;
    
    // Afficher les détails
    const reportDetails = document.getElementById("report-details");
    reportDetails.innerHTML = `
        <h3>Détails des Visiteurs</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Prix</th>
                </tr>
            </thead>
            <tbody>
                ${filteredVisitors.map(v => `
                    <tr>
                        <td>${v.id}</td>
                        <td>${v.fullName}</td>
                        <td>${getVisitorTypeLabel(v.type)}</td>
                        <td>${formatDate(v.visitDate)}</td>
                        <td>$${v.ticketPrice}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Afficher le bouton d'export
    document.getElementById("export-report-btn").classList.remove("hidden");
}

// Utilitaires
function setupModals() {
    // Fermer les modals en cliquant sur le bouton de fermeture
    closeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            for (const modal of Object.values(modals)) {
                modal.style.display = "none";
            }
        });
    });
    
    // Fermer les modals en cliquant à l'extérieur
    window.addEventListener("click", (e) => {
        for (const modal of Object.values(modals)) {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        }
    });
}

function getVisitorTypeLabel(type) {
    const labels = {
        adult: "Adulte",
        child: "Enfant",
        student: "Étudiant",
        group: "Groupe"
    };
    return labels[type] || type;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}