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

  if (!date) return alert("Escolha uma data");

  const resultsBox = document.getElementById("results");
  const analysisBox = document.getElementById("analysis");

  resultsBox.textContent = "Buscando resultados...";
  analysisBox.textContent = "Analisando...";

  const baseDate = new Date(date);
  let output = "";
  let analysisOutput = "";

  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const url =
      `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${state}&date=${dateStr}`;

    try {
      const resp = await fetch(url);
      const json = await resp.json();

      output += `📅 ${dateStr}\n`;

      json.data.forEach(game => {
        const nums = game.places.map(n => n.padStart(4, "0"));

        output += `${game.lotteryName}\n`;
        output += nums.join(" | ") + "\n";

        analysisOutput += analyzeSorteio(game.lotteryName, nums);
        output += "\n";
      });

    } catch {
      output += `❌ Erro ao buscar ${dateStr}\n\n`;
    }
  }

  resultsBox.textContent = output;
  analysisBox.textContent = analysisOutput || "Nenhum padrão relevante.";
}

function analyzeSorteio(nome, numeros) {
  const rules = getRules();
  let text = `🔍 ${nome}\n`;

  const digitsPresent = new Set();
  numeros.forEach(n => n.split("").forEach(d => digitsPresent.add(d)));

  const ausentes = [];
  for (let d = 0; d <= 9; d++) {
    if (!digitsPresent.has(String(d))) ausentes.push(d);
  }

  if (rules.ausencia.ativa && ausentes.length >= rules.ausencia.min) {
    text += `⏳ Ausentes: ${ausentes.join(", ")}\n`;
  }

  let soma = numeros.reduce((a, b) => a + Number(b), 0);
  if (
    rules.soma.ativa &&
    (soma < rules.soma.min || soma > rules.soma.max)
  ) {
    text += `➕ Soma: ${soma}\n`;
  }

  let mult = 1;
  numeros.forEach(n => {
    mult *= Number(n.slice(-rules.mult.digits));
  });

  if (rules.mult.ativa) {
    text += `✖️ Mult: ${mult}\n`;
  }

  const duplaCount = {};
  numeros.forEach(n => {
    for (let i = 0; i < 3; i++) {
      const d = n.substring(i, i + 2);
      const inv = d.split("").reverse().join("");
      const key = [d, inv].sort().join("/");
      duplaCount[key] = (duplaCount[key] || 0) + 1;
    }
  });

  if (rules.dupla.ativa) {
    Object.entries(duplaCount)
      .filter(([_, v]) => v >= rules.dupla.min)
      .forEach(([d, v]) => {
        text += `🔁 Dupla ${d} → ${v}x\n`;
      });
  }

  return text + "\n";
}
