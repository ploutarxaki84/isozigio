/* =========================================================
   STORAGE & INITIALIZATION
========================================================= */
const STORAGE_KEY = "BUDGET_DATA_FINAL_12";
const BACKUP_KEY = "BUDGET_BACKUP_12";

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadBackup() {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
}

function saveBackup(backupData) {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
}

let entries = loadData();
let selectedEntries = new Set();
let changeCounter = 0;

/* =========================================================
   IRIS → ΜΕΤΑΦΟΡΑ AUTO-CONVERSION
========================================================= */
function convertIrisToMetaphora() {
    let converted = 0;
    
    entries.forEach(entry => {
        if (entry.category === "IRIS") {
            entry.category = "ΜΕΤΑΦΟΡΑ";
            converted++;
        }
    });
    
    if (converted > 0) {
        saveData(entries);
        console.log(`✅ Μετατρέψαμε ${converted} εγγραφές IRIS → ΜΕΤΑΦΟΡΑ`);
        
        showTimedNotification({
            title: 'ΑΥΤΟΜΑΤΗ ΜΕΤΑΤΡΟΠΗ',
            count: converted,
            timestamp: new Date().toLocaleString('el-GR')
        }, 3000);
    }
}

convertIrisToMetaphora();

/* =========================================================
   CATEGORY ICONS
========================================================= */
function getCategoryIcon(category) {
    const icons = {
        'ΕΝΟΙΚΙΟ': '🏠',
        'ΔΕΗ': '⚡',
        'ΕΥΔΑΠ': '💧',
        'NOVA': '🌐',
        'ΨΩΝΙΑ': '🛒',
        'ΨΥΧΑΓΩΓΙΑ': '🎭',
        'ΑΛΛΑ': '📝',
        'ΜΙΣΘΟΣ': '💼',
        'ΕΠΙΔΟΜΑ': '💰',
        'ΜΕΤΑΦΟΡΑ': '🔄'
    };
    return icons[category] || '📋';
}

/* =========================================================
   BACKUP SYSTEM
========================================================= */
let activeNotification = null;

function showTimedNotification(message, duration = 5000) {
    const notification = document.getElementById('backupNotification');
    const backupCount = document.getElementById('backupCount');
    const backupTimestamp = document.getElementById('backupTimestamp');
    const header = document.querySelector('.backup-notification-header span');
    
    if (!notification) return;
    
    if (message.count !== undefined) backupCount.textContent = message.count;
    if (message.timestamp !== undefined) backupTimestamp.textContent = message.timestamp;
    if (message.title !== undefined) header.textContent = message.title;
    
    if (activeNotification) {
        clearTimeout(activeNotification);
    }
    
    notification.style.display = 'block';
    
    activeNotification = setTimeout(() => {
        notification.style.display = 'none';
        activeNotification = null;
    }, duration);
}

function createBackup() {
    const backup = {
        timestamp: new Date().toISOString(),
        timestampLocal: new Date().toLocaleString('el-GR'),
        entries: JSON.parse(JSON.stringify(entries)),
        count: entries.length
    };
    
    saveBackup(backup);
    showBackupNotification(backup);
    
    return backup;
}

function showBackupNotification(backup) {
    showTimedNotification({
        title: 'ΑΠΟΘΗΚΕΥΣΗ ΟΛΟΚΛΗΡΩΘΗΚΗ',
        count: backup.count,
        timestamp: backup.timestampLocal
    }, 5000);
}

// Auto-backup κάθε 5η αλλαγή
function autoBackupCheck() {
    changeCounter++;
    if (changeCounter % 5 === 0 && entries.length > 0) {
        createBackup();
        console.log(`📦 Auto-backup created (change #${changeCounter})`);
    }
}

/* =========================================================
   CLICK FEEDBACK
========================================================= */
function addClickFeedback(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    btn.addEventListener('click', function() {
        this.classList.add('clicked');
        setTimeout(() => {
            this.classList.remove('clicked');
        }, 300);
    });
}

/* =========================================================
   ΚΛΕΙΔΩΜΑ ΣΥΝΕΙΣΦΟΡΑΣ ΓΙΑ ΕΣΟΔΑ
========================================================= */
function lockContributionForIncome() {
    const typeSelect = document.getElementById('entryType');
    const contributionSelect = document.getElementById('entryContribution');
    const message = document.getElementById('incomeLockMessage');
    
    if (typeSelect.value === 'ΕΣΟΔΑ') {
        contributionSelect.value = 'ΟΧΙ';
        contributionSelect.disabled = true;
        if (message) message.style.display = 'block';
    } else {
        contributionSelect.disabled = false;
        if (message) message.style.display = 'none';
        // Επαναφορά προεπιλογής αν χρειάζεται
        if (contributionSelect.value === 'ΟΧΙ') {
            contributionSelect.value = 'ΝΑΙ';
        }
    }
}

/* =========================================================
   TABS SYSTEM
========================================================= */
const tabBase = document.getElementById("tabBase");
const tabBalance = document.getElementById("tabBalance");
const tabAnalysis = document.getElementById("tabAnalysis");
const tabContents = document.querySelectorAll(".tab-content");

