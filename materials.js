// materials.js
// Rendert die Materialauswahl inkl. der farbigen ISO-Filter (Schritt 2)

export function renderMaterials(containerId, materials, selectedMaterialId, onSelectCallback) {
    const container = document.getElementById(containerId);
    
    // HTML-Struktur mit Filter-Buttons (ISO-Gruppen)
    container.innerHTML = `
        <h2>2. Werkstoff wählen</h2>
        
        <div style="margin-bottom: 20px;">
            <strong style="display:block; margin-bottom: 10px;">Nach ISO-Gruppe filtern:</strong>
            <div style="display:flex; flex-wrap: wrap; gap: 8px;">
                <button onclick="window.filterMaterial('ALL')" style="background:var(--border); color:var(--text);">Alle</button>
                <button onclick="window.filterMaterial('P')" class="iso-P" style="border:none;">P - Stahl</button>
                <button onclick="window.filterMaterial('M')" class="iso-M" style="border:none;">M - Edelstahl</button>
                <button onclick="window.filterMaterial('K')" class="iso-K" style="border:none;">K - Guss</button>
                <button onclick="window.filterMaterial('N')" class="iso-N" style="border:none;">N - Alu/NE</button>
                <button onclick="window.filterMaterial('S')" class="iso-S" style="border:none;">S - Titan/Superleg.</button>
                <button onclick="window.filterMaterial('H')" class="iso-H" style="border:none;">H - Hart</button>
            </div>
        </div>
        
        <div class="grid" id="materialGrid"></div>
    `;

    // Speichern der Daten global für die Filter-Funktion
    window._currentMaterials = materials;
    window._selectedMaterialId = selectedMaterialId;
    window._materialCallback = onSelectCallback;

    // Initiale Darstellung aller Materialien
    drawMaterialCards(materials);
}

// Globale Funktion für die Filter-Buttons
window.filterMaterial = function(isoCode) {
    let filtered = window._currentMaterials;
    if (isoCode !== 'ALL') {
        filtered = window._currentMaterials.filter(m => m.isoGroup === isoCode);
    }
    drawMaterialCards(filtered);
};

// Hilfsfunktion zum Zeichnen der Karten
function drawMaterialCards(dataList) {
    const grid = document.getElementById('materialGrid');
    grid.innerHTML = ''; // Vorherige Karten löschen

    if(dataList.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1;">Keine Werkstoffe in dieser ISO-Gruppe gefunden.</p>';
        return;
    }

    dataList.forEach(mat => {
        const card = document.createElement('div');
        card.className = `card ${window._selectedMaterialId === mat.id ? 'selected' : ''}`;
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <h3 style="margin:0;">${mat.name}</h3>
                <span class="iso-badge iso-${mat.isoGroup}">${mat.isoGroup}</span>
            </div>
            <div style="font-size: 0.9em;">
                <strong>Richtwert vc:</strong> ${mat.vc} m/min
            </div>
        `;

        card.onclick = () => window._materialCallback(mat);
        grid.appendChild(card);
    });
}
