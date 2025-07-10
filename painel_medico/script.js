//const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw2cQ_qQXV704KTz3miKuqg5-tnrNAoDPf9go5Y5ZjCzwj2HVWadjnR9gfd8J7UKo96/exec";
function getWebAppUrl(consultorio) {
  const map = {
    "1":  "https://script.google.com/macros/s/AKfycbxR6DcsRmYQOVehWIDemVqexG0TCvGy7ou4OPOVkKAxFcg6BKysO4432SzET1b_lu2a/exec",
    "2":  "https://script.google.com/macros/s/AKfycbzFh1hzyQvw3ijj4k8tPZhPBwtmzVeInp3KBAFncFeTkyXObp-d8rGSNpCwQQhZcrbT/exec",
    "3":  "https://script.google.com/macros/s/AKfycbwq478S475027hYkhkF3RA8YmCV7YzkCtQ5PQ8Ky58AriLOyNyAdrZWlsrFScAQi23V/exec",
    "4":  "https://script.google.com/macros/s/AKfycbxkIhETWfF2bNWtGs6anLunrQtockjJBKcMLbiUvptIUowrX-G9yA5XFPuSoHCvQvv_/exec",
    "5":  "https://script.google.com/macros/s/AKfycbzq10EdJRwQ3V34Smmwh9u-GqlpagBZ1crvwh5iPY03gHSOdcKnCcjb3QPN9pY6SsHWAg/exec",
    "6":  "https://script.google.com/macros/s/AKfycbw36X-6FzPAfAljAEE_dcdh1Xw1RxjwV6ywdFoyv7OGVsivoAmFfSwNNhuUnsuWHa5zQw/exec",
    "7":  "https://script.google.com/macros/s/AKfycbzXxFWlSTiRJzEP4ghxTLCC-0muxEOTBU_JA9y9CpIP-Nhr9EfyKSwhOZsax7LriTRU/exec",
    "8":  "https://script.google.com/macros/s/AKfycbwLJG1980Wypf20lQOc1iLuDoVdKFYJUHvAuYEG0c6hhExdKGZmLGFsP_NicIijWp29/exec",
    "9":  "https://script.google.com/macros/s/AKfycbzUdlbSnWdQuqlqTVEN61-D4XxpbTvj7NZG-yisanB_OKyKfU517MiwhRLfXVAO_1q7/exec",
    "10": "https://script.google.com/macros/s/AKfycbwpMwIclLu44CWI-JgCxY2euwAA57ZZiaRQYvI0veeBnHf2grzFJ5IoLlbvOqByD9jh/exec",
    "11": "https://script.google.com/macros/s/AKfycbx38jlaW3rA6QvtFY0LQHKDrBCnf144Ei8pyc9HMQ0UzIsSHGfR-ZJnJMzotq8Iq0S6/exec",
    "12": "https://script.google.com/macros/s/AKfycbyc2FYKhJBO6TXhM70J9QnEPEbM7qAssk1LYn4tB85pMiG-mPiMzqZdQz-KrlNUJaul/exec"
  };

  const numero = consultorio?.replace(/\D/g, "");
  return map[numero] || "";
}

let consultorioSelecionado = localStorage.getItem("consultorioSelecionado") || "";
const WEB_APP_URL = getWebAppUrl(consultorioSelecionado);

const STORAGE_KEY = "ultimaAtualizacaoMedico";
let ultimaLeitura = localStorage.getItem(STORAGE_KEY) || "";
let isFirstLoad = true;
let senhas = [];
let especialidadesSelecionadas = [];

const tbody = document.querySelector("#senhaTable tbody");
const spanMaquina = document.getElementById("spanMaquina");
const filtroEspecialidades = document.getElementById("filtroEspecialidades");
const selectAll = document.getElementById("selectAll");

// Reload automático a cada 15 minutos
setInterval(() => location.reload(), 15 * 60 * 1000);

// Engrenagem
document.getElementById("btnEngrenagem").addEventListener("click", () => {
  document.getElementById("modalMaquina").classList.add("show");
  const saved = localStorage.getItem("consultorioSelecionado");
  if (saved) {
    document.querySelectorAll("input[name='consultorio']").forEach(r => r.checked = r.value === saved);
  }
});
document.getElementById("cancelarMaquinaBtn").addEventListener("click", () => {
  document.getElementById("modalMaquina").classList.remove("show");
});
document.getElementById("salvarMaquinaBtn").addEventListener("click", () => {
  const sel = document.querySelector("input[name='consultorio']:checked");
  if (!sel) return alert("Selecione um consultório.");
  consultorioSelecionado = sel.value;
  localStorage.setItem("consultorioSelecionado", consultorioSelecionado);
  spanMaquina.textContent = `(Consultório atual: ${consultorioSelecionado})`;
  document.getElementById("modalMaquina").classList.remove("show");
  
  window.location.reload(); // Força recarregamento para usar nova URL correta

});

