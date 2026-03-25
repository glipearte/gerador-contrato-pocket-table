/* =============================================
   CONTRATO — Geração, templates e CRUD
   ============================================= */

let contratoTipoSelecionado = null;
let assinaturaBase64 = null;
let contratoEditandoId = null;
let contratosData = [];

// ─── Itens de reposição por tipo ─────────────
let ITENS_REPOSICAO = {
  BASICO: [],
  LUXO: []
};

// ─── Inicializar itens de reposição ──────────
function initItensReposicao() {
  const salvos = Storage.reposicao.getAll();
  ITENS_REPOSICAO.BASICO = salvos.BASICO || [
    { id: 'mesa', label: 'Mesa desmontável', valor: 350 },
    { id: 'painel', label: 'Painel de encaixe', valor: 80 },
    { id: 'capa', label: 'Capa de tecido / disco PVC', valor: 70 },
    { id: 'doceiras', label: 'Doceiras (4 unidades)', valor: 100 },
    { id: 'boleira', label: 'Boleira', valor: 80 },
    { id: 'vaso', label: 'Vaso', valor: 60 },
    { id: 'arranjo', label: 'Arranjo de flores', valor: 90 },
    { id: 'placa', label: 'Placa PVC adesivado', valor: 60 },
  ];
  ITENS_REPOSICAO.LUXO = salvos.LUXO || [
    { id: 'mesa', label: 'Mesa desmontável', valor: 350 },
    { id: 'painel', label: 'Painel de encaixe', valor: 80 },
    { id: 'capa', label: 'Capa temática', valor: 70 },
    { id: 'boleira', label: 'Boleira de cerâmica/metal', valor: 180 },
    { id: 'vaso', label: 'Vaso de cerâmica/vidro', valor: 180 },
    { id: 'doceiras', label: 'Suportes de cerâmica', valor: 150 },
    { id: 'arranjo', label: 'Arranjo de flores', valor: 100 },
    { id: 'placa', label: 'Placa PVC adesivado', valor: 60 },
  ];
}

// ─── Selecionar tipo no Step 1 ───────────────
function selectTipo(tipo) {
  contratoTipoSelecionado = tipo;

  document.querySelectorAll('.contract-type-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('card-' + tipo)?.classList.add('selected');

  document.getElementById('btnStep1Next').disabled = false;
}

function setContratoTipo(tipo) {
  setTimeout(() => selectTipo(tipo), 100);
}

// ─── Navegação do wizard ─────────────────────
let currentStep = 1;

function nextStep(to) {
  if (!validateStep(currentStep)) return;
  goToStep(to);
}

function prevStep(to) {
  goToStep(to);
}

function goToStep(n) {
  document.getElementById(`step-${currentStep}`)?.classList.add('hidden');
  document.getElementById(`step-${n}`)?.classList.remove('hidden');

  // Atualiza indicadores
  for (let i = 1; i <= 5; i++) {
    const ind = document.getElementById(`step-ind-${i}`);
    if (!ind) continue;
    ind.classList.remove('active', 'completed');
    if (i < n) ind.classList.add('completed');
    else if (i === n) ind.classList.add('active');
  }

  currentStep = n;

  if (n === 4) carregarValoresStep4();
  if (n === 5) renderContratoPreview();
}

// ─── Validação por step ──────────────────────
function validateStep(step) {
  if (step === 1) {
    if (!contratoTipoSelecionado) {
      showToast('Selecione o tipo de contrato (Básico ou Luxo).', 'error');
      return false;
    }
  }

  if (step === 2) {
    const nome = document.getElementById('c_nome').value.trim();
    const tel  = document.getElementById('c_telefone').value.trim();
    if (!nome) { showToast('Informe o nome do locatário.', 'error'); return false; }
    if (!tel)  { showToast('Informe o telefone do locatário.', 'error'); return false; }
  }

  if (step === 3) {
    const ret = document.getElementById('e_retirada').value;
    const dev = document.getElementById('e_devolucao').value;
    if (!ret) { showToast('Informe a data de retirada.', 'error'); return false; }
    if (!dev) { showToast('Informe a data de devolução.', 'error'); return false; }
  }

  return true;
}

// ─── Carregar valores no Step 4 ──────────────
function carregarValoresStep4() {
  // Inicializa itens de reposição se necessário
  initItensReposicao();
  
  const tipo = contratoTipoSelecionado || 'BASICO';

  // Valor total default
  const valPadrao = tipo === 'LUXO' ? (appConfig.valorLuxo || 350) : (appConfig.valorBasico || 280);
  if (!document.getElementById('v_total').value) {
    document.getElementById('v_total').value = valPadrao.toFixed(2);
  }
  calcularSinal();

  // PIX
  if (!document.getElementById('v_pix').value) {
    document.getElementById('v_pix').value = appConfig.pix || '';
  }

  // Reposição
  renderReposicaoInputs('reposicaoContainer', tipo);
}

function renderReposicaoInputs(containerId, tipo) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const itens = ITENS_REPOSICAO[tipo] || ITENS_REPOSICAO.BASICO;
  container.innerHTML = itens.map(item => `
    <div class="reposicao-item">
      <label>${item.label}</label>
      <div class="input-reposicao">
        <span>R$</span>
        <input type="number" id="rep_${item.id}" value="${item.valor}" step="0.01" min="0" />
      </div>
    </div>
  `).join('');
}

