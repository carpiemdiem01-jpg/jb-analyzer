// =======================================================
// CONFIGURAÇÃO DAS LOTERIAS (API)
// =======================================================
const LOTERIAS = {
  LOOK: "GO",
  RJ: "RJ",
  SP: "SP",
  NACIONAL: "DF"
};

// =======================================================
// TABELA DO JOGO DO BICHO – GRUPO POR DEZENA
// =======================================================
function getGrupoByDezena(dezena) {
  if (dezena === 0) return 25;
  return Math.ceil(dezena / 4);
}

// =======================================================
// CONSTANTES DE MULTIPLICAÇÃO (JB)
// =======================================================
const MULTIPLICADORES = [369, 555, 315, 777];

// =======================================================
// PUXADAS ENTRE BICHOS (POR GRUPO)
// =======================================================
const PUXADAS = {
  1: [24], 24: [1],
  2: [23], 23: [2],
  3: [22], 22: [3],
  4: [21], 21: [4],
  5: [20], 20: [5],
  6: [19], 19: [6],
  7: [18], 18: [7],
  8: [17], 17: [8],
  9: [16], 16: [9],
  10: [15], 15: [10],
  11: [14], 14: [11],
  12: [13], 13: [12],
  25: [25] // vaca puxa vaca
};

// =======================================================
// BUSCAR RESULTADOS VIA API
// =======================================================
async function loadData() {
  const date = document.getElementById("date").value;
  const days = Number(document.getElementById("days").value);
  const analysisBox = document.getElementById("analysis");

  if (!date) {
    alert("Escolha uma data");
    return;
  }

  analysisBox.innerHTML = "<div class='analysis-block'>Buscando dados...</div>";

  const selecionadas = Array.from(
    document.querySelectorAll(".checks input:checked")
  ).map(el => el.id.replace("lot_", ""));

  if (selecionadas.length === 0) {
    analysisBox.innerHTML =
      "<div class='analysis-block'>Nenhuma loteria selecionada.</div>";
    return;
  }

  const baseDate = new Date(date);
  let html = "";

  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    for (const lot of selecionadas) {
      const state = LOTERIAS[lot];
      const url =
        `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${state}&date=${dateStr}`;

      try {
        const resp = await fetch(url);
        const json = await resp.json();
        if (!json.data || json.data.length === 0) continue;

        // MAIS RECENTE PRIMEIRO
        const jogos = [...json.data].reverse();

        jogos.forEach(game => {
          const numeros = game.places
            .slice(0, 5)
            .map(n => n.padStart(4, "0"));

          html += analyzeSorteio(dateStr, game.lotteryName, numeros);
        });

      } catch (e) {
        console.warn("Erro:", lot, dateStr);
      }
    }
  }

  analysisBox.innerHTML =
    html || "<div class='analysis-block'>Nenhum dado encontrado.</div>";
}

// =======================================================
// INSERÇÃO MANUAL
// =======================================================
function addManualResult() {
  const nome = document.getElementById("manual_name").value.trim();
  const data = document.getElementById("manual_date").value;
  const raw = document.getElementById("manual_numbers").value;

  if (!nome || !data || !raw) {
    alert("Preencha todos os campos.");
    return;
  }

  const numeros = raw
    .split(",")
    .map(n => n.trim())
    .filter(n => /^\d{4}$/.test(n))
    .slice(0, 5);

  if (numeros.length !== 5) {
    alert("Informe exatamente 5 números de 4 dígitos.");
    return;
  }

  const analysisBox = document.getElementById("analysis");
  analysisBox.innerHTML =
    analyzeSorteio(data, nome, numeros) + analysisBox.innerHTML;
}

// =======================================================
// ANÁLISE PRINCIPAL DO SORTEIO
// =======================================================
function analyzeSorteio(data, nome, numeros) {
  let html = `<div class="analysis-block">`;

  html += `<div><strong>📅 ${data}</strong></div>`;
  html += `<div><strong>${nome}</strong></div>`;
  html += `<div class="small">${numeros.join(" | ")}</div><br>`;

  // ===================================================
  // AUSÊNCIA DE DÍGITOS (1º ao 5º prêmio)
  // ===================================================
  const presentes = new Set();
  numeros.forEach(n => n.split("").forEach(d => presentes.add(d)));

  const ausentes = [];
  for (let i = 0; i <= 9; i++) {
    if (!presentes.has(String(i))) ausentes.push(i);
  }

  if (ausentes.length > 0) {
    html += `⏳ <strong>Dígitos ausentes:</strong> ${ausentes.join(", ")}<br>`;
  } else {
    html += `⏳ <strong>Dígitos ausentes:</strong> NEGATIVO<br>`;
  }

  // ===================================================
  // GRUPOS RELACIONADOS À AUSÊNCIA
  // ===================================================
  if (ausentes.length > 0) {
    const grupos = new Set();
    ausentes.forEach(n => {
      [n, n + 10, n + 20].forEach(dz => {
        if (dz <= 99) grupos.add(getGrupoByDezena(dz));
      });
    });
    html += `🐂 <strong>Grupos relacionados:</strong> ${[...grupos].join(", ")}<br>`;
  }

  // ===================================================
  // DUPLAS
  // ===================================================
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

  // ===================================================
  // SOMA / SUBTRAÇÃO JB (1º PRÊMIO)
  // ===================================================
  const p = numeros[0];
  const dz1 = Number(p.slice(0, 2));
  const dz2 = Number(p.slice(2, 4));
  const grupo = getGrupoByDezena(dz2);

  const somaJB = dz1 + dz2 + grupo;
  const subJB = Math.abs(dz1 - dz2 - grupo);

  html += `➕ <strong>Soma JB:</strong> ${somaJB}<br>`;
  html += `➖ <strong>Subtração JB:</strong> ${subJB}<br>`;

  const somaDigitos = p
    .split("")
    .map(Number)
    .reduce((a, b) => a + b, 0) + grupo;

  html += `➕ <strong>Soma alternativa:</strong> ${somaDigitos}<br>`;

  // ===================================================
  // MULTIPLICAÇÕES JB
  // ===================================================
  MULTIPLICADORES.forEach(m => {
    const r = String(Number(p) * m);
    Object.keys(duplaCount).forEach(d => {
      const [a, b] = d.split("/");
      if (r.includes(a) || r.includes(b)) {
        html += `✖️ <strong>Multi ${m} coincidiu:</strong> ${d}<br>`;
      }
    });
  });

  // ===================================================
  // PUXADAS
  // ===================================================
  const grupoAtual = grupo;
  if (PUXADAS[grupoAtual]) {
    html += `🔗 <strong>Puxada:</strong> ${grupoAtual} → ${PUXADAS[grupoAtual].join(", ")}<br>`;
  }

  html += `</div>`;
  return html;
}