// Filtro especialidade
document.getElementById("btnFiltroEspecialidade").addEventListener("click", () => {
  filtroEspecialidades.classList.toggle("show");
});
document.getElementById("fecharFiltroBtn").addEventListener("click", () => {
  filtroEspecialidades.classList.remove("show");
});
selectAll.addEventListener("change", () => {
  document.querySelectorAll(".especialidade").forEach(cb => cb.checked = selectAll.checked);
  atualizarFiltroEspecialidades();
});
document.querySelectorAll(".especialidade").forEach(cb =>
  cb.addEventListener("change", atualizarFiltroEspecialidades)
);

function atualizarFiltroEspecialidades() {
  especialidadesSelecionadas = Array.from(document.querySelectorAll(".especialidade:checked"))
    .map(cb => cb.value);
  render();
}

// Modal confirmar
let senhaSelecionada = "";
document.getElementById("btnCancelarConfirmar").addEventListener("click", () => {
  document.getElementById("modalConfirmar").classList.remove("show");
});
document.getElementById("btnConfirmarFinalizar").addEventListener("click", finalizarAtendimento);

function abrirModalConfirmar(senha) {
  senhaSelecionada = senha;
  document.getElementById("senhaConfirmar").textContent = senha;
  document.getElementById("modalConfirmar").classList.add("show");
}

function mostrarMensagem(texto) {
  const el = document.createElement("div");
  el.textContent = texto;
  el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#38c172;color:#fff;padding:10px 20px;border-radius:5px;z-index:9999;font-weight:bold";
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 3000);
}

async function chamarPaciente(senha) {
  if (!consultorioSelecionado) return alert("Selecione um consultório.");

  try {
    const resp = await fetch(`${WEB_APP_URL}?action=registrarChamadaTV&senha=${encodeURIComponent(senha)}&consultorio=${encodeURIComponent(consultorioSelecionado)}`);
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Paciente chamado.");
      isFirstLoad = true;
      carregarSenhas(true);
    } else {
      alert("Erro ao chamar: " + result.message);
    }
  } catch (e) {
    console.error("Erro ao chamar:", e);
  }
}

async function finalizarAtendimento() {
  if (!consultorioSelecionado) return alert("Selecione um consultório.");

  try {
    const resp = await fetch(`${WEB_APP_URL}?action=liberar&senha=${encodeURIComponent(senhaSelecionada)}&consultorio=${encodeURIComponent(consultorioSelecionado)}`);
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Atendimento finalizado.");
      document.getElementById("modalConfirmar").classList.remove("show");
      isFirstLoad = true;
      carregarSenhas(true);
    } else {
      alert("Erro ao finalizar: " + result.message);
    }
  } catch (e) {
    console.error("Erro ao finalizar:", e);
  }
}

function render() {
  tbody.innerHTML = "";
  senhas
    .filter(s =>
      !especialidadesSelecionadas.length ||
      especialidadesSelecionadas.includes(s.especialidade)
    )
    .forEach(({ senha, nome, idade, data, status, especialidade, cor }) => {
      const tr = document.createElement("tr");
      if (status === "Em atendimento") tr.style.background = "#ffe5e5";
      tr.innerHTML = `
        <td>${senha}</td>
        <td>${nome || "-"}</td>
        <td>${idade || "-"}</td>
        <td>${new Date(data).toLocaleString()}</td>
        <td>${status}</td>
        <td>${especialidade}</td>
        <td><span class="cor-bolinha cor-${cor?.trim() || ""}"></span></td>
        <td>
          <button class="btn-primario" onclick="chamarPaciente('${senha}')">📣 Chamar</button>
          <button class="btn-finalizar" onclick="abrirModalConfirmar('${senha}')">Finalizar</button>

        </td>
      `;
      tbody.appendChild(tr);
    });
}

async function carregarSenhas(forcarAtualizacao = false) {
  const tsCliente = forcarAtualizacao || isFirstLoad ? "" : ultimaLeitura;
  isFirstLoad = false;

  try {
    const url = `${WEB_APP_URL}?action=listar&timestamp=${encodeURIComponent(tsCliente)}`;
    const resp = await fetch(url);
    const result = await resp.json();

    if (!result.atualizacao) {
      console.log(`[${new Date().toLocaleTimeString()}] Nenhuma atualização detectada.`);
      return;
    }

    console.log(`[${new Date().toLocaleTimeString()}] Atualização detectada!`, result.ultimaLeitura);
    senhas = result.senhas;
    ultimaLeitura = result.ultimaLeitura;
    localStorage.setItem(STORAGE_KEY, ultimaLeitura);
    render();
  } catch (e) {
    console.error("Erro ao carregar senhas:", e);
  }
}

window.addEventListener("load", () => {
  consultorioSelecionado = localStorage.getItem("consultorioSelecionado") || "";
  if (consultorioSelecionado) {
    spanMaquina.textContent = `(Consultório atual: ${consultorioSelecionado})`;
  }

  window.chamarPaciente = chamarPaciente;
  window.abrirModalConfirmar = abrirModalConfirmar;

  carregarSenhas(true);
  setInterval(() => carregarSenhas(false), 10000);
});