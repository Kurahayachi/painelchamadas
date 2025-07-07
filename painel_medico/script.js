/**
 * Sistema de Gestão de Senhas
 * Desenvolvido por Igor M. Kurahayachi
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbyo8Qw9Kc6V7pyo8fB_5ABqY7lvXQQ2n3aUPgrbjFy-0helPtsCRZamaTYhptgvFTE8/exec";

// Auto-reload a cada 15 minutos para manter a sessão ativa
setInterval(() => {
    console.log("⏳ 15 minutos se passaram, recarregando o painel de médico...");
    location.reload();
}, 15 * 60 * 1000);

let senhas = [];
let consultorioSelecionado = "";
let especialidadesSelecionadas = [];
let ultimaLeitura = "";
let senhaConfirmar = "";    // necessário para o modal de finalizar
let senhaSelecionada = "";  // guarda a senha ao abrir o modal

const tbody = document.querySelector("#senhaTable tbody");
const spanMaquina = document.getElementById("spanMaquina");
const modalMaquina = document.getElementById("modalMaquina");
const btnEngrenagem = document.getElementById("btnEngrenagem");
const salvarMaquinaBtn = document.getElementById("salvarMaquinaBtn");
const cancelarMaquinaBtn = document.getElementById("cancelarMaquinaBtn");
const btnFiltro = document.getElementById("btnFiltroEspecialidade");
const filtroEspecialidades = document.getElementById("filtroEspecialidades");
const selectAll = document.getElementById("selectAll");

// Notificador visual
const notificador = document.createElement("div");
notificador.id = "notificador";
Object.assign(notificador.style, {
  position: "fixed", top: "15px", left: "50%",
  transform: "translateX(-50%)",
  background: "#38c172", color: "white",
  padding: "10px 20px", borderRadius: "5px",
  display: "none", zIndex: "9999", fontWeight: "bold",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
});
document.body.appendChild(notificador);

function mostrarMensagem(texto) {
  notificador.textContent = texto;
  notificador.style.display = "block";
  setTimeout(() => notificador.style.display = "none", 3000);
}

// Configuração do consultório
btnEngrenagem.addEventListener("click", () => {
  modalMaquina.classList.add("show");
  const saved = localStorage.getItem("consultorioSelecionado");
  if (saved) {
    document.querySelectorAll("input[name='consultorio']")
      .forEach(r => r.checked = r.value === saved);
  }
});
cancelarMaquinaBtn.addEventListener("click", () => modalMaquina.classList.remove("show"));
salvarMaquinaBtn.addEventListener("click", () => {
  const sel = document.querySelector("input[name='consultorio']:checked");
  if (!sel) { alert("Selecione um consultório."); return; }
  consultorioSelecionado = sel.value;
  localStorage.setItem("consultorioSelecionado", consultorioSelecionado);
  spanMaquina.textContent = `(Consultório atual: ${consultorioSelecionado})`;
  modalMaquina.classList.remove("show");
  carregarSenhas();
});

// Filtro de especialidades
btnFiltro.addEventListener("click", () => filtroEspecialidades.classList.toggle("show"));
document.getElementById("fecharFiltroBtn")
  .addEventListener("click", () => filtroEspecialidades.classList.remove("show"));
selectAll.addEventListener("change", () => {
  document.querySelectorAll(".especialidade").forEach(cb => cb.checked = selectAll.checked);
  atualizarFiltroEspecialidades();
});
document.querySelectorAll(".especialidade").forEach(cb =>
  cb.addEventListener("change", atualizarFiltroEspecialidades)
);

function atualizarFiltroEspecialidades() {
  especialidadesSelecionadas = Array.from(
    document.querySelectorAll(".especialidade:checked")
  ).map(cb => cb.value);
  render();
}

function render() {
  tbody.innerHTML = "";
  senhas
    .filter(s =>
      !especialidadesSelecionadas.length ||
      especialidadesSelecionadas.includes(s.especialidade)
    )
    .forEach(({ senha, nome, idade, data, status, especialidade, cor }) => {
      const corClasse = `cor-${(cor||"").trim().replace(/\s+/g,"")}`;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${senha}</td>
        <td>${nome||"-"}</td>
        <td>${idade||"-"}</td>
        <td>${new Date(data).toLocaleString()}</td>
        <td>${status}</td>
        <td>${especialidade}</td>
        <td><span class="cor-bolinha ${corClasse}"></span></td>
        <td>
          <button class="btn-primario" onclick="chamarPaciente('${senha}')">📣 Chamar</button>
          <button class="btn-finalizar" onclick="abrirModalConfirmar('${senha}')">Finalizar</button>
        </td>

      `;
      tbody.appendChild(tr);
    });
}

async function chamarPaciente(senha) {
  if (!consultorioSelecionado) {
    alert("Você precisa selecionar um consultório."); return;
  }

  try {
    const resp = await fetch(
      `${WEB_APP_URL}?action=registrarChamadaTV&senha=${encodeURIComponent(senha)}&consultorio=${encodeURIComponent(consultorioSelecionado)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Paciente chamado com sucesso.");
    } else {
      alert("Erro ao chamar: " + result.message);
    }
  } catch (err) {
    console.warn("Erro ao chamar:", err);
  }
}

function abrirModalConfirmar(senha) {
  senhaSelecionada = senha;
  document.getElementById("senhaConfirmar").textContent = senha;
  document.getElementById("modalConfirmar").classList.add("show");
}

async function finalizarTriagemModal() {
  if (!consultorioSelecionado) {
    alert("Você precisa selecionar um consultório."); return;
  }

  try {
    const resp = await fetch(
      `${WEB_APP_URL}?action=liberar&senha=${encodeURIComponent(senhaSelecionada)}&consultorio=${encodeURIComponent(consultorioSelecionado)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Atendimento finalizado com sucesso.");
      document.getElementById("modalConfirmar").classList.remove("show");
      // força recarregamento completo para sumir a senha finalizada
      ultimaLeitura = "";
      await carregarSenhas();
    } else {
      alert("Erro ao finalizar: " + result.message);
    }
  } catch (err) {
    console.warn("Erro ao finalizar:", err);
  }
}

async function carregarSenhas() {
  try {
    const url = `${WEB_APP_URL}?action=listar${ultimaLeitura ? `&timestamp=${encodeURIComponent(ultimaLeitura)}` : ""}`;
    const resp = await fetch(url);
    const result = await resp.json();
    if (!result.atualizacao) {
      console.log(`[${new Date().toLocaleTimeString()}] Nenhuma atualização detectada.`);
      return;
    }
    console.log(`[${new Date().toLocaleTimeString()}] Atualização detectada! timestamp: ${result.ultimaLeitura}`);
    senhas = result.senhas;
    ultimaLeitura = result.ultimaLeitura;
    render();
  } catch (err) {
    console.warn("Erro ao carregar senhas:", err);
  }
}

window.addEventListener("load", async () => {
  consultorioSelecionado = localStorage.getItem("consultorioSelecionado") || "";
  if (consultorioSelecionado) {
    spanMaquina.textContent = `(Consultório atual: ${consultorioSelecionado})`;
  }

  window.chamarPaciente = chamarPaciente;
  window.abrirModalConfirmar = abrirModalConfirmar;
  document.getElementById("btnCancelarConfirmar")
    .addEventListener("click", () => document.getElementById("modalConfirmar").classList.remove("show"));
  document.getElementById("btnConfirmarFinalizar")
    .addEventListener("click", finalizarTriagemModal);

  await carregarSenhas();
  setInterval(carregarSenhas, 10000);

});


