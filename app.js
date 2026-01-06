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
// GRUPO DO JOGO DO BICHO
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

  const selecionadas = Object.keys(LOTERIAS).filter(id =>
    document.getElementById(id)?.checked
  );

  if (selecionadas.length === 0) {
    analysisBox.innerHTML =
      "<div class='analysis-block'>Nenhuma loteria selecionada.</div>";
    return;
  }

  const baseDate = new Date(date);
  let sorteios = [];

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

        if (!json.data) continue;

        json.data.forEach(game => {
          const numeros = game.places
            .slice(0, 5)
            .map(n => n.padStart(4, "0"));

          sorteios.push({
            data: dateStr,
            nome: game.lotteryName,
            numeros
          });
        });
      } catch {}
    }
  }

  renderAnalises(sorteios);
}

// ===============================
// INSERÇÃO MANUAL
// ===============================
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

  if (numeros.length < 5) {
    alert("Informe exatamente 5 números de 4 dígitos.");
    return;
  }

  renderAnalises([{ data, nome, numeros }], true);
}

// ===============================
// RENDERIZA TODAS AS ANÁLISES
// ===============================
function renderAnalises(sorteios, prepend = false) {
  const analysisBox = document.getElementById("analysis");
  let html = "";

  if (!prepend) {
    html += analiseGeralAusencias(sorteios);
  }

  sorteios.forEach(s => {
    html += analisePorSorteio(s);
  });

  analysisBox.innerHTML = prepend
    ? html + analysisBox.innerHTML
    : html || "<div class='analysis-block'>Nenhum dado encontrado.</div>";
}

// ===============================
// ANÁLISE GERAL DE AUSÊNCIAS (1º PRÊMIO)
// ===============================
function analiseGeralAusencias(sorteios) {
  const dig = new Set();
  const dez = new Set();
  const uni = new Set();

  sorteios.forEach(s => {
    const p = s.numeros[0];
    dig.add(p[0]);
    dig.add(p[1]);
    dig.add(p[2]);
    dig.add(p[3]);
    dez.add(p[2]);
    uni.add(p[3]);
  });

  const ausDig = [];
  const ausDez = [];
  const ausUni = [];

  for (let i = 0; i <= 9; i++) {
    if (!dig.has(String(i))) ausDig.push(i);
    if (!dez.has(String(i))) ausDez.push(i);
    if (!uni.has(String(i))) ausUni.push(i);
  }

  return `
  <div class="analysis-block">
    <strong>📊 Análise geral de ausências (1º prêmio)</strong><br>
    🔢 Dígitos ausentes: ${ausDig.join(", ") || "nenhum"}<br>
    🔟 Dezena ausente (3º dígito): ${ausDez.join(", ") || "nenhuma"}<br>
    🔢 Unidade ausente (4º dígito): ${ausUni.join(", ") || "nenhuma"}
  </div>`;
}

// ===============================
// ANÁLISE POR SORTEIO
// ===============================
function analisePorSorteio(s) {
  let html = `<div class="analysis-block">`;

  html += `<div><strong>📅 ${s.data}</strong></div>`;
  html += `<div><strong>${s.nome}</strong></div>`;
  html += `<div class="small">${s.numeros.join(" | ")}</div><br>`;

  const presentes = new Set();
  s.numeros.forEach(n => n.split("").forEach(d => presentes.add(d)));

  const ausentes = [];
  for (let i = 0; i <= 9; i++) {
    if (!presentes.has(String(i))) ausentes.push(i);
  }

  if (ausentes.length > 0) {
    html += `⏳ <strong>Dígitos ausentes:</strong> ${ausentes.join(", ")}<br>`;

    const grupos = [];
    ausentes.forEach(n => {
      [n, n + 10, n + 20].forEach(dz => {
        if (dz <= 99) grupos.push(getGrupoByDezena(dz));
      });
    });

    html += `🐂 <strong>Grupos relacionados:</strong> ${[...new Set(grupos)].join(", ")}<br>`;
  }

  const duplaCount = {};
  s.numeros.forEach(n => {
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
