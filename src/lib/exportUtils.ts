/**
 * Utility helper to export tabular data as CSV or trigger formatted printing (PDF)
 */

export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string, headersMap?: Record<string, string>) {
  if (!data || !data.length) return;

  const keys = Object.keys(data[0]);
  const headerRow = keys.map(k => headersMap?.[k] || k).join(',');

  const rows = data.map(row => {
    return keys.map(k => {
      let val = row[k];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      // Escape quotes and commas
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        val = `"${val}"`;
      }
      return val;
    }).join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerRow, ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printFormattedReport(title: string, htmlContent: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; }
          h1 { color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 14px; }
          th { background-color: #f1f5f9; font-weight: 600; }
          .footer { margin-top: 30px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p style="font-size: 12px; color: #64748b; margin-top: 0;">Relatório gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <div>${htmlContent}</div>
        <div class="footer">Casa Espírita - Sistema de Gestão Integrada</div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function printVolunteerBadge(volunteerName: string, role: string, sector: string, code: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Crachá de Voluntário - ${volunteerName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; margin: 0; }
          .badge-card { width: 320px; height: 480px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; border-radius: 20px; padding: 24px; box-sizing: border-box; display: flex; flex-col; justify-content: space-between; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: 2px solid #6366f1; position: relative; overflow: hidden; }
          .header { border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 12px; }
          .title { font-size: 14px; text-transform: uppercase; tracking: 2px; color: #a5b4fc; font-weight: 700; }
          .sub { font-size: 11px; color: #cbd5e1; }
          .avatar { width: 90px; h: 90px; border-radius: 50%; background: #4f46e5; border: 3px solid #818cf8; margin: 16px auto; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; }
          .name { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 4px; }
          .role { font-size: 13px; font-weight: 600; color: #38bdf8; background: rgba(56, 189, 248, 0.15); display: inline-block; padding: 4px 12px; border-radius: 12px; margin-bottom: 12px; }
          .sector { font-size: 12px; color: #e2e8f0; }
          .barcode-box { background: white; color: black; border-radius: 8px; padding: 8px; font-family: monospace; font-weight: bold; letter-spacing: 3px; margin-top: auto; }
          @media print {
            body { background: white; }
            .badge-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="badge-card">
          <div class="header">
            <div class="title">CASA ESPÍRITA</div>
            <div class="sub">Crachá de Voluntário / Trabalhador</div>
          </div>
          <div>
            <div class="avatar">${volunteerName.charAt(0).toUpperCase()}</div>
            <div class="name">${volunteerName}</div>
            <div class="role">${role}</div>
            <div class="sector">Setor: ${sector}</div>
          </div>
          <div class="barcode-box">
            COD: ${code || 'VOL-' + Math.floor(1000 + Math.random() * 9000)}
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function printSalesReceipt(saleId: string, items: Array<{ name: string; quantity: number; price: number }>, total: number, paymentMethod: string, customerName?: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">R$ ${item.price.toFixed(2)}</td>
      <td style="text-align: right;">R$ ${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comprovante de Venda - ${saleId}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 300px; padding: 15px; margin: 0 auto; background: #fff; color: #000; font-size: 12px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .title { font-weight: bold; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 4px; font-size: 11px; }
          td { padding: 4px 0; font-size: 11px; }
          .total-box { border-top: 1px dashed #000; pt-8px; font-weight: bold; font-size: 13px; text-align: right; margin-top: 10px; padding-top: 6px; }
          .footer { text-align: center; font-size: 10px; margin-top: 15px; border-top: 1px dashed #000; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">LIVRARIA / BAZAR ESPÍRITA</div>
          <div>Comprovante de Venda / Doação</div>
          <div style="font-size: 10px; margin-top: 4px;">Data: ${new Date().toLocaleString('pt-BR')}</div>
          ${customerName ? `<div style="font-size: 10px;">Cliente: ${customerName}</div>` : ''}
          <div style="font-size: 10px;">Cód: ${saleId}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qtd</th>
              <th style="text-align: right;">Unit</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          TOTAL: R$ ${total.toFixed(2)}<br/>
          <span style="font-size: 11px; font-weight: normal;">Forma de Pagto: ${paymentMethod}</span>
        </div>

        <div class="footer">
          Muito Obrigado! Sua contribuição auxilia nas obras assistenciais de nossa Casa.<br/>
          "Fora da caridade não há salvação."
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

