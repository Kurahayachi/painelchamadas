const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxismeV4ufjPbtKZA4dBYS2M0A69r_EbZ8WuVn8WM-y0WPlCT2GabPsK8GWhfwyCHDJ/exec";

let senhas = [];
let consultorioSelecionado = "";
let especialidadesSelecionadas = [];

const tbody = document.querySelector("#senhaTable tbody");
const spanMaquina = document.getElementById("spanMaquina");
const modalMaquina = document.getElementById("modalMaquina");
const btnEngrenagem = document.getElementById("btnEngrenagem");
const salvarMaquinaBtn = document.getElementById("salvarMaquinaBtn");
const cancelarMaquinaBtn = document.getElementById("cancelarMaquinaBtn");
const btnFiltro = document.getElementById("btnFiltroEspecialidade");
const filtroEspecialidades = document.getElementById("filtroEspecialidades");
const selectAll = document.getElementById("selectAll");

btnEngrenagem.addEventListener("click", () => {
    modalMaquina.classList.add("show");
    const saved = localStorage.getItem("consultorioSelecionado");
    if (saved) {
        document.querySelectorAll("input[name='consultorio']").forEach((radio) => {
            radio.checked = radio.value === saved;
        });
    }
});

cancelarMaquinaBtn.addEventListener("click", () => {
    modalMaquina.classList.remove("show");
});

salvarMaquinaBtn.addEventListener("click", () => {
    const selecionado = document.querySelector(
        "input[name='consultorio']:checked"
    );
    if (!selecionado) {
        alert("Selecione um consultório.");
        return;
    }
    consultorioSelecionado = selecionado.value;
    localStorage.setItem("consultorioSelecionado", consultorioSelecionado);
    spanMaquina.textContent = `(Consultório atual: ${consultorioSelecionado})`;
    modalMaquina.classList.remove("show");
    carregarSenhas();
});

btnFiltro.addEventListener("click", () => {
    filtroEspecialidades.classList.toggle("show");
});

document.getElementById("fecharFiltroBtn").addEventListener("click", () => {
    filtroEspecialidades.classList.remove("show");
});

selectAll.addEventListener("change", () => {
    document
        .querySelectorAll(".especialidade")
        .forEach((cb) => (cb.checked = selectAll.checked));
    atualizarFiltroEspecialidades();
});

document.querySelectorAll(".especialidade").forEach((cb) => {
    cb.addEventListener("change", atualizarFiltroEspecialidades);
});

function atualizarFiltroEspecialidades() {
    especialidadesSelecionadas = Array.from(
        document.querySelectorAll(".especialidade:checked")
    ).map((cb) => cb.value);
    render();
}

function render() {
    tbody.innerHTML = "";
    senhas
        .filter(
            (s) =>
            especialidadesSelecionadas.length === 0 ||
            especialidadesSelecionadas.includes(s.especialidade)
        )
        .forEach(({ senha, nome, idade, data, status, especialidade, cor }) => {
            const corClasse = `cor-${(cor || "").trim().replace(/\s+/g, "")}`;
            const tr = document.createElement("tr");

            tr.innerHTML = `
        <td>${senha}</td>
        <td>${nome || "-"}</td>
        <td>${idade || "-"}</td>
        <td>${new Date(data).toLocaleString()}</td>
        <td>${status}</td>
        <td>${especialidade}</td>
        <td><span class="cor-bolinha ${corClasse}"></span></td>
        <td>
          <button class="btn-primario" onclick="chamarPaciente('${senha}')">Chamar</button>
          <button class="btn-finalizar" onclick="liberarPaciente('${senha}')">Liberar</button>
        </td>
      `;

            tbody.appendChild(tr);
        });
}

function chamarPaciente(senha) {
    alert(`Chamando paciente: ${senha}`);
}

async function liberarPaciente(senha) {
    if (!consultorioSelecionado) {
        alert("Você precisa selecionar um consultório.");
        return;
    }

    try {
        const resp = await fetch(
            `${WEB_APP_URL}?action=liberar&senha=${encodeURIComponent(
        senha
      )}&consultorio=${encodeURIComponent(consultorioSelecionado)}`
        );
        const result = await resp.json();
        if (result.success) {
            carregarSenhas();
        } else {
            alert("Erro ao liberar: " + result.message);
        }
    } catch (err) {
        alert("Erro de conexão: " + err.message);
    }
}

async function carregarSenhas() {
    try {
        const resp = await fetch(`${WEB_APP_URL}?action=listar`);
        senhas = await resp.json();
        render();
    } catch (err) {
        alert("Erro ao carregar senhas: " + err.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    consultorioSelecionado = localStorage.getItem("consultorioSelecionado") || "";
    if (consultorioSelecionado) {
        spanMaquina.textContent = `(Consultório atual: ${consultorioSelecionado})`;
    }

    window.chamarPaciente = chamarPaciente;
    window.liberarPaciente = liberarPaciente;

    carregarSenhas();
    setInterval(carregarSenhas, 5000);
});