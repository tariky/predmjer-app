import ExcelJS from "exceljs";

type EstimateData = {
  estimate: {
    name: string;
    client_name: string;
    location: string;
    notes: string;
    created_at: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  groups: {
    group_name: string;
    items: {
      name: string;
      description: string;
      unit: string;
      quantity: number;
      unit_price: number;
    }[];
  }[];
};

export async function generateExcel(data: EstimateData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Predmjer", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
  });

  // Column widths
  sheet.columns = [
    { width: 6 },   // R.br.
    { width: 25 },  // Naziv
    { width: 35 },  // Opis
    { width: 8 },   // Jed.
    { width: 12 },  // Kolicina
    { width: 12 },  // Jed. cijena
    { width: 14 },  // Ukupno
  ];

  // Company header
  const companyRow = sheet.addRow([data.company.name]);
  companyRow.font = { bold: true, size: 14 };
  sheet.mergeCells(companyRow.number, 1, companyRow.number, 7);

  const addrRow = sheet.addRow([`${data.company.address} | Tel: ${data.company.phone} | ${data.company.email}`]);
  addrRow.font = { size: 9, color: { argb: "FF666666" } };
  sheet.mergeCells(addrRow.number, 1, addrRow.number, 7);

  sheet.addRow([]);

  // Title
  const titleRow = sheet.addRow(["PREDMJER I PREDRACUN RADOVA"]);
  titleRow.font = { bold: true, size: 13 };
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 7);

  sheet.addRow([`Naziv: ${data.estimate.name}`]);
  sheet.addRow([`Investitor: ${data.estimate.client_name}`]);
  sheet.addRow([`Lokacija: ${data.estimate.location}`]);
  sheet.addRow([`Datum: ${new Date(data.estimate.created_at).toLocaleDateString("bs-BA")}`]);
  sheet.addRow([]);

  let itemCounter = 0;
  const groupSubtotalRows: { row: number; name: string }[] = [];

  for (const group of data.groups) {
    // Group header
    const groupRow = sheet.addRow([group.group_name.toUpperCase()]);
    groupRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3C3C3C" } };
    groupRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    sheet.mergeCells(groupRow.number, 1, groupRow.number, 7);

    // Table header
    const headerRow = sheet.addRow(["R.br.", "Naziv stavke", "Opis", "Jed.", "Kolicina", "Jed. cijena", "Ukupno"]);
    headerRow.font = { bold: true, size: 9 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };

    for (const item of group.items) {
      itemCounter++;
      const currentRowNum = sheet.rowCount + 1;
      const row = sheet.addRow([
        itemCounter,
        item.name,
        item.description,
        item.unit,
        item.quantity,
        item.unit_price,
        { formula: `E${currentRowNum}*F${currentRowNum}` },
      ]);
      row.getCell(5).numFmt = "#,##0.00";
      row.getCell(6).numFmt = "#,##0.00";
      row.getCell(7).numFmt = "#,##0.00";
    }

    const firstItemRow = headerRow.number + 1;
    const lastItemRow = sheet.rowCount;

    // Subtotal row
    const subtotalRow = sheet.addRow(["", "", "", "", "", "UKUPNO:", { formula: `SUM(G${firstItemRow}:G${lastItemRow})` }]);
    subtotalRow.font = { bold: true };
    subtotalRow.getCell(7).numFmt = "#,##0.00";
    groupSubtotalRows.push({ row: sheet.rowCount, name: group.group_name });

    sheet.addRow([]);
  }

  // Recapitulation
  sheet.addRow([]);
  const recapTitle = sheet.addRow(["REKAPITULACIJA"]);
  recapTitle.font = { bold: true, size: 12 };
  sheet.mergeCells(recapTitle.number, 1, recapTitle.number, 7);

  const recapHeader = sheet.addRow(["R.br.", "Grupa radova", "", "", "", "", "Iznos"]);
  recapHeader.font = { bold: true };
  recapHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };

  const recapStartRow = sheet.rowCount + 1;

  groupSubtotalRows.forEach((g, i) => {
    const row = sheet.addRow([i + 1, g.name, "", "", "", "", { formula: `G${g.row}` }]);
    row.getCell(7).numFmt = "#,##0.00";
    sheet.mergeCells(row.number, 2, row.number, 6);
  });

  const recapEndRow = sheet.rowCount;

  const grandTotalRow = sheet.addRow(["", "UKUPNO:", "", "", "", "", { formula: `SUM(G${recapStartRow}:G${recapEndRow})` }]);
  grandTotalRow.font = { bold: true, size: 12 };
  grandTotalRow.getCell(7).numFmt = "#,##0.00";
  sheet.mergeCells(grandTotalRow.number, 2, grandTotalRow.number, 6);

  // Notes
  if (data.estimate.notes) {
    sheet.addRow([]);
    const notesTitle = sheet.addRow(["NAPOMENA"]);
    notesTitle.font = { bold: true, size: 10 };
    sheet.mergeCells(notesTitle.number, 1, notesTitle.number, 7);

    const notesRow = sheet.addRow([data.estimate.notes]);
    notesRow.font = { size: 9, color: { argb: "FF666666" } };
    notesRow.getCell(1).alignment = { wrapText: true };
    sheet.mergeCells(notesRow.number, 1, notesRow.number, 7);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
