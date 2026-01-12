import { jsPDF } from "jspdf";
import type { BillingContractDetails } from "@/application/core/@types/Billing/Billing";

const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00-03:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
};

export async function generateContractReportPDF(
  contract: BillingContractDetails,
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const labelColor: [number, number, number] = [71, 85, 105];
  const textColor: [number, number, number] = [15, 23, 42];
  const primary: [number, number, number] = [19, 75, 115];
  let cursorY = 40;

  const ensureSpace = (height: number) => {
    if (cursorY + height > pageHeight - 40) {
      doc.addPage();
      cursorY = 40;
    }
  };

  const addHeader = (title: string, subtitle?: string) => {
    doc.setFillColor(245, 248, 252);
    doc.rect(0, 0, pageWidth, 96, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text("Grota Financiamentos", marginX, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(title, marginX, 56);
    if (subtitle) {
      doc.text(subtitle, marginX, 72);
    }
    cursorY = 110;
  };

  const addSection = (title: string, rows: Array<[string, string]>) => {
    ensureSpace(40 + rows.length * 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(title, marginX, cursorY);
    cursorY += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);

    rows.forEach(([label, value]) => {
      ensureSpace(24);
      doc.text(`${label}:`, marginX, cursorY);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(value || "--", marginX + 120, cursorY);
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      cursorY += 24;
    });
    cursorY += 12;
  };

  const issuedAt = new Date().toLocaleString("pt-BR");
  addHeader("Relatório Completo de Contrato", `Emitido em ${issuedAt}`);

  // Dados do Cliente
  addSection("Dados do Cliente", [
    ["Nome", contract.customer.name],
    ["CPF/CNPJ", contract.customer.document],
    ["Nascimento", contract.customer.birthDate ? formatDate(contract.customer.birthDate) : "--"],
    ["E-mail", contract.customer.email || "--"],
    ["Telefone", contract.customer.phone || "--"],
    ["Endereço", `${contract.customer.address || "--"}, ${contract.customer.city || "--"} / ${contract.customer.state || "--"}`],
  ]);

  // Dados Profissionais
  if (contract.professionalData) {
    addSection("Dados Profissionais", [
      ["Empresa", contract.professionalData.enterprise || "--"],
      ["Função", contract.professionalData.function || "--"],
      ["Data de Admissão", contract.professionalData.admissionDate ? formatDate(contract.professionalData.admissionDate) : "--"],
      ["Estado Civil", contract.professionalData.maritalStatus || "--"],
      ["Renda", formatCurrency(contract.professionalData.income ?? null)],
      ["Outras Rendas", formatCurrency(contract.professionalData.otherIncomes ?? null)],
    ]);
  }

  // Dados da Loja
  if (contract.dealer) {
    addSection("Dados da Loja", [
      ["Empresa", contract.dealer.enterprise || "--"],
      ["Razão Social", contract.dealer.fullNameEnterprise || "--"],
      ["CNPJ", contract.dealer.cnpj || "--"],
      ["Telefone", contract.dealer.phone || "--"],
    ]);
  }

  // Resumo do Contrato
  const statusLabel = contract.status === "PAGO" ? "Pago" : contract.status === "EM_ABERTO" ? "Em aberto" : "Em atraso";
  addSection("Resumo do Contrato", [
    ["Número do Contrato", contract.contractNumber],
    ["Status", statusLabel],
    ["Data Base", formatDate(contract.startDate)],
    ["Data de Pagamento", formatDate(contract.paidAt)],
    ["Valor Financiado", formatCurrency(contract.financedValue)],
    ["Valor da Parcela", formatCurrency(contract.installmentValue)],
    ["Total de Parcelas", `${contract.installmentsTotal}x`],
    ["Saldo Devedor", formatCurrency(contract.outstandingBalance)],
    ["Saldo Restante", formatCurrency(contract.remainingBalance)],
  ]);

  // Dados do Veículo
  addSection("Dados do Veículo", [
    ["Marca", contract.vehicle.brand || "--"],
    ["Modelo", contract.vehicle.model || "--"],
    ["Ano", contract.vehicle.year?.toString() || "--"],
    ["Placa", contract.vehicle.plate || "--"],
    ["RENAVAM", contract.vehicle.renavam || "--"],
    ["DUT Emitido", contract.vehicle.dutIssued ? "Sim" : "Não"],
    ["DUT Pago", contract.vehicle.dutPaid ? "Sim" : "Não"],
    ["Data DUT Pago", contract.vehicle.dutPaidDate ? formatDate(contract.vehicle.dutPaidDate) : "--"],
  ]);

  // Parcelas
  if (contract.installments.length > 0) {
    const tableWidth = pageWidth - marginX * 2;
    const columnWidths = [60, 120, 140, tableWidth - 320];
    const headerHeight = 22;
    const rowHeight = 20;

    const drawHeader = () => {
      if (cursorY + headerHeight > pageHeight - 40) {
        doc.addPage();
        cursorY = 40;
      }
      doc.setFillColor(245, 248, 252);
      doc.rect(marginX, cursorY, tableWidth, headerHeight, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(marginX, cursorY, tableWidth, headerHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      let colX = marginX + 8;
      doc.text("Numero", colX, cursorY + 14);
      colX += columnWidths[0];
      doc.text("Valor", colX, cursorY + 14);
      colX += columnWidths[1];
      doc.text("Vencimento", colX, cursorY + 14);
      colX += columnWidths[2];
      doc.text("Status", colX, cursorY + 14);
      cursorY += headerHeight;
    };

    const drawRow = (values: [string, string, string, string]) => {
      if (cursorY + rowHeight > pageHeight - 40) {
        doc.addPage();
        cursorY = 40;
        drawHeader();
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(marginX, cursorY, tableWidth, rowHeight);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      let colX = marginX + 8;
      values.forEach((value, index) => {
        doc.text(value, colX, cursorY + 13);
        colX += columnWidths[index];
      });
      cursorY += rowHeight;
    };

    ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text("Parcelas", marginX, cursorY);
    cursorY += 24;

    drawHeader();
    contract.installments.forEach((installment) => {
      const status = installment.paid ? "Pago" : "Pendente";
      drawRow([
        String(installment.number),
        formatCurrency(installment.amount),
        formatDate(installment.dueDate),
        status,
      ]);
    });
    cursorY += 12;
  }

  // Ocorrências
  if (contract.occurrences.length > 0) {
    ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text("Ocorrências", marginX, cursorY);
    cursorY += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);

    contract.occurrences.slice(0, 5).forEach((occurrence) => {
      ensureSpace(40);
      doc.text(`Data: ${formatDate(occurrence.date)}`, marginX, cursorY);
      cursorY += 16;
      doc.text(`Contato: ${occurrence.contact}`, marginX, cursorY);
      cursorY += 16;
      doc.text(`Observação: ${occurrence.note}`, marginX, cursorY, { maxWidth: pageWidth - marginX * 2 });
      cursorY += 24;
    });

    if (contract.occurrences.length > 5) {
      ensureSpace(20);
      doc.text(`... e mais ${contract.occurrences.length - 5} ocorrências`, marginX, cursorY);
      cursorY += 20;
    }
  }

  const fileName = `contrato-${contract.contractNumber.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

export async function generateContractReportWord(
  contract: BillingContractDetails,
): Promise<void> {
  // Para Word, vamos criar um HTML e usar uma biblioteca ou fazer download direto
  // Por enquanto, vamos criar um HTML que pode ser aberto no Word
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Contrato - ${contract.contractNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #134B73; }
    h2 { color: #134B73; margin-top: 30px; border-bottom: 2px solid #134B73; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f8fc; color: #134B73; font-weight: bold; }
    .label { font-weight: bold; color: #475569; }
  </style>
</head>
<body>
  <h1>Grota Financiamentos</h1>
  <h2>Relatório Completo de Contrato</h2>
  <p><strong>Emitido em:</strong> ${new Date().toLocaleString("pt-BR")}</p>

  <h2>Dados do Cliente</h2>
  <table>
    <tr><td class="label">Nome:</td><td>${contract.customer.name}</td></tr>
    <tr><td class="label">CPF/CNPJ:</td><td>${contract.customer.document}</td></tr>
    <tr><td class="label">Nascimento:</td><td>${contract.customer.birthDate ? formatDate(contract.customer.birthDate) : "--"}</td></tr>
    <tr><td class="label">E-mail:</td><td>${contract.customer.email || "--"}</td></tr>
    <tr><td class="label">Telefone:</td><td>${contract.customer.phone || "--"}</td></tr>
    <tr><td class="label">Endereço:</td><td>${contract.customer.address || "--"}, ${contract.customer.city || "--"} / ${contract.customer.state || "--"}</td></tr>
  </table>

  ${contract.professionalData ? `
  <h2>Dados Profissionais</h2>
  <table>
    <tr><td class="label">Empresa:</td><td>${contract.professionalData.enterprise || "--"}</td></tr>
    <tr><td class="label">Função:</td><td>${contract.professionalData.function || "--"}</td></tr>
    <tr><td class="label">Data de Admissão:</td><td>${contract.professionalData.admissionDate ? formatDate(contract.professionalData.admissionDate) : "--"}</td></tr>
    <tr><td class="label">Estado Civil:</td><td>${contract.professionalData.maritalStatus || "--"}</td></tr>
    <tr><td class="label">Renda:</td><td>${formatCurrency(contract.professionalData.income ?? null)}</td></tr>
    <tr><td class="label">Outras Rendas:</td><td>${formatCurrency(contract.professionalData.otherIncomes ?? null)}</td></tr>
  </table>
  ` : ""}

  ${contract.dealer ? `
  <h2>Dados da Loja</h2>
  <table>
    <tr><td class="label">Empresa:</td><td>${contract.dealer.enterprise || "--"}</td></tr>
    <tr><td class="label">Razão Social:</td><td>${contract.dealer.fullNameEnterprise || "--"}</td></tr>
    <tr><td class="label">CNPJ:</td><td>${contract.dealer.cnpj || "--"}</td></tr>
    <tr><td class="label">Telefone:</td><td>${contract.dealer.phone || "--"}</td></tr>
  </table>
  ` : ""}

  <h2>Resumo do Contrato</h2>
  <table>
    <tr><td class="label">Número do Contrato:</td><td>${contract.contractNumber}</td></tr>
    <tr><td class="label">Status:</td><td>${contract.status === "PAGO" ? "Pago" : contract.status === "EM_ABERTO" ? "Em aberto" : "Em atraso"}</td></tr>
    <tr><td class="label">Data Base:</td><td>${formatDate(contract.startDate)}</td></tr>
    <tr><td class="label">Data de Pagamento:</td><td>${formatDate(contract.paidAt)}</td></tr>
    <tr><td class="label">Valor Financiado:</td><td>${formatCurrency(contract.financedValue)}</td></tr>
    <tr><td class="label">Valor da Parcela:</td><td>${formatCurrency(contract.installmentValue)}</td></tr>
    <tr><td class="label">Total de Parcelas:</td><td>${contract.installmentsTotal}x</td></tr>
    <tr><td class="label">Saldo Devedor:</td><td>${formatCurrency(contract.outstandingBalance)}</td></tr>
    <tr><td class="label">Saldo Restante:</td><td>${formatCurrency(contract.remainingBalance)}</td></tr>
  </table>

  <h2>Dados do Veículo</h2>
  <table>
    <tr><td class="label">Marca:</td><td>${contract.vehicle.brand || "--"}</td></tr>
    <tr><td class="label">Modelo:</td><td>${contract.vehicle.model || "--"}</td></tr>
    <tr><td class="label">Ano:</td><td>${contract.vehicle.year?.toString() || "--"}</td></tr>
    <tr><td class="label">Placa:</td><td>${contract.vehicle.plate || "--"}</td></tr>
    <tr><td class="label">RENAVAM:</td><td>${contract.vehicle.renavam || "--"}</td></tr>
    <tr><td class="label">DUT Emitido:</td><td>${contract.vehicle.dutIssued ? "Sim" : "Não"}</td></tr>
    <tr><td class="label">DUT Pago:</td><td>${contract.vehicle.dutPaid ? "Sim" : "Não"}</td></tr>
    <tr><td class="label">Data DUT Pago:</td><td>${contract.vehicle.dutPaidDate ? formatDate(contract.vehicle.dutPaidDate) : "--"}</td></tr>
  </table>

  ${contract.installments.length > 0 ? `
  <h2>Parcelas</h2>
  <table>
    <thead>
      <tr>
        <th>Número</th>
        <th>Valor</th>
        <th>Vencimento</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${contract.installments.map(i => `
        <tr>
          <td>${i.number}</td>
          <td>${formatCurrency(i.amount)}</td>
          <td>${formatDate(i.dueDate)}</td>
          <td>${i.paid ? "Pago" : "Pendente"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}

  ${contract.occurrences.length > 0 ? `
  <h2>Ocorrências</h2>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Contato</th>
        <th>Observação</th>
      </tr>
    </thead>
    <tbody>
      ${contract.occurrences.map(o => `
        <tr>
          <td>${formatDate(o.date)}</td>
          <td>${o.contact}</td>
          <td>${o.note}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fileName = `contrato-${contract.contractNumber.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.doc`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
