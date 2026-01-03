import express from 'express';
import multer from 'multer';
import cors from 'cors';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const IS_RECEIPT_NO = (text) => /^[A-Z]{2,3}[A-Z0-9]{7,10}$/.test(text.trim());
// Detects numbers, including M-Pesa's special dashes (–) and commas
const IS_NUMERIC = (text) => /^[–-]?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(text.trim());

app.post('/upload', upload.single('statement'), async (req, res) => {
    try {
        const { password } = req.body;
        const buffer = new Uint8Array(req.file.buffer);
        const loadingTask = pdfjsLib.getDocument({ data: buffer, password });
        const pdfDocument = await loadingTask.promise;

        let transactions = [];
        let currentTx = null;

        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const rowsMap = {};

            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                const x = Math.round(item.transform[4]);
                if (!rowsMap[y]) rowsMap[y] = [];
                rowsMap[y].push({ text: item.str.trim(), x });
            });

            const sortedY = Object.keys(rowsMap).sort((a, b) => b - a);

            sortedY.forEach(y => {
                const rowItems = rowsMap[y].sort((a, b) => a.x - b.x).filter(item => item.text !== "");
                if (rowItems.length === 0) return;

                const firstItem = rowItems[0].text;

                if (IS_RECEIPT_NO(firstItem)) {
                    if (currentTx) transactions.push(currentTx);

                    currentTx = {
                        receiptNo: "",
                        completionTime: "",
                        details: "",
                        status: "Completed",
                        paidIn: "0.00",
                        withdrawn: "0.00",
                        balance: "0.00"
                    };

                    // 1. Separate numbers from text for smarter mapping
                    const numericItems = rowItems.filter(item => IS_NUMERIC(item.text));
                    const textItems = rowItems.filter(item => !IS_NUMERIC(item.text));

                    // 2. RELATIVE NUMERIC LOGIC: The right-most number is ALWAYS the balance
                    if (numericItems.length > 0) {
                        currentTx.balance = numericItems[numericItems.length - 1].text;
                        
                        // Check remaining numbers for Paid In or Withdrawn
                        const others = numericItems.slice(0, -1);
                        others.forEach(num => {
                            // If it has a dash/minus, it's a withdrawal
                            if (num.text.includes('-') || num.text.includes('–')) {
                                currentTx.withdrawn = num.text;
                            } else {
                                currentTx.paidIn = num.text;
                            }
                        });
                    }

                    // 3. TEXT BUCKETS (Calibrated to prevent Details from swallowing Status)
                    textItems.forEach(item => {
                        const x = item.x;
                        if (x < 70) currentTx.receiptNo = item.text;
                        else if (x >= 70 && x < 175) currentTx.completionTime += " " + item.text;
                        else if (x >= 175 && x < 380) currentTx.details += " " + item.text;
                        else if (x >= 380 && x < 480) currentTx.status = item.text;
                    });

                } else if (currentTx) {
                    // Handle multi-line wrapping for Details and Time
                    rowItems.forEach(item => {
                        if (!IS_NUMERIC(item.text)) {
                            const x = item.x;
                            if (x >= 70 && x < 175) currentTx.completionTime += " " + item.text;
                            else if (x >= 175 && x < 380) currentTx.details += " " + item.text;
                        }
                    });
                }
            });
        }
        if (currentTx) transactions.push(currentTx);

        // FINAL CLEANUP
        const processed = transactions.map(tx => {
            const clean = (val) => (val || "").replace(/[–]/g, '-').replace(/[^\d.-]/g, '').trim() || "0.00";
            
            return {
                ...tx,
                receiptNo: tx.receiptNo.trim(),
                completionTime: tx.completionTime.trim(),
                // Remove redundant 'Completed' text that leaks into Details bucket
                details: tx.details.replace(/completed/gi, '').replace(/\s+/g, ' ').trim(),
                paidIn: clean(tx.paidIn),
                withdrawn: clean(tx.withdrawn).replace('-', ''), // Frontend adds the minus
                balance: clean(tx.balance)
            };
        });

        res.json({ success: true, transactions: processed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(5000, () => console.log('Parser running on port 5000'));