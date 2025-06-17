/**
 * Sistema de Gestão de Atendimento
 * Desenvolvido por Igor M. Kurahayachi
 * Analista de Sistemas - Rede Santa Catarina
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyHWBjH0V511TkqGWyJKZytHXhbxWtXLNhdgKnap926pnUiYnzW0o5Ml94PHpGC33H_ag/exec";

let senhas = [];
let senhaSelecionada = "";

const tbody = document.querySelector("#senhaTable tbody");
const POLLING_INTERVAL = 5000;
 
const notificador = document.createElement("div");
notificador.id = "notificador"; 
document.body.appendChild(notificador);

function mostrarMensagem(texto) {
  notificador.textContent = texto;
  notificador.style.display = "block";
  setTimeout(() => {
    notificador.style.display = "none";
  }, 3000);
}
 
function render() {
  tbody.innerHTML = "";
  senhas.forEach(({ senha, data, nome, status }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${senha}</td>
      <td>${new Date(data).toLocaleString()}</td>
      <td>${nome}</td>
      <td>${status}</td>
      <td>
        <button class="btn-primario chamarBtn" data-senha="${senha}">Chamar</button>
        <button class="btn-finalizar finalizarBtn" data-senha="${senha}">Finalizar</button>
        <button class="btn-perigo excluirBtn" data-senha="${senha}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".chamarBtn").forEach(btn => {
    btn.addEventListener("click", () => chamarPaciente(btn.dataset.senha));
  });

  document.querySelectorAll(".finalizarBtn").forEach(btn => {
    btn.addEventListener("click", () => abrirModalConfirmar(btn.dataset.senha));
  });

  document.querySelectorAll(".excluirBtn").forEach(btn => {
    btn.addEventListener("click", () => excluirSenha(btn.dataset.senha));
  });
}
 
async function carregarSenhas(maquina) {
  try {
    const resp = await fetch(`${WEB_APP_URL}?action=listar&maquina=${encodeURIComponent(maquina)}`);
    if (!resp.ok) throw new Error("Resposta inválida");
    senhas = await resp.json();
    render();
  } catch (err) {
    console.warn("Erro ao carregar senhas (silenciado):", err.message);
  }
}
 
async function chamarPaciente(senha) {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
  try {
    const resp = await fetch(`${WEB_APP_URL}?action=registrarChamadaTV&senha=${encodeURIComponent(senha)}&maquina=${encodeURIComponent(maquina)}`);
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Chamada registrada com sucesso.");
    } else {
      alert("Erro ao chamar: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

let senhaConfirmar = "";

function abrirModalConfirmar(senha) {
  senhaConfirmar = senha;
  document.getElementById("senhaConfirmar").textContent = senha;
  document.getElementById("modalConfirmar").classList.add("show");
}

async function finalizarSenha() {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
  try {
    const resp = await fetch(`${WEB_APP_URL}?action=liberar&senha=${encodeURIComponent(senhaConfirmar)}&maquina=${encodeURIComponent(maquina)}`);
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Atendimento finalizado.");
      carregarSenhas(maquina);
      fecharModalConfirmar();
    } else {
      alert("Erro ao finalizar: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

function fecharModalConfirmar() {
  document.getElementById("modalConfirmar").classList.remove("show");
}

async function excluirSenha(senha) {
  if (!confirm(`Tem certeza que deseja excluir a senha ${senha}?`)) return;
  try {
    const resp = await fetch(`${WEB_APP_URL}?action=excluir&senha=${senha}`);
    const result = await resp.json();
    if (result.success) {
      const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
      carregarSenhas(maquina);
    } else {
      alert("Erro ao excluir: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

function iniciarAtualizacaoAutomatica() {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
  carregarSenhas(maquina);
  setInterval(() => carregarSenhas(maquina), POLLING_INTERVAL);
}

const modalMaquina = document.getElementById("modalMaquina");
const btnEngrenagem = document.getElementById("btnEngrenagem");
const salvarMaquinaBtn = document.getElementById("salvarMaquinaBtn");
const cancelarMaquinaBtn = document.getElementById("cancelarMaquinaBtn");
const spanMaquina = document.getElementById("spanMaquina");

btnEngrenagem.addEventListener("click", () => {
  modalMaquina.classList.add("show");
  const maquinaSalva = localStorage.getItem("maquinaSelecionada");
  if (maquinaSalva) {
    document.querySelectorAll("input[name='recepcao']").forEach(radio => {
      radio.checked = radio.value === maquinaSalva;
    });
  }
});

cancelarMaquinaBtn.addEventListener("click", () => {
  modalMaquina.classList.remove("show");
});

salvarMaquinaBtn.addEventListener("click", () => {
  const selecionado = document.querySelector("input[name='recepcao']:checked");
  if (!selecionado) {
    alert("Selecione uma máquina.");
    return;
  }
  const maquina = selecionado.value;
  localStorage.setItem("maquinaSelecionada", maquina);
  spanMaquina.textContent = `(Máquina atual: ${maquina})`;
  modalMaquina.classList.remove("show");
  carregarSenhas(maquina);
});


document.addEventListener("DOMContentLoaded", () => {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
  spanMaquina.textContent = `(Máquina atual: ${maquina})`;

  document.getElementById("btnCancelarConfirmar").addEventListener("click", fecharModalConfirmar);
  document.getElementById("btnConfirmarFinalizar").addEventListener("click", finalizarSenha);

  iniciarAtualizacaoAutomatica();
});
