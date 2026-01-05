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
    if (state === "BA") apiState = "BA";

    const url = `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${apiState}&date=${dateStr}`;

    try {
      const resp = await fetch(url);
      const json = await resp.json();

      if (!json.data || json.data.length === 0) {
        continue;
      }

      json.data.forEach(game => {
        const nums = game.places
          .slice(0, 5) // 🔥 somente 1º ao 5º
          .map(n => n.padStart(4, "0"));

        analysisOutput += analyzeSorteio(
          dateStr,
          game.lotteryName,
          nums
        );
      });

    } catch (e) {
      console.error("Erro ao buscar", dateStr, e);
    }
  }

  analysisBox.innerHTML =
    analysisOutput || "<div class='analysis-block'>Nenhum padrão relevante encontrado.</div>";
}

function analyzeSorteio(data, nome, numeros) {
  const rules = getRules();
  let html = `<div class="analysis-block">`;

  // CONTEXTO
  html += `<div><strong>📅 ${data}</strong></div>`;
  html += `<div><strong>${nome}</strong></div>`;
  html += `<div class="small">${numeros.join(" | ")}</div><br>`;

  // DÍGITOS PRESENTES
  const digitsPresent = new Set();
  numeros.forEach(n => n.split("").forEach(d => digitsPresent.add(d)));

  // AUSENTES
  const ausentes = [];
  for (let d = 0; d <= 9; d++) {
    if (!digitsPresent.has(String(d))) ausentes.push(d);
  }

  if (rules.ausencia.ativa && ausentes.length >= rules.ausencia.min) {
    html += `⏳ <strong>Ausentes:</strong> ${ausentes.join(", ")}<br>`;
  }

  // SOMA
  const soma = numeros.reduce((a, b) => a + Number(b), 0);
  if (
    rules.soma.ativa &&
    soma >= rules.soma.min &&
    soma <= rules.soma.max
  ) {
    html += `➕ <strong>Soma:</strong> ${soma}<br>`;
  }

  // MULTIPLICAÇÃO
  if (rules.mult.ativa) {
    let mult = 1;
    numeros.forEach(n => {
      mult *= Number(n.slice(-rules.mult.digits));
    });
    html += `✖️ <strong>Mult:</strong> ${mult}<br>`;
  }

  // DUPLAS
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

  html += `</div>`;
  return html;
}
