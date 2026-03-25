/* =============================================
   STORAGE — Persistência local com localStorage
   ============================================= */

const STORAGE_KEYS = {
  CLIENTES: 'glipearte_clientes',
  CONTRATOS: 'glipearte_contratos',
  CONFIGS: 'glipearte_configs',
  REPOSICAO: 'glipearte_reposicao'
};

// ─── Utilitários ───────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getFromStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Erro ao ler localStorage:', e);
    return defaultValue;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
    return false;
  }
}

// ─── Clientes ──────────────────────────────────
const ClienteStorage = {
  getAll() {
    return getFromStorage(STORAGE_KEYS.CLIENTES, []);
  },

  getById(id) {
    const clientes = this.getAll();
    return clientes.find(c => c.id === id) || null;
  },

  create(cliente) {
    const clientes = this.getAll();
    const novo = {
      ...cliente,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    clientes.push(novo);
    saveToStorage(STORAGE_KEYS.CLIENTES, clientes);
    return novo;
  },

  update(id, dados) {
    const clientes = this.getAll();
    const index = clientes.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    clientes[index] = {
      ...clientes[index],
      ...dados,
      updated_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.CLIENTES, clientes);
    return clientes[index];
  },

  delete(id) {
    const clientes = this.getAll();
    const filtrados = clientes.filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.CLIENTES, filtrados);
    return filtrados.length < clientes.length;
  },

  search(query) {
    const clientes = this.getAll();
    const q = query.toLowerCase();
    return clientes.filter(c => 
      (c.nome || '').toLowerCase().includes(q) ||
      (c.cpf || '').includes(q) ||
      (c.telefone || '').includes(q)
    );
  }
};

// ─── Contratos ─────────────────────────────────
const ContratoStorage = {
  getAll() {
    return getFromStorage(STORAGE_KEYS.CONTRATOS, []);
  },

  getById(id) {
    const contratos = this.getAll();
    return contratos.find(c => c.id === id) || null;
  },

  create(contrato) {
    const contratos = this.getAll();
    const novo = {
      ...contrato,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    contratos.push(novo);
    saveToStorage(STORAGE_KEYS.CONTRATOS, contratos);
    return novo;
  },

  update(id, dados) {
    const contratos = this.getAll();
    const index = contratos.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    contratos[index] = {
      ...contratos[index],
      ...dados,
      updated_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.CONTRATOS, contratos);
    return contratos[index];
  },

  delete(id) {
    const contratos = this.getAll();
    const filtrados = contratos.filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.CONTRATOS, filtrados);
    return filtrados.length < contratos.length;
  },

  search(query) {
    const contratos = this.getAll();
    const q = query.toLowerCase();
    return contratos.filter(c => 
      (c.cliente_nome || '').toLowerCase().includes(q) ||
      (c.numero || '').includes(q)
    );
  },

  getRecent(limit = 5) {
    const contratos = this.getAll();
    return [...contratos]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  getStats() {
    const contratos = this.getAll();
    return {
      total: contratos.length,
      assinados: contratos.filter(c => c.status === 'assinado').length,
      pendentes: contratos.filter(c => c.status === 'rascunho' || c.status === 'enviado').length,
      cancelados: contratos.filter(c => c.status === 'cancelado').length
    };
  }
};

// ─── Configurações ─────────────────────────────
const ConfigStorage = {
  defaults: {
    chave_pix: '',
    telefone: '(85) 99999-0000',
    valor_basico: '280',
    valor_luxo: '350',
    endereco_empresa: 'Fortaleza - CE'
  },

  getAll() {
    const configs = getFromStorage(STORAGE_KEYS.CONFIGS, {});
    return { ...this.defaults, ...configs };
  },

  get(key) {
    const configs = this.getAll();
    return configs[key] !== undefined ? configs[key] : this.defaults[key];
  },

  set(key, value) {
    const configs = getFromStorage(STORAGE_KEYS.CONFIGS, {});
    configs[key] = value;
    saveToStorage(STORAGE_KEYS.CONFIGS, configs);
    return configs;
  },

  setMultiple(updates) {
    const configs = getFromStorage(STORAGE_KEYS.CONFIGS, {});
    Object.assign(configs, updates);
    saveToStorage(STORAGE_KEYS.CONFIGS, configs);
    return configs;
  }
};

// ─── Valores de Reposição ──────────────────────
const ReposicaoStorage = {
  defaults: {
    BASICO: [
      { id: 'mesa', label: 'Mesa desmontável', valor: 350 },
      { id: 'painel', label: 'Painel de encaixe', valor: 80 },
      { id: 'capa', label: 'Capa de tecido / disco PVC', valor: 70 },
      { id: 'doceiras', label: 'Doceiras (4 unidades)', valor: 100 },
      { id: 'boleira', label: 'Boleira', valor: 80 },
      { id: 'vaso', label: 'Vaso', valor: 60 },
      { id: 'arranjo', label: 'Arranjo de flores', valor: 90 },
      { id: 'placa', label: 'Placa PVC adesivado', valor: 60 },
    ],
    LUXO: [
      { id: 'mesa', label: 'Mesa desmontável', valor: 350 },
      { id: 'painel', label: 'Painel de encaixe', valor: 80 },
      { id: 'capa', label: 'Capa temática', valor: 70 },
      { id: 'boleira', label: 'Boleira de cerâmica/metal', valor: 180 },
      { id: 'vaso', label: 'Vaso de cerâmica/vidro', valor: 180 },
      { id: 'doceiras', label: 'Suportes de cerâmica', valor: 150 },
      { id: 'arranjo', label: 'Arranjo de flores', valor: 100 },
      { id: 'placa', label: 'Placa PVC adesivado', valor: 60 },
    ]
  },

  getAll() {
    const saved = getFromStorage(STORAGE_KEYS.REPOSICAO, null);
    return saved || this.defaults;
  },

  get(tipo) {
    const all = this.getAll();
    return all[tipo] || this.defaults[tipo];
  },

  set(tipo, itens) {
    const all = this.getAll();
    all[tipo] = itens;
    saveToStorage(STORAGE_KEYS.REPOSICAO, all);
    return all;
  },

  reset() {
    saveToStorage(STORAGE_KEYS.REPOSICAO, this.defaults);
    return this.defaults;
  }
};

// ─── Exportar para uso global ──────────────────
window.Storage = {
  clientes: ClienteStorage,
  contratos: ContratoStorage,
  configs: ConfigStorage,
  reposicao: ReposicaoStorage,
  generateId,
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.CLIENTES);
    localStorage.removeItem(STORAGE_KEYS.CONTRATOS);
    localStorage.removeItem(STORAGE_KEYS.CONFIGS);
    localStorage.removeItem(STORAGE_KEYS.REPOSICAO);
  }
};
