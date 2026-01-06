/* ===============================
   CONFIGURAÇÕES FIXAS DA MÁQUINA
================================= */

const RULES = {
  ausenciaNumero: true,
  duplaMin: 2
};

/* ===============================
   UTILITÁRIOS
================================= */

function pad(num) {
  return num.toString().padStart(4, "0");
}

function parseManualNumbers(text) {
  return text
    .split(",")
    .map(n => n.trim())
    .filter(n => n.length)
    .map(n => pad(n));
}

/* ===============================
   MOTOR DE ANÁLISE
================================= */

function analyzeDraw(date, name, numbers) {
  let html = `<div class="analysis-block">`;

  html += `<strong>📅 ${date}</strong><br>`;
  html += `<strong>${name}</strong><br>`;
  html += `<div class="small">${numbers.join(" | ")}</div><br>`;

  /* ===== AUSÊNCIA DE NÚMERO (0–9) ===== */
  if (RULES.ausenciaNumero) {
    const present = new Set();
    numbers.forEach(n => {
      n.split("").forEach(d => present.add(d));
    });

    const absent = [];
    for (let i = 0; i <= 9; i++) {
      if (!present.has(String(i))) absent.push(i);
    }

    if (absent.length) {
      html += `⏳ <strong>Números ausentes:</strong> ${absent.join(", ")}<br>`;
    }
  }

  /* ===== DUPLAS ===== */
  const duplaCount = {};
  numbers.forEach(n => {
    for (let i = 0; i < n.length - 1; i++) {
      const d = n.substring(i, i + 2);
      const inv = d.split("").reverse().join("");
      const key = [d, inv].sort().join("/");
      duplaCount[key] = (duplaCount[key] || 0) + 1;
    }
  });

  Object.entries(duplaCount)
    .filter(([_, v]) => v >= RULES.duplaMin)
    .forEach(([d, v]) => {
      html += `🔁 <strong>Dupla:</strong> ${d} → ${v}x<br>`;
    });

  html += `</div>`;
  return html;
}

/* ===============================
   BUSCA AUTOMÁTICA (API)
================================= */

async function loadData() {
  const dateInput = document.getElementById("date").value;
  const days = Number(document.getElementById("days").value);
  const analysisBox = document.getElementById("analysis");

  if (!dateInput) {
    alert("Escolha uma data");
    return;
  }

  analysisBox.innerHTML = `<div class="analysis-block">Buscando dados...</div>`;

  const lotteries = [];
  if (document.getElementById("lot_LOOK").checked) lotteries.push("LOOK");
  if (document.getElementById("lot_RJ").checked) lotteries.push("RJ");
  if (document.getElementById("lot_SP").checked) lotteries.push("SP");
  if (document.getElementById("lot_NACIONAL").checked) lotteries.push("NACIONAL");

  const baseDate = new Date(dateInput);
  let output = "";

  for (let d = 0; d < days; d++) {
    const current = new Date(baseDate);
    current.setDate(current.getDate() - d);
    const dateStr = current.toISOString().split("T")[0];

    for (const lot of lotteries) {
      let apiState = lot;
      if (lot === "NACIONAL") apiState = "DF";

      const url =
        `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${apiState}&date=${dateStr}`;

      try {
        const resp = await fetch(url);
        const json = await resp.json();

        if (!json.data) continue;

        // mais recente primeiro
        const games = [...json.data].reverse();

        games.forEach(game => {
          const nums = game.places
            .slice(0, 5)
            .map(n => pad(n));

          output += analyzeDraw(
            dateStr,
            `${game.lotteryName}`,
            nums
          );
        });

      } catch (e) {
        console.warn("Erro:", lot, dateStr);
      }
    }
  }

  analysisBox.innerHTML =
    output || `<div class="analysis-block">Nenhum dado encontrado.</div>`;
}

/* ===============================
   ENTRADA MANUAL
================================= */

function addManualResult() {
  const name = document.getElementById("manual_name").value;
  const date = document.getElementById("manual_date").value;
  const numbersText = document.getElementById("manual_numbers").value;
  const analysisBox = document.getElementById("analysis");

  if (!name || !date || !numbersText) {
    alert("Preencha todos os campos do resultado manual");
    return;
  }

  const numbers = parseManualNumbers(numbersText);

  const html = analyzeDraw(date, name, numbers);

  analysisBox.innerHTML = html + analysisBox.innerHTML;

  // limpa campos
  document.getElementById("manual_name").value = "";
  document.getElementById("manual_numbers").value = "";
}
