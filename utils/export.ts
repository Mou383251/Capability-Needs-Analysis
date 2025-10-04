// Declare global variables for external libraries
declare const docx: any;
declare const jspdf: any;
declare const XLSX: any;

interface TableData {
  type: 'table';
  headers: string[];
  rows: (string | number)[][];
}

interface ImageData {
  type: 'image';
  dataUrl: string;
  width: number;
  height: number;
}

export interface ReportSection {
  title: string;
  content: (string | TableData | ImageData)[];
  orientation?: 'portrait' | 'landscape';
  headingStyle?: 'Blue' | 'Green';
}

export interface ReportData {
  title: string;
  sections: ReportSection[];
}

const ORG_NAME = "Public Service Department";

const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const generatedDate = formatDate(new Date());

const createFileName = (title: string, extension: string) => {
    const sanitizedTitle = title.toLowerCase().replace(/\s+/g, '-');
    return `${sanitizedTitle}-report-${new Date().toISOString().split('T')[0]}.${extension}`;
};


// --- CSV & Sheets Conversion Utility ---
const convertTableDataToString = (tableData: TableData, separator: ',' | '\t'): string => {
    const header = tableData.headers.join(separator);
    const body = tableData.rows.map(row => 
        row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(separator)
    ).join('\n');
    return `${header}\n${body}`;
};


// --- PDF EXPORT ---
export const exportToPdf = (reportData: ReportData) => {
    const firstSectionOrientation = reportData.sections[0]?.orientation || 'portrait';
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: firstSectionOrientation });
    
    let y = 20;
    let currentOrientation = firstSectionOrientation;

    const pageDimensions = () => ({
        width: doc.internal.pageSize.width || doc.internal.pageSize.getWidth(),
        height: doc.internal.pageSize.height || doc.internal.pageSize.getHeight(),
    });

    const addHeaderFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const { width: pageWidth, height: pageHeight } = pageDimensions();
            // Header
            doc.setFontSize(10).setTextColor(100);
            doc.text(reportData.title, pageWidth / 2, 10, { align: 'center' });
            // Footer
            doc.text(`${ORG_NAME} - Generated on ${generatedDate}`, 15, pageHeight - 10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, pageHeight - 10);
        }
    };
    
    doc.setFontSize(18).text(reportData.title, pageDimensions().width / 2, y, { align: 'center' });
    y += 10;

    reportData.sections.forEach(section => {
        const sectionOrientation = section.orientation || 'portrait';

        if (sectionOrientation !== currentOrientation) {
            doc.addPage(undefined, sectionOrientation);
            currentOrientation = sectionOrientation;
            y = 20; // Reset y on new page
        }

        const { width: pageWidth, height: pageHeight } = pageDimensions();

        if (y > pageHeight - 40) { // Increased margin for safety
            doc.addPage(undefined, currentOrientation);
            y = 20;
        }

        doc.setFontSize(14).setFont(undefined, 'bold');
        if (section.headingStyle === 'Blue') {
            doc.setTextColor(37, 99, 235); // Tailwind 'blue-600'
        } else if (section.headingStyle === 'Green') {
            doc.setTextColor(22, 163, 74); // Tailwind 'green-600'
        }
        doc.text(section.title, 15, y);
        doc.setTextColor(0, 0, 0); // Reset to black
        y += 8;

        section.content.forEach(item => {
             const { height: currentPageHeight, width: currentPageWidth } = pageDimensions();
            if (y > currentPageHeight - 40) {
                doc.addPage(undefined, currentOrientation);
                y = 20;
            }

            if (typeof item === 'string') {
                const splitText = doc.splitTextToSize(item, currentPageWidth - 30);
                doc.setFontSize(10).setFont(undefined, 'normal').text(splitText, 15, y);
                y += (splitText.length * 5) + 5;
            } else if (item.type === 'table') {
                (doc as any).autoTable({
                    startY: y,
                    head: [item.headers],
                    body: item.rows,
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185] },
                    margin: { left: 15, right: 15 },
                });
                y = (doc as any).lastAutoTable.finalY + 10;
            } else if (item.type === 'image') {
                const imageWidth = item.width > currentPageWidth - 30 ? currentPageWidth - 30 : item.width;
                const imageHeight = (item.height * imageWidth) / item.width;
                
                if (y + imageHeight > currentPageHeight - 20) {
                    doc.addPage(undefined, currentOrientation);
                    y = 20;
                }

                try {
                    doc.addImage(item.dataUrl, 'PNG', 15, y, imageWidth, imageHeight);
                    y += imageHeight + 10;
                } catch (e) {
                    console.error("jsPDF error adding image:", e);
                    const fallbackText = "[Chart could not be rendered in PDF]";
                    doc.setFontSize(10).setTextColor(255, 0, 0).text(fallbackText, 15, y);
                    y += 10;
                }
            }
        });
        y += 5; // Add some space between sections
    });

    addHeaderFooter();
    doc.save(createFileName(reportData.title, 'pdf'));
};


