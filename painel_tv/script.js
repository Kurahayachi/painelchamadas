/**
 * Sistema de Gestão de Atendimento
 * Desenvolvido por Igor M. Kurahayachi
 * Analista de Sistemas - Rede Santa Catarina
 * Todos os direitos reservados.
 * Uso interno permitido mediante autorização do autor.
 */

// URL do seu Web App (Apps Script) que já implementa `action=chamadas`
const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbw0wHi03HdpRmKcjb4NhJz4YmcXWbKetJuqwdlR5RtbrO9FSOCcraHHvwpp4fWHY1vx/exec";

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

    // A chamada mais recente vem em chamadas[0]
    const chamadaAtual = chamadas[0];

    // Só dispara modal se a senha mudou (nova chamada)
    if (!ultimaChamada || chamadaAtual.uuid !== ultimaChamada.uuid) {
    ultimaChamada = chamadaAtual;
    mostrarModal(chamadaAtual);
    }

    // Atualiza texto de "Última chamada"
    ultimaSenhaElem.textContent = chamadaAtual.senha;
    ultimaNomeElem.textContent = chamadaAtual.nome;

    // PREENCHE AGORA CADA COLUNA A PARTIR DO CAMPO 'setor', NÃO MAIS 'maquina'
    // Pegamos as 3 últimas chamadas cujo 'setor' inclua a palavra (ignorando maiúsculas/minúsculas)
    const classificacao = chamadas
  .filter(
    c => c.setor && c.setor.toLowerCase().includes("classifica")
  )
  .slice(0, 5); // ← mantenha isso apenas se quiser limitar a 3 visualmente


    const recepcao = chamadas
        .filter(
            c =>
            c.setor &&
            (c.setor.toLowerCase().includes("recepção") ||
                c.setor.toLowerCase().includes("recep") ||
                c.setor.toLowerCase().includes("guiche"))
        )
        .slice(0, 3);

    const medico = chamadas
        .filter(
            c =>
            c.setor &&
            (c.setor.toLowerCase().includes("medic") ||
                c.setor.toLowerCase().includes("consult"))
        )
        .slice(0, 3);

    // Preenche cada lista (<ul>) com as senhas e nomes
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
        li.textContent = `${c.senha} – ${c.nome}`;
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