function activateTab(targetId) {
    // Αφαίρεση όλων των ενεργών κλάσεων
    tabBase.classList.remove("tab-cyan", "tab-purple");
    tabBalance.classList.remove("tab-cyan", "tab-purple");
    tabAnalysis.classList.remove("tab-cyan", "tab-purple");
    
    // Προσθήκη βασικού χρώματος
    tabBase.classList.add("tab-purple");
    tabBalance.classList.add("tab-purple");
    tabAnalysis.classList.add("tab-purple");
    
    // Ενεργοποίηση επιλεγμένης καρτέλας με τυρκουάζ
    if (targetId === "base") {
        tabBase.classList.remove("tab-purple");
        tabBase.classList.add("tab-cyan");
    } else if (targetId === "balance") {
        tabBalance.classList.remove("tab-purple");
        tabBalance.classList.add("tab-cyan");
    } else if (targetId === "analysis") {
        tabAnalysis.classList.remove("tab-purple");
        tabAnalysis.classList.add("tab-cyan");
    }

    tabContents.forEach(c => {
        c.classList.remove("active");
        if (c.id === targetId) c.classList.add("active");
    });

    if (targetId === "base") {
        renderBaseTable();
        renderMobileCards();
        // ΔΕΝ καλούμε το updateMonthSelector() - αφαιρέθηκε από τη βάση
    }
    if (targetId === "balance") {
        renderBalanceTable();
        updateDashboard();
        renderCategorySummary();
    }
    if (targetId === "analysis") {
        renderAnalysisGrid();
    }
}

tabBase.addEventListener("click", () => activateTab("base"));
tabBalance.addEventListener("click", () => activateTab("balance"));
tabAnalysis.addEventListener("click", () => activateTab("analysis"));

/* =========================================================
   MODALS
========================================================= */
const modal = document.getElementById("entryModal");
const addEntryBtn = document.getElementById("addEntryBtn");
const allEntriesModal = document.getElementById("allEntriesModal");
const entriesDetailsModal = document.getElementById("entriesDetailsModal");

addEntryBtn.addEventListener("click", () => {
    document.getElementById("entryDate").valueAsDate = new Date();
    document.getElementById("entryCategory").value = "ΕΝΟΙΚΙΟ";
    document.getElementById("entryType").value = "ΕΞΟΔΑ";
    document.getElementById("entryAmount").value = "";
    document.getElementById("entryPerson").value = "Plou";
    document.getElementById("entryContribution").value = "ΝΑΙ";
    modal.style.display = "flex";
    
    lockContributionForIncome();
});

document.getElementById("showAllEntriesBtn").addEventListener("click", () => {
    openAllEntriesModal();
});

function closeModal() {
    modal.style.display = "none";
}

function closeAllEntriesModal() {
    allEntriesModal.style.display = "none";
    selectedEntries.clear();
    updateSelectedCount();
    modalCurrentLimit = 10;
}

function closeEntriesModal() {
    entriesDetailsModal.style.display = "none";
}

window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
    if (e.target === allEntriesModal) closeAllEntriesModal();
    if (e.target === entriesDetailsModal) closeEntriesModal();
});

document.getElementById('entryType').addEventListener('change', lockContributionForIncome);

/* =========================================================
   DATE & MONTH UTILITIES
========================================================= */
function getMonthLabelFromDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const monthsGR = ["ΙΑΝ", "ΦΕΒ", "ΜΑΡ", "ΑΠΡ", "ΜΑΙ", "ΙΟΥΝ", "ΙΟΥΛ", "ΑΥΓ", "ΣΕΠ", "ΟΚΤ", "ΝΟΕ", "ΔΕΚ"];
    return monthsGR[d.getMonth()];
}

function getMonthNumber(monthLabel) {
    const monthsGR = ["ΙΑΝ", "ΦΕΒ", "ΜΑΡ", "ΑΠΡ", "ΜΑΙ", "ΙΟΥΝ", "ΙΟΥΛ", "ΑΥΓ", "ΣΕΠ", "ΟΚΤ", "ΝΟΕ", "ΔΕΚ"];
    const index = monthsGR.indexOf(monthLabel);
    return index !== -1 ? index : 99;
}

/* =========================================================
   DEBT CALCULATION
========================================================= */
function computeDebtForEntries(list) {
    let debt = 0;
    
    list
        .filter(e => e.contribution === "ΝΑΙ")
        .forEach(e => {
            if (e.category === "ΜΕΤΑΦΟΡΑ") {
                if (e.person === "Plou") {
                    debt += e.amount;
                } else if (e.person === "Nikelo") {
                    debt -= e.amount;
                }
            } else {
                const half = e.amount / 2;
                if (e.person === "Plou") {
                    debt += half;
                } else if (e.person === "Nikelo") {
                    debt -= half;
                }
            }
        });
    
    return debt;
}

/* =========================================================
   SAVE ENTRY
========================================================= */
document.getElementById("saveEntry").addEventListener("click", () => {
    const date = document.getElementById("entryDate").value;
    const category = document.getElementById("entryCategory").value;
    const type = document.getElementById("entryType").value;
    const amount = parseFloat(document.getElementById("entryAmount").value);
    const person = document.getElementById("entryPerson").value;
    let contribution = document.getElementById("entryContribution").value;

    if (!date || !category || !amount) {
        alert("ΣΥΜΠΛΗΡΩΣΕ ΗΜΕΡΟΜΗΝΙΑ, ΚΑΤΗΓΟΡΙΑ ΚΑΙ ΠΟΣΟ.");
        return;
    }

    if (type === "ΕΣΟΔΑ") {
        contribution = "ΟΧΙ";
    }

    const month = getMonthLabelFromDate(date);

    entries.push({
        date,
        month,
        category,
        type,
        amount,
        person,
        contribution
    });

    saveData(entries);
    autoBackupCheck();
    closeModal();
    renderAll();
});

