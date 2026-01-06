// ===============================
// CONFIGURAÇÃO DAS LOTERIAS
// ===============================
const LOTERIAS = {
  lot_LOOK: "GO",
  lot_RJ: "RJ",
  lot_SP: "SP",
  lot_NACIONAL: "DF"
};

// ===============================
// GRUPO DO JOGO DO BICHO (CORRETO)
// ===============================
function getGrupoByDezena(dezena) {
  if (dezena === 0) return 25;
  return Math.ceil(dezena / 4);
}

// ===============================
// BUSCAR RESULTADOS (API)
// ===============================
async function loadData() {
  const date = document.getElementById("date").value;
  const days = Number(document.getElementById("days").value);
  const analysisBox = document.getElementById("analysis");

  if (!date) {
    alert("Escolha uma data");
    return;
  }

  analysisBox.innerHTML =
    "<div class='analysis-block'>Aguardando dados...</div>";

  // pegar checkboxes pelo ID (igual ao HTML)
  const selecionadas = Object.keys(LOTERIAS).filter(id =>
    document.getElementById(id)?.checked
  );

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

    for (const lotId of selecionadas) {
      const state = LOTERIAS[lotId];
      const url =
        `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${state}&date=${dateStr}`;

      try {
        const resp = await fetch(url);
        const json = await resp.json();

        if (!json.data || json.data.length === 0) continue;

        // mais recente primeiro
        const jogos = [...json.data].reverse();

        jogos.forEach(game => {
          const numeros = game.places
            .slice(0, 5)
            .map(n => n.padStart(4, "0"));

          html += analyzeSorteio(
            dateStr,
            game.lotteryName,
            numeros
          );
        });

      } catch (e) {
        console.warn("Erro ao buscar:", state, dateStr);
      }
    }
  }

  analysisBox.innerHTML =
    html || "<div class='analysis-block'>Nenhum dado encontrado.</div>";
}

// ===============================
// INSERÇÃO MANUAL (ALINHADA AO HTML)
// ===============================
function addManualResult() {
  const nome = document.getElementById("manual_name").value.trim();
  const data = document.getElementById("manual_date").value;
  const raw = document.getElementById("manual_numbers").value;
  const analysisBox = document.getElementById("analysis");

  if (!nome || !data || !raw) {
    alert("Preencha todos os campos do resultado manual.");
    return;
  }

  const numeros = raw
    .split(",")
    .map(n => n.trim())
    .filter(n => /^\d{4}$/.test(n))
    .slice(0, 5);

  if (numeros.length < 5) {
    alert("Informe exatamente 5 números de 4 dígitos.");
    return;
  }

  analysisBox.innerHTML =
    analyzeSorteio(data, nome, numeros) + analysisBox.innerHTML;
}

// ===============================
// ANÁLISE PRINCIPAL
// ===============================
function analyzeSorteio(data, nome, numeros) {
  let html = `<div class="analysis-block">`;

  html += `<div><strong>📅 ${data}</strong></div>`;
  html += `<div><strong>${nome}</strong></div>`;
  html += `<div class="small">${numeros.join(" | ")}</div><br>`;

  // ===============================
  // AUSÊNCIA POR NÚMERO (1º PRÊMIO)
  // ===============================
  const primeiro = numeros[0];
  const digitosPresentes = new Set(primeiro.split(""));

  const ausentes = [];
  for (let i = 0; i <= 9; i++) {
    if (!digitosPresentes.has(String(i))) ausentes.push(i);
  }

  if (ausentes.length > 0) {
    html += `⏳ <strong>Números ausentes (1º prêmio):</strong> ${ausentes.join(", ")}<br>`;

    const grupos = [];
    ausentes.forEach(n => {
      [n, n + 10, n + 20].forEach(dz => {
        if (dz <= 99) grupos.push(getGrupoByDezena(dz));
      });
    });

    html += `🐂 <strong>Grupos fortes:</strong> ${[...new Set(grupos)].join(", ")}<br>`;
  }

  // ===============================
  // DUPLAS
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
