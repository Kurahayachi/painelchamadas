const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbyiKkNeQFdXwJukv8MRCGm6lm8mMf06aaBZX-8yBaqA8Rp84QxTb1venFcRptzsgCve-w/exec";

let senhas = [];
const tbody = document.querySelector("#senhaTable tbody");
const POLLING_INTERVAL = 5000;

// Modal máquina
const modalMaquina = document.getElementById("modalMaquina");
const btnEngrenagem = document.getElementById("btnEngrenagem");
const salvarMaquinaBtn = document.getElementById("salvarMaquinaBtn");
const cancelarMaquinaBtn = document.getElementById("cancelarMaquinaBtn");
const spanMaquina = document.getElementById("spanMaquina");

// Notificador de topo
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

// Renderiza a tabela com base nas senhas
function render() {
    tbody.innerHTML = "";
    senhas.forEach(({ senha, data, status }) => {
        const tr = document.createElement("tr");
        const botoes = `
      <button class="btn-primario" onclick="chamarPaciente('${senha}')">Chamar</button>
      <button class="btn-liberar" onclick="liberarPaciente('${senha}')">Liberar</button>
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
}

// Carrega senhas com status "Aguardando Recepção"
async function carregarSenhas(maquina) {
    try {
        // O Apps Script espera action=listar para chamar listarSenhasRecepcao()
        const resp = await fetch(
            `${WEB_APP_URL}?action=listar&maquina=${encodeURIComponent(maquina)}`
        );
        senhas = await resp.json();
        render();
    } catch (err) {
        alert("Erro ao carregar senhas: " + err.message);
    }
}

// Ação de chamar paciente (exibição simples)
async function chamarPaciente(senha) {
    mostrarMensagem(`Paciente ${senha} chamado.`);
}

// Libera o paciente para o médico (muda status para "Aguardando Médico")
async function liberarPaciente(senha) {
    try {
        const resp = await fetch(
            `${WEB_APP_URL}?action=liberar&senha=${encodeURIComponent(senha)}`
        );
        const result = await resp.json();
        if (result.success) {
            mostrarMensagem("Paciente liberado para o médico.");
            const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
            carregarSenhas(maquina);
        } else {
            alert("Erro ao liberar: " + result.message);
        }
    } catch (err) {
        alert("Erro de conexão: " + err.message);
    }
}

// Exclui paciente da recepção
async function excluirSenha(senha) {
    if (!confirm(`Tem certeza que deseja excluir a senha ${senha}?`)) return;
    try {
        const resp = await fetch(
            `${WEB_APP_URL}?action=excluir&senha=${encodeURIComponent(senha)}`
        );
        const result = await resp.json();
        if (result.success) {
            const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
            carregarSenhas(maquina);
        } else {
            alert("Erro ao excluir: " + result.message);
        }
    } catch (err) {
        alert("Erro ao excluir: " + err.message);
    }
}

// Atualização automática
function iniciarAtualizacao() {
    const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
    carregarSenhas(maquina);
    setInterval(() => carregarSenhas(maquina), POLLING_INTERVAL);
}

// Engrenagem
btnEngrenagem.addEventListener("click", () => {
    modalMaquina.classList.add("show");
    const maquinaSalva = localStorage.getItem("maquinaSelecionada");
    if (maquinaSalva) {
        document.querySelectorAll("input[name='recepcao']").forEach((radio) => {
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

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const maquina = localStorage.getItem("maquinaSelecionada") || "Recepção 01";
    spanMaquina.textContent = `(Máquina atual: ${maquina})`;

    window.chamarPaciente = chamarPaciente;
    window.liberarPaciente = liberarPaciente;
    window.excluirSenha = excluirSenha;

    iniciarAtualizacao();
});