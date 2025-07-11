/*
 * Sistema de Gestão de Atendimento - Painel Recepção
 * Desenvolvido por Igor M. Kurahayachi
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

// 1) Mapeamento de recepções → URLs de deploy
function getWebAppUrlRecepcao(recepcao) {
  const map = {
    "1": "https://script.google.com/macros/s/AKfycbx0jgZOcak365hNpPDDKAs9BMpAha5PycNuTTanXvCyeoNaxKfWZVOnrqpdJhDBjB-i/exec",
    "2": "https://script.google.com/macros/s/AKfycbwUR4u8cmuFGPzPFuHSuejgs7zmH6GtibOkXGCQUlqiMh9GswepCE6QQb6eiGK55bnz/exec",
    "3": "https://script.google.com/macros/s/AKfycbzbYWKjNa12_Q2tW9zx6veEMYg_PYWx7Ae0S2oSRYIZ_3u0zpQvi6F83-tJqNiw8ZuS/exec",
    "4": "https://script.google.com/macros/s/AKfycbz-3prlZigqi6k3Ntme9lFLIqVJuFzE-ZW3-nCd1lgNhRNCE_uxTMYauD0oeISfHVWD/exec"
  };
  return map[(recepcao || "").replace(/\D/g, "")] || "";
}

// 2) Recupera e aplica a recepção atual (default = "1")
let recepcaoSelecionada = localStorage.getItem("recepcaoSelecionada") || "1";
const WEB_APP_URL_R = getWebAppUrlRecepcao(recepcaoSelecionada);
const STORAGE_KEY_R = `ultimaAtualizacaoRecepcao_R${recepcaoSelecionada}`;
const POLLING_INTERVAL_R = 10000;

// 3) Notificador visual
const notificadorR = document.createElement('div');
notificadorR.id = 'notificador';
document.body.appendChild(notificadorR);
function mostrarMensagemRecepcao(texto) {
  notificadorR.textContent = texto;
  notificadorR.style.display = 'block';
  setTimeout(() => notificadorR.style.display = 'none', 3000);
}

// 4) Estado das senhas
let senhasR = [];
let ultimaLeituraR = localStorage.getItem(STORAGE_KEY_R) || "";
let isFirstLoadR = true;
const tbodyR = document.querySelector("#senhaTable tbody");

// 5) Função de polling otimizado
async function carregarSenhasRecepcao() {
  const tsCliente = isFirstLoadR ? "" : ultimaLeituraR;
  isFirstLoadR = false;

  try {
    const resp = await fetch(
      `${WEB_APP_URL_R}?action=listar&timestampCliente=${encodeURIComponent(tsCliente)}`
    );
    const result = await resp.json();

    if (!result.atualizacao) {
      console.log(`[${new Date().toLocaleTimeString()}] Sem atualizações.`);
      return;
    }

    const tsServidor = `${result.ultimaAtualizacaoO2}|${result.ultimaAtualizacaoQ2}`;
    console.log(`[${new Date().toLocaleTimeString()}] Atualização: ${tsServidor}`);

    ultimaLeituraR = tsServidor;
    localStorage.setItem(STORAGE_KEY_R, ultimaLeituraR);

    senhasR = result.senhas;
    renderRecepcao();
  } catch (error) {
    console.error("Erro ao carregar senhas:", error);
    mostrarMensagemRecepcao("Erro ao atualizar dados.");
  }
}

// 6) Renderização da tabela
function renderRecepcao() {
  tbodyR.innerHTML = "";
  senhasR.forEach(({ senha, data, nome, status, cor }) => {
    const tr = document.createElement("tr");
    if (status === "Em atendimento") tr.style.backgroundColor = "#ffe5e5";

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

  document.querySelectorAll(".chamarBtn").forEach(btn => btn.addEventListener("click", () => chamarPaciente(btn.dataset.senha)));
  document.querySelectorAll(".finalizarBtn").forEach(btn => btn.addEventListener("click", () => abrirModalConfirmar(btn.dataset.senha)));
  document.querySelectorAll(".excluirBtn").forEach(btn => btn.addEventListener("click", () => excluirSenha(btn.dataset.senha)));
}

// 7) Ações de chamar, finalizar e excluir
async function chamarPaciente(senha) {
  try {
    let resp = await fetch(
      `${WEB_APP_URL_R}?action=chamar&senha=${encodeURIComponent(senha)}` +
      `&recepcao=${encodeURIComponent(recepcaoSelecionada)}`
    );
    let json = await resp.json();
    if (!json.success) throw new Error(json.message);

    resp = await fetch(
      `${WEB_APP_URL_R}?action=registrarChamadaTV&senha=${encodeURIComponent(senha)}` +
      `&recepcao=${encodeURIComponent(recepcaoSelecionada)}`
    );
    json = await resp.json();
    if (!json.success) throw new Error(json.message);

    mostrarMensagemRecepcao("Paciente chamado com sucesso.");
    isFirstLoadR = true;
    carregarSenhasRecepcao();
  } catch (error) {
    console.error("Erro em chamarPaciente:", error);
    alert(`Erro: ${error.message}`);
  }
}

async function finalizarSenha() {
  try {
    const resp = await fetch(
      `${WEB_APP_URL_R}?action=liberar&senha=${encodeURIComponent(senhaConfirmar)}` +
      `&recepcao=${encodeURIComponent(recepcaoSelecionada)}`
    );
    const json = await resp.json();
    if (!json.success) throw new Error(json.message);

    mostrarMensagemRecepcao("Atendimento finalizado.");
    fecharModalConfirmar();
    isFirstLoadR = true;
    carregarSenhasRecepcao();
  } catch (error) {
    console.error("Erro em finalizarSenha:", error);
    alert(`Erro: ${error.message}`);
  }
}

async function excluirSenha(senha) {
  if (!confirm(`Excluir senha ${senha}?`)) return;
  try {
    const resp = await fetch(
      `${WEB_APP_URL_R}?action=excluir&senha=${encodeURIComponent(senha)}`
    );
    const json = await resp.json();
    if (!json.success) throw new Error(json.message);

    mostrarMensagemRecepcao("Senha excluída com sucesso.");
    isFirstLoadR = true;
    carregarSenhasRecepcao();
  } catch (error) {
    console.error("Erro em excluirSenha:", error);
    alert(`Erro: ${error.message}`);
  }
}

// 8) Modal de confirmação
let senhaConfirmar = "";
function abrirModalConfirmar(senha) {
  senhaConfirmar = senha;
  document.getElementById("senhaConfirmar").textContent = senha;
  document.getElementById("modalConfirmar").classList.add("show");
}
function fecharModalConfirmar() {
  document.getElementById("modalConfirmar").classList.remove("show");
}

// 9) Inicialização e polling
function iniciarAtualizacaoAutomatica() {
  carregarSenhasRecepcao();
  setInterval(carregarSenhasRecepcao, POLLING_INTERVAL_R);
  setInterval(() => {
    console.log("Reload forçado (Recepção)");
    window.location.reload();
  }, 15 * 60 * 1000);
}

// 10) Elementos do DOM e listeners
const modalMaquina = document.getElementById("modalMaquina");
const btnEngrenagem = document.getElementById("btnEngrenagem");
const salvarRecepcaoBtn = document.getElementById("salvarMaquinaBtn");
const cancelarRecepcaoBtn = document.getElementById("cancelarMaquinaBtn");
const spanRecepcao = document.getElementById("spanRecepcao");

btnEngrenagem.addEventListener("click", () => {
  modalMaquina.classList.add("show");
  const recepcaoSalva = localStorage.getItem("recepcaoSelecionada");
  if (recepcaoSalva) {
    document
      .querySelectorAll("input[name='recepcao']")
      .forEach((radio) => (radio.checked = radio.value === recepcaoSalva));
  }
});

cancelarRecepcaoBtn.addEventListener("click", () => modalMaquina.classList.remove("show"));

salvarRecepcaoBtn.addEventListener("click", () => {
  const sel = document.querySelector("input[name='recepcao']:checked");
  if (!sel) return alert("Selecione uma recepção.");
  recepcaoSelecionada = sel.value;
  localStorage.setItem("recepcaoSelecionada", recepcaoSelecionada);
  modalMaquina.classList.remove("show");
  window.location.reload();
});

document.addEventListener("DOMContentLoaded", () => {
  spanRecepcao.textContent = `(Recepção atual: ${recepcaoSelecionada})`;
  document.getElementById("btnCancelarConfirmar").addEventListener("click", fecharModalConfirmar);
  document.getElementById("btnConfirmarFinalizar").addEventListener("click", finalizarSenha);
  iniciarAtualizacaoAutomatica();
});