// --- DOCX EXPORT ---
export const exportToDocx = (reportData: ReportData) => {
    if (typeof docx === 'undefined') {
        console.error("The 'docx' library failed to load. Cannot export to DOCX.");
        alert("DOCX export functionality is not available. This may be due to a network issue. Please check your connection and try again.");
        return;
    }

    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, PageOrientation, ImageRun } = docx;

    const docxSections = reportData.sections.map((section, index) => {
        
        const headingStyleId = section.headingStyle === 'Blue' ? "Heading2Blue" : section.headingStyle === 'Green' ? "Heading2Green" : undefined;
        
        const contentChildren = section.content.flatMap(item => {
            if (typeof item === 'string') {
                return item.split('\n').map(line => new Paragraph({ text: line, style: "normal", alignment: AlignmentType.JUSTIFIED }));
            } else if (item.type === 'table') {
                return new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: item.headers.map(header => new TableCell({ children: [new Paragraph({ text: header, bold: true })] })),
                            tableHeader: true,
                        }),
                        ...item.rows.map(row => new TableRow({
                            children: row.map(cell => new TableCell({ children: [new Paragraph(String(cell ?? ''))] })),
                        })),
                    ],
                });
            } else if (item.type === 'image') {
                const base64Data = item.dataUrl.split(',')[1];
                if (!base64Data) return new Paragraph(" [Image Error] ");
                return new Paragraph({
                    children: [
                        new ImageRun({
                            data: base64Data,
                            transformation: {
                                width: item.width * 2.5,
                                height: item.height * 2.5,
                            },
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                });
            }
            return new Paragraph("");
        });

        let children = [
            headingStyleId 
                ? new Paragraph({ text: section.title, style: headingStyleId })
                : new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }),
            ...contentChildren,
            new Paragraph({ text: "" }) // Spacer
        ];
        
        // Add main title to the very first section
        if (index === 0) {
            children.unshift(
                new Paragraph({ text: reportData.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "" })
            );
        }

        const orientation = section.orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT;

        return {
            properties: {
                page: {
                    size: {
                        orientation: orientation,
                    },
                },
            },
            headers: {
                default: new Paragraph({
                    children: [new TextRun(`${reportData.title}\t\t${ORG_NAME}`)],
                    alignment: AlignmentType.CENTER,
                }),
            },
            footers: {
                default: new Paragraph({
                    children: [new TextRun(`Generated on ${generatedDate}`)],
                    alignment: AlignmentType.CENTER,
                }),
            },
            children: children
        };
    });

    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "normal", name: "Normal", run: { size: 22, font: "Calibri" }, paragraph: { spacing: { after: 120 } } },
                { id: "Heading2Blue", name: "Heading 2 Blue", basedOn: "Normal", next: "Normal", run: { size: 28, bold: true, color: "2563EB" }, paragraph: { spacing: { before: 240, after: 120 } } },
                { id: "Heading2Green", name: "Heading 2 Green", basedOn: "Normal", next: "Normal", run: { size: 28, bold: true, color: "16A34A" }, paragraph: { spacing: { before: 240, after: 120 } } },
            ]
        },
        sections: docxSections,
    });

    Packer.toBlob(doc).then((blob: any) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = createFileName(reportData.title, 'docx');
        a.click();
        URL.revokeObjectURL(url);
    });
};


