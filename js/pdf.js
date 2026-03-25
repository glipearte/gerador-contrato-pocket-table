/* =============================================
   PDF — Geração de PDF e Assinatura Digital
   ============================================= */

// ─── Assinatura Digital ───────────────────────
let isDrawing = false;
let lastX = 0, lastY = 0;
let ctx = null;

function initSignaturePad() {
  const canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1a3a5c';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Mouse events
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  // Touch events
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e.touches[0]); }, { passive: false });
  canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); draw(e.touches[0]); }, { passive: false });
  canvas.addEventListener('touchend',   (e) => { e.preventDefault(); stopDraw(); }, { passive: false });
}

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  };
}

function startDraw(e) {
  const canvas = document.getElementById('signatureCanvas');
  const pos = getPos(e, canvas);
  isDrawing = true;
  lastX = pos.x;
  lastY = pos.y;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
}

function draw(e) {
  if (!isDrawing) return;
  const canvas = document.getElementById('signatureCanvas');
  const pos = getPos(e, canvas);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  lastX = pos.x;
  lastY = pos.y;
}

function stopDraw() { isDrawing = false; }

function limparAssinatura() {
  const canvas = document.getElementById('signatureCanvas');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function abrirAssinaturaModal() {
  document.getElementById('modalAssinatura').classList.remove('hidden');
  setTimeout(initSignaturePad, 100);
}

function closeAssinaturaModal() {
  document.getElementById('modalAssinatura').classList.add('hidden');
}

function isCanvasBlank(canvas) {
  const blank = document.createElement('canvas');
  blank.width = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

function confirmarAssinatura() {
  const canvas = document.getElementById('signatureCanvas');
  if (isCanvasBlank(canvas)) {
    showToast('Por favor, realize a assinatura antes de confirmar.', 'error');
    return;
  }

  assinaturaBase64 = canvas.toDataURL('image/png');
  closeAssinaturaModal();
  showToast('Assinatura digital registrada com sucesso! ✍️', 'success');

  // Atualiza preview
  renderContratoPreview();

  Swal.fire({
    title: 'Assinatura registrada!',
    text: 'A assinatura digital foi anexada ao contrato.',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
  });
}

// ─── Geração de PDF via html2canvas + jsPDF ───
async function gerarPDF() {
  const dados = montarContratoObj();
  await gerarPDFDados(dados);
}

async function gerarPDFDados(dados) {
  // Mostrar loading
  Swal.fire({
    title: 'Gerando PDF...',
    html: '<p>Aguarde enquanto preparamos seu contrato.</p>',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  // Cria div temporária oculta
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: 800px; background: white;
    font-family: 'Times New Roman', serif;
    padding: 0;
  `;
  wrapper.innerHTML = `
    <div style="background:white;padding:50px 60px;max-width:800px;font-size:13px;line-height:1.7;color:#111;">
      ${gerarHTMLContrato(dados)}
    </div>
  `;
  document.body.appendChild(wrapper);

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 800,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = pdfWidth / (imgWidth / 2); // scale: 2
    const totalPdfHeight = (imgHeight / 2) * ratio;

    let position = 0;
    let heightLeft = totalPdfHeight;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;
    }

    const nomeCliente = (dados.cliente_nome || 'cliente').replace(/\s+/g, '_').toLowerCase();
    const numContrato = (dados.numero || 'contrato').replace(/\//g, '-');
    const tipo = (dados.tipo || 'BASICO').toLowerCase();

    pdf.save(`contrato_${tipo}_${nomeCliente}_${numContrato}.pdf`);

    Swal.fire({
      title: 'PDF gerado!',
      text: 'O arquivo foi baixado com sucesso.',
      icon: 'success',
      timer: 2500,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    Swal.fire({
      title: 'Erro ao gerar PDF',
      text: 'Tente novamente ou use a opção de impressão do navegador.',
      icon: 'error',
      confirmButtonText: 'OK',
    });
  } finally {
    document.body.removeChild(wrapper);
  }
}

// ─── Impressão via janela de impressão ────────
function imprimirContrato(dados = null) {
  if (!dados) dados = montarContratoObj();
  const html = gerarHTMLContrato(dados);

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Contrato Glipearte</title>
      <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Times New Roman', serif; font-size: 13px; color: #111; padding: 40px 60px; }
        .cp-header { text-align:center; margin-bottom:20px; border-bottom:2px solid #1a3a5c; padding-bottom:16px; }
        .cp-logo-wrapper { display:flex; align-items:center; justify-content:center; gap:14px; margin-bottom:8px; }
        .cp-logo-circle { width:50px;height:50px;background:#1a3a5c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:#f4a100; }
        .cp-company-name { font-family:'Pacifico',cursive;font-size:22px;color:#1a3a5c; }
        .cp-company-sub { font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#666; }
        .cp-title { font-size:14px;font-weight:bold;text-transform:uppercase;color:#1a3a5c;margin-top:10px; }
        .cp-subtitle,.cp-numero { font-size:12px;color:#888;margin-top:3px; }
        .cp-clause-title { font-weight:bold;text-transform:uppercase;color:#1a3a5c;margin:18px 0 6px;font-size:12px; }
        .cp-parties { display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f9f6f0;border:1px solid #ddd;border-radius:6px;padding:14px;margin-bottom:16px; }
        .cp-party h4 { font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px; }
        .cp-party p { font-size:12px;margin-bottom:2px; }
        .cp-party strong { color:#1a3a5c; }
        .cp-table { width:100%;border-collapse:collapse;margin:10px 0;font-size:12px; }
        .cp-table th { background:#1a3a5c;color:white;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase; }
        .cp-table td { padding:7px 10px;border:1px solid #ddd; }
        .cp-table tr:nth-child(even) td { background:#f9f6f0; }
        .cp-highlight-box { background:#f9f6f0;border-left:4px solid #1a3a5c;padding:10px 14px;margin:10px 0;border-radius:0 6px 6px 0;font-size:12px; }
        .cp-value-line { display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dotted #ddd; }
        .cp-signatures { display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px;padding-top:16px;border-top:1px solid #ddd; }
        .cp-signature-block { text-align:center; }
        .cp-signature-line { height:1px;background:#333;margin:50px 0 6px; }
        .cp-signature-img { max-height:60px;display:block;margin:0 auto 4px; }
        .cp-signature-label { font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#666; }
        .cp-footer { text-align:center;margin-top:20px;padding-top:14px;border-top:1px solid #ddd;font-size:10px;color:#888; }
        ul { margin:8px 0 8px 18px;font-size:12px;line-height:1.9; }
        @media print { body { padding:20px 40px; } }
      </style>
    </head>
    <body>
      ${html}
      <script>window.onload = () => window.print();<\/script>
    </body>
    </html>
  `);
  win.document.close();
}
