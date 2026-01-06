// ===============================
// HISTÓRICO PARA ANÁLISE TEMPORAL
// ===============================
const historyByLottery = {};

// ===============================
// REGRAS FIXAS (INTERNAS)
// ===============================
function getRules() {
  return {
    ausencia: { ativa: true },
    dupla: { ativa: true, min: 2 }
  };
}

// ===============================
// FUNÇÃO PRINCIPAL
// ===============================
async function loadData() {
  const state = document.getElementById("state").value;
  const date = document.getElementById("date").value;
  const days = Number(document.getElementById("days").value);

  if (!date) {
    alert("Escolha uma data");
    return;
  }

  const analysisBox = document.getElementById("analysis");
  analysisBox.innerHTML =
    "<div class='analysis-block'>Buscando resultados...</div>";

  let output = "";
  const baseDate = new Date(date);

  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    let apiState = state;
    if (state === "NACIONAL") apiState = "DF";

    const url =
      `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${apiState}&date=${dateStr}`;

    try {
      const resp = await fetch(url);
      const json = await resp.json();
      if (!json.data || json.data.length === 0) continue;

      // 🔥 MAIS RECENTE PRIMEIRO
      const games = [...json.data].reverse();

      games.forEach(game => {
        const numeros = game.places
          .slice(0, 5)
          .map(n => n.padStart(4, "0"));

        output += analyzeSorteio(
          dateStr,
          game.lotteryName,
          numeros
        );
      });

    } catch {
      continue;
    }
  }

  analysisBox.innerHTML =
    output || "<div class='analysis-block'>Nenhum padrão relevante.</div>";
}

// ===============================
// ANÁLISE UNIFICADA
// ===============================
function analyzeSorteio(data, nome, numeros) {
  const rules = getRules();

  if (!historyByLottery[nome]) {
    historyByLottery[nome] = [];
  }

  const history = historyByLottery[nome];

  let html = `<div class="analysis-block">`;

  // CONTEXTO
  html += `<div><strong>📅 ${data}</strong></div>`;
  html += `<div><strong>${nome}</strong></div>`;
  html += `<div class="small">${numeros.join(" | ")}</div><br>`;

  // ===============================
  // AUSÊNCIA (FINAIS)
  // ===============================
  if (rules.ausencia.ativa) {
    const finais = numeros.map(n => n.slice(-1));
    const ausentes = [];
    for (let d = 0; d <= 9; d++) {
      if (!finais.includes(String(d))) ausentes.push(d);
    }
    if (ausentes.length > 0) {
      html += `⏳ <strong>Finais ausentes:</strong> ${ausentes.join(", ")}<br>`;
    }
  }

  // ===============================
  // DUPLAS
  // ===============================
  if (rules.dupla.ativa) {
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
      .filter(([_, v]) => v >= rules.dupla.min)
      .forEach(([d, v]) => {
        html += `🔁 <strong>Dupla:</strong> ${d} → ${v}x<br>`;
      });
  }

  // ===============================
  // CONTINUIDADE / ECO TEMPORAL
  // ===============================
  if (history.length > 0) {
    const atual = numeros.map(n => n.slice(-2));

    const check = (label, past) => {
      const pastDezenas = past.map(n => n.slice(-2));
      const hits = atual.filter(d => pastDezenas.includes(d));
      if (hits.length > 0) {
        html += `⏭️ <strong>${label}:</strong> ${hits.join(", ")}<br>`;
      }
    };

    check("Eco do sorteio anterior", history[history.length - 1]);

    if (history.length > 1) {
      check("Eco do penúltimo sorteio", history[history.length - 2]);
    }
  }

  // Atualiza histórico (máx 2)
  history.push(numeros);
  if (history.length > 2) history.shift();

  html += `</div>`;
  return html;
}
