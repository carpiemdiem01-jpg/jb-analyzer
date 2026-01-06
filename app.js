function analyzeSorteio(data, nome, numeros) {
  let html = `<div class="analysis-block">`;

  html += `<div><strong>📅 ${data}</strong></div>`;
  html += `<div><strong>${nome}</strong></div>`;
  html += `<div class="small">${numeros.join(" | ")}</div><br>`;

  // ===============================
  // 1️⃣ AUSÊNCIA POR NÚMERO (1º PRÊMIO)
  // ===============================
  const primeiroPremio = numeros[0];

  const digitosPresentes = new Set(
    primeiroPremio.split("").map(d => Number(d))
  );

  const digitosAusentes = [];
  for (let i = 0; i <= 9; i++) {
    if (!digitosPresentes.has(i)) digitosAusentes.push(i);
  }

  if (digitosAusentes.length > 0) {
    html += `🎯 <strong>Números ausentes (1º prêmio):</strong> ${digitosAusentes.join(", ")}<br>`;

    // ===============================
    // 2️⃣ GRUPOS RELACIONADOS
    // ===============================
    const grupos = [];
    digitosAusentes.forEach(d => {
      [d, d + 10, d + 20].forEach(n => {
        if (n <= 99) grupos.push(getGrupoByDezena(n));
      });
    });

    html += `🐂 <strong>Grupos fortes:</strong> ${[...new Set(grupos)].join(", ")}<br>`;
  }

  // ===============================
  // 3️⃣ DUPLAS
  // ===============================
  const duplaCount = {};

  numeros.forEach(n => {
    for (let i = 0; i <= n.length - 2; i++) {
      const d = n.substring(i, i + 2);
      const inv = d.split("").reverse().join("");
      const key = [d, inv].sort().join("/");
      duplaCount[key] = (duplaCount[key] || 0) + 1;
    }
  });

  Object.entries(duplaCount)
    .filter(([_, v]) => v >= 3)
    .forEach(([d, v]) => {
      html += `🔁 <strong>Dupla:</strong> ${d} → ${v}x<br>`;
    });

  html += `</div>`;
  return html;
}
