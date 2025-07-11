/**
 * Sistema de Gestão de Senhas
 * Desenvolvido por Igor M. Kurahayachi
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

/**
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwm3CCr-NsvZNiC7hyn1x878YhQ3zUHer3f_awmXuPyz6l7bvUZuUXqFsg5oejIocL5/exec";**/

function getWebAppUrlClassificacao(maquina) {
  const urls = {
    "Classificação 01": "https://script.google.com/macros/s/AKfycbwnQ5EWVFmcrvcFEKDQV5QPMXoJhZEwkwkcNohSlxb1DLtzRQxWoJDYmWW2j9eqkoUl/exec",
    "Classificação 02": "https://script.google.com/macros/s/AKfycbz7LdSnKjREHxGTfex2ZNOYtwyflNf4b8uJQiLj3f62a7u3FMHPRqd43LvWad6zfeEl/exec"
  };
  return urls[maquina] || urls["Classificação 01"];
}

const STORAGE_KEY = "ultimaAtualizacaoClassificacao";    // combina L2 + O2

// Auto-reload a cada 15 minutos para manter a sessão ativa
setInterval(() => {
    console.log("⏳ 15 minutos se passaram, recarregando o painel de classificação…");
    location.reload();
}, 15 * 60 * 1000);

let senhas = [];
let senhaSelecionada = "";
let ultimaLeitura = localStorage.getItem(STORAGE_KEY) || "";
let isFirstLoad = true;

