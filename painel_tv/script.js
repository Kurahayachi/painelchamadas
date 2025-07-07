/**
 * Sistema de Gestão de Atendimento
 * Desenvolvido por Igor M. Kurahayachi
 * Analista de Sistemas - Rede Santa Catarina
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

// URL do seu Web App (Apps Script) que já implementa `action=chamadas`
const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycby45gpx6r1rxy10P3S2qwx6K6utzpUHsY2Mgu7_ekqOeZRsxtb7MASFOivbo8JGfUM9/exec";

// Elementos do DOM
const ultimaSenhaElem = document.getElementById("ultimaSenha");
const ultimaNomeElem = document.getElementById("ultimaNome");

const modal = document.getElementById("modalChamada");
const modalSenha = document.getElementById("modal-senha");
const modalNome = document.getElementById("modal-nome");
const modalMaquina = document.getElementById("modal-maquina");

const listaClassificacao = document.getElementById("historicoClassificacao");
const listaRecepcao = document.getElementById("historicoRecepcao");
const listaMedico = document.getElementById("historicoMedico");

let ultimaChamada = null;
// guarda o timestamp da última chamada pendente exibida
let isFirstLoadPendentes = true;
let ultimaPendencia = localStorage.getItem("ultimaPendencia") || "";


/**
 * @param {Array<Object>} chamadas
 * Cada objeto 'chamada' agora traz:
 *   {
 *     senha:   "A010",
 *     nome:    "João Silva",
 *     maquina: "CONSULTÓRIO 05",        // nome da máquina/setor
 *     setor:   "Classificação",         // campo que definimos no appendRow
 *     data:    "2025-06-05T14:24:50.123Z",
 *     uuid:    "550e8400-e29b-41d4-a716-446655440000"
 *   }
 */
/**
 * Exibe os modais de forma sequencial, um por um, com intervalo de 12 segundos entre eles.
 */
function exibirModaisSequencial(chamadasPendentes, index = 0) {
  if (index >= chamadasPendentes.length) return;

  const chamada = chamadasPendentes[index];
  mostrarModal(chamada);
  marcarComoExibido(chamada.uuid);

  // Espera o tempo total (10s de exibição + 2s de pausa) antes de chamar o próximo
  setTimeout(() => {
    exibirModaisSequencial(chamadasPendentes, index + 1);
  }, 15000);  // Total = 10s + 2s de respiro
}

/**
 * Atualiza a interface da TV com base nas chamadas recebidas do Apps Script.
 * Exibe o modal apenas para as chamadas que ainda não foram exibidas na TV (coluna G ≠ "Sim").
 * Atualiza o topo da tela com a última senha chamada.
 */
function atualizarUI(chamadas) {
  if (!chamadas || chamadas.length === 0) return;

  // Filtra apenas as chamadas que ainda não foram exibidas na TV
  const chamadasPendentes = chamadas.filter(
    c => !c.exibidoTV || c.exibidoTV.toLowerCase() !== "sim"
  );

  // Exibe os modais um por um, com intervalo entre eles
  if (chamadasPendentes.length > 0) {
    exibirModaisSequencial(chamadasPendentes);
  }

  // Atualiza o campo da última senha e nome (topo da tela)
  const ultimaChamadaNaLista = chamadas[0];
  if (ultimaChamadaNaLista) {
    ultimaSenhaElem.textContent = ultimaChamadaNaLista.senha;
    ultimaNomeElem.textContent = ultimaChamadaNaLista.nome;
  }

  // Preenche a coluna CLASSIFICAÇÃO (últimas 5 chamadas com setor contendo "classifica")
  const classificacao = chamadas
    .filter(c => c.setor && c.setor.toLowerCase().includes("classifica"))
    .slice(0, 5);

  // Preenche a coluna RECEPÇÃO (últimas 5 chamadas cujo setor contenha "recep", "recepção" ou "guiche")
  const recepcao = chamadas
    .filter(c =>
      c.setor &&
      (c.setor.toLowerCase().includes("recepção") ||
       c.setor.toLowerCase().includes("recep") ||
       c.setor.toLowerCase().includes("guiche"))
    )
    .slice(0, 5);

  // Preenche a coluna MÉDICO (últimas 5 chamadas com setor exatamente "Médico")
  const medico = chamadas
    .filter(c => c.setor && c.setor.toLowerCase() === "médico")
    .slice(0, 5);

  // Atualiza as 3 colunas da interface
  preencherLista(listaClassificacao, classificacao);
  preencherLista(listaRecepcao, recepcao);
  preencherLista(listaMedico, medico);
}


/**
 * Limpa a <ul> e insere <li> para cada objeto 'c' recebido.
 * c.senha e c.nome já estão disponíveis.
 */
