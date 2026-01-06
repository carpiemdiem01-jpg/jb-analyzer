// ===============================
// TABELA DO JOGO DO BICHO
// ===============================
function getGrupoByDezena(dezena) {
  return Math.floor(dezena / 4) + 1;
}

// ===============================
// FUNÇÃO PRINCIPAL DE ANÁLISE
// ===============================
function analyzeSorteio(data, nome, numeros) {
  let html = `<div class="analysis-block">`;

  html += `<div><strong>📅 ${data}</strong></div>`;
  html += `<div><strong>${nome}</strong></div>`;
  html += `<div class="small">${numeros.join(" | ")}</div><br>`;

  // ===============================
  // 1️⃣ AUSÊNCIA POR NÚMERO (1º PRÊMIO)
  // ===============================
  const primeiroPremio = numeros[0];
  const dezenaPrimeiro = Number(primeiroPremio.slice(-2));

  const presentes = new Set();
  numeros.forEach(n => {
    presentes.add(Number(n.slice(-2)));
  });

  let numeroAusente = null;
  for (let i = 0; i <= 99; i++) {
    if (!presentes.has(i)) {
      numeroAusente = i % 10;
      break;
    }
  }

  if (numeroAusente !== null) {
    html += `🎯 <strong>Número ausente (1º prêmio):</strong> ${numeroAusente}<br>`;

    // ===============================
    // 2️⃣ GRUPOS RELACIONADOS
    // ===============================
    const grupos = [];
    [numeroAusente, numeroAusente + 10, numeroAusente + 20].forEach(n => {
      if (n <= 99) {
        grupos.push(getGrupoByDezena(n));
      }
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
    .filter(([_, v]) => v >= 2)
    .forEach(([d, v]) => {
      html += `🔁 <strong>Dupla:</strong> ${d} → ${v}x<br>`;
    });

  html += `</div>`;
  return html;
}
