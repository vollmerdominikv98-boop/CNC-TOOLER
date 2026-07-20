// tools.js
// Rendert die Werkzeug-Kategorien und die Werkzeugliste mit Bildern (Schritt 3)

export function renderTools(containerId, tools, categories, selectedCategoryId, selectedToolId, onCategorySelect, onToolSelect) {
    const container = document.getElementById(containerId);
    
    // Oberer Bereich: Kategorien (Schaftfräser, Bohrer, etc.)
    let html = `
        <h2>3. Werkzeug wählen</h2>
        <h3 style="margin-top:20px; font-size:1.1em; color:#7f8c8d;">Kategorie</h3>
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:30px;">
    `;

    categories.forEach(cat => {
        const isSelected = selectedCategoryId === cat.id;
        const btnStyle = isSelected ? 'background: var(--accent); color: white;' : 'background: var(--bg); color: var(--text); border: 1px solid var(--border);';
        html += `<button style="${btnStyle}" onclick="window._catSelect('${cat.id}')">${cat.name}</button>`;
    });

    html += `</div>`;

    // Unterer Bereich: Konkrete Werkzeuge dieser Kategorie
    if (selectedCategoryId) {
        html += `<h3 style="font-size:1.1em; color:#7f8c8d;">Werkzeugauswahl</h3>
                 <div class="grid" id="toolGrid"></div>`;
    } else {
        html += `<p style="color:var(--warning); font-weight:bold;">Bitte wählen Sie zuerst eine Kategorie (oben).</p>`;
    }

    container.innerHTML = html;

    // Callbacks ans Window hängen für die dynamischen Buttons
    window._catSelect = (id) => onCategorySelect(id);

    // Werkzeugkarten zeichnen
    if (selectedCategoryId) {
        const grid = document.getElementById('toolGrid');
        const filteredTools = tools.filter(t => t.categoryId === selectedCategoryId);

        if(filteredTools.length === 0) {
            grid.innerHTML = '<p>Keine Werkzeuge in dieser Kategorie vorhanden. Bitte im Admin-Bereich anlegen.</p>';
            return;
        }

        filteredTools.forEach(tool => {
            const card = document.createElement('div');
            card.className = `card ${selectedToolId === tool.id ? 'selected' : ''}`;
            
            // Fallback, falls kein Bild vorhanden ist
            const imgSrc = tool.imageUrl || 'https://via.placeholder.com/150/eeeeee/aaaaaa?text=Kein+Bild';

            card.innerHTML = `
                <img src="${imgSrc}" class="tool-image" alt="${tool.name}">
                <h3 style="margin: 0 0 5px 0;">${tool.name}</h3>
                <div style="font-size: 0.8em; color: #7f8c8d; margin-bottom: 10px;">Hersteller: ${tool.manufacturer || '-'}</div>
                
                <div style="font-size: 0.9em; display:flex; justify-content:space-between; border-top: 1px solid var(--border); padding-top: 5px;">
                    <span>Ø <strong>${tool.d}</strong> mm</span>
                    <span>Z = <strong>${tool.z}</strong></span>
                </div>
            `;

            card.onclick = () => onToolSelect(tool);
            grid.appendChild(card);
        });
    }
}
