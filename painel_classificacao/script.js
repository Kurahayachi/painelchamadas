// --- script.js FINAL - AJUSTADO E COMENTADO ---

const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxGqaLyQ8xP0tUL5s_FHOrm2XY__0gD2rNTbrcMikcA6UBuyN-z78Un_OxX9keGmyZD/exec";

let senhas = [];
let senhaSelecionada = "";

const tbody = document.querySelector("#senhaTable tbody");
const POLLING_INTERVAL = 5000;

// Modal Paciente
const modal = document.getElementById("modal");
const nomeInput = document.getElementById("nome");
const idadeInput = document.getElementById("idade");
const especialidadeInput = document.getElementById("especialidade");
const corInput = document.getElementById("cor");
const observacaoInput = document.getElementById("observacao");
const salvarBtn = document.getElementById("salvarBtn");
const cancelarBtn = document.getElementById("cancelarBtn");
const finalizarBtn = document.getElementById("finalizarBtn");

// Modal Máquina
const modalMaquina = document.getElementById("modalMaquina");
const btnEngrenagem = document.getElementById("btnEngrenagem");
const salvarMaquinaBtn = document.getElementById("salvarMaquinaBtn");
const cancelarMaquinaBtn = document.getElementById("cancelarMaquinaBtn");
const spanMaquina = document.getElementById("spanMaquina");

// Notificador
const notificador = document.createElement("div");
notificador.id = "notificador";
notificador.style.position = "fixed";
notificador.style.top = "15px";
notificador.style.left = "50%";
notificador.style.transform = "translateX(-50%)";
notificador.style.background = "#38c172";
notificador.style.color = "white";
notificador.style.padding = "10px 20px";
notificador.style.borderRadius = "5px";
notificador.style.display = "none";
notificador.style.zIndex = "9999";
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
    senhas.forEach(({ senha, data, status }) => {
        const tr = document.createElement("tr");
        let botoes = "";
        if (status === "Em triagem") {
            botoes += `<button class="btn-finalizar" onclick="finalizarTriagem('${senha}')">Finalizar Classificação</button>`;
        } else {
            botoes += `<button class="btn-primario" onclick="abrirModal('${senha}')">Chamar</button>`;
            botoes += `<button class="btn-perigo" onclick="excluirSenha('${senha}')">Excluir</button>`;
        }
        tr.innerHTML = `
      <td>${senha}</td>
      <td>${new Date(data).toLocaleString()}</td>
      <td>${status}</td>
      <td>${botoes}</td>
    `;
        tbody.appendChild(tr);
    });
}

async function carregarSenhas(maquina) {
    try {
        const resp = await fetch(
            `${WEB_APP_URL}?action=listar&maquina=${encodeURIComponent(maquina)}`
        );
        senhas = await resp.json();
        render();
    } catch (err) {
        alert("Erro ao carregar senhas: " + err.message);
    }
}

function abrirModal(senha) {
    senhaSelecionada = senha;
    limparFormulario();
    modal.classList.add("show");
    finalizarBtn.disabled = true; // Inicialmente desabilitado
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
    const maquina =
        localStorage.getItem("maquinaSelecionada") || "Classificação 01";

    if (!nome || !idade || !especialidade || !cor) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    try {
        const resp = await fetch(
            `${WEB_APP_URL}?action=chamar&senha=${encodeURIComponent(
        senhaSelecionada
      )}&maquina=${encodeURIComponent(maquina)}&nome=${encodeURIComponent(
        nome
      )}&idade=${encodeURIComponent(idade)}&especialidade=${encodeURIComponent(
        especialidade
      )}&cor=${encodeURIComponent(cor)}&observacao=${encodeURIComponent(
        observacao
      )}`
        );
        const result = await resp.json();
        if (result.success) {
            mostrarMensagem("Dados salvos com sucesso!");
            finalizarBtn.disabled = false; // Habilita o botão Finalizar
        } else {
            alert("Erro ao salvar dados: " + result.message);
        }
    } catch (err) {
        alert("Erro na conexão: " + err.message);
    }
}

async function finalizarTriagemModal() {
    const maquina =
        localStorage.getItem("maquinaSelecionada") || "Classificação 01";
    try {
        const resp = await fetch(
            `${WEB_APP_URL}?action=finalizarTriagem&senha=${encodeURIComponent(
        senhaSelecionada
      )}`
        );
        const result = await resp.json();
        if (result.success) {
            mostrarMensagem("Classificação finalizada.");
            modal.classList.remove("show");
            carregarSenhas(maquina);
        } else {
            alert("Erro ao finalizar triagem: " + result.message);
        }
    } catch (err) {
        alert("Erro na conexão: " + err.message);
    }
}

async function finalizarTriagem(senha) {
    const maquina =
        localStorage.getItem("maquinaSelecionada") || "Classificação 01";
    try {
        const resp = await fetch(
            `${WEB_APP_URL}?action=finalizarTriagem&senha=${encodeURIComponent(
        senha
      )}`
        );
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
            const maquina =
                localStorage.getItem("maquinaSelecionada") || "Classificação 01";
            carregarSenhas(maquina);
        } else {
            alert("Erro ao excluir senha: " + result.message);
        }
    } catch (err) {
        alert("Erro na conexão: " + err.message);
    }
}

function iniciarAtualizacaoAutomatica() {
    const maquina =
        localStorage.getItem("maquinaSelecionada") || "Classificação 01";
    carregarSenhas(maquina);
    setInterval(() => carregarSenhas(maquina), POLLING_INTERVAL);
}

btnEngrenagem.addEventListener("click", () => {
    modalMaquina.classList.add("show");
    const maquinaSalva = localStorage.getItem("maquinaSelecionada");
    if (maquinaSalva) {
        document
            .querySelectorAll("input[name='classificacao']")
            .forEach((radio) => {
                radio.checked = radio.value === maquinaSalva;
            });
    }
});

cancelarMaquinaBtn.addEventListener("click", () => {
    modalMaquina.classList.remove("show");
});

salvarMaquinaBtn.addEventListener("click", () => {
    const selecionado = document.querySelector(
        "input[name='classificacao']:checked"
    );
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
    const maquina =
        localStorage.getItem("maquinaSelecionada") || "Classificação 01";
    spanMaquina.textContent = `(Máquina atual: ${maquina})`;

    window.abrirModal = abrirModal;
    window.excluirSenha = excluirSenha;
    window.finalizarTriagem = finalizarTriagem;

    cancelarBtn.addEventListener("click", cancelarModal);
    salvarBtn.addEventListener("click", salvarDados);
    finalizarBtn.addEventListener("click", finalizarTriagemModal);

    iniciarAtualizacaoAutomatica();
});