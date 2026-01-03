async function loadData() {
  const state = document.getElementById("state").value;
  const date = document.getElementById("date").value;

  if (!date) {
    alert("Escolha uma data");
    return;
  }

  const resultsBox = document.getElementById("results");
  const analysisBox = document.getElementById("analysis");

  resultsBox.textContent = "Buscando resultados...";
  analysisBox.textContent = "Processando análises...";

  const baseDate = new Date(date);
  const allNumbers = [];
  let output = "";

  for (let i = 0; i < 5; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const url = `https://corsproxy.io/?https://api.pontodobicho.com/bets/jb/results?state=${state}&date=${dateStr}`;
    const resp = await fetch(url);
    const json = await resp.json();

    output += `📅 ${dateStr}\n`;

    json.data.forEach(game => {
      output += `${game.lotteryName}\n`;
      const nums = game.places.map(n => n.padStart(4, "0"));
      nums.forEach(n => allNumbers.push(n));
      output += nums.join(" | ") + "\n\n";
    });
  }

  resultsBox.textContent = output;
  analysisBox.textContent = runAnalysis(allNumbers);
}

function runAnalysis(numbers) {
  const digitCount = {};
  const duplaCount = {};

  numbers.forEach(n => {
    n.split("").forEach(d => {
      digitCount[d] = (digitCount[d] || 0) + 1;
    });

    for (let i = 0; i < 3; i++) {
      const d = n.substring(i, i + 2);
      const inv = d.split("").reverse().join("");
      const key = [d, inv].sort().join("/");
      duplaCount[key] = (duplaCount[key] || 0) + 1;
    }
  });

  let report = "🔁 DUPLAS COINCIDENTES (≥3)\n";
  Object.entries(duplaCount)
    .filter(([_, v]) => v >= 3)
    .sort((a, b) => b[1] - a[1])
    .forEach(([d, v]) => report += `${d} → ${v}x\n`);

  report += "\n🔢 DÍGITOS MAIS FREQUENTES\n";
  Object.entries(digitCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .forEach(([d, v]) => report += `${d}: ${v}x\n`);

  const soma = numbers.slice(0, 5).reduce((a, b) => a + Number(b), 0);
  report += `\n➕ SOMA (ref): ${String(soma).slice(-4)}\n`;

  let mult = 1;
  numbers.slice(0, 5).forEach(n => mult *= Number(n.slice(-2)));
  report += `✖️ MULT (ref): ${String(mult).slice(-5)}\n`;

  return report || "Nenhum padrão relevante detectado.";
}

