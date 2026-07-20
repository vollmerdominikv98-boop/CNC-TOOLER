// machine.js
// Kümmert sich um die Darstellung und Auswahl der CNC-Maschinen (Schritt 1)

export function renderMachines(containerId, machines, selectedMachineId, onSelectCallback) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <h2>1. Maschine wählen</h2>
        <p style="color: #666; margin-bottom: 20px;">Wählen Sie Ihre Maschine, damit die App die Maschinengrenzen (Max-Drehzahl & Leistung) prüfen kann.</p>
        <div class="grid" id="machineGrid"></div>
    `;

    const grid = document.getElementById('machineGrid');

    machines.forEach(mach => {
        const card = document.createElement('div');
        // Wenn die ID der Maschine der aktuell ausgewählten entspricht, fügen wir die Klasse "selected" hinzu
        card.className = `card ${selectedMachineId === mach.id ? 'selected' : ''}`;
        
        card.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: var(--accent);">${mach.name}</h3>
            <div style="font-size: 0.9em; line-height: 1.5;">
                <div><strong>Max. Drehzahl:</strong> ${mach.maxRpm.toLocaleString()} U/min</div>
                <div><strong>Max. Vorschub:</strong> ${mach.maxFeed.toLocaleString()} mm/min</div>
                <div><strong>Leistung:</strong> ${mach.powerKw} kW</div>
            </div>
        `;

        card.onclick = () => onSelectCallback(mach);
        grid.appendChild(card);
    });
}
