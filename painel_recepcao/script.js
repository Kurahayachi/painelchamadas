/**
 * Sistema de Gestão de Atendimento
 * Desenvolvido por Igor M. Kurahayachi
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

const WEB_APP_URL_R       = "https://script.google.com/macros/s/AKfycbyqqn-e4U9qxFq1irjb38qwdW9cizigL3-xlnd0LwSWd4V8TJewlhkXxwDlDi7CuY1ZIw/exec";
const STORAGE_KEY_R = "ultimaAtualizacaoRecepcao";  // combina O2 + Q2
const POLLING_INTERVAL_R  = 10000;

// Notificador visual exclusivo para o Painel Recepção testando...
const notificadorR = document.createElement('div');
notificadorR.id = 'notificador';
document.body.appendChild(notificadorR);

function mostrarMensagemRecepcao(texto) {
  notificadorR.textContent = texto;
  notificadorR.style.display = 'block';
  setTimeout(() => notificadorR.style.display = 'none', 3000);
}

let senhasR             = [];
let ultimaLeituraR      = localStorage.getItem(STORAGE_KEY_R) || "";
let isFirstLoadR        = true;

const tbodyR            = document.querySelector("#senhaTable tbody");

async function carregarSenhasRecepcao() {
  const tsCliente = isFirstLoadR ? "" : ultimaLeituraR;
  isFirstLoadR = false;

  const url = `${WEB_APP_URL_R}?action=listar&timestampCliente=${encodeURIComponent(tsCliente)}`;
  const resp = await fetch(url);
  const result = await resp.json();

  const tsServidorCombinado = `${result.ultimaAtualizacaoO2}|${result.ultimaAtualizacaoQ2}`;

  if (!result.atualizacao) {
    console.log(`[${new Date().toLocaleTimeString()}] Nenhuma atualização detectada.`);
    return;
  }

  console.log(`[${new Date().toLocaleTimeString()}] Atualização detectada! ISO: ${tsServidorCombinado}`);

  ultimaLeituraR = tsServidorCombinado;
  localStorage.setItem(STORAGE_KEY_R, ultimaLeituraR);
  senhasR = result.senhas;
  renderRecepcao();
}

function renderRecepcao() {
  tbodyR.innerHTML = "";
  senhasR.forEach(({ senha, data, nome, status, cor }) => {
  const tr = document.createElement("tr");

  // 🔴 Destacar "Em atendimento"
  if (status === "Em atendimento") {
    tr.style.backgroundColor = "#ffe5e5";
  }

  tr.innerHTML = `
  <td>${senha}</td>
  <td>${new Date(data).toLocaleString()}</td>
  <td>${nome || "-"}</td>
  <td>${status}</td>
  <td><span class="cor-bolinha cor-${cor?.trim() || ""}"></span></td>
  <td>
    <button class="btn-primario chamarBtn" data-senha="${senha}">📣 Chamar</button>
    <button class="btn-finalizar finalizarBtn" data-senha="${senha}">Finalizar</button>
    <button class="btn-perigo excluirBtn" data-senha="${senha}">Excluir</button>
  </td>
`;
  tbodyR.appendChild(tr);
});

  // Aplica listeners corretos para as funções existentes
  document.querySelectorAll(".chamarBtn").forEach(btn => btn.addEventListener("click", () => chamarPaciente(btn.dataset.senha)));
  document.querySelectorAll(".finalizarBtn").forEach(btn => btn.addEventListener("click", () => abrirModalConfirmar(btn.dataset.senha)));
  document.querySelectorAll(".excluirBtn").forEach(btn => btn.addEventListener("click", () => excluirSenha(btn.dataset.senha)));
}
// Inicia painel de recepção
carregarSenhasRecepcao();
setInterval(carregarSenhasRecepcao, POLLING_INTERVAL_R);

async function chamarPaciente(senha) {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";

  try {
    // 1. Atualiza status para "Em atendimento" e grava Q2
    const respChamar = await fetch(
      `${WEB_APP_URL_R}?action=chamar`
      + `&senha=${encodeURIComponent(senha)}`
      + `&maquina=${encodeURIComponent(maquina)}`
    );
    const resultChamar = await respChamar.json();

    if (!resultChamar.success) {
      alert("Erro ao marcar como 'Em atendimento': " + resultChamar.message);
      return;
    }

    // 2. Grava na aba ChamadaTV
    const respTV = await fetch(
      `${WEB_APP_URL_R}?action=registrarChamadaTV`
      + `&senha=${encodeURIComponent(senha)}`
      + `&maquina=${encodeURIComponent(maquina)}`
    );
    const resultTV = await respTV.json();

    if (resultTV.success) {
      mostrarMensagemRecepcao("Chamada registrada com sucesso.");
      isFirstLoadR = true;
      carregarSenhasRecepcao(); // 🔁 força atualização após chamar
    } else {
      alert("Erro ao registrar na TV: " + resultTV.message);
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
    const resp = await fetch(
      `${WEB_APP_URL_R}?action=liberar`
      + `&senha=${encodeURIComponent(senhaConfirmar)}`
      + `&maquina=${encodeURIComponent(maquina)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagemRecepcao("Atendimento finalizado.");
      fecharModalConfirmar();
      isFirstLoadR = true;
      carregarSenhasRecepcao();
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
    const resp = await fetch(
      `${WEB_APP_URL_R}?action=excluir`
      + `&senha=${encodeURIComponent(senha)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagemRecepcao("Senha excluída com sucesso.");
      carregarSenhasRecepcao();
    } else {
      alert("Erro ao excluir: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

function iniciarAtualizacaoAutomatica() {
  // 1) carrega imediatamente (GET completo na 1ª vez)
  carregarSenhasRecepcao();
  // 2) polling a cada POLLING_INTERVAL_R
  setInterval(carregarSenhasRecepcao, POLLING_INTERVAL_R);
  // 3) reload forçado a cada 15 minutos
  setInterval(() => {
    console.log("⏰ Reload forçado (Recepção) a cada 15 minutos.");
    location.reload();
  }, 15 * 60 * 1000);
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

cancelarMaquinaBtn.addEventListener("click", () => modalMaquina.classList.remove("show"));

salvarMaquinaBtn.addEventListener("click", () => {
  const selecionado = document.querySelector("input[name='recepcao']:checked");
  if (!selecionado) { alert("Selecione uma máquina."); return; }
  localStorage.setItem("maquinaSelecionada", selecionado.value);
  spanMaquina.textContent = `(Máquina atual: ${selecionado.value})`;
  modalMaquina.classList.remove("show");
  carregarSenhasRecepcao();
});

document.addEventListener("DOMContentLoaded", () => {
  spanMaquina.textContent = `(Máquina atual: ${localStorage.getItem("maquinaSelecionada") || "Recepção 01"})`;
  document.getElementById("btnCancelarConfirmar").addEventListener("click", fecharModalConfirmar);
  document.getElementById("btnConfirmarFinalizar").addEventListener("click", finalizarSenha);
  iniciarAtualizacaoAutomatica();
});