function calcularSinal() {
  const total = parseFloat(document.getElementById('v_total').value) || 0;
  document.getElementById('v_sinal').value = (total / 2).toFixed(2);
}

// ─── Obter itens de reposição do form ─────────
function getItensReposicao() {
  const tipo = contratoTipoSelecionado || 'BASICO';
  const itens = ITENS_REPOSICAO[tipo] || ITENS_REPOSICAO.BASICO;
  return itens.map(item => ({
    ...item,
    valor: parseFloat(document.getElementById('rep_' + item.id)?.value) || item.valor,
  }));
}

// ─── Gerar número do contrato ─────────────────
function gerarNumeroContrato() {
  const now = new Date();
  const ano = now.getFullYear();
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${ano}/${seq}`;
}

// ─── Montar objeto contrato ────────────────────
function montarContratoObj() {
  const c = getClienteWizard();
  const tipo = contratoTipoSelecionado || 'BASICO';
  const total = parseFloat(document.getElementById('v_total').value) || 0;
  const itens = getItensReposicao();

  return {
    numero: gerarNumeroContrato(),
    tipo,
    cliente_nome: c.nome,
    cliente_cpf:  c.cpf,
    cliente_rg:   c.rg,
    cliente_tel:  c.telefone,
    cliente_email: c.email,
    cliente_endereco: c.endereco,
    cliente_cidade: c.cidade,
    cliente_estado: c.estado,
    endereco_evento: document.getElementById('e_endereco').value.trim(),
    data_retirada:   document.getElementById('e_retirada').value,
    data_devolucao:  document.getElementById('e_devolucao').value,
    observacoes:     document.getElementById('e_obs').value.trim(),
    valor_total: total,
    valor_sinal: total / 2,
    chave_pix:   document.getElementById('v_pix').value.trim(),
    itens:       JSON.stringify(itens),
    status:      assinaturaBase64 ? 'assinado' : 'rascunho',
    assinatura_locatario: assinaturaBase64 || '',
    data_assinatura: assinaturaBase64 ? new Date().toISOString() : '',
  };
}

// ─── Salvar contrato no localStorage ──────────
async function salvarContrato() {
  if (!validateStep(2)) return;

  const dados = montarContratoObj();

  // Salvar cliente se necessário
  const clienteId = await salvarClienteSeNovo();
  if (clienteId) dados.cliente_id = clienteId;

  try {
    let salvo;
    if (contratoEditandoId) {
      salvo = Storage.contratos.update(contratoEditandoId, dados);
    } else {
      salvo = Storage.contratos.create(dados);
      contratoEditandoId = salvo.id;
    }

    showToast('Contrato salvo com sucesso!', 'success');
    await loadContratos();
    updateDashboardStats();

    const confirm = await Swal.fire({
      title: 'Contrato salvo!',
      html: `<p>O contrato <strong>Nº ${dados.numero}</strong> foi salvo.</p>
             <p style="margin-top:12px;">Deseja gerar o PDF agora?</p>`,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-file-pdf"></i> Gerar PDF',
      cancelButtonText: 'Ir para contratos',
      confirmButtonColor: '#1a3a5c',
    });

    if (confirm.isConfirmed) {
      gerarPDF();
    } else {
      navigate('contratos');
      resetWizard();
    }
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar contrato.', 'error');
  }
}

// ─── Render preview do contrato ───────────────
function renderContratoPreview(contratoData = null) {
  const el = document.getElementById('contratoPreview');
  if (!el) return;
  el.innerHTML = gerarHTMLContrato(contratoData);
}

function gerarHTMLContrato(data = null) {
  // Se não passou data, monta do wizard
  if (!data) data = montarContratoObj();

  const tipo     = data.tipo || 'BASICO';
  const tipoLabel = tipo === 'LUXO' ? 'LUXO' : 'BÁSICO';
  const numContrato = data.numero || '—';

  const itens = (() => {
    try { return JSON.parse(data.itens || '[]'); } catch { return []; }
  })();

  const itensDescricao = tipo === 'LUXO'
    ? '1 mesa desmontável; 1 painel com capa temática; suportes de cerâmica para doces; 1 boleira; 1 vaso com arranjo floral; 1 placa de PVC personalizada.'
    : '1 mesa desmontável; 1 painel de encaixe; 1 capa temática; 4 doceiras; 1 boleira; 1 vaso com arranjo de flores; 1 placa de PVC adesivada e personalizada.';

  const formatDate = (str) => {
    if (!str) return '—';
    try {
      const d = new Date(str);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return str; }
  };

  const formatMoeda = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const dataAssinatura = data.data_assinatura ? formatDate(data.data_assinatura) : hoje;

  const assinaturaImg = data.assinatura_locatario
    ? `<img src="${data.assinatura_locatario}" class="cp-signature-img" style="max-height:70px;" alt="Assinatura" />`
    : '';

  return `
    <div class="cp-header">
      <div class="cp-logo-wrapper">
        <div class="cp-logo-circle">🎈</div>
        <div>
          <div class="cp-company-name">Glipearte</div>
          <div class="cp-company-sub">Pegue e Monte</div>
        </div>
      </div>
      <div class="cp-title">Contrato de Locação — Pocket Table ${tipoLabel}</div>
      <div class="cp-subtitle">Festas incríveis começam aqui ✨</div>
      <div class="cp-numero">Nº ${numContrato} | Fortaleza - CE</div>
    </div>

    <div class="cp-parties">
      <div class="cp-party">
        <h4>Locadora</h4>
        <p><strong>Glipearte Pegue e Monte</strong></p>
        <p>📍 Fortaleza - CE</p>
        <p>📞 ${appConfig.telefone || '(85) 99999-0000'}</p>
      </div>
      <div class="cp-party">
        <h4>Locatário(a)</h4>
        <p><strong>${escHtml(data.cliente_nome) || '—'}</strong></p>
        ${data.cliente_cpf ? `<p>CPF: ${escHtml(data.cliente_cpf)}</p>` : ''}
        ${data.cliente_rg  ? `<p>RG: ${escHtml(data.cliente_rg)}</p>` : ''}
        ${data.cliente_tel ? `<p>📞 ${escHtml(data.cliente_tel)}</p>` : ''}
        ${data.cliente_endereco ? `<p>📍 ${escHtml(data.cliente_endereco)}${data.cliente_cidade ? ', ' + escHtml(data.cliente_cidade) : ''}${data.cliente_estado ? '/' + escHtml(data.cliente_estado) : ''}</p>` : ''}
      </div>
    </div>

    <p class="cp-clause-title">Cláusula Primeira — Do Objeto</p>
    <p>A Locadora compromete-se a entregar ao(à) Locatário(a) em regime de locação temporária o seguinte conjunto de itens:</p>
    <div class="cp-highlight-box">${itensDescricao}</div>
    <p>O kit será utilizado no seguinte endereço: <strong>${escHtml(data.endereco_evento) || '—'}</strong></p>

    <p class="cp-clause-title">Cláusula Segunda — Do Prazo e Logística</p>
    <table class="cp-table">
      <tr>
        <th>Data / Horário de Retirada</th>
        <th>Data / Horário de Devolução</th>
      </tr>
      <tr>
        <td><strong>${formatDate(data.data_retirada)}</strong></td>
        <td><strong>${formatDate(data.data_devolucao)}</strong></td>
      </tr>
    </table>
    <p>É obrigatório o envio de foto do documento de identidade (RG/CPF) e comprovante de residência pelo WhatsApp antes da retirada do kit.</p>

    <p class="cp-clause-title">Cláusula Terceira — Do Preço e Forma de Pagamento</p>
    <div class="cp-highlight-box">
      <div class="cp-value-line"><span>Valor Total da Locação:</span><strong>${formatMoeda(data.valor_total)}</strong></div>
      <div class="cp-value-line"><span>Sinal (50% — para confirmar reserva):</span><strong>${formatMoeda(data.valor_sinal)}</strong></div>
      <div class="cp-value-line"><span>Saldo (pagar até a retirada):</span><strong>${formatMoeda(data.valor_sinal)}</strong></div>
      <div class="cp-value-line" style="border:none;margin-top:8px;"><span>Chave PIX:</span><strong>${escHtml(data.chave_pix) || '—'}</strong></div>
    </div>

    <p class="cp-clause-title">Cláusula Quarta — Das Obrigações do Locatário</p>
    <p>O(a) Locatário(a) se compromete a:</p>
    <ul style="margin:10px 0 10px 20px;font-size:13px;line-height:2;">
      <li>Usar os itens com zelo e cuidado;</li>
      <li>Devolver os itens na data e horário combinados, limpos e nas embalagens originais;</li>
      <li>Não emprestar ou ceder os itens a terceiros sem autorização prévia;</li>
      <li>Comunicar imediatamente qualquer dano ou extravio à Locadora.</li>
    </ul>

    <p class="cp-clause-title">Cláusula Quinta — Das Penalidades por Danos, Extravio e Atraso</p>
    <p><strong>§ 1º — Danos irreversíveis ou extravio:</strong> o(a) Locatário(a) deverá ressarcir o valor de reposição de cada item no ato da devolução, conforme tabela abaixo:</p>
    ${itens.length ? `
    <table class="cp-table">
      <thead><tr><th>Item</th><th>Valor de Reposição</th></tr></thead>
      <tbody>
        ${itens.map(i => `<tr><td>${escHtml(i.label)}</td><td>${formatMoeda(i.valor)}</td></tr>`).join('')}
      </tbody>
    </table>` : ''}
    <p><strong>§ 2º — Danos reversíveis:</strong> o custo de manutenção será avaliado por profissional especializado e deverá ser pago pelo(a) Locatário(a) em até 24 horas após a notificação.</p>
    <p><strong>§ 3º — Embalagens:</strong> a perda ou dano à sacola ou capa da embalagem gerará cobrança de ressarcimento.</p>
    <p><strong>§ 4º — Atraso na devolução:</strong> será cobrada multa de <strong>50% do valor da locação por dia de atraso</strong>, caso não haja aviso prévio à Locadora.</p>

    <p class="cp-clause-title">Cláusula Sexta — Da Rescisão e Cancelamento</p>
    <p>Em caso de desistência por parte do(a) Locatário(a), os valores já pagos <strong>não serão devolvidos</strong>, sendo convertidos em crédito para utilização em nova locação no prazo de até <strong>12 (doze) meses</strong>.</p>
    <p><strong>Parágrafo Único:</strong> alterações de data ficam sujeitas à disponibilidade do material. Se não houver disponibilidade, o(a) Locatário(a) poderá escolher outro item de valor equivalente.</p>

    <p class="cp-clause-title">Cláusula Sétima — Do Foro</p>
    <p>Fica eleito o foro da Comarca de <strong>Fortaleza — CE</strong> para dirimir quaisquer controvérsias oriundas do presente instrumento.</p>

    ${data.observacoes ? `
    <p class="cp-clause-title">Observações</p>
    <div class="cp-highlight-box">${escHtml(data.observacoes)}</div>` : ''}

    <p style="margin-top:24px;text-align:center;font-size:13px;">
      Estando justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor.
    </p>
    <p style="text-align:center;font-size:13px;margin-top:4px;">
      Fortaleza, ${dataAssinatura}
    </p>

    <div class="cp-signatures">
      <div class="cp-signature-block">
        <div class="cp-signature-line"></div>
        <div class="cp-signature-label"><strong>Glipearte Pegue e Monte</strong><br>Locadora</div>
      </div>
      <div class="cp-signature-block">
        ${assinaturaImg}
        <div class="cp-signature-line" style="${assinaturaImg ? 'margin-top:6px' : ''}"></div>
        <div class="cp-signature-label"><strong>${escHtml(data.cliente_nome) || '—'}</strong><br>Locatário(a)</div>
      </div>
    </div>

    <div class="cp-footer">
      Glipearte Pegue e Monte — Fortaleza/CE | ${appConfig.telefone || ''} | ${appConfig.pix || ''}
      <br>Contrato gerado em ${hoje}
    </div>
  `;
}

// ─── Carregar contratos ───────────────────────
async function loadContratos() {
  try {
    contratosData = Storage.contratos.getAll();
    renderContratosTable(contratosData);
    renderRecentContracts();
    updateDashboardStats();
  } catch (e) {
    console.error('Erro ao carregar contratos:', e);
  }
}

function renderContratosTable(list) {
  const tbody = document.getElementById('contratosTableBody');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row"><i class="fa fa-file-contract"></i> Nenhum contrato gerado.</td></tr>`;
    return;
  }

  const statusBadge = {
    rascunho: '<span class="badge badge-secondary">Rascunho</span>',
    enviado:  '<span class="badge badge-info">Enviado</span>',
    assinado: '<span class="badge badge-success">Assinado</span>',
    cancelado:'<span class="badge badge-danger">Cancelado</span>',
  };

  const tipoBadge = {
    BASICO: '<span class="badge badge-primary">Básico</span>',
    LUXO:   '<span class="badge badge-accent">Luxo ✨</span>',
  };

  tbody.innerHTML = [...list].reverse().map(ct => `
    <tr>
      <td><strong>${escHtml(ct.numero) || '—'}</strong></td>
      <td>${escHtml(ct.cliente_nome) || '—'}</td>
      <td>${tipoBadge[ct.tipo] || ct.tipo}</td>
      <td>${ct.valor_total ? Number(ct.valor_total).toLocaleString('pt-BR', {style:'currency',currency:'BRL'}) : '—'}</td>
      <td>${ct.data_retirada ? new Date(ct.data_retirada).toLocaleDateString('pt-BR') : '—'}</td>
      <td>${statusBadge[ct.status] || ct.status}</td>
      <td>
        <div style="display:flex;gap:5px;">
          <button class="btn btn-outline btn-sm btn-icon" title="Visualizar" onclick="visualizarContrato('${ct.id}')">
            <i class="fa fa-eye"></i>
          </button>
          <button class="btn btn-primary btn-sm btn-icon" title="Gerar PDF" onclick="gerarPDFContrato('${ct.id}')">
            <i class="fa fa-file-pdf"></i>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" title="Excluir" onclick="excluirContrato('${ct.id}', '${escHtml(ct.numero || '')}')">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterContratos() {
  const q = document.getElementById('searchContrato').value.toLowerCase();
  const filtered = contratosData.filter(c =>
    (c.cliente_nome || '').toLowerCase().includes(q) ||
    (c.numero || '').includes(q)
  );
  renderContratosTable(filtered);
}

function renderRecentContracts() {
  const el = document.getElementById('recentContracts');
  if (!el) return;

  const recent = Storage.contratos.getRecent(5);
  if (recent.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fa fa-file-contract fa-3x"></i><p>Nenhum contrato gerado ainda.</p></div>`;
    return;
  }

  const tipoBadge = {
    BASICO: '<span class="badge badge-primary">Básico</span>',
    LUXO:   '<span class="badge badge-accent">Luxo</span>',
  };

  const statusBadge = {
    rascunho: '<span class="badge badge-secondary">Rascunho</span>',
    enviado:  '<span class="badge badge-info">Enviado</span>',
    assinado: '<span class="badge badge-success">Assinado</span>',
    cancelado:'<span class="badge badge-danger">Cancelado</span>',
  };

  el.innerHTML = recent.map(ct => `
    <div class="recent-contract-item">
      <div class="rci-info">
        <div class="rci-name">${escHtml(ct.cliente_nome) || 'Cliente'}</div>
        <div class="rci-detail">${tipoBadge[ct.tipo] || ''} Nº ${escHtml(ct.numero) || '—'} · ${ct.valor_total ? Number(ct.valor_total).toLocaleString('pt-BR', {style:'currency',currency:'BRL'}) : '—'}</div>
      </div>
      ${statusBadge[ct.status] || ''}
    </div>
  `).join('');
}

