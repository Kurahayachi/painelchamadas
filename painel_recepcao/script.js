/**
 * Sistema de Gestão de Atendimento
 * Desenvolvido por Igor M. Kurahayachi
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

/**
 * Painel Classificação - script.js
 */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwlwt_B4sMuYlzNZLlP9_RNa3Jq_HPGUW96Pldab-G0HaH4WfH1Iu4GB4E6htatz4FE/exec";
const STORAGE_KEY = "ultimaAtualizacaoTotem";    // L2 ISO

let senhas = [];
let senhaSelecionada = "";
let ultimaLeitura = localStorage.getItem(STORAGE_KEY) || "";
let isFirstLoad = true;

const tbody = document.querySelector("#senhaTable tbody");
const POLLING_INTERVAL = 5000;

const modal = document.getElementById("modal");
const nomeInput = document.getElementById("nome");
const idadeInput = document.getElementById("idade");
const especialidadeInput = document.getElementById("especialidade");
const corInput = document.getElementById("cor");
const observacaoInput = document.getElementById("observacao");
const salvarBtn = document.getElementById("salvarBtn");
const cancelarBtn = document.getElementById("cancelarBtn");
const finalizarBtn = document.getElementById("finalizarBtn");

const notificador = document.createElement("div");
notificador.id = "notificador";
document.body.appendChild(notificador);

function mostrarMensagem(texto) {
  notificador.textContent = texto;
  notificador.style.display = "block";
  setTimeout(() => notificador.style.display = "none", 3000);
}

function render() {
  tbody.innerHTML = "";
  senhas.forEach(({ senha, data, status }) => {
    const tr = document.createElement("tr");
    let botoes = "";
    if (status === "Em triagem") {
      botoes = `<button class="btn-finalizar" onclick="finalizarTriagem('${senha}')">Finalizar Classificação</button>`;
    } else {
      botoes = `
        <button class="btn-chamar btn-primario chamarBtn" data-senha="${senha}">📣 Chamar</button>
        <button class="btn-primario editarBtn" data-senha="${senha}">Editar</button>
        <button class="btn-perigo" onclick="excluirSenha('${senha}')">Excluir</button>
      `;
    }
    tr.innerHTML = `
      <td>${senha}</td>
      <td>${new Date(data).toLocaleString()}</td>
      <td>${status}</td>
      <td>${botoes}</td>
    `;
    tbody.appendChild(tr);
  });
  document.querySelectorAll(".chamarBtn").forEach(btn => btn.addEventListener("click", () => chamarPaciente(btn.dataset.senha)));
  document.querySelectorAll(".editarBtn").forEach(btn => btn.addEventListener("click", () => abrirModal(btn.dataset.senha)));
}

async function carregarSenhas() {
  const tsCliente = isFirstLoad ? "" : ultimaLeitura;
  const url = `${WEB_APP_URL}?action=listar&timestampCliente=${encodeURIComponent(tsCliente)}`;
  const resp = await fetch(url);
  const result = await resp.json();
  isFirstLoad = false;

  if (!result.atualizacao) {
    console.log(`[${new Date().toLocaleTimeString()}] Nenhuma atualização detectada.`);
    return;
  }

  console.log(`[${new Date().toLocaleTimeString()}] Atualização detectada! ISO:`, result.ultimaAtualizacao);

  ultimaLeitura = result.ultimaAtualizacao;
  localStorage.setItem(STORAGE_KEY, ultimaLeitura);
  senhas = result.senhas;
  render();
}

// Inicia painel de classificação
carregarSenhas();
setInterval(carregarSenhas, POLLING_INTERVAL);

// … Funções abrirModal, limparFormulario, salvarDados, finalizarTriagemModal, finalizarTriagem, excluirSenha …

/**
 * Painel Recepção - script.js
 */
const WEB_APP_URL_R = "https://script.google.com/macros/s/AKfycbxqci7STn4wNQrfg7K-YQ5lJUr88yyAKU90QmRrI0HO2P-n6vXaZIksG0Dp4sKuRKT5oA/exec";
const STORAGE_KEY_R = "ultimaAtualizacaoClass";  // O2 ISO
const POLLING_INTERVAL_R = 5000;

let senhasR = [];
let ultimaLeituraR = localStorage.getItem(STORAGE_KEY_R) || "";
let isFirstLoadR = true;

const tbodyR = document.querySelector("#senhaTable tbody");

async function carregarSenhasRecepcao() {
  console.log(`[Recepção] timestampCliente atual: ${ultimaLeituraR}`);
  const tsCliente = isFirstLoadR ? "" : ultimaLeituraR;
  isFirstLoadR = false;

  const url = `${WEB_APP_URL_R}?action=listar&timestampCliente=${encodeURIComponent(tsCliente)}`;
  const resp = await fetch(url);
  const result = await resp.json();

  if (!result.atualizacao) {
    console.log(`[${new Date().toLocaleTimeString()}] Nenhuma atualização detectada.`);
    return;
  }

  console.log(`[${new Date().toLocaleTimeString()}] Atualização detectada! ISO:`, result.ultimaAtualizacao);

  ultimaLeituraR = result.ultimaAtualizacao;
  localStorage.setItem(STORAGE_KEY_R, ultimaLeituraR);
  senhasR = result.senhas;
  renderRecepcao();
}

function renderRecepcao() {
  tbodyR.innerHTML = "";
  senhasR.forEach(({ senha, data, nome, status }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${senha}</td>
      <td>${new Date(data).toLocaleString()}</td>
      <td>${nome}</td>
      <td>${status}</td>
      <td>
        <button class="chamarBtn btn-primario" data-senha="${senha}">📣 Chamar</button>
        <button class="finalizarBtn btn-finalizar" data-senha="${senha}">Finalizar</button>
        <button class="excluirBtn btn-perigo" data-senha="${senha}">Excluir</button>
      </td>
    `;
    tbodyR.appendChild(tr);
  });

  document.querySelectorAll(".chamarBtn").forEach(btn => btn.addEventListener("click", () => chamarPacienteR(btn.dataset.senha)));
  document.querySelectorAll(".finalizarBtn").forEach(btn => btn.addEventListener("click", () => finalizarRecepcao(btn.dataset.senha)));
  document.querySelectorAll(".excluirBtn").forEach(btn => btn.addEventListener("click", () => excluirRecepcao(btn.dataset.senha)));
}

// Inicia painel de recepção
carregarSenhasRecepcao();
setInterval(carregarSenhasRecepcao, POLLING_INTERVAL_R);

// … Funções chamarPacienteR, abrirModalConfirmar, finalizarRecepcao, excluirRecepcao …


async function chamarPaciente(senha) {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
  try {
    const resp = await fetch(
      `${WEB_APP_URL}`
      + `?action=registrarChamadaTV`
      + `&senha=${encodeURIComponent(senha)}`
      + `&maquina=${encodeURIComponent(maquina)}`
    );
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
    // Usa a URL correta do painel de Recepção
    const resp = await fetch(
      `${WEB_APP_URL_R}`
      + `?action=liberar`
      + `&senha=${encodeURIComponent(senhaConfirmar)}`
      + `&maquina=${encodeURIComponent(maquina)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Atendimento finalizado.");
      // Fecha o modal antes de recarregar a lista
      fecharModalConfirmar();
      // Força um GET completo na próxima chamada (timestamp vazio)
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
      `${WEB_APP_URL}`
      + `?action=excluir`
      + `&senha=${encodeURIComponent(senha)}`
    );
    const result = await resp.json();
    if (result.success) {
      carregarSenhas();
    } else {
      alert("Erro ao excluir: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

function iniciarAtualizacaoAutomatica() {
  carregarSenhas();
  setInterval(carregarSenhas, POLLING_INTERVAL);
  setInterval(() => location.reload(), 15 * 60 * 1000);
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
  carregarSenhas();
});

document.addEventListener("DOMContentLoaded", () => {
  spanMaquina.textContent = `(Máquina atual: ${localStorage.getItem("maquinaSelecionada") || "Recepção 01"})`;
  document.getElementById("btnCancelarConfirmar").addEventListener("click", fecharModalConfirmar);
  document.getElementById("btnConfirmarFinalizar").addEventListener("click", finalizarSenha);
  iniciarAtualizacaoAutomatica();
});
