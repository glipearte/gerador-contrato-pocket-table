# 🎈 Glipearte — Sistema de Geração de Contratos

**Sistema web para geração de contratos de locação do kit Pocket Table da Glipearte Pegue e Monte.**

---

## ✅ Funcionalidades Implementadas

### 📋 Gestão de Contratos
- **Wizard de 5 etapas** para criação de contratos guiada e intuitiva
- **Dois modelos de contrato**: Pocket Table BÁSICO e Pocket Table LUXO
- Contrato completo com todas as cláusulas oficiais (7 cláusulas)
- **Numeração automática** dos contratos
- Status de contrato: Rascunho → Enviado → Assinado → Cancelado
- Visualização, exclusão e gestão de todos os contratos

### 📝 Edição de Valores / Reajustes
- Valor total da locação **editável** por contrato
- **Sinal automático** calculado em 50% do valor total
- **Tabela de reposição editável** (por peça/item) por contrato
- Valores padrão globais configuráveis na tela de Configurações
- Suporte a ambos os pacotes (BÁSICO e LUXO) com valores distintos

### 👤 Cadastro de Clientes
- CRUD completo de clientes (criar, editar, excluir)
- Campos: nome, CPF, RG, telefone, e-mail, endereço, cidade, estado
- **Reutilização de clientes** nos contratos (select dropdown)
- Busca/filtro de clientes por nome ou CPF

### ✍️ Assinatura Digital
- **Canvas de assinatura digital** com suporte a mouse e toque (touch)
- Assinatura armazenada em base64 e exibida no contrato
- A assinatura aparece na área do locatário no PDF gerado

### 📄 Geração de PDF
- Geração de PDF via `html2canvas` + `jsPDF`
- PDF com paginação automática
- Nome do arquivo padronizado: `contrato_{tipo}_{cliente}_{numero}.pdf`
- Alternativa: impressão via janela do navegador

### ⚙️ Configurações
- Chave PIX padrão da empresa
- Telefone da empresa
- Valor padrão dos kits BÁSICO e LUXO
- Valores de reposição padrão por tipo de item

### 🏠 Dashboard
- Contadores: total de contratos, assinados, pendentes e clientes
- Lista de contratos recentes
- Ações rápidas: novo contrato BÁSICO, novo contrato LUXO, cadastrar cliente

---

## 🗂️ Estrutura de Arquivos

```
index.html            — Estrutura principal da aplicação
css/
  style.css           — Estilos globais, componentes, responsividade
js/
  app.js              — Inicialização, navegação, configurações, utilitários
  clientes.js         — CRUD de clientes
  contrato.js         — Lógica de contratos, wizard, templates HTML
  pdf.js              — Assinatura digital, geração de PDF
```

---

## 🔗 Rotas e URIs

| Página | Como Acessar |
|---|---|
| Dashboard | `index.html` (padrão) |
| Clientes | Sidebar → Clientes |
| Contratos | Sidebar → Contratos |
| Novo Contrato | Sidebar → Novo Contrato ou botão "+" |
| Configurações | Sidebar → Configurações |

---

## 🗃️ Modelos de Dados (Tables API)

### `clientes`
| Campo | Tipo | Descrição |
|---|---|---|
| nome | text | Nome completo |
| cpf | text | CPF |
| rg | text | RG |
| telefone | text | WhatsApp/Telefone |
| email | text | E-mail |
| endereco | text | Endereço residencial |
| cidade | text | Cidade |
| estado | text | Estado (UF) |

### `contratos`
| Campo | Tipo | Descrição |
|---|---|---|
| numero | text | Número único (ex: 2025/1234) |
| tipo | text | BASICO ou LUXO |
| cliente_nome | text | Nome do locatário |
| valor_total | number | Valor total da locação |
| valor_sinal | number | Sinal (50%) |
| chave_pix | text | Chave PIX de pagamento |
| data_retirada | text | Data e hora de retirada |
| data_devolucao | text | Data e hora de devolução |
| itens | rich_text | JSON com itens e valores de reposição |
| status | text | rascunho/enviado/assinado/cancelado |
| assinatura_locatario | rich_text | Assinatura em base64 (PNG) |
| data_assinatura | text | Timestamp da assinatura |

### `configuracoes`
| Campo | Tipo | Descrição |
|---|---|---|
| chave | text | Nome da configuração |
| valor | text | Valor da configuração |

---

## 🚀 Próximos Passos Sugeridos

1. **Envio por WhatsApp**: Botão para compartilhar link/PDF do contrato diretamente via WhatsApp
2. **Link de assinatura remota**: Gerar URL única para o cliente assinar o contrato online
3. **Histórico de reajustes**: Rastrear alterações de valor por contrato
4. **Filtros avançados**: Filtrar contratos por data, status, valor
5. **Exportar relatório**: Lista de contratos em Excel/CSV
6. **Notificações**: Alertas de devolução próxima

---

## 📦 Dependências (CDN)

- [Google Fonts — Inter + Pacifico](https://fonts.google.com)
- [Font Awesome 6.4](https://fontawesome.com)
- [SweetAlert2](https://sweetalert2.github.io)
- [jsPDF](https://artskydj.github.io/jsPDF)
- [html2canvas](https://html2canvas.hertzen.com)
