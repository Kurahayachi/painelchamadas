const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbw2c6xdblSlDnO6pkUxBOKtIJq6qw7Sfnfd58xiA21tV-VYylTw3et7A5k-0Uvzz6xe/exec";

// Auto-reload a cada 15 minutos para amnter a sessão ativa
setInterval(() => {
    console.log("⏳ 5 minutos se passaram, recarregando o painel de médico...");
    location.reload();
}, 15 * 60 * 1000);

let senhas = [];
let consultorioSelecionado = "";
let especialidadesSelecionadas = [];
let ultimaLeitura = "";

const tbody = document.querySelector("#senhaTable tbody");
const spanMaquina = document.getElementById("spanMaquina");
const modalMaquina = document.getElementById("modalMaquina");
const btnEngrenagem = document.getElementById("btnEngrenagem");
const salvarMaquinaBtn = document.getElementById("salvarMaquinaBtn");
const cancelarMaquinaBtn = document.getElementById("cancelarMaquinaBtn");
const btnFiltro = document.getElementById("btnFiltroEspecialidade");
const filtroEspecialidades = document.getElementById("filtroEspecialidades");
const selectAll = document.getElementById("selectAll");
// Cria o elemento visual do notificador (a caixinha de mensagem que aparece no topo da tela)
const notificador = document.createElement("div");
notificador.id = "notificador";
// Define o estilo visual da caixinha (posição, cor, fonte, sombra, etc)
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
notificador.style.fontWeight = "bold";
notificador.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.2)";
// Adiciona o elemento criado dentro do body da página
document.body.appendChild(notificador);
// Função para exibir o notificador com o texto desejado e sumir sozinho depois de 3 segundos
function mostrarMensagem(texto) {
  notificador.textContent = texto;
  notificador.style.display = "block";
  setTimeout(() => {
    notificador.style.display = "none";
  }, 3000);
}

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
        <button class="btn-primario" onclick="chamarPaciente('${senha}')">📣 Chamar</button>
        <button class="btn-finalizar" onclick="abrirModalConfirmar('${senha}')">Finalizar</button>
        </td>

      `;

            tbody.appendChild(tr);
        });
}

async function chamarPaciente(senha) {
  if (!consultorioSelecionado) {
    alert("Você precisa selecionar um consultório.");
    return;
  }

  try {
    const resp = await fetch(`${WEB_APP_URL}?action=registrarChamadaTV&senha=${encodeURIComponent(senha)}&consultorio=${encodeURIComponent(consultorioSelecionado)}`);
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Paciente chamado com sucesso.");
    } else {
      alert("Erro ao chamar: " + result.message);
    }
  } catch (err) {
    console.warn("Erro ao chamar:", err);
  }
}
function abrirModalConfirmar(senha) {
  senhaSelecionada = senha;
  document.getElementById("senhaConfirmar").textContent = senha;
  document.getElementById("modalConfirmar").classList.add("show");
}
async function finalizarTriagemModal() {
  if (!consultorioSelecionado) {
    alert("Você precisa selecionar um consultório.");
    return;
  }

  try {
    const resp = await fetch(
      `${WEB_APP_URL}?action=liberar&senha=${encodeURIComponent(senhaSelecionada)}&consultorio=${encodeURIComponent(consultorioSelecionado)}`
    );
    const result = await resp.json();
    if (result.success) {
      mostrarMensagem("Atendimento finalizado com sucesso.");
      document.getElementById("modalConfirmar").classList.remove("show");
      carregarSenhas();
    } else {
      alert("Erro ao finalizar: " + result.message);
    }
  } catch (err) {
    console.warn("Erro ao finalizar:", err);
  }
}
async function carregarSenhas() {
  try {
    const url = `${WEB_APP_URL}?action=listar${
      ultimaLeitura ? `&timestamp=${encodeURIComponent(ultimaLeitura)}` : ""
    }`;

    const resp = await fetch(url);
    const result = await resp.json();

    if (!result.atualizacao) return;

    senhas = result.senhas;
    ultimaLeitura = result.ultimaLeitura;
    render();
  } catch (err) {
    console.warn("Erro ao carregar senhas:", err);
  }
}
window.addEventListener("load", async () => {
  consultorioSelecionado = localStorage.getItem("consultorioSelecionado") || "";
  if (consultorioSelecionado) {
    spanMaquina.textContent = `(Consultório atual: ${consultorioSelecionado})`;
  }

  window.chamarPaciente = chamarPaciente;
  window.abrirModalConfirmar = abrirModalConfirmar;

  document.getElementById("btnCancelarConfirmar").addEventListener("click", () => {
    document.getElementById("modalConfirmar").classList.remove("show");
  });

  document.getElementById("btnConfirmarFinalizar").addEventListener("click", () => {
    finalizarTriagemModal();
  });

  try {
    await carregarSenhas();
    setInterval(carregarSenhas, 5000);
  } catch (error) {
    console.warn("Erro inicial:", error);
  }
});