const tbody = document.querySelector("#senhaTable tbody");
const POLLING_INTERVAL = 10000;

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

    // Destaca quem já está em triagem
    if (status === "Em triagem") {
      tr.style.backgroundColor = "#ffcccc";
    }

    // Sempre mostra só Chamar / Editar / Excluir
    const botoes = `
      <button class="btn-chamar chamarBtn" data-senha="${senha}">📣 Chamar</button>
      <button class="btn-primario editarBtn" data-senha="${senha}">Editar</button>
      <button class="btn-perigo" onclick="excluirSenha('${senha}')">Excluir</button>
    `;

    tr.innerHTML = `
      <td>${senha}</td>
      <td>${new Date(data).toLocaleString()}</td>
      <td>${status}</td>
      <td>${botoes}</td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".chamarBtn")
    .forEach(btn => btn.addEventListener("click", () => chamarPaciente(btn.dataset.senha)));
  document.querySelectorAll(".editarBtn")
    .forEach(btn => btn.addEventListener("click", () => abrirModal(btn.dataset.senha)));
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
carregarSenhas();  // corrigido de tocarSenhas()
setInterval(carregarSenhas, POLLING_INTERVAL);

function abrirModal(senha) {
    senhaSelecionada = senha;
    limparFormulario();
    modal.classList.add("show");
    finalizarBtn.disabled = true;
}

function cancelarModal() {
    modal.classList.remove("show");
    limparFormulario();
}

function limparFormulario() {
    nomeInput.value = "";
    idadeInput.value = "";
    especialidadeInput.value = "";
    corInput.value = "";
    observacaoInput.value = "";
}

// 2) salvarDados: só grava dados e recarrega a lista sem status nem passar máquina
async function salvarDados() {
  const nome          = nomeInput.value.trim();
  const idade         = idadeInput.value.trim();
  const especialidade = especialidadeInput.value.trim();
  const cor           = corInput.value;
  const observacao    = observacaoInput.value.trim();
  const maquina       = localStorage.getItem("maquinaSelecionada") || "Classificação 01";

  if (!nome || !idade || !especialidade || !cor) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return;
  }
  try {
    const resp = await fetch(
      `${WEB_APP_URL}?action=chamar`
      + `&senha=${encodeURIComponent(senhaSelecionada)}`
      + `&maquina=${encodeURIComponent(maquina)}`
      + `&nome=${encodeURIComponent(nome)}`
      + `&idade=${encodeURIComponent(idade)}`
      + `&especialidade=${encodeURIComponent(especialidade)}`
      + `&cor=${encodeURIComponent(cor)}`
      + `&observacao=${encodeURIComponent(observacao)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Dados salvos com sucesso!");
      finalizarBtn.disabled = false;
      // só isso: recarrega usando o timestamp
      isFirstLoad = false;  // mantém otimização; não precisa full-fetch aqui
      carregarSenhas();
    } else {
      alert("Erro ao salvar dados: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

async function finalizarTriagemModal() {
  try {
    const resp = await fetch(
      `${WEB_APP_URL}?action=finalizarTriagem&senha=${encodeURIComponent(senhaSelecionada)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Classificação finalizada.");
      modal.classList.remove("show");

      // ——— FORÇA ATUALIZAÇÃO IMEDIATA ———
      isFirstLoad = true;   // zera o timestampCliente para fetch completo
      carregarSenhas();     // atualiza agora, removendo a linha
      // ——————————————————————————
    } else {
      alert("Erro ao finalizar triagem: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

// 3) finalizarTriagem “direto” também força full-fetch
async function finalizarTriagem(senha) {
  try {
    const resp   = await fetch(
      `${WEB_APP_URL}?action=finalizarTriagem&senha=${encodeURIComponent(senha)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Classificação finalizada.");
      // força full-fetch pra sumir a linha agora
      isFirstLoad = true;
      carregarSenhas();
    } else {
      alert("Erro ao finalizar triagem: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

async function excluirSenha(senha) {
  if (!confirm(`Tem certeza que deseja excluir a senha ${senha}?`)) return;
  try {
    const resp   = await fetch(`${WEB_APP_URL}?action=excluir&senha=${senha}`);
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Senha excluída com sucesso.");
      // força full-fetch imediato (zera o timestamp e recarrega tudo)
      isFirstLoad = true;
      carregarSenhas();
    } else {
      alert("Erro ao excluir senha: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

function iniciarAtualizacaoAutomatica() {
    carregarSenhas();
    setInterval(() => carregarSenhas(), POLLING_INTERVAL);
}


btnEngrenagem.addEventListener("click", () => {
    modalMaquina.classList.add("show");
    const maquinaSalva = localStorage.getItem("maquinaSelecionada");
    if (maquinaSalva) {
        document.querySelectorAll("input[name='classificacao']").forEach((radio) => {
            radio.checked = radio.value === maquinaSalva;
        });
    }
});

cancelarMaquinaBtn.addEventListener("click", () => {
    modalMaquina.classList.remove("show");
});

salvarMaquinaBtn.addEventListener("click", () => {
    const selecionado = document.querySelector("input[name='classificacao']:checked");
    if (!selecionado) {
        alert("Selecione uma máquina.");
        return;
    }
    const maquina = selecionado.value;
    localStorage.setItem("maquinaSelecionada", maquina);
    spanMaquina.textContent = `(Máquina atual: ${maquina})`;
    modalMaquina.classList.remove("show");

    // 👉 ATUALIZA a URL com base na nova máquina
    window.WEB_APP_URL = getWebAppUrlClassificacao(maquina);

    // 👉 Recarrega os dados com a nova URL
    isFirstLoad = true; // força fetch completo ao trocar de máquina
    carregarSenhas();
});

window.addEventListener("load", () => {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Classificação 01";
  spanMaquina.textContent = `(Máquina atual: ${maquina})`;

  // Define a URL dinâmica com base na máquina selecionada
  window.WEB_APP_URL = getWebAppUrlClassificacao(maquina);

  window.abrirModal = abrirModal;
  window.excluirSenha = excluirSenha;
  window.finalizarTriagem = finalizarTriagem;

  cancelarBtn.addEventListener("click", cancelarModal);
  salvarBtn.addEventListener("click", salvarDados);
  finalizarBtn.addEventListener("click", finalizarTriagemModal);

  try {
    iniciarAtualizacaoAutomatica();
  } catch (error) {
    console.warn("Erro ao iniciar atualização automática:", error);
    mostrarMensagem("Não foi possível carregar os dados. Tente novamente.");
  }
});

// 1) chamarPaciente: grava na TV e já recarrega sem esperar o polling
async function chamarPaciente(senha) {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Classificação 01";
  try {
    const resp   = await fetch(
      `${WEB_APP_URL}?action=registrarChamadaTV`
      + `&senha=${encodeURIComponent(senha)}`
      + `&maquina=${encodeURIComponent(maquina)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Chamada registrada com sucesso.");
      // força full-fetch
      isFirstLoad = true;
      carregarSenhas();
    } else {
      alert("Erro ao registrar chamada: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}