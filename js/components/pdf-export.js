// ============================================
// HOME CARE APP — PDF Export Utility
// Uses jsPDF + autoTable for professional PDFs
// ============================================

const PdfExport = (() => {

  // Brand colors matching the baby blue theme
  const COLORS = {
    primary: [93, 173, 226],    // #5DADE2
    dark: [27, 42, 74],         // #1B2A4A
    secondary: [90, 113, 132],  // #5A7184
    light: [232, 244, 253],     // #E8F4FD
    white: [255, 255, 255],
    border: [218, 238, 249]     // #DAEEF9
  };

  /**
   * Generate a professional PDF document
   * @param {Object} options
   * @param {string} options.title - Main document title
   * @param {string} options.subtitle - Document subtitle / description
   * @param {string} options.filename - Download filename (without .pdf)
   * @param {Array} options.sections - Array of section objects:
   *   { type: 'table', title: string, headers: string[], rows: string[][] }
   *   { type: 'text', title: string, content: string }
   *   { type: 'info', pairs: [{label, value}] }
   */
  function generate(options) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // ---- HEADER ----
    // Background bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.white);
    doc.text('HomeCare', margin, 15);

    // Subtitle under logo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 240, 255);
    doc.text('Sistema de Gestão Assistencial Domiciliar', margin, 22);

    // Date on the right
    const dateStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.text(dateStr, pageWidth - margin, 15, { align: 'right' });

    y = 45;

    // ---- DOCUMENT TITLE ----
    if (options.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...COLORS.dark);
      doc.text(options.title, margin, y);
      y += 7;
    }

    if (options.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.secondary);
      doc.text(options.subtitle, margin, y);
      y += 10;
    }

    // Divider line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ---- SECTIONS ----
    if (options.sections) {
      options.sections.forEach(section => {
        // Check if we need a new page
        if (y > 260) {
          doc.addPage();
          y = margin + 5;
        }

        if (section.type === 'table') {
          y = renderTable(doc, section, y, margin, pageWidth);
        } else if (section.type === 'text') {
          y = renderText(doc, section, y, margin, pageWidth);
        } else if (section.type === 'info') {
          y = renderInfo(doc, section, y, margin, pageWidth);
        }

        y += 8;
      });
    }

    // ---- FOOTER on each page ----
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();

      // Footer line
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      // Footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.secondary);
      doc.text('HomeCare — Documento gerado automaticamente', margin, pageHeight - 10);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // ---- DOWNLOAD ----
    const filename = (options.filename || 'relatorio_homecare') + '.pdf';
    doc.save(filename);

    return filename;
  }

  function renderTable(doc, section, y, margin, pageWidth) {
    // Section title
    if (section.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.dark);
      doc.text(section.title, margin, y);
      y += 6;
    }

    // AutoTable
    doc.autoTable({
      startY: y,
      head: [section.headers],
      body: section.rows,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        textColor: COLORS.dark,
        lineColor: COLORS.border,
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      bodyStyles: {
        fillColor: COLORS.white
      },
      tableLineColor: COLORS.border,
      tableLineWidth: 0.3
    });

    return doc.lastAutoTable.finalY + 5;
  }

  function renderText(doc, section, y, margin, pageWidth) {
    // Section title
    if (section.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.dark);
      doc.text(section.title, margin, y);
      y += 6;
    }

    // Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.secondary);
    const lines = doc.splitTextToSize(section.content, pageWidth - (margin * 2));
    doc.text(lines, margin, y);
    y += lines.length * 5;

    return y;
  }

  function renderInfo(doc, section, y, margin, pageWidth) {
    if (section.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.dark);
      doc.text(section.title, margin, y);
      y += 7;
    }

    const pairs = section.pairs || [];
    pairs.forEach(pair => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.secondary);
      doc.text(pair.label + ':', margin, y);

      // Value
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.dark);
      doc.text(String(pair.value || '-'), margin + 45, y);
      y += 6;
    });

    return y;
  }

  return { generate };
})();
