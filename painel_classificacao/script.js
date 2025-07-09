/**
 * Sistema de Gestão de Senhas
 * Desenvolvido por Igor M. Kurahayachi
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxVwPnJItjnhujBJIrxwkRgvQGRZZkBJvWMWognGMi1c1B-XJwGmGm2XhIYdYmuHCQ1/exec";
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

    // ⬇️ Destaque visual para "Em triagem"
    if (status === "Em triagem") {
      tr.style.backgroundColor = "#ffcccc";
    }

    // ⬇️ Sempre exibe os três botões
    let botoes = `
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

  // Reatribui eventos aos botões dinâmicos
  document.querySelectorAll(".chamarBtn").forEach(btn =>
    btn.addEventListener("click", () => chamarPaciente(btn.dataset.senha))
  );

  document.querySelectorAll(".editarBtn").forEach(btn =>
    btn.addEventListener("click", () => abrirModal(btn.dataset.senha))
  );
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

async function salvarDados() {
    const nome = nomeInput.value.trim();
    const idade = idadeInput.value.trim();
    const especialidade = especialidadeInput.value.trim();
    const cor = corInput.value;
    const observacao = observacaoInput.value.trim();
    const maquina = localStorage.getItem("maquinaSelecionada") || "Classificação 01";

    if (!nome || !idade || !especialidade || !cor) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    try {
        const resp = await fetch(`${WEB_APP_URL}?action=chamar&senha=${encodeURIComponent(senhaSelecionada)}&maquina=${encodeURIComponent(maquina)}&nome=${encodeURIComponent(nome)}&idade=${encodeURIComponent(idade)}&especialidade=${encodeURIComponent(especialidade)}&cor=${encodeURIComponent(cor)}&observacao=${encodeURIComponent(observacao)}`);
        const result = await resp.json();
        if (result.success) {
            mostrarMensagem("Dados salvos com sucesso!");
            finalizarBtn.disabled = false;

            // 🚀 Atualiza a lista sem F5 (mantendo otimização)
            carregarSenhas(maquina);
        } else {
            alert("Erro ao salvar dados: " + result.message);
        }
    } catch (err) {
        alert("Erro na conexão: " + err.message);
    }
}

async function finalizarTriagemModal() {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Classificação 01";
  try {
    const resp = await fetch(
      `${WEB_APP_URL}?action=finalizarTriagem&senha=${encodeURIComponent(senhaSelecionada)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Classificação finalizada.");
      modal.classList.remove("show");

      // ——— FORÇA RECARREGAR TUDO ———
      isFirstLoad = true;       // na próxima chamada, timestampCliente será ""
      carregarSenhas();         // dispara um GET completo
      // ————————————————
    } else {
      alert("Erro ao finalizar triagem: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}

async function finalizarTriagem(senha) {
    const maquina = localStorage.getItem("maquinaSelecionada") || "Classificação 01";
    try {
        const resp = await fetch(`${WEB_APP_URL}?action=finalizarTriagem&senha=${encodeURIComponent(senha)}`);
        const result = await resp.json();
        if (result.success) {
            mostrarMensagem("Classificação finalizada.");
            carregarSenhas(maquina);
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
        const resp = await fetch(`${WEB_APP_URL}?action=excluir&senha=${senha}`);
        const result = await resp.json();
        if (result.success) {
            const maquina = localStorage.getItem("maquinaSelecionada") || "Classificação 01";
            carregarSenhas(maquina);
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
    carregarSenhas(maquina);
});

window.addEventListener("load", () => {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Classificação 01";
  spanMaquina.textContent = `(Máquina atual: ${maquina})`;

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

// Dispara chamada na ChamadaTV passando só a senha
async function chamarPaciente(senha) {
  const maquina = localStorage.getItem("maquinaSelecionada") || "Classificação 01";
  try {
    const resp = await fetch(
      `${WEB_APP_URL}?action=registrarChamadaTV`
      + `&senha=${encodeURIComponent(senha)}`
      + `&maquina=${encodeURIComponent(maquina)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Chamada registrada com sucesso.");

      // 🚀 Atualização imediata após clique em chamar
      isFirstLoad = true;
      carregarSenhas();
      
    } else {
      alert("Erro ao registrar chamada: " + result.message);
    }
  } catch (err) {
    alert("Erro na conexão: " + err.message);
  }
}


