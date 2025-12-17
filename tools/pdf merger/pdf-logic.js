'use strict';

const status = document.getElementById('status');

// Helper: Download function
function downloadFile(bytes, name) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = "Finished: " + name + " downloaded.";
}

// --- 1. MERGE LOGIC ---
document.getElementById('mergeBtn').onclick = async () => {
    const files = document.getElementById('mergeInput').files;
    if (files.length < 2) return alert("Select at least 2 PDFs");
    
    status.textContent = "Merging...";
    const mergedDoc = await PDFLib.PDFDocument.create();
    
    for (const file of files) {
        const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer());
        const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => mergedDoc.addPage(p));
    }
    
    const bytes = await mergedDoc.save();
    downloadFile(bytes, "merged_toolsuite.pdf");
};

// --- 2. SPLIT LOGIC ---
document.getElementById('splitBtn').onclick = async () => {
    const file = document.getElementById('splitInput').files[0];
    const range = document.getElementById('splitRange').value;
    if (!file || !range) return alert("Select a file and enter a page range");

    status.textContent = "Splitting...";
    const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer());
    const newDoc = await PDFLib.PDFDocument.create();
    
    const pageIndices = [];
    range.split(',').forEach(part => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) pageIndices.push(i - 1);
        } else {
            pageIndices.push(Number(part) - 1);
        }
    });

    try {
        const pages = await newDoc.copyPages(doc, pageIndices);
        pages.forEach(p => newDoc.addPage(p));
        const bytes = await newDoc.save();
        downloadFile(bytes, "extracted_pages.pdf");
    } catch (e) {
        alert("Check your page range. " + e.message);
    }
};

// --- 3. IMAGE TO PDF LOGIC ---
document.getElementById('imgToPdfBtn').onclick = async () => {
    const files = document.getElementById('imgToPdfInput').files;
    if (files.length === 0) return alert("Select at least one image");

    status.textContent = "Converting Images...";
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (const file of files) {
        const bytes = await file.arrayBuffer();
        let img;
        if (file.type === "image/jpeg") img = await pdfDoc.embedJpg(bytes);
        else if (file.type === "image/png") img = await pdfDoc.embedPng(bytes);
        else continue;

        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }

    const finalBytes = await pdfDoc.save();
    downloadFile(finalBytes, "images_converted.pdf");
};
