/**
 * Sistema de Gestão de Atendimento - Recepção
 * Desenvolvido por Igor M. Kurahayachi
 * Todos os direitos reservados.
 */

const WEB_APP_URL_R     = "https://script.google.com/macros/s/AKfycbzL4_MWTmtfgvn_TW5Ei1GBfeQjHsIKMx6ILPeuB-JaHnhQ13RPgcsaL7Xp6OOA9xCRRA/exec";
const STORAGE_KEY_R     = "ultimaAtualizacaoRecepcao";  // combina O2 + Q2
const POLLING_INTERVAL  = 10000;                        // 10s

// Notificador visual exclusivo para o Painel Recepção
const notificadorR = document.createElement('div');
notificadorR.id  = 'notificador';
document.body.appendChild(notificadorR);

function mostrarMensagemRecepcao(texto) {
  notificadorR.textContent = texto;
  notificadorR.style.display = 'block';
  setTimeout(() => notificadorR.style.display = 'none', 3000);
}

let senhasR        = [];
let ultimaLeituraR = localStorage.getItem(STORAGE_KEY_R) || "";
let isFirstLoadR   = true;

const tbodyR = document.querySelector("#senhaTable tbody");

/**
 * Busca novas senhas aguardando Recepção ou em Atendimento,
 * acordando o painel só quando O2 ou Q2 mudarem.
 */
async function carregarSenhasRecepcao() {
  const tsCliente = isFirstLoadR ? "" : ultimaLeituraR;
  isFirstLoadR = false;

  const url  = `${WEB_APP_URL_R}?action=listar&timestampCliente=${encodeURIComponent(tsCliente)}`;
  const resp = await fetch(url, { mode: 'cors' });
  const result = await resp.json();

  if (!result.atualizacao) {
    console.log(`[Recepção] Sem atualização.`);
    return;
  }

  console.log(`[Recepção] Atualização! ISO = ${result.ultimaAtualizacao}`);
  ultimaLeituraR = result.ultimaAtualizacao;
  localStorage.setItem(STORAGE_KEY_R, ultimaLeituraR);
  senhasR = result.senhas;
  renderRecepcao();
}

/**
 * Renderiza a tabela de senhas no Painel Recepção.
 */
function renderRecepcao() {
  tbodyR.innerHTML = "";
  senhasR.forEach(({ senha, data, nome, status }) => {
    const tr = document.createElement("tr");

    // Destaca quem está "Em Atendimento"
    if (status === "Em Atendimento") {
      tr.style.backgroundColor = "#ffcccc";
    }

    tr.innerHTML = `
      <td>${senha}</td>
      <td>${new Date(data).toLocaleString()}</td>
      <td>${nome}</td>
      <td>${status}</td>
      <td>
        <button class="btn-primario chamarBtn" data-senha="${senha}">📣 Chamar</button>
        <button class="btn-finalizar finalizarBtn" data-senha="${senha}">Finalizar</button>
        <button class="btn-perigo excluirBtn" data-senha="${senha}">Excluir</button>
      </td>
    `;
    tbodyR.appendChild(tr);
  });

  document.querySelectorAll(".chamarBtn")
    .forEach(btn => btn.addEventListener("click", () => chamarPaciente(btn.dataset.senha)));

  document.querySelectorAll(".finalizarBtn")
    .forEach(btn => btn.addEventListener("click", () => abrirModalConfirmar(btn.dataset.senha)));

  document.querySelectorAll(".excluirBtn")
    .forEach(btn => btn.addEventListener("click", () => excluirSenha(btn.dataset.senha)));
}
// Inicia e faz polling
carregarSenhasRecepcao();
setInterval(carregarSenhasRecepcao, POLLING_INTERVAL);

/**
 * Chama na Tela de TV e marca “Em Atendimento” + dispara Q2.
 */
async function chamarPaciente(senha) {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
  const url = `${WEB_APP_URL_R}?action=registrarChamadaTV`
    + `&senha=${encodeURIComponent(senha)}`
    + `&maquina=${encodeURIComponent(maquina)}`;

  const resp = await fetch(url, { mode: 'cors' });
  const result = await resp.json();
  if (result.success) {
    mostrarMensagemRecepcao("Chamada registrada com sucesso.");
    // opcionalmente forçar full-fetch para atualizar status imediatamente:
    isFirstLoadR = true;
    carregarSenhasRecepcao();
  } else {
    alert("Erro ao chamar: " + result.message);
  }
}

let senhaConfirmar = "";
function abrirModalConfirmar(senha) {
  senhaConfirmar = senha;
  document.getElementById("senhaConfirmar").textContent = senha;
  document.getElementById("modalConfirmar").classList.add("show");
}

/**
 * Finaliza atendimento (libera para médico) + dispara Q2.
 */
async function finalizarSenha() {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
  const url = `${WEB_APP_URL_R}?action=liberar`
    + `&senha=${encodeURIComponent(senhaConfirmar)}`
    + `&maquina=${encodeURIComponent(maquina)}`;

  const resp = await fetch(url, { mode: 'cors' });
  const result = await resp.json();
  if (result.success) {
    mostrarMensagemRecepcao("Atendimento finalizado.");
    fecharModalConfirmar();
    isFirstLoadR = true;
    carregarSenhasRecepcao();
  } else {
    alert("Erro ao finalizar: " + result.message);
  }
}

function fecharModalConfirmar() {
  document.getElementById("modalConfirmar").classList.remove("show");
}

/**
 * Exclui senha + dispara Q2.
 */
async function excluirSenha(senha) {
  if (!confirm(`Excluir senha ${senha}?`)) return;
  const url = `${WEB_APP_URL_R}?action=excluir&senha=${encodeURIComponent(senha)}`;
  const resp = await fetch(url, { mode: 'cors' });
  const result = await resp.json();
  if (result.success) {
    mostrarMensagemRecepcao("Senha excluída com sucesso.");
    isFirstLoadR = true;
    carregarSenhasRecepcao();
  } else {
    alert("Erro ao excluir: " + result.message);
  }
}

// Configuração de máquina e inicialização final
function iniciarRecepcao() {
  carregarSenhasRecepcao();
  setInterval(carregarSenhasRecepcao, POLLING_INTERVAL);
  setInterval(() => location.reload(), 15 * 60 * 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnCancelarConfirmar")
    .addEventListener("click", fecharModalConfirmar);
  document.getElementById("btnConfirmarFinalizar")
    .addEventListener("click", finalizarSenha);

  const spanMaquina = document.getElementById("spanMaquina");
  spanMaquina.textContent = `(Máquina atual: ${localStorage.getItem("maquinaSelecionada") || "Recepção 01"})`;

  document.getElementById("btnEngrenagem")
    .addEventListener("click", () => {
      document.getElementById("modalMaquina").classList.add("show");
      const saved = localStorage.getItem("maquinaSelecionada");
      if (saved) {
        document.querySelectorAll("input[name='recepcao']").forEach(r => {
          r.checked = r.value === saved;
        });
      }
    });

  document.getElementById("salvarMaquinaBtn")
    .addEventListener("click", () => {
      const sel = document.querySelector("input[name='recepcao']:checked");
      if (!sel) return alert("Selecione uma máquina.");
      localStorage.setItem("maquinaSelecionada", sel.value);
      document.getElementById("spanMaquina").textContent = `(Máquina atual: ${sel.value})`;
      document.getElementById("modalMaquina").classList.remove("show");
      carregarSenhasRecepcao();
    });

  document.getElementById("cancelarMaquinaBtn")
    .addEventListener("click", () => document.getElementById("modalMaquina").classList.remove("show"));

  iniciarRecepcao();
});
