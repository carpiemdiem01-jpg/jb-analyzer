// =======================================================
// CONFIGURAÇÃO DAS LOTERIAS
// =======================================================
const LOTERIAS = {
  LOOK: "GO",
  RJ: "RJ",
  SP: "SP",
  NACIONAL: "DF"
};

// =======================================================
// GRUPO DO JOGO DO BICHO
// =======================================================
function getGrupoByDezena(dezena) {
  if (dezena === 0) return 25;
  return Math.ceil(dezena / 4);
}

// =======================================================
// MULTIPLICADORES JB
// =======================================================
const MULTIPLICADORES = [369, 555, 315, 777];

// =======================================================
// PUXADAS ENTRE GRUPOS
// =======================================================
const PUXADAS = {
  1:[24],24:[1],2:[23],23:[2],3:[22],22:[3],4:[21],21:[4],
  5:[20],20:[5],6:[19],19:[6],7:[18],18:[7],8:[17],17:[8],
  9:[16],16:[9],10:[15],15:[10],11:[14],14:[11],12:[13],13:[12],
  25:[25]
};

// =======================================================
// BUSCAR RESULTADOS (API)
// =======================================================
async function loadData() {
  const date = document.getElementById("date").value;
  const days = Number(document.getElementById("days").value);
  const analysisBox = document.getElementById("analysis");

  if (!date) {
    alert("Escolha uma data");
    return;
  }

  analysisBox.innerHTML =
    "<div class='analysis-block'>Buscando dados...</div>";

  const selecionadas = Array.from(
    document.querySelectorAll(".checks input:checked")
  ).map(el => el.id.replace("lot_", ""));

  let historico = [];
  let html = "";

  for (let i = 0; i < days; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    for (const lot of selecionadas) {
      const url =
        `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${LOTERIAS[lot]}&date=${dateStr}`;

      try {
        const r = await fetch(url);
        const j = await r.json();
        if (!j.data) continue;

        // mais recente primeiro
        [...j.data].reverse().forEach(game => {
          const nums = game.places
            .slice(0, 5)
            .map(n => n.padStart(4, "0"));

          historico.push({
            data: dateStr,
            nome: game.lotteryName,
            numeros: nums
          });
        });

      } catch (e) {
        console.warn("Erro API:", lot, dateStr);
      }
    }
  }

  if (historico.length === 0) {
    analysisBox.innerHTML =
      "<div class='analysis-block'>Nenhum dado encontrado.</div>";
    return;
  }

  html += analiseCruzada(historico);

  historico.forEach(item => {
    html += analyzeSorteio(item.data, item.nome, item.numeros);
  });

  analysisBox.innerHTML = html;
}

// =======================================================
// INSERÇÃO MANUAL
// =======================================================
function addManualResult() {
  const nome = document.getElementById("manual_name").value.trim();
  const data = document.getElementById("manual_date").value;
  const raw = document.getElementById("manual_numbers").value;

  if (!nome || !data || !raw) {
    alert("Preencha todos os campos do resultado manual.");
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

  document.getElementById("manual_name").value = "";
  document.getElementById("manual_date").value = "";
  document.getElementById("manual_numbers").value = "";
}

// =======================================================
// ANÁLISE CRUZADA ENTRE LOTERIAS
// =======================================================
function analiseCruzada(historico) {
  let html =
    `<div class="analysis-block"><strong>🔄 Análise cruzada</strong><br>`;

  const mapa = {};

  historico.forEach(h => {
    h.numeros.forEach(n => {
      const u = n[3];
      mapa[u] = (mapa[u] || 0) + 1;
    });
  });

  const fortes = Object.entries(mapa)
    .filter(([_, v]) => v >= 3)
    .map(([k]) => k);

  html += fortes.length
    ? `🔁 Dígitos recorrentes entre loterias: ${fortes.join(", ")}`
    : `Nenhuma recorrência forte detectada`;

  html += `</div>`;
  return html;
}

// =======================================================
// ANÁLISE INDIVIDUAL
// =======================================================
function analyzeSorteio(data, nome, numeros) {
  let score = 0;
  let html = `<div class="analysis-block">`;

  html += `<strong>📅 ${data}</strong><br>`;
  html += `<strong>${nome}</strong><br>`;
  html += `<div class="small">${numeros.join(" | ")}</div><br>`;

  // -------- AUSÊNCIA DE DÍGITOS --------
  const pres = new Set();
  numeros.forEach(n => n.split("").forEach(d => pres.add(d)));

  const aus = [];
  for (let i = 0; i <= 9; i++) {
    if (!pres.has(String(i))) aus.push(i);
  }

  if (aus.length) {
    score += 1;
    html += `⏳ Dígitos ausentes: ${aus.join(", ")}<br>`;
  } else {
    html += `⏳ Dígitos ausentes: NEGATIVO<br>`;
  }

  // -------- GRUPOS RELACIONADOS --------
  if (aus.length) {
    const g = new Set();
    aus.forEach(n => {
      [n, n + 10, n + 20].forEach(dz => {
        if (dz <= 99) g.add(getGrupoByDezena(dz));
      });
    });
    html += `🐂 Grupos relacionados: ${[...g].join(", ")}<br>`;
  }

  // -------- DUPLAS --------
  const dcount = {};
  numeros.forEach(n => {
    for (let i = 0; i < 3; i++) {
      const d = n.substring(i, i + 2);
      const k = [d, d.split("").reverse().join("")].sort().join("/");
      dcount[k] = (dcount[k] || 0) + 1;
    }
  });

  Object.entries(dcount).forEach(([d, v]) => {
    if (v >= 2) {
      score += 2;
      html += `🔁 Dupla: ${d} → ${v}x<br>`;
    }
  });

  // -------- SOMA / SUBTRAÇÃO JB --------
  const p = numeros[0];
  const a = Number(p.slice(0, 2));
  const b = Number(p.slice(2));
  const g = getGrupoByDezena(b);

  const soma = a + b + g;
  const sub = Math.abs(a - b - g);

  html += `➕ Soma JB: ${soma}<br>`;
  html += `➖ Subtração JB: ${sub}<br>`;

  // -------- MULTIPLICAÇÕES --------
  MULTIPLICADORES.forEach(m => {
    const r = String(Number(p) * m);
    Object.keys(dcount).forEach(d => {
      if (r.includes(d.split("/")[0])) {
        score += 1;
        html += `✖️ Multi ${m} coincidiu: ${d}<br>`;
      }
    });
  });

  // -------- PUXADAS --------
  if (PUXADAS[g]) {
    score += 2;
    html += `🔗 Puxada: ${g} → ${PUXADAS[g].join(", ")}<br>`;
  }

  // -------- INDICADOR FINAL --------
  let status = "❄️ Frio";
  if (score >= 5) status = "🔥 Quente";
  else if (score >= 3) status = "🌡 Morno";

  html += `<strong>📊 Força:</strong> ${status} (${score})<br>`;
  html += `</div>`;

  return html;
}
