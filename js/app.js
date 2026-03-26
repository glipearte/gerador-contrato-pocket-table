/* =============================================
   APP — Inicialização, navegação e utilidades
   ============================================= */

// ─── Configurações globais ─────────────────────
let appConfig = {
  pix: '',
  telefone: '(85) 99999-0000',
  valorBasico: 280,
  valorLuxo: 350,
  enderecoEmpresa: 'Fortaleza - CE',
};

// ─── Inicialização ─────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadConfiguracoes(),
    loadClientes(),
    loadContratos(),
  ]);
  navigate('dashboard');
  renderConfigPage();
  renderReposicaoConfig();
});

// ─── Navegação ─────────────────────────────────
function navigate(page) {
  // Esconde todas as páginas
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Mostra a página selecionada
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  // Atualiza nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Título
  const titles = {
    dashboard:      'Dashboard',
    clientes:       'Clientes',
    contratos:      'Contratos',
    'novo-contrato':'Novo Contrato',
    configuracoes:  'Configurações',
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  // Scroll to top
  document.querySelector('.main-content').scrollTop = 0;

  // Fechar sidebar em mobile
  closeSidebarMobile();

  // Se for para novo-contrato, reset
  if (page === 'novo-contrato') {
    resetWizard();
    // Atualiza preços dos cards com configurações atuais
    const elB = document.getElementById('price-BASICO');
    const elL = document.getElementById('price-LUXO');
    if (elB) elB.textContent = Number(appConfig.valorBasico).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    if (elL) elL.textContent = Number(appConfig.valorLuxo).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
  }
}

// ─── Sidebar mobile ─────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  sidebar.classList.toggle('open');
  overlay.classList.toggle('visible');
  overlay.classList.toggle('hidden', !overlay.classList.contains('visible'));
}

function closeSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
  overlay.classList.add('hidden');
}

// ─── Dashboard stats ────────────────────────────
function updateDashboardStats() {
  const stats = Storage.contratos.getStats();
  const clientes = Storage.clientes.getAll().length;

  animateCounter('statTotal', stats.total);
  animateCounter('statAssinados', stats.assinados);
  animateCounter('statPendentes', stats.pendentes);
  animateCounter('statClientes', clientes);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const duration = 600;
  const step = Math.ceil(target / (duration / 30));
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start;
    if (start >= target) clearInterval(timer);
  }, 30);
}

// ─── Configurações ──────────────────────────────
async function loadConfiguracoes() {
  try {
    const configs = Storage.configs.getAll();
    
    appConfig.pix = configs.chave_pix || '778.802.773-15';
    appConfig.telefone = configs.telefone || '(85) 98685-3750';
    appConfig.valorBasico = parseFloat(configs.valor_basico) || 280;
    appConfig.valorLuxo = parseFloat(configs.valor_luxo) || 350;
    appConfig.enderecoEmpresa = configs.endereco_empresa || 'Fortaleza - CE';
  } catch (e) {
    console.error('Erro ao carregar configs:', e);
  }
}

function renderConfigPage() {
  const elPix = document.getElementById('cfg_pix');
  const elTel = document.getElementById('cfg_tel');
  const elVB  = document.getElementById('cfg_valor_basico');
  const elVL  = document.getElementById('cfg_valor_luxo');
  if (elPix) elPix.value = appConfig.pix;
  if (elTel) elTel.value = appConfig.telefone;
  if (elVB)  elVB.value  = appConfig.valorBasico;
  if (elVL)  elVL.value  = appConfig.valorLuxo;

  // Preços nos cards de tipo
  const priceB = document.getElementById('price-BASICO');
  const priceL = document.getElementById('price-LUXO');
  if (priceB) priceB.textContent = Number(appConfig.valorBasico).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
  if (priceL) priceL.textContent = Number(appConfig.valorLuxo).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
}

async function salvarConfiguracoes() {
  const novoPix   = document.getElementById('cfg_pix').value.trim();
  const novoTel   = document.getElementById('cfg_tel').value.trim();
  const novoVB    = parseFloat(document.getElementById('cfg_valor_basico').value);
  const novoVL    = parseFloat(document.getElementById('cfg_valor_luxo').value);

  try {
    Storage.configs.setMultiple({
      chave_pix: novoPix,
      telefone: novoTel,
      valor_basico: String(novoVB || 280),
      valor_luxo: String(novoVL || 350)
    });

    appConfig.pix = novoPix;
    appConfig.telefone = novoTel;
    appConfig.valorBasico = novoVB;
    appConfig.valorLuxo = novoVL;

    renderConfigPage();
    showToast('Configurações salvas com sucesso!', 'success');
  } catch {
    showToast('Erro ao salvar configurações.', 'error');
  }
}

