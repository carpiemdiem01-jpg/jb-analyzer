async function loadData() {
  const state = document.getElementById("state").value;
  const date = document.getElementById("date").value;
  const days = Number(document.getElementById("days").value);

  if (!date) {
    alert("Escolha uma data");
    return;
  }

  const resultsBox = document.getElementById("results");
  const analysisBox = document.getElementById("analysis");

  resultsBox.textContent = "Buscando resultados...";
  analysisBox.textContent = "Processando análises...";

  let analysisOutput = "";
  let resultsOutput = "";

  const baseDate = new Date(date);

  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);

    const url = `https://api.pontodobicho.com/bets/jb/results?state=${state}&date=${iso}`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!json.data) continue;

      resultsOutput += `<div><strong>${iso}</strong></div>`;

      json.data.forEach(game => {
        const nums = game.places
          .slice(0, 5) // 🔥 somente 1º ao 5º
          .map(n => n.padStart(4, "0"));

        resultsOutput += `<div class="small">${game.lotteryName}: ${nums.join(" | ")}</div>`;

        analysisOutput += analyzeSorteio(game.lotteryName, nums);
      });

      resultsOutput += `<br>`;
    } catch (e) {
      console.error(e);
    }
  }

  resultsBox.innerHTML = resultsOutput || "Nenhum resultado encontrado.";
  analysisBox.innerHTML = analysisOutput || "<em>Nenhuma análise relevante.</em>";
}

function analyzeSorteio(nome, nums) {
  let html = "";

  // AUSENTES
  const ausentes = [];
  for (let d = 0; d <= 9; d++) {
    if (!nums.join("").includes(d.toString())) ausentes.push(d);
  }
  if (ausentes.length > 0) {
    html += `<div>⏳ <strong>Ausentes:</strong> ${ausentes.join(", ")}</div>`;
  }

  // SOMA
  const soma = nums.reduce((a, n) => a + Number(n), 0);
  html += `<div>➕ <strong>Soma:</strong> ${soma}</div>`;

  // MULT
  const mult = nums.reduce((a, n) => a * Number(n), 1);
  html += `<div>✖️ <strong>Mult:</strong> ${mult}</div>`;

  // DUPLAS
  const duplas = {};
  nums.forEach(n => {
    const d = n.slice(-2);
    const inv = d.split("").reverse().join("");
    duplas[d] = (duplas[d] || 0) + 1;
    if (inv !== d) duplas[inv] = (duplas[inv] || 0) + 1;
  });

  Object.entries(duplas)
    .filter(([_, v]) => v >= 3)
    .forEach(([k, v]) => {
      html += `<div>🔁 <strong>Dupla:</strong> ${k} → ${v}x</div>`;
    });

  return `
    <div class="analysis-block">
      <div class="analysis-title">🔍 ${nome}</div>
      ${html}
    </div>
  `;
}