// ─── Visualizar contrato ──────────────────────
function visualizarContrato(id) {
  const ct = contratosData.find(c => c.id === id);
  if (!ct) return;

  const modal = document.getElementById('modalVisualizarContrato');
  const content = document.getElementById('contratoModalContent');
  content.innerHTML = gerarHTMLContrato(ct);
  modal.classList.remove('hidden');
  window._currentContrato = ct;
}

function closeVisualizarModal() {
  document.getElementById('modalVisualizarContrato').classList.add('hidden');
  window._currentContrato = null;
}

function gerarPDFModal() {
  if (window._currentContrato) {
    gerarPDFDados(window._currentContrato);
  }
}

// ─── Excluir contrato ─────────────────────────
async function excluirContrato(id, num) {
  const result = await Swal.fire({
    title: 'Excluir contrato?',
    html: `Contrato <strong>Nº ${num}</strong> será removido.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Excluir',
  });

  if (result.isConfirmed) {
    Storage.contratos.delete(id);
    showToast('Contrato excluído.', 'success');
    await loadContratos();
  }
}

// ─── Reset wizard ─────────────────────────────
function resetWizard() {
  contratoTipoSelecionado = null;
  assinaturaBase64 = null;
  contratoEditandoId = null;
  currentStep = 1;

  for (let i = 1; i <= 5; i++) {
    const step = document.getElementById(`step-${i}`);
    if (step) {
      if (i === 1) step.classList.remove('hidden');
      else step.classList.add('hidden');
    }
    const ind = document.getElementById(`step-ind-${i}`);
    if (ind) {
      ind.classList.remove('active', 'completed');
      if (i === 1) ind.classList.add('active');
    }
  }

  document.querySelectorAll('.contract-type-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('btnStep1Next').disabled = true;
  limparCliente();

  ['e_endereco','e_retirada','e_devolucao','e_obs','v_total','v_sinal','v_pix'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// ─── Geração de PDF por ID ─────────────────────
function gerarPDFContrato(id) {
  const ct = contratosData.find(c => c.id === id);
  if (ct) gerarPDFDados(ct);
}
