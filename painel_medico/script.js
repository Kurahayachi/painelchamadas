const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz_pb2JMaCO-fuTVfXmY7iEXA3SWRxXMRZqL5Q1M6TRhW3HUFAWOnM4OxoGFyidGSxi/exec";
const STORAGE_KEY = "ultimaAtualizacaoMedico";
let ultimaLeitura = localStorage.getItem(STORAGE_KEY) || "";
let isFirstLoad = true;
let senhas = [];
let consultorioSelecionado = "";
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
  carregarSenhas(true);
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
          <button onclick="chamarPaciente('${senha}')">📣</button>
          <button onclick="abrirModalConfirmar('${senha}')">Finalizar</button>
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