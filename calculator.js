// calculator.js
// Reine Berechnungslogik, komplett isoliert von der Benutzeroberfläche

/**
 * Berechnet alle relevanten Schnittdaten inkl. Spanausdünnung (Chip Thinning)
 */
export function calculate(vc, d, z, fz, ae, ap) {
    // 1. Spindeldrehzahl (n) in U/min
    // Formel: n = (vc * 1000) / (PI * d)
    let n = (vc * 1000) / (Math.PI * d);
    
    // 2. Chip Thinning (Mittlere Spandicke)
    // Wenn ae kleiner als der halbe Fräserdurchmesser ist, wird der Span dünner.
    // Wir müssen den Vorschub pro Zahn (fz) erhöhen, um die optimale Spandicke (hex) zu erreichen.
    let fz_eff = fz;
    let chipThinningFactor = 1.0;
    
    if (ae > 0 && ae < (d / 2)) {
        // Branchenübliche Näherung für den Korrekturfaktor: Wurzel(D / ae)
        // Wir begrenzen den Faktor auf maximal 3, um Werkzeugbruch zu vermeiden.
        chipThinningFactor = Math.sqrt(d / ae);
        if (chipThinningFactor > 3) chipThinningFactor = 3; 
        
        fz_eff = fz * chipThinningFactor;
    }

    // 3. Vorschubgeschwindigkeit (vf) in mm/min
    // Formel: vf = n * z * fz_eff
    let vf = n * z * fz_eff;

    // 4. Zeitspanvolumen (Q) in cm³/min
    // Formel: Q = (ae * ap * vf) / 1000
    let q = (ae * ap * vf) / 1000;

    return {
        n: Math.round(n),
        vf: Math.round(vf),
        q: q.toFixed(2),
        fz_eff: fz_eff.toFixed(3),
        chipThinningFactor: chipThinningFactor.toFixed(2),
        chipThinningActive: chipThinningFactor > 1.01
    };
}