// --- XLSX EXPORT ---
export const exportToXlsx = (reportData: ReportData) => {
    const wb = XLSX.utils.book_new();
    let sheetIndex = 1;

    // Create a sheet for each table found in the report
    reportData.sections.forEach(section => {
        const tableContent = section.content.find(c => typeof c !== 'string' && c.type === 'table') as TableData | undefined;

        if (tableContent) {
            const table_ws_data = [tableContent.headers, ...tableContent.rows];
            const table_ws = XLSX.utils.aoa_to_sheet(table_ws_data);
            
            const colWidths = tableContent.headers.map((h, i) => ({
                wch: Math.max(
                    h.length,
                    ...tableContent.rows.map(r => String(r[i] || '').length)
                ) + 2
            }));
            table_ws['!cols'] = colWidths;
            
            const sheetName = section.title.replace(/[\\/*?:]/g, '').substring(0, 30) || `Sheet ${sheetIndex++}`;
            XLSX.utils.book_append_sheet(wb, table_ws, sheetName);
        }
    });

    // Create a summary sheet with all non-table text content
    const main_ws_data: any[][] = [[reportData.title], [`Generated on ${generatedDate}`], []];
    reportData.sections.forEach(section => {
        main_ws_data.push([section.title]);
        section.content.forEach(item => {
            if (typeof item === 'string') {
                const lines = item.split('\n');
                lines.forEach(line => main_ws_data.push([`  ${line}`]));
            }
        });
        main_ws_data.push([]); // Spacer
    });

    if (main_ws_data.length > 3) { // If there is more than just the title
        const main_ws = XLSX.utils.aoa_to_sheet(main_ws_data);
        main_ws['!cols'] = [{ wch: 80 }];
        const mainSheetName = 'Report Summary';
        XLSX.utils.book_append_sheet(wb, main_ws, mainSheetName);
    }
    
    // Ensure at least one sheet exists
    if (wb.SheetNames.length === 0) {
        const empty_ws = XLSX.utils.aoa_to_sheet([["No tabular data to export."]]);
        XLSX.utils.book_append_sheet(wb, empty_ws, 'Empty');
    }

    // Move the summary sheet to be the first tab
    const summarySheetName = 'Report Summary';
    if (wb.SheetNames.includes(summarySheetName)) {
        const idx = wb.SheetNames.indexOf(summarySheetName);
        if (idx > 0) {
            const sheet = wb.SheetNames.splice(idx, 1);
            wb.SheetNames.unshift(sheet[0]);
        }
    }
    
    XLSX.writeFile(wb, createFileName(reportData.title, 'xlsx'));
};

// --- CSV EXPORT ---
export const exportToCsv = (reportData: ReportData) => {
    const tableContent = reportData.sections.flatMap(s => s.content).find(c => typeof c !== 'string' && c.type === 'table') as TableData | undefined;
    if (!tableContent) {
        alert("No table data found to export to CSV.");
        return;
    }
    
    const csvContent = convertTableDataToString(tableContent, ',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = createFileName(reportData.title, 'csv');
    a.click();
    URL.revokeObjectURL(url);
};

// --- COPY FOR SHEETS ---
export const copyForSheets = (reportData: ReportData): Promise<string> => {
    return new Promise((resolve, reject) => {
        const tableContent = reportData.sections.flatMap(s => s.content).find(c => typeof c !== 'string' && c.type === 'table') as TableData | undefined;
        if (!tableContent) {
            return reject("No table data found to copy.");
        }
        
        const tsvContent = convertTableDataToString(tableContent, '\t');
        
        if (!navigator.clipboard) {
            return reject("Clipboard API not available. This feature requires a secure connection (HTTPS).");
        }

        navigator.clipboard.writeText(tsvContent).then(
            () => resolve("Table data copied to clipboard! You can now paste it into Google Sheets or Excel."),
            () => reject("Failed to copy data to clipboard. Your browser might have blocked the action.")
        );
    });
};


// --- JSON EXPORT ---
export const exportToJson = (reportData: ReportData) => {
    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = createFileName(reportData.title, 'json');
    a.click();
    URL.revokeObjectURL(url);
};