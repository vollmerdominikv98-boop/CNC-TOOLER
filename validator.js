// validator.js
// Führt Plausibilitätsprüfungen durch und kappt Werte, wenn sie Maschinenlimits überschreiten

export function validateParameters(calculationResult, machine, tool, ae, ap) {
    let warnings = [];
    let errors = [];

    // Wir arbeiten mit einer Kopie des Ergebnisses, um es bei Bedarf zu korrigieren
    let correctedResult = { ...calculationResult };

    // 1. Geometrische Prüfung (Hard Error)
    if (ae > tool.d) {
        errors.push(`Fehler: Die Schnittbreite (ae = ${ae} mm) darf nicht größer sein als der Werkzeugdurchmesser (D = ${tool.d} mm).`);
    }
    if (ae <= 0 || ap <= 0) {
        errors.push("Fehler: Schnittbreite (ae) und Schnitttiefe (ap) müssen größer als 0 sein.");
    }

    // 2. Maschinen-Limit: Max. Spindeldrehzahl
    if (correctedResult.n > machine.maxRpm) {
        warnings.push(`Warnung: Berechnete Drehzahl (${correctedResult.n} U/min) überschreitet das Limit der Maschine. Wird auf ${machine.maxRpm} U/min gekappt.`);
        
        // Werte auf Maschine anpassen
        correctedResult.n = machine.maxRpm;
        
        // Wenn die Drehzahl sinkt, MUSS der Vorschub (vf) und Q neu berechnet werden!
        correctedResult.vf = Math.round(correctedResult.n * tool.z * parseFloat(correctedResult.fz_eff));
        correctedResult.q = ((ae * ap * correctedResult.vf) / 1000).toFixed(2);
    }

    // 3. Maschinen-Limit: Max. Vorschub (Eilgang / Arbeitsvorschub)
    if (correctedResult.vf > machine.maxFeed) {
        warnings.push(`Warnung: Berechneter Vorschub (${correctedResult.vf} mm/min) überschreitet den Maximalvorschub der Maschine. Wird auf ${machine.maxFeed} mm/min gekappt.`);
        
        correctedResult.vf = machine.maxFeed;
        correctedResult.q = ((ae * ap * correctedResult.vf) / 1000).toFixed(2);
    }

    // 4. Maschinen-Limit: Leistungsabschätzung (Daumenregel)
    // Sehr vereinfacht: Wir nehmen an, dass 25 cm³/min ca. 1 kW Maschinenleistung benötigen (bei Stahl).
    let estimatedPowerRequired = parseFloat(correctedResult.q) / 25; 
    if (estimatedPowerRequired > machine.powerKw) {
        warnings.push(`Maschinenüberlastung droht: Das hohe Zeitspanvolumen benötigt geschätzt ${estimatedPowerRequired.toFixed(1)} kW. Ihre Maschine hat nur ${machine.powerKw} kW! Bitte ae/ap verringern oder Spindelauslastung überwachen.`);
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        result: correctedResult
    };
}