function preencherLista(elemento, dados) {
  elemento.innerHTML = "";
  dados.forEach(c => {
    const li = document.createElement("li");

    // Se for CLASSIFICAÇÃO ou MÉDICO, mostra a máquina
    if (
      elemento.id === "historicoClassificacao" ||
      elemento.id === "historicoMedico"
    ) {
      li.textContent = `${c.senha} (${c.maquina})`;
    } else {
      li.textContent = `${c.senha} – ${c.nome}`;
    }

    elemento.appendChild(li);
  });
}


/**
 * Exibe o modal de destaque para a chamada atual.
 * Modal mostra senha, nome e máquina/setor que chamou.
 */
function mostrarModal(chamada) {
    modalSenha.textContent  = chamada.senha;
    modalNome.textContent   = chamada.nome;
    modalMaquina.textContent = chamada.maquina;

    modal.classList.add("show");

    // toca um áudio de chamada (se existir <audio id="somChamada">)
    const audio = document.getElementById("somChamada");
    if (audio) {
        audio.pause();         // interrompe qualquer reprodução anterior
        audio.currentTime = 0; // volta ao início
        audio.play().catch(err => console.warn("Erro ao tocar som:", err));
    }

    // Após 15 s, oculta o modal automaticamente
    setTimeout(() => {
        modal.classList.remove("show");
    }, 15000);
}

/**
 * Após exibir o modal de uma chamada, envia um GET ao Apps Script
 * para marcar a linha como "Exibido na TV".
 */
function marcarComoExibido(uuid) {
  fetch(`${WEB_APP_URL}?action=marcarExibido&uuid=${encodeURIComponent(uuid)}`)
    .then(response => response.json())
    .then(data => {
      console.log(`UUID ${uuid} marcado como exibido na TV:`, data);
    })
    .catch(error => {
      console.warn(`Falha ao marcar UUID ${uuid} como exibido:`, error);
    });
}
// Função 1: Carrega o histórico para as 3 colunas da tela
async function carregarHistorico() {
    try {
        const resp = await fetch(`${WEB_APP_URL}?action=historico`);
        if (!resp.ok) throw new Error("Erro ao carregar histórico");

        const dados = await resp.json();
        atualizarUI(dados);
    } catch (e) {
        console.warn("Falha ao carregar histórico:", e);
    }
}

// Função 2: Carrega apenas as chamadas pendentes para exibir os modais
async function carregarPendentes() {
  console.log(`[${new Date().toLocaleTimeString()}] ▶️ carregarPendentes() chamado com tsCliente=`, ultimaPendencia);

  try {
    // se for o 1º load, força param vazio; senão, usa o stored timestamp
    const tsParam = (!isFirstLoadPendentes && ultimaPendencia)
      ? `&timestampCliente=${encodeURIComponent(ultimaPendencia)}`
      : "";

    // depois da 1ª chamada, desligue o flag
    isFirstLoadPendentes = false;

    const resp = await fetch(`${WEB_APP_URL}?action=pendingCalls${tsParam}`);
    const result = await resp.json();

    console.log(`[${new Date().toLocaleTimeString()}] ← resposta pendingCalls:`, result);

    if (!result.atualizacao) {
      console.log(`[${new Date().toLocaleTimeString()}] Nenhuma pendência nova.`);
      return;
    }

    console.log(
      `[${new Date().toLocaleTimeString()}] Novas pendências! ISO:`,
      result.ultimaAtualizacao,
      "→ chamadas:",
      result.chamadas
    );

    if (result.chamadas && result.chamadas.length) {
      exibirModaisSequencial(result.chamadas);
    }


    ultimaPendencia = result.ultimaAtualizacao;
    localStorage.setItem("ultimaPendencia", ultimaPendencia);

  } catch (e) {
    console.warn("Falha ao buscar chamadas pendentes:", e);
  }
}

// Ao carregar a página, inicia o polling e carrega imediatamente.
document.addEventListener("DOMContentLoaded", () => {
  // limpa o localStorage para garantir GET completo após F5:
  localStorage.removeItem("ultimaPendencia");
  isFirstLoadPendentes = true;

  carregarHistorico();
  carregarPendentes();
  setInterval(() => {
    carregarHistorico();
    carregarPendentes();
  }, 5000);
});

/**
 * Exibe um overlay com spinner antes de fazer o reload automático da TV.
 * Isso evita congelamento e melhora a experiência visual.
 */
setTimeout(() => {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
        overlay.style.display = "flex"; // Mostra o overlay com o spinner
    }

    // Aguarda 1 segundo para o usuário visualizar a tela de carregamento, depois faz o reload
    setTimeout(() => {
        location.reload();
    }, 1000);
}, 1000 * 60 * 1); // Executa o reload a cada 30 minutos