// ─── Valores de reposição na config ────────────
const REPOSICAO_CONFIG_KEYS = {
  BASICO: [
    { id: 'cfg_rep_basico_mesa',     label: 'Mesa desmontável',           default: 350 },
    { id: 'cfg_rep_basico_painel',   label: 'Painel de encaixe',          default: 80  },
    { id: 'cfg_rep_basico_capa',     label: 'Capa de tecido / disco PVC', default: 70  },
    { id: 'cfg_rep_basico_doceiras', label: 'Doceiras (4 unid.)',          default: 100 },
    { id: 'cfg_rep_basico_boleira',  label: 'Boleira',                    default: 80  },
    { id: 'cfg_rep_basico_vaso',     label: 'Vaso',                       default: 60  },
    { id: 'cfg_rep_basico_arranjo',  label: 'Arranjo de flores',          default: 90  },
    { id: 'cfg_rep_basico_placa',    label: 'Placa PVC adesivado',        default: 60  },
  ],
  LUXO: [
    { id: 'cfg_rep_luxo_mesa',       label: 'Mesa desmontável',           default: 350 },
    { id: 'cfg_rep_luxo_painel',     label: 'Painel de encaixe',          default: 80  },
    { id: 'cfg_rep_luxo_capa',       label: 'Capa temática',              default: 70  },
    { id: 'cfg_rep_luxo_boleira',    label: 'Boleira de cerâmica/metal',  default: 180 },
    { id: 'cfg_rep_luxo_vaso',       label: 'Vaso de cerâmica/vidro',     default: 180 },
    { id: 'cfg_rep_luxo_doceiras',   label: 'Suportes de cerâmica',       default: 150 },
    { id: 'cfg_rep_luxo_arranjo',    label: 'Arranjo de flores',          default: 100 },
    { id: 'cfg_rep_luxo_placa',      label: 'Placa PVC adesivado',        default: 60  },
  ],
};

function renderReposicaoConfig() {
  const container = document.getElementById('reposicaoConfigContainer');
  if (!container) return;

  // Carrega valores salvos ou usa defaults
  const valoresSalvos = Storage.reposicao.getAll();

  container.innerHTML = `
    <h4 style="color:var(--primary);margin-bottom:10px;">📦 Pacote BÁSICO</h4>
    ${REPOSICAO_CONFIG_KEYS.BASICO.map(item => {
      const valorSalvo = valoresSalvos.BASICO?.find(i => i.id === item.id)?.valor;
      const valor = valorSalvo !== undefined ? valorSalvo : item.default;
      return `
      <div class="reposicao-item">
        <label>${item.label}</label>
        <div class="input-reposicao">
          <span>R$</span>
          <input type="number" id="${item.id}" data-tipo="BASICO" value="${valor}" step="0.01" min="0" />
        </div>
      </div>
    `}).join('')}
    <h4 style="color:var(--primary);margin-top:20px;margin-bottom:10px;">👑 Pacote LUXO</h4>
    ${REPOSICAO_CONFIG_KEYS.LUXO.map(item => {
      const valorSalvo = valoresSalvos.LUXO?.find(i => i.id === item.id)?.valor;
      const valor = valorSalvo !== undefined ? valorSalvo : item.default;
      return `
      <div class="reposicao-item">
        <label>${item.label}</label>
        <div class="input-reposicao">
          <span>R$</span>
          <input type="number" id="${item.id}" data-tipo="LUXO" value="${valor}" step="0.01" min="0" />
        </div>
      </div>
    `}).join('')}
  `;
}

async function salvarValoresReposicao() {
  const valoresBasico = [];
  const valoresLuxo = [];

  REPOSICAO_CONFIG_KEYS.BASICO.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      valoresBasico.push({
        id: item.id,
        label: item.label,
        valor: parseFloat(el.value) || item.default
      });
    }
  });

  REPOSICAO_CONFIG_KEYS.LUXO.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      valoresLuxo.push({
        id: item.id,
        label: item.label,
        valor: parseFloat(el.value) || item.default
      });
    }
  });

  Storage.reposicao.set('BASICO', valoresBasico);
  Storage.reposicao.set('LUXO', valoresLuxo);

  // Atualiza também o ITENS_REPOSICAO global
  ITENS_REPOSICAO.BASICO = valoresBasico;
  ITENS_REPOSICAO.LUXO = valoresLuxo;

  showToast('Valores de reposição atualizados!', 'success');
}

// ─── Máscaras ───────────────────────────────────
function maskCPF(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = v;
}

function maskPhone(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) {
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
  }
  input.value = v;
}

// ─── Toast ───────────────────────────────────────
function showToast(msg, type = 'success') {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: type,
    title: msg,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

// ─── Escape HTML ─────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