/* =========================================================
   BASE TABLE - 10 ΠΡΟΣΦΑΤΕΣ ΕΓΓΡΑΦΕΣ
========================================================= */
function renderBaseTable() {
    const tbody = document.querySelector("#baseTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    const recentEntries = [...entries].reverse().slice(0, 10);
    
    recentEntries.forEach((e, i) => {
        const originalIndex = entries.length - 1 - [...entries].reverse().findIndex(entry => 
            entry.date === e.date && 
            entry.category === e.category && 
            entry.amount === e.amount &&
            entry.person === e.person
        );
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${e.date}</td>
            <td>${e.month || ""}</td>
            <td>${getCategoryIcon(e.category)} ${e.category}</td>
            <td>${e.type}</td>
            <td>${e.amount.toFixed(2)} €</td>
            <td>${e.person}</td>
            <td>${e.contribution}</td>
            <td><button onclick="deleteEntry(${originalIndex})" style="color:#ff6b6b;background:none;border:none;cursor:pointer;">✖</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    updateTableInfo();
}

function updateTableInfo() {
    const tableInfo = document.getElementById("tableInfo");
    if (!tableInfo) return;
    
    const showing = Math.min(entries.length, 10);
    tableInfo.textContent = `Εμφάνιση ${showing} πιο πρόσφατων εγγραφών`;
}

/* =========================================================
   MOBILE CARDS RENDER
========================================================= */
function renderMobileCards() {
    const container = document.getElementById('mobileEntriesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const recentEntries = [...entries].reverse().slice(0, 10);
    
    if (recentEntries.length === 0) {
        container.innerHTML = `
            <div class="mobile-entry-card" style="text-align: center; color: var(--text-dim);">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Δεν υπάρχουν καταχωρήσεις</p>
            </div>
        `;
        return;
    }
    
    recentEntries.forEach((entry, i) => {
        const originalIndex = entries.length - 1 - i;
        
        const card = document.createElement('div');
        card.className = 'mobile-entry-card';
        
        const typeClass = entry.type === 'ΕΣΟΔΑ' ? 'type-income' : 'type-expense';
        const personClass = entry.person === 'Plou' ? 'plou' : 'nikelo';
        
        card.innerHTML = `
            <div class="card-header">
                <span class="card-date">
                    <i class="fas fa-calendar-alt"></i> ${entry.date}
                </span>
                <span class="card-category">${getCategoryIcon(entry.category)} ${entry.category}</span>
            </div>
            
            <div class="card-body">
                <div class="card-amount">${entry.amount.toFixed(2)} €</div>
                <div class="card-person ${personClass}">
                    <i class="fas fa-user"></i> ${entry.person}
                </div>
            </div>
            
            <div class="card-footer">
                <span class="card-type ${typeClass}">
                    <i class="fas ${entry.type === 'ΕΣΟΔΑ' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    ${entry.type}
                </span>
                <span class="card-contribution">
                    <i class="fas fa-handshake"></i> ${entry.contribution}
                </span>
            </div>
            
            <div class="card-actions">
                <button onclick="deleteEntry(${originalIndex})" style="color: #ff6b6b;">
                    <i class="fas fa-trash"></i> Διαγραφή
                </button>
                <button onclick="editEntry(${originalIndex})" style="color: var(--neon-cyan);">
                    <i class="fas fa-edit"></i> Επεξεργασία
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

/* =========================================================
   EDIT ENTRY
========================================================= */
function editEntry(index) {
    if (index < 0 || index >= entries.length) return;
    
    const entry = entries[index];
    
    document.getElementById('entryDate').value = entry.date;
    document.getElementById('entryCategory').value = entry.category;
    document.getElementById('entryType').value = entry.type;
    document.getElementById('entryAmount').value = entry.amount;
    document.getElementById('entryPerson').value = entry.person;
    
    if (entry.type === 'ΕΣΟΔΑ') {
        document.getElementById('entryContribution').value = 'ΟΧΙ';
        document.getElementById('entryContribution').disabled = true;
        const message = document.getElementById('incomeLockMessage');
        if (message) message.style.display = 'block';
    } else {
        document.getElementById('entryContribution').value = entry.contribution;
        document.getElementById('entryContribution').disabled = false;
        const message = document.getElementById('incomeLockMessage');
        if (message) message.style.display = 'none';
    }
    
    modal.style.display = "flex";
    
    const saveBtn = document.getElementById('saveEntry');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "ΕΝΗΜΕΡΩΣΗ";
    
    const originalHandler = saveBtn.onclick;
    
    saveBtn.onclick = function() {
        const newDate = document.getElementById('entryDate').value;
        const newType = document.getElementById('entryType').value;
        let newContribution = document.getElementById('entryContribution').value;
        
        if (newType === 'ΕΣΟΔΑ') {
            newContribution = 'ΟΧΙ';
        }
        
        entries[index] = {
            date: newDate,
            month: getMonthLabelFromDate(newDate),
            category: document.getElementById('entryCategory').value,
            type: newType,
            amount: parseFloat(document.getElementById('entryAmount').value),
            person: document.getElementById('entryPerson').value,
            contribution: newContribution
        };
        
        saveData(entries);
        autoBackupCheck();
        closeModal();
        renderAll();
        
        saveBtn.textContent = originalText;
        saveBtn.onclick = originalHandler;
    };
}

/* =========================================================
   MODAL ALL ENTRIES - LOAD MORE SYSTEM
========================================================= */
let modalCurrentLimit = 10;
let modalCurrentFilter = 'all';

function openAllEntriesModal(initialFilter = 'all') {
    modalCurrentLimit = 10;
    modalCurrentFilter = initialFilter;
    
    selectedEntries.clear();
    updateSelectedCount();
    
    renderModalTable();
    updateAllEntriesMonthSelector();
    
    allEntriesModal.style.display = "flex";
}

function renderModalTable() {
    const tbody = document.querySelector("#allEntriesTable tbody");
    const allEntriesInfo = document.getElementById("allEntriesInfo");
    const loadMoreBtn = document.getElementById("modalLoadMoreBtn");
    
    if (!tbody || !allEntriesInfo || !loadMoreBtn) return;
    
    tbody.innerHTML = "";
    
    let filteredEntries = modalCurrentFilter === 'all' 
        ? [...entries] 
        : entries.filter(e => e.month === modalCurrentFilter);
    
    filteredEntries = filteredEntries.reverse();
    
    const entriesToShow = filteredEntries.slice(0, modalCurrentLimit);
    const totalEntries = filteredEntries.length;
    
    entriesToShow.forEach((e, index) => {
        const originalIndex = entries.length - 1 - [...entries].reverse().findIndex(entry => 
            entry.date === e.date && 
            entry.category === e.category && 
            entry.amount === e.amount &&
            entry.person === e.person
        );
        
        const tr = document.createElement("tr");
        const isSelected = selectedEntries.has(originalIndex);
        
        tr.innerHTML = `
            <td><input type="checkbox" data-index="${originalIndex}" ${isSelected ? 'checked' : ''}></td>
            <td>${e.date}</td>
            <td>${e.month || ""}</td>
            <td>${getCategoryIcon(e.category)} ${e.category}</td>
            <td>${e.type}</td>
            <td>${e.amount.toFixed(2)} €</td>
            <td>${e.person}</td>
            <td>${e.contribution}</td>
        `;
        tbody.appendChild(tr);
    });
    
    const showing = Math.min(modalCurrentLimit, totalEntries);
    allEntriesInfo.textContent = `Εμφάνιση ${showing} από ${totalEntries} εγγραφές`;
    
    loadMoreBtn.style.display = (modalCurrentLimit < totalEntries) ? 'block' : 'none';
    loadMoreBtn.disabled = (modalCurrentLimit >= totalEntries);
    
    tbody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            if (this.checked) {
                selectedEntries.add(index);
            } else {
                selectedEntries.delete(index);
            }
            updateSelectedCount();
            updateSelectAllCheckbox();
        });
    });
    
    updateSelectAllCheckbox();
}

function loadMoreInModal() {
    modalCurrentLimit += 10;
    renderModalTable();
}

function updateAllEntriesMonthSelector() {
    const allEntriesMonthSelector = document.getElementById("allEntriesMonthSelector");
    if (!allEntriesMonthSelector) return;
    
    const months = [...new Set(entries.map(e => e.month).filter(m => m))];
    months.sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
    
    allEntriesMonthSelector.innerHTML = '';
    
    months.forEach(month => {
        const monthBtn = document.createElement('button');
        monthBtn.className = 'month-selector-btn ' + (modalCurrentFilter === month ? 'active' : '');
        monthBtn.textContent = month;
        monthBtn.dataset.month = month;
        monthBtn.onclick = () => {
            modalCurrentLimit = 10;
            modalCurrentFilter = month;
            selectedEntries.clear();
            renderModalTable();
            document.querySelectorAll('#allEntriesMonthSelector .month-selector-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            monthBtn.classList.add('active');
            updateSelectedCount();
        };
        allEntriesMonthSelector.appendChild(monthBtn);
    });
}

/* =========================================================
   MULTI-DELETE SYSTEM
========================================================= */
function updateSelectedCount() {
    const selectedCount = document.getElementById('selectedCount');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
    if (selectedCount) {
        selectedCount.textContent = selectedEntries.size;
    }
    
    if (deleteSelectedBtn) {
        deleteSelectedBtn.disabled = selectedEntries.size === 0;
    }
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const tbody = document.querySelector("#allEntriesTable tbody");
    
    if (!selectAllCheckbox || !tbody) return;
    
    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
    const someChecked = Array.from(checkboxes).some(cb => cb.checked);
    
    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = someChecked && !allChecked;
}

document.getElementById('selectAllCheckbox')?.addEventListener('change', function() {
    const tbody = document.querySelector("#allEntriesTable tbody");
    if (!tbody) return;
    
    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        checkbox.checked = this.checked;
        
        if (this.checked) {
            selectedEntries.add(index);
        } else {
            selectedEntries.delete(index);
        }
    });
    
    updateSelectedCount();
});

document.getElementById('deleteSelectedBtn')?.addEventListener('click', function() {
    if (selectedEntries.size === 0) return;
    
    const monthFilter = document.querySelector('#allEntriesMonthSelector .month-selector-btn.active')?.dataset.month || 'all';
    
    const warning = `🚨 ΔΙΑΓΡΑΦΗ ${selectedEntries.size} ΕΓΓΡΑΦΩΝ\n\n` +
                   `Θα διαγραφούν ${selectedEntries.size} επιλεγμένες εγγραφές.\n\n` +
                   `Αυτή η ενέργεια ΔΕΝ μπορεί να αναιρεθεί!\n\n` +
                   `ΣΙΓΟΥΡΑ;`;
    
    if (!confirm(warning)) return;
    
    createBackup();
    
    const sortedIndices = Array.from(selectedEntries).sort((a, b) => b - a);
    sortedIndices.forEach(index => {
        entries.splice(index, 1);
    });
    
    saveData(entries);
    selectedEntries.clear();
    
    renderAll();
    renderModalTable();
    updateSelectedCount();
    
    alert(`✅ Διαγράφηκαν ${sortedIndices.length} εγγραφές`);
});

/* =========================================================
   DELETE ENTRY
========================================================= */
function deleteEntry(index) {
    if (!confirm("Σίγουρα θέλεις να διαγράψεις αυτή την εγγραφή;")) return;
    
    createBackup();
    
    entries.splice(index, 1);
    saveData(entries);
    renderAll();
}

/* =========================================================
   BALANCE TABLE
========================================================= */
function renderBalanceTable() {
    const tbody = document.querySelector("#balanceTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    const months = [...new Set(entries.map(e => e.month).filter(m => m))];
    months.sort((a, b) => getMonthNumber(a) - getMonthNumber(b));

    months.forEach(month => {
        const monthEntries = entries.filter(e => e.month === month);
        
        const debt = computeDebtForEntries(monthEntries);
        
        const plouTotal = monthEntries
            .filter(e => e.person === "Plou" && e.contribution === "ΝΑΙ")
            .reduce((a, b) => a + b.amount, 0);
            
        const nikeloTotal = monthEntries
            .filter(e => e.person === "Nikelo" && e.contribution === "ΝΑΙ")
            .reduce((a, b) => a + b.amount, 0);

        let debtText = "ΚΑΝΕΙΣ";
        let cssClass = "";
        if (Math.abs(debt) > 0.01) {
            if (debt > 0) {
                debtText = `NIKELO: ${debt.toFixed(2)}€`;
                cssClass = "debt-nikelo";
            } else {
                debtText = `PLOU: ${Math.abs(debt).toFixed(2)}€`;
                cssClass = "debt-plou";
            }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${month}</td>
            <td>${plouTotal.toFixed(2)} €</td>
            <td>${nikeloTotal.toFixed(2)} €</td>
            <td class="${cssClass}">${debtText}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* =========================================================
   FLOATING DEBT INDICATOR
========================================================= */
function updateFloatingDebt() {
    const debt = computeDebtForEntries(entries);
    const floatingDebt = document.getElementById("floatingDebt");
    
    floatingDebt.style.display = "block";
    
    const debtAmount = floatingDebt.querySelector(".debt-amount");
    const debtStatus = floatingDebt.querySelector(".debt-status");
    
    debtStatus.className = "debt-status";
    
    if (Math.abs(debt) < 0.01) {
        debtAmount.textContent = "ΚΑΝΕΝΑ ΧΡΕΟΣ";
        debtStatus.classList.add("debt-none");
    } else if (debt > 0) {
        debtAmount.textContent = `NIKELO: ${debt.toFixed(2)} €`;
        debtStatus.classList.add("debt-nikelo");
    } else {
        debtAmount.textContent = `PLOU: ${Math.abs(debt).toFixed(2)} €`;
        debtStatus.classList.add("debt-plou");
    }
}

/* =========================================================
   CATEGORY SUMMARY
========================================================= */
function renderCategorySummary() {
    const tbody = document.querySelector("#categorySummaryTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const byCategory = {};

    entries.forEach(e => {
        const key = e.category;
        if (!byCategory[key]) {
            byCategory[key] = {
                category: key,
                totalCount: 0,
                plouCount: 0,
                nikeloCount: 0,
                plouAmount: 0,
                nikeloAmount: 0
            };
        }
        
        byCategory[key].totalCount += 1;
        
        if (e.person === "Plou") {
            byCategory[key].plouCount += 1;
            byCategory[key].plouAmount += e.amount;
        } else if (e.person === "Nikelo") {
            byCategory[key].nikeloCount += 1;
            byCategory[key].nikeloAmount += e.amount;
        }
    });

    const categories = Object.keys(byCategory).sort();

    categories.forEach(cat => {
        const catEntries = entries.filter(e => e.category === cat && e.contribution === "ΝΑΙ");
        const net = computeDebtForEntries(catEntries);

        const row = byCategory[cat];
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${getCategoryIcon(row.category)} ${row.category}</td>
            <td>${row.totalCount}</td>
            <td>${row.plouAmount.toFixed(2)} €</td>
            <td>${row.nikeloAmount.toFixed(2)} €</td>
            <td>${net.toFixed(2)} €</td>
        `;
        tbody.appendChild(tr);
    });
}

/* =========================================================
   FULL BUBBLE GRID - ΠΛΕΓΜΑ 12×10 (ΟΛΑ ΤΑ ΚΕΛΙΑ ΟΡΑΤΑ)
========================================================= */
let currentGridData = null;

function renderAnalysisGrid() {
    const container = document.getElementById('fullBubbleGridContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim);"><i class="fas fa-spinner fa-spin"></i> Φόρτωση πλέγματος...</div>';
    
    // ΣΤΑΘΕΡΕΣ ΚΑΤΗΓΟΡΙΕΣ (10) - με τη σειρά που θέλουμε
    const categories = [
        'ΕΝΟΙΚΙΟ', 'ΔΕΗ', 'ΕΥΔΑΠ', 'NOVA', 'ΨΩΝΙΑ', 
        'ΨΥΧΑΓΩΓΙΑ', 'ΑΛΛΑ', 'ΜΙΣΘΟΣ', 'ΕΠΙΔΟΜΑ', 'ΜΕΤΑΦΟΡΑ'
    ];
    
    // ΣΤΑΘΕΡΟΙ ΜΗΝΕΣ (ΠΑΝΤΑ 12)
    const monthLabels = ["ΙΑΝ", "ΦΕΒ", "ΜΑΡ", "ΑΠΡ", "ΜΑΙ", "ΙΟΥΝ", "ΙΟΥΛ", "ΑΥΓ", "ΣΕΠ", "ΟΚΤ", "ΝΟΕ", "ΔΕΚ"];
    const months = monthLabels.slice(0, 12);
    
    // ΔΗΜΙΟΥΡΓΗΣΕ ΔΕΔΟΜΕΝΑ
    currentGridData = {};
    
    categories.forEach(category => {
        currentGridData[category] = {};
        
        months.forEach(month => {
            const monthEntries = entries.filter(e => 
                e.month === month && e.category === category
            );
            
            if (monthEntries.length > 0) {
                const plouEntries = monthEntries.filter(e => e.person === "Plou");
                const nikeloEntries = monthEntries.filter(e => e.person === "Nikelo");
                
                currentGridData[category][month] = {
                    plou: {
                        count: plouEntries.length,
                        amount: plouEntries.reduce((sum, e) => sum + e.amount, 0),
                        entries: plouEntries
                    },
                    nikelo: {
                        count: nikeloEntries.length,
                        amount: nikeloEntries.reduce((sum, e) => sum + e.amount, 0),
                        entries: nikeloEntries
                    },
                    totalCount: monthEntries.length,
                    totalAmount: monthEntries.reduce((sum, e) => sum + e.amount, 0),
                    allEntries: monthEntries
                };
            } else {
                currentGridData[category][month] = null; // ΚΕΝΟ ΚΕΛΙ
            }
        });
    });
    
    // ΔΗΜΙΟΥΡΓΗΣΕ ΤΟ ΠΛΕΓΜΑ HTML
    const gridHTML = createFullBubbleGridHTML(months, categories);
    container.innerHTML = gridHTML;
    
    // ΚΛΙΚ ΣΕ ΚΕΛΙ → ENTRIES DETAILS
    container.querySelectorAll('.grid-cell').forEach(cell => {
        cell.addEventListener('click', function() {
            const category = this.dataset.category;
            const month = this.dataset.month;
            const data = currentGridData[category]?.[month];
            
            if (data && data.totalCount > 0) {
                showEntriesDetailsDirect(category, month);
            } else {
                console.log(`Άδειο κελί: ${category} - ${month}`);
            }
        });
    });
}

function createFullBubbleGridHTML(months, categories) {
    let html = `
        <div class="full-bubble-grid">
            <!-- ΚΕΝΗ ΓΩΝΙΑ -->
            <div class="grid-corner-header">ΚΑΤΗΓΟΡΙΕΣ</div>
    `;
    
    // ΜΗΝΕΣ HEADER (ΠΑΝΤΑ 12)
    months.forEach(month => {
        html += `<div class="grid-month-header">${month}</div>`;
    });
    
    // ΚΑΤΗΓΟΡΙΕΣ ΚΑΙ ΚΕΛΙΑ
    categories.forEach(category => {
        // ΚΑΤΗΓΟΡΙΑ HEADER
        html += `<div class="grid-category-header">${getCategoryIcon(category)} ${category}</div>`;
        
        // ΚΕΛΙΑ ΓΙΑ ΚΑΘΕ ΜΗΝΑ
        months.forEach(month => {
            const data = currentGridData[category][month];
            
            html += `
                <div class="grid-cell" 
                     data-category="${category}" 
                     data-month="${month}"
                     title="${category} - ${month}">
                    <div class="grid-bubble-container">
            `;
            
            if (data) {
                // PLOU BUBBLE (αν έχει)
                if (data.plou.count > 0) {
                    html += `
                        <div class="grid-bubble plou-bubble">
                            P
                            <span class="bubble-count-badge">${data.plou.count}</span>
                        </div>
                    `;
                }
                
                // NIKELO BUBBLE (αν έχει)
                if (data.nikelo.count > 0) {
                    html += `
                        <div class="grid-bubble nikelo-bubble">
                            N
                            <span class="bubble-count-badge">${data.nikelo.count}</span>
                        </div>
                    `;
                }
                
                // Αν είναι άδειο (0 καταχωρήσεις και για τους δύο)
                if (data.plou.count === 0 && data.nikelo.count === 0) {
                    html += `<span class="empty-cell-indicator">-</span>`;
                }
                
            } else {
                // ΚΕΝΟ ΚΕΛΙ (αλλά ΟΡΑΤΟ)
                html += `<span class="empty-cell-indicator">-</span>`;
            }
            
            html += `
                    </div>
                </div>
            `;
        });
    });
    
    html += `</div>`;
    return html;
}

/* =========================================================
   DIRECT TO ENTRIES DETAILS (ΧΩΡΙΣ SUMMARY)
========================================================= */
function showEntriesDetailsDirect(category, month) {
    const data = currentGridData?.[category]?.[month];
    if (!data || data.totalCount === 0) return;
    
    // ΟΛΕΣ ΟΙ ΕΓΓΡΑΦΕΣ (και Plou και Nikelo)
    const entriesToShow = data.allEntries;
    
    // ΟΜΑΔΟΠΟΙΗΣΗ ΑΝΑ ΗΜΕΡΟΜΗΝΙΑ
    const groupedByDate = {};
    entriesToShow.forEach(entry => {
        if (!groupedByDate[entry.date]) {
            groupedByDate[entry.date] = {
                plouEntries: [],
                nikeloEntries: [],
                totalAmount: 0
            };
        }
        
        if (entry.person === 'Plou') {
            groupedByDate[entry.date].plouEntries.push(entry);
        } else {
            groupedByDate[entry.date].nikeloEntries.push(entry);
        }
        
        groupedByDate[entry.date].totalAmount += entry.amount;
    });
    
    // ΕΝΗΜΕΡΩΣΗ ΤΙΤΛΟΥ
    document.getElementById('entriesTitle').textContent = `${month} - ${category}`;
    
    // ΕΝΗΜΕΡΩΣΗ ΣΥΝΟΛΙΚΟΥ
    const totalSum = entriesToShow.reduce((sum, e) => sum + e.amount, 0);
    document.querySelector('.entries-total strong').textContent = 
        `${entriesToShow.length} καταχωρήσεις - ${totalSum.toFixed(2)}€`;
    
    // ΕΝΗΜΕΡΩΣΗ ΛΙΣΤΑΣ
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';
    
    // ΜΕΤΑΤΡΟΠΗ ΗΜΕΡΟΜΗΝΙΩΝ ΣΕ ΕΛΛΗΝΙΚΑ
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    
    Object.keys(groupedByDate).sort().forEach(date => {
        const group = groupedByDate[date];
        const dateObj = new Date(date);
        const greekDate = dateObj.toLocaleDateString('el-GR', dateOptions);
        
        const dayGroup = document.createElement('div');
        dayGroup.className = 'entry-day-group';
        
        let dayHTML = `
            <div class="day-header">
                <i class="fas fa-calendar-day"></i>
                <span class="day-date">${greekDate}</span>
                <span class="day-total">(ΣΥΝΟΛΟ ΗΜΕΡΑΣ: ${group.totalAmount.toFixed(2)}€)</span>
            </div>
            <div class="person-entries">
        `;
        
        // ΠΡΟΣΘΗΚΗ PLOU ENTRIES
        if (group.plouEntries.length > 0) {
            dayHTML += `
                <div class="person-entry plou-entry">
                    <div class="entry-person">
                        <span class="person-badge plou-badge">🔵 PLOU (${group.plouEntries.length} καταχωρήσεις)</span>
                    </div>
                    <div class="entry-details">
            `;
            
            group.plouEntries.forEach(entry => {
                dayHTML += `
                    <div class="entry-item">
                        <span class="entry-amount">${entry.amount.toFixed(2)}€</span>
                        <span class="entry-contribution">
                            <i class="fas fa-handshake"></i> ${entry.contribution}
                        </span>
                    </div>
                `;
            });
            
            dayHTML += `</div></div>`;
        }
        
        // ΠΡΟΣΘΗΚΗ NIKELO ENTRIES
        if (group.nikeloEntries.length > 0) {
            dayHTML += `
                <div class="person-entry nikelo-entry">
                    <div class="entry-person">
                        <span class="person-badge nikelo-badge">🟣 NIKELO (${group.nikeloEntries.length} καταχωρήσεις)</span>
                    </div>
                    <div class="entry-details">
            `;
            
            group.nikeloEntries.forEach(entry => {
                dayHTML += `
                    <div class="entry-item">
                        <span class="entry-amount">${entry.amount.toFixed(2)}€</span>
                        <span class="entry-contribution">
                            <i class="fas fa-handshake"></i> ${entry.contribution}
                        </span>
                    </div>
                `;
            });
            
            dayHTML += `</div></div>`;
        }
        
        dayHTML += `</div></div>`;
        dayGroup.innerHTML = dayHTML;
        entriesList.appendChild(dayGroup);
    });
    
    // ΑΝΟΙΓΜΑ ENTRIES MODAL
    entriesDetailsModal.style.display = 'flex';
}

/* =========================================================
   GO BACK TO GRID (ΑΠΟ ENTRIES MODAL)
========================================================= */
function goBackToGrid() {
    closeEntriesModal();
    activateTab("analysis");
}

/* =========================================================
   EXPORT
========================================================= */
document.getElementById("exportBtn").addEventListener("click", () => {
    if (entries.length === 0) {
        alert("Δεν υπάρχουν δεδομένα για εξαγωγή!");
        return;
    }
    
    const choice = prompt("ΕΠΙΛΕΞΕ ΜΟΡΦΗ: 1=JSON, 2=EXCEL");
    if (!choice) return;
    
    if (choice === "1") {
        exportToJSON();
    } else if (choice === "2") {
        exportToExcel();
    } else {
        alert("ΔΩΣΕ 1 Ή 2.");
    }
});

function exportToJSON() {
    const now = new Date();
    const filename = `budget_${now.getDate()}_${now.getMonth()+1}_${now.getFullYear()}.json`;
    
    const exportData = {
        metadata: {
            exported: now.toLocaleString('el-GR'),
            entries: entries.length
        },
        entries: entries
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Εξήχθησαν ${entries.length} εγγραφές σε JSON\nΑρχείο: ${filename}`);
}

function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BUDGET");
    XLSX.writeFile(wb, `budget_${new Date().getDate()}_${new Date().getMonth()+1}.xlsx`);
    
    alert(`✅ Εξήχθησαν ${entries.length} εγγραφές σε Excel`);
}

/* =========================================================
   IMPORT
========================================================= */
const fileInput = document.getElementById("fileInput");
document.getElementById("importBtn").addEventListener("click", () => {
    if (entries.length > 0 && !confirm("🚨 ΕΙΣΑΓΩΓΗ ΔΕΔΟΜΕΝΩΝ\n\nΘα ΑΛΛΑΞΟΥΝ τα τρέχοντα δεδομένα!\n\nΣυνέχεια;")) {
        return;
    }
    
    fileInput.value = "";
    fileInput.click();
});

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (evt) => {
        createBackup();
        
        const data = evt.target.result;
        
        if (file.name.endsWith('.json')) {
            importJSON(data);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            importExcel(data);
        } else {
            alert("Μη υποστηριζόμενο αρχείο. Χρησιμοποιήστε JSON ή Excel.");
        }
    };

    if (file.name.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
});

function importJSON(jsonData) {
    try {
        const parsed = JSON.parse(jsonData);
        
        if (parsed.entries && Array.isArray(parsed.entries)) {
            entries = parsed.entries;
        } else if (Array.isArray(parsed)) {
            entries = parsed;
        } else {
            throw new Error("Μη έγκυρη μορφή JSON");
        }
        
        convertIrisToMetaphora();
        
        saveData(entries);
        renderAll();
        alert(`✅ Εισήχθησαν ${entries.length} εγγραφές από JSON`);
    } catch (error) {
        alert("Σφάλμα κατά την εισαγωγή JSON: " + error.message);
    }
}

function importExcel(binaryData) {
    try {
        const workbook = XLSX.read(binaryData, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        
        const importedEntries = [];
        
        json.forEach(row => {
            let date = row.date || row["DATE"] || row["ΗΜΕΡΟΜΗΝΙΑ"] || row["ΗΜΕΡΟΜΗΝΙΑ "] || "";
            let month = row.month || row["MONTH"] || row["ΜΗΝΑΣ"] || row["ΜΗΝΑΣ "] || "";
            
            const category = row.category || row["ΚΑΤΗΓΟΡΙΑ"] || row["ΚΑΤΗΓΟΡΙΑ "] || "";
            const type = row.type || row["ΤΥΠΟΣ"] || row["ΤΥΠΟΣ "] || "ΕΞΟΔΑ";
            const amount = parseFloat(row.amount || row["ΠΟΣΟ"] || row["ΠΟΣΟ "] || 0) || 0;
            const person = row.person || row["ΠΟΙΟΣ"] || row["ΠΟΙΟΣ "] || "Plou";
            const contribution = row.contribution || row["ΣΥΝΕΙΣΦΟΡΑ"] || row["ΣΥΝΕΙΣΦΟΡΑ "] || "ΝΑΙ";

            if (!date || !category || !amount) return;

            if (!month) {
                month = getMonthLabelFromDate(date);
            }

            importedEntries.push({
                date,
                month,
                category: category === "IRIS" ? "ΜΕΤΑΦΟΡΑ" : category,
                type,
                amount,
                person,
                contribution
            });
        });
        
        entries = importedEntries;
        saveData(entries);
        renderAll();
        alert(`✅ Εισήχθησαν ${entries.length} εγγραφές από Excel`);
    } catch (error) {
        alert("Σφάλμα κατά την εισαγωγή Excel: " + error.message);
    }
}

/* =========================================================
   BACKUP/RESTORE BUTTONS
========================================================= */
document.getElementById('backupBtn').addEventListener('click', function() {
    if (entries.length === 0) {
        alert("Δεν υπάρχουν δεδομένα για backup!");
        return;
    }
    
    const backup = createBackup();
});

document.getElementById('restoreBtn').addEventListener('click', function() {
    const backup = loadBackup();
    
    if (!backup) {
        alert("Δεν υπάρχει αποθηκευμένη κατάσταση!");
        return;
    }
    
    const warning = `🚨 ΕΠΑΝΑΦΟΡΗ ΑΠΟ ΑΠΟΘΗΚΕΥΣΗ\n\n` +
                   `Ημερομηνία: ${backup.timestampLocal}\n` +
                   `Εγγραφές: ${backup.count}\n\n` +
                   `Θα ΧΑΘΟΥΝ όλες οι αλλαγές μετά από αυτή την ημερομηνία!\n\n` +
                   `ΣΙΓΟΥΡΑ;`;
    
    if (!confirm(warning)) return;
    
    entries = backup.entries;
    saveData(entries);
    renderAll();
    
    alert(`✅ ΕΠΑΝΑΦΟΡΗ ΟΛΟΚΛΗΡΩΘΗΚΗ\n${entries.length} εγγραφές επαναφέρθηκαν`);
});

addClickFeedback('backupBtn');
addClickFeedback('restoreBtn');

/* =========================================================
   DASHBOARD
========================================================= */
function updateDashboard() {
    // Απλοποιημένη έκδοση
}

/* =========================================================
   RENDER ALL
========================================================= */
function renderAll() {
    renderBaseTable();
    renderMobileCards();
    renderBalanceTable();
    updateDashboard();
    renderCategorySummary();
    updateFloatingDebt();
}

/* =========================================================
   DIGITAL CLOCK
========================================================= */
function updateDigitalClock() {
    const now = new Date();
    
    const weekdaysGR = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const monthsGR = ["Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου", "Μαΐου", "Ιουνίου", 
                      "Ιουλίου", "Αυγούστου", "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου", "Δεκεμβρίου"];
    
    const weekday = weekdaysGR[now.getDay()];
    const day = now.getDate() || 1;
    const month = monthsGR[now.getMonth()] || "Ιανουαρίου";
    const year = now.getFullYear() || 2024;
    
    const hours = (now.getHours() || 0).toString().padStart(2, '0');
    const minutes = (now.getMinutes() || 0).toString().padStart(2, '0');
    const seconds = (now.getSeconds() || 0).toString().padStart(2, '0');
    
    const clock = document.getElementById('digitalClock');
    if (clock) {
        clock.querySelector('.weekday').textContent = weekday;
        clock.querySelector('.day').textContent = day;
        clock.querySelector('.month').textContent = month;
        clock.querySelector('.year').textContent = year;
        
        clock.querySelector('.hours').textContent = hours;
        clock.querySelector('.minutes').textContent = minutes;
        
        const secondTens = seconds[0] || '0';
        const secondOnes = seconds[1] || '0';
        
        clock.querySelector('.second-tens').textContent = secondTens;
        clock.querySelector('.second-ones').textContent = secondOnes;
        
        const secondTensElement = clock.querySelector('.second-tens');
        const secondOnesElement = clock.querySelector('.second-ones');
        
        secondTensElement.style.color = 'var(--neon-purple)';
        secondTensElement.style.textShadow = '0 0 8px var(--neon-purple-glow)';
        
        secondOnesElement.style.color = 'var(--neon-cyan)';
        secondOnesElement.style.textShadow = '0 0 8px var(--neon-cyan-glow)';
    }
}

/* =========================================================
   INITIALIZATION
========================================================= */
window.addEventListener('DOMContentLoaded', () => {
    activateTab("base");
    renderAll();

    if (entries.length > 0) {
        createBackup();
    }

    updateDigitalClock();
    setInterval(updateDigitalClock, 1000);

    addClickFeedback('backupBtn');
    addClickFeedback('restoreBtn');
});

console.log('✅ Budget Manager με ΑΝΑΛΥΣΗ στην καρτέλα loaded successfully!');