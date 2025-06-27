/**
 * Sistema de Gestão de Atendimento
 * Desenvolvido por Igor M. Kurahayachi
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

const WEB_APP_URL_R = "https://script.google.com/macros/s/AKfycbxqci7STn4wNQrfg7K-YQ5lJUr88yyAKU90QmRrI0HO2P-n6vXaZIksG0Dp4sKuRKT5oA/exec";
const STORAGE_KEY_R = "ultimaAtualizacaoClass";  // O2 ISO

let senhasR = [];
let ultimaLeituraR = localStorage.getItem(STORAGE_KEY_R) || "";
let isFirstLoadR = true;

const tbodyR = document.querySelector("#senhaTable tbody");
// Se for lista específica, ajustar selector para recepção

async function carregarSenhasRecepcao() {
  // Log para depuração: compara timestampCliente em Recepção antes do fetch
  console.log(`[Recepção] timestampCliente atual: ${ultimaLeituraR}`);
  const tsCliente = isFirstLoadR ? "" : ultimaLeituraR;
  const url = `${WEB_APP_URL_R}?action=listar&timestampCliente=${encodeURIComponent(tsCliente)}`;
  const resp = await fetch(url);
  const result = await resp.json();
  isFirstLoadR = false;

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
        <button class=\"chamarBtn\" data-senha=\"${senha}\">📣 Chamar</button>
        <button class=\"finalizarBtn\" data-senha=\"${senha}\">Finalizar</button>
        <button class=\"excluirBtn\" data-senha=\"${senha}\">Excluir</button>
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
setInterval(carregarSenhasRecepcao, POLLING_INTERVAL);

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
    const resp = await fetch(
      `${WEB_APP_URL}`
      + `?action=liberar`
      + `&senha=${encodeURIComponent(senhaConfirmar)}`
      + `&maquina=${encodeURIComponent(maquina)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Atendimento finalizado.");
      carregarSenhas();
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
