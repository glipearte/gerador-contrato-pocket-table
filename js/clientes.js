/* =============================================
   CLIENTES — CRUD de clientes
   ============================================= */

let clientesData = [];
let clienteEditId = null;

// ─── Carregar clientes do localStorage ─────────
async function loadClientes() {
  try {
    clientesData = Storage.clientes.getAll();
    // Ordena por nome
    clientesData.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    renderClientesTable(clientesData);
    renderClientesSelect();
    updateDashboardStats();
  } catch (e) {
    console.error('Erro ao carregar clientes:', e);
  }
}

// ─── Renderizar tabela ───────────────────────
function renderClientesTable(list) {
  const tbody = document.getElementById('clientesTableBody');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row"><i class="fa fa-users"></i> Nenhum cliente cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td><strong>${escHtml(c.nome)}</strong></td>
      <td>${escHtml(c.cpf) || '—'}</td>
      <td>${escHtml(c.telefone) || '—'}</td>
      <td>${escHtml(c.cidade) || '—'}${c.estado ? '/' + escHtml(c.estado) : ''}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm btn-icon" title="Editar" onclick="editarCliente('${c.id}')">
            <i class="fa fa-edit"></i>
          </button>
          <button class="btn btn-outline btn-sm btn-icon" title="Novo contrato" onclick="novoContratoComCliente('${c.id}')">
            <i class="fa fa-file-contract"></i>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" title="Excluir" onclick="confirmarExcluirCliente('${c.id}', '${escHtml(c.nome)}')">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Preencher select de clientes no wizard ──
function renderClientesSelect() {
  const sel = document.getElementById('selectClienteExistente');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Selecione um cliente —</option>' +
    clientesData.map(c => `<option value="${c.id}">${escHtml(c.nome)}${c.cpf ? ' — ' + escHtml(c.cpf) : ''}</option>`).join('');
}

// ─── Filtrar clientes ────────────────────────
function filterClientes() {
  const q = document.getElementById('searchCliente').value.toLowerCase();
  const filtered = clientesData.filter(c =>
    (c.nome || '').toLowerCase().includes(q) ||
    (c.cpf || '').includes(q) ||
    (c.telefone || '').includes(q)
  );
  renderClientesTable(filtered);
}

// ─── Abrir modal ─────────────────────────────
function openClienteModal(id = null) {
  clienteEditId = id;
  document.getElementById('modalClienteTitle').textContent = id ? 'Editar Cliente' : 'Novo Cliente';
  document.getElementById('m_cliente_id').value = '';
  clearClienteForm();

  if (id) {
    const c = clientesData.find(x => x.id === id);
    if (c) {
      document.getElementById('m_nome').value = c.nome || '';
      document.getElementById('m_cpf').value = c.cpf || '';
      document.getElementById('m_rg').value = c.rg || '';
      document.getElementById('m_telefone').value = c.telefone || '';
      document.getElementById('m_email').value = c.email || '';
      document.getElementById('m_endereco').value = c.endereco || '';
      document.getElementById('m_cidade').value = c.cidade || '';
      document.getElementById('m_estado').value = c.estado || '';
      document.getElementById('m_cliente_id').value = id;
    }
  }

  document.getElementById('modalCliente').classList.remove('hidden');
}

function closeClienteModal() {
  document.getElementById('modalCliente').classList.add('hidden');
  clienteEditId = null;
}

function clearClienteForm() {
  ['m_nome','m_cpf','m_rg','m_telefone','m_email','m_endereco','m_cidade','m_estado'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// ─── Salvar cliente ──────────────────────────
async function salvarCliente() {
  const nome = document.getElementById('m_nome').value.trim();
  const cpf  = document.getElementById('m_cpf').value.trim();
  const tel  = document.getElementById('m_telefone').value.trim();

  if (!nome) { showToast('Informe o nome do cliente.', 'error'); return; }
  if (!tel)  { showToast('Informe o telefone do cliente.', 'error'); return; }

  const payload = {
    nome,
    cpf,
    rg:       document.getElementById('m_rg').value.trim(),
    telefone: tel,
    email:    document.getElementById('m_email').value.trim(),
    endereco: document.getElementById('m_endereco').value.trim(),
    cidade:   document.getElementById('m_cidade').value.trim(),
    estado:   document.getElementById('m_estado').value.trim().toUpperCase(),
  };

  try {
    const editId = document.getElementById('m_cliente_id').value;
    if (editId) {
      Storage.clientes.update(editId, payload);
    } else {
      Storage.clientes.create(payload);
    }

    showToast('Cliente salvo com sucesso!', 'success');
    closeClienteModal();
    await loadClientes();
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar cliente.', 'error');
  }
}

// ─── Editar cliente ──────────────────────────
function editarCliente(id) {
  openClienteModal(id);
}

// ─── Novo contrato com cliente pré-selecionado ─
function novoContratoComCliente(clienteId) {
  navigate('novo-contrato');
  setTimeout(() => {
    const sel = document.getElementById('selectClienteExistente');
    if (sel) {
      sel.value = clienteId;
      preencherClienteExistente();
    }
  }, 200);
}

// ─── Confirmar exclusão ───────────────────────
async function confirmarExcluirCliente(id, nome) {
  const result = await Swal.fire({
    title: 'Excluir cliente?',
    html: `Tem certeza que deseja excluir <strong>${nome}</strong>?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
  });

  if (result.isConfirmed) {
    try {
      Storage.clientes.delete(id);
      showToast('Cliente excluído.', 'success');
      await loadClientes();
    } catch {
      showToast('Erro ao excluir.', 'error');
    }
  }
}

// ─── Preencher form com cliente existente ─────
function preencherClienteExistente() {
  const sel = document.getElementById('selectClienteExistente');
  const id = sel.value;
  if (!id) { limparCliente(); return; }

  const c = clientesData.find(x => x.id === id);
  if (!c) return;

  document.getElementById('c_nome').value     = c.nome || '';
  document.getElementById('c_cpf').value      = c.cpf || '';
  document.getElementById('c_rg').value       = c.rg || '';
  document.getElementById('c_telefone').value = c.telefone || '';
  document.getElementById('c_email').value    = c.email || '';
  document.getElementById('c_endereco').value = c.endereco || '';
  document.getElementById('c_cidade').value   = c.cidade || '';
  document.getElementById('c_estado').value   = c.estado || '';
  document.getElementById('c_salvar').checked = false;
}

function limparCliente() {
  ['c_nome','c_cpf','c_rg','c_telefone','c_email','c_endereco','c_cidade','c_estado'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const sel = document.getElementById('selectClienteExistente');
  if (sel) sel.value = '';
  document.getElementById('c_salvar').checked = true;
}

// ─── Obter dados do cliente no wizard ─────────
function getClienteWizard() {
  return {
    nome:     document.getElementById('c_nome').value.trim(),
    cpf:      document.getElementById('c_cpf').value.trim(),
    rg:       document.getElementById('c_rg').value.trim(),
    telefone: document.getElementById('c_telefone').value.trim(),
    email:    document.getElementById('c_email').value.trim(),
    endereco: document.getElementById('c_endereco').value.trim(),
    cidade:   document.getElementById('c_cidade').value.trim(),
    estado:   document.getElementById('c_estado').value.trim(),
    salvar:   document.getElementById('c_salvar').checked,
  };
}

// ─── Salvar cliente novo durante criação de contrato ──
async function salvarClienteSeNovo() {
  const c = getClienteWizard();
  if (!c.salvar) return null;
  // Verificar se já existe via select
  const sel = document.getElementById('selectClienteExistente');
  if (sel && sel.value) return sel.value;

  if (!c.nome || !c.telefone) return null;

  try {
    const novo = Storage.clientes.create({
      nome: c.nome,
      cpf: c.cpf,
      rg: c.rg,
      telefone: c.telefone,
      email: c.email,
      endereco: c.endereco,
      cidade: c.cidade,
      estado: c.estado
    });
    await loadClientes();
    return novo.id;
  } catch (e) {
    console.error(e);
  }
  return null;
}
