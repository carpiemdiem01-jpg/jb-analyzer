// =======================
// REGRAS
// =======================
function getRules() {
  return {
    dupla: {
      ativa: document.getElementById("r_dupla").checked,
      min: Number(document.getElementById("r_dupla_min").value)
    },
    ausencia: {
      ativa: document.getElementById("r_ausencia").checked,
      min: Number(document.getElementById("r_ausencia_min").value)
    },
    soma: {
      ativa: document.getElementById("r_soma").checked,
      min: Number(document.getElementById("r_soma_min").value),
      max: Number(document.getElementById("r_soma_max").value)
    },
    mult: {
      ativa: document.getElementById("r_mult").checked,
      digits: Number(document.getElementById("r_mult_digits").value)
    }
  };
}

// =======================
// MAPA DE PUXADA (CONFIRMADO)
// =======================
const puxadas = {
  AVESTRUZ: "VEADO",
  VEADO: "AVESTRUZ",

  AGUIA: "URSO",
  URSO: "AGUIA",

  BURRO: "TIGRE",
  TIGRE: "BURRO",

  BORBOLETA: "TOURO",
  TOURO: "BORBOLETA",

  CACHORRO: "PERU",
  PERU: "CACHORRO",

  CABRA: "PAVAO",
  PAVAO: "CABRA",

  CARNEIRO: "PORCO",
  PORCO: "CARNEIRO",

  CAMELO: "MACACO",
  MACACO: "CAMELO",

  COBRA: "LEAO",
  LEAO: "COBRA",

  COELHO: "JACARE",
  JACARE: "COELHO",

  CAVALO: "GATO",
  GATO: "CAVALO",

  ELEFANTE: "GALO",
  GALO: "ELEFANTE",

  VACA: "VACA"
};

// =======================
// BUSCA DE DADOS
// =======================
async function loadData() {
  const state = document.getElementById("state").value;
  const date = document.getElementById("date").value;
  const days = Number(document.getElementById("days").value);

  if (!date) {
    alert("Escolha uma data");
    return;
  }

  const analysisBox = document.getElementById("analysis");
  analysisBox.innerHTML = "<div class='analysis-block'>Buscando dados...</div>";

  const baseDate = new Date(date);
  let analysisOutput = "";

  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    let apiState = state;
    if (state === "NACIONAL") apiState = "DF";

    const url = `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${apiState}&date=${dateStr}`;

    try {
      const resp = await fetch(url);
      const json = await resp.json();
      if (!json.data || json.data.length === 0) continue;

      // 🔥 ORDENA DO MAIS RECENTE PARA O MAIS ANTIGO
      const jogosOrdenados = json.data.sort((a, b) => {
        const ha = parseInt(a.lotteryName.match(/\d+/));
        const hb = parseInt(b.lotteryName.match(/\d+/));
        return hb - ha;
      });

      jogosOrdenados.forEach(game => {
        const nums = game.places
          .slice(0, 5)
          .map(n => n.padStart(4, "0"));

        analysisOutput += analyzeSorteio(
          dateStr,
          game.lotteryName,
          nums
        );
      });

    } catch {
      continue;
    }
  }

  analysisBox.innerHTML =
    analysisOutput || "<div class='analysis-block'>Nenhum padrão relevante.</div>";
}

// =======================
// ANÁLISE UNIFICADA
// =======================
function analyzeSorteio(data, nome, numeros) {
  const rules = getRules();
  let html = `<div class="analysis-block">`;

  html += `<div><strong>📅 ${data}</strong></div>`;
  html += `<div><strong>${nome}</strong></div>`;
  html += `<div class="small">${numeros.join(" | ")}</div><br>`;

  // ===== AUSÊNCIA (FINAIS)
  const finais = numeros.map(n => n.slice(-1));
  const ausentes = [];
  for (let d = 0; d <= 9; d++) {
    if (!finais.includes(String(d))) ausentes.push(d);
  }

  if (rules.ausencia.ativa && ausentes.length >= rules.ausencia.min) {
    html += `⏳ <strong>Finais ausentes:</strong> ${ausentes.join(", ")}<br>`;
  }

  // ===== DUPLAS
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

  // ===== PUXADA (MARCAÇÃO)
  const nomeBicho = nome.split(" ")[0].toUpperCase();
  if (puxadas[nomeBicho]) {
    html += `🐾 <strong>Puxada:</strong> ${nomeBicho} ⇄ ${puxadas[nomeBicho]}<br>`;
  }

  html += `</div>`;
  return html;
}
