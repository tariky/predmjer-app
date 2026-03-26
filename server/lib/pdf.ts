import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { readFileSync } from "fs";
import { join, dirname } from "path";

type EstimateData = {
  estimate: {
    name: string;
    client_name: string;
    location: string;
    notes: string;
    created_at: string;
    pdv_enabled: number;
    discount_type: "none" | "amount" | "percentage";
    discount_value: number;
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

function fmt(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Load Roboto fonts (supports č, ć, š, ž, đ)
const fontsDir = join(dirname(Bun.main), "..", "server", "lib", "fonts");
const robotoRegularBytes = readFileSync(join(fontsDir, "Roboto-Regular.ttf"));
const robotoBoldBytes = readFileSync(join(fontsDir, "Roboto-Bold.ttf"));
const robotoRegularBase64 = Buffer.from(robotoRegularBytes).toString("base64");
const robotoBoldBase64 = Buffer.from(robotoBoldBytes).toString("base64");

function registerFonts(doc: jsPDF) {
  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");
}

export function generatePDF(data: EstimateData): ArrayBuffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const rightEdge = pageWidth - margin;
  const contentWidth = pageWidth - margin * 2;

  // ─── HEADER ───
  doc.setFontSize(13);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(data.company.name, margin, 16);

  doc.setFontSize(8);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(data.company.address, margin, 22);
  doc.text(`Tel: ${data.company.phone}  |  Email: ${data.company.email}`, margin, 27);

  // Header double line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 31, rightEdge, 31);
  doc.setLineWidth(0.15);
  doc.line(margin, 32, rightEdge, 32);

  // ─── TITLE ───
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("Roboto", "bold");
  doc.text("PREDMJER I PREDRAČUN RADOVA", pageWidth / 2, 41, { align: "center" });

  // Meta
  doc.setFontSize(9);
  const metaY = 50;
  const labelX = margin;
  const valueX = margin + 22;

  doc.setFont("Roboto", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Naziv:", labelX, metaY);
  doc.text("Investitor:", labelX, metaY + 5);
  doc.text("Lokacija:", labelX, metaY + 10);
  doc.text("Datum:", labelX, metaY + 15);

  doc.setTextColor(0, 0, 0);
  doc.setFont("Roboto", "bold");
  doc.text(data.estimate.name, valueX, metaY);
  doc.setFont("Roboto", "normal");
  doc.text(data.estimate.client_name, valueX, metaY + 5);
  doc.text(data.estimate.location, valueX, metaY + 10);

  const dateStr = new Date(data.estimate.created_at).toLocaleDateString("bs-BA", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  doc.text(dateStr, valueX, metaY + 15);

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);
  doc.line(margin, 70, rightEdge, 70);

  let yPos = 76;
  let itemCounter = 0;
  const groupTotals: { name: string; total: number }[] = [];

  // ─── GROUPS ───
  for (const group of data.groups) {
    if (yPos > pageHeight - 45) {
      doc.addPage();
      yPos = 20;
    }

    // Group header — black bar
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, yPos - 4.5, contentWidth, 7, "F");
    doc.setFontSize(8);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(group.group_name.toUpperCase(), margin + 2, yPos);
    yPos += 5;

    const tableData = group.items.map((item) => {
      itemCounter++;
      const total = item.quantity * item.unit_price;
      return [
        itemCounter.toString(),
        item.name + (item.description ? "\n" + item.description : ""),
        item.unit,
        fmt(item.quantity),
        fmt(item.unit_price),
        fmt(total),
      ];
    });

    const groupTotal = group.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price, 0
    );
    groupTotals.push({ name: group.group_name, total: groupTotal });

    autoTable(doc, {
      startY: yPos,
      head: [["R.br.", "Naziv stavke / Opis", "Jed.", "Količina", "Jed. cijena", "Ukupno (KM)"]],
      body: tableData,
      foot: [["", "", "", "", "Ukupno:", fmt(groupTotal)]],
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        font: "Roboto",
        fontSize: 7.5,
        cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
        textColor: [0, 0, 0],
        lineColor: [180, 180, 180],
        lineWidth: 0.15,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 7,
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        halign: "right",
        lineWidth: { top: 0.4, bottom: 0, left: 0, right: 0 },
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 12, halign: "center" },
        3: { cellWidth: 22, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // ─── REKAPITULACIJA ───
  if (yPos > pageHeight - 55) {
    doc.addPage();
    yPos = 20;
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos - 2, rightEdge, yPos - 2);

  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("REKAPITULACIJA", margin, yPos + 5);
  yPos += 9;

  const recapData = groupTotals.map((g, i) => [
    (i + 1).toString() + ".",
    g.name,
    fmt(g.total),
  ]);

  const grandTotal = groupTotals.reduce((sum, g) => sum + g.total, 0);
  const { discount_type, discount_value, pdv_enabled } = data.estimate;
  const discountAmount = discount_type === "percentage"
    ? grandTotal * discount_value / 100
    : discount_type === "amount" ? discount_value : 0;
  const afterDiscount = grandTotal - discountAmount;
  const pdvAmount = pdv_enabled ? afterDiscount * 0.17 : 0;
  const finalTotal = afterDiscount + pdvAmount;

  const footRows: string[][] = [];
  if (discountAmount > 0 || pdv_enabled) {
    footRows.push(["", "Ukupno bez popusta:", fmt(grandTotal)]);
  }
  if (discountAmount > 0) {
    const discLabel = discount_type === "percentage"
      ? `Popust (${discount_value}%):`
      : "Popust:";
    footRows.push(["", discLabel, `-${fmt(discountAmount)}`]);
  }
  if (discountAmount > 0 && pdv_enabled) {
    footRows.push(["", "Ukupno sa popustom:", fmt(afterDiscount)]);
  }
  if (pdv_enabled) {
    footRows.push(["", "PDV (17%):", fmt(pdvAmount)]);
  }
  footRows.push(["", "UKUPNO:", fmt(finalTotal)]);

  autoTable(doc, {
    startY: yPos,
    head: [["R.br.", "Grupa radova", "Iznos (KM)"]],
    body: recapData,
    foot: footRows,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: {
      font: "Roboto",
      fontSize: 9,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      textColor: [0, 0, 0],
      lineColor: [180, 180, 180],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "right",
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 35, halign: "right", fontStyle: "bold" },
    },
  });

  // ─── NOTES ───
  if (data.estimate.notes) {
    let notesY = (doc as any).lastAutoTable.finalY + 15;
    if (notesY > pageHeight - 40) {
      doc.addPage();
      notesY = 20;
    }

    doc.setFontSize(10);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("NAPOMENA", margin, notesY);

    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(data.estimate.notes, contentWidth);
    doc.text(noteLines, margin, notesY + 7);
  }

  // ─── PAGE NUMBERS ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.15);
    doc.line(margin, pageHeight - 14, rightEdge, pageHeight - 14);

    doc.setFontSize(7);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(data.company.name, margin, pageHeight - 9);
    doc.text(`Stranica ${i} / ${pageCount}`, rightEdge, pageHeight - 9, { align: "right" });
  }

  return doc.output("arraybuffer");
}
