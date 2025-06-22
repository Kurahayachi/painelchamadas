/**
 * Sistema de Gestão de Atendimento
 * Desenvolvido por Igor M. Kurahayachi
 * Analista de Sistemas - Rede Santa Catarina
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

// URL do seu Web App (Apps Script) que já implementa `action=chamadas`
const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbyrgLyKJ1e7CxtPZqzgRgoN1RKRmdbzSfwxUMPFZmToHObfFH6BsCQEpoKW62oC5lXZ/exec";
const WEB_APP_URL_MARCAR =
    "https://script.google.com/macros/s/AKfycbyrgLyKJ1e7CxtPZqzgRgoN1RKRmdbzSfwxUMPFZmToHObfFH6BsCQEpoKW62oC5lXZ/exec";

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
function atualizarUI(chamadas) {
  if (!chamadas || chamadas.length === 0) return;

  const chamadaAtual = chamadas[0];

  // Só exibe o modal se for uma nova chamada (evita repetir o mesmo som)
 if (!ultimaChamada || chamadaAtual.uuid !== ultimaChamada.uuid) {
  ultimaChamada = chamadaAtual;
  mostrarModal(chamadaAtual);
  marcarComoExibido(chamadaAtual.uuid); // <<< Nova linha: marca como exibido na TV
}
  // Atualiza o campo da última senha e nome (topo da tela)
  ultimaSenhaElem.textContent = chamadaAtual.senha;
  ultimaNomeElem.textContent = chamadaAtual.nome;

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
    modalSenha.textContent = chamada.senha;
    modalNome.textContent = chamada.nome;
    modalMaquina.textContent = chamada.maquina; // agora exibe o nome da máquina que chamou

    modal.classList.add("show");

    // toca um áudio de chamada (se existir <audio id="somChamada">)
    const audio = document.getElementById("somChamada");
    if (audio) {
        audio.play().catch(err => console.warn("Erro ao tocar som:", err));
    }

    // Após 10 s, oculta o modal automaticamente
    setTimeout(() => {
        modal.classList.remove("show");
    }, 10000);
}

/**
 * Após exibir o modal de uma chamada, envia um GET ao Apps Script
 * para marcar a linha como "Exibido na TV".
 */
function marcarComoExibido(uuid) {
  fetch(`${WEB_APP_URL_MARCAR}?action=marcarExibido&uuid=${encodeURIComponent(uuid)}`)
    .then(response => response.json())
    .then(data => {
      console.log(`UUID ${uuid} marcado como exibido na TV:`, data);
    })
    .catch(error => {
      console.warn(`Falha ao marcar UUID ${uuid} como exibido:`, error);
    });
}
/**
 * Faz o fetch para `?action=chamadas` a cada 5 s e atualiza a UI.
 */
async function carregarChamadas() {
    try {
        const resp = await fetch(`${WEB_APP_URL}?action=chamadas`);

        if (!resp.ok) throw new Error("Resposta inválida do servidor");

        const dados = await resp.json();
        atualizarUI(dados);
    } catch (e) {
        // Silencia o erro para não interromper a UX do painel TV
        console.warn("Falha temporária ao buscar chamadas. Tentando novamente no próximo ciclo...");
    }
}


// Ao carregar a página, inicia o polling e carrega imediatamente.
document.addEventListener("DOMContentLoaded", () => {
    carregarChamadas();
    setInterval(carregarChamadas, 5000);
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

