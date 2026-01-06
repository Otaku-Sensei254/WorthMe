// backend/routes/im.js
import express from 'express';
import multer from 'multer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_DATE = (text) => /^\d{2}-\d{2}-\d{2}$/.test(text.trim());
const IS_CURRENCY_LIKE = (text) => /^\d{1,3}(,\d{3})*(\.\d{2})?$/.test(text.trim());

const parseCurrency = (str) => {
    if (!str) return '0.00';
    const clean = str.replace(/,/g, '').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? '0.00' : num.toFixed(2);
};

router.post('/', upload.single('statement'), async (req, res) => {
    try {
        const buffer = new Uint8Array(req.file.buffer);
        const { password } = req.body;

        const pdf = await pdfjsLib.getDocument({
            data: buffer,
            standardFontDataUrl: path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/'),
            password: password || ''
        }).promise;

        let transactions = [];
        let headerFound = false;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const rows = {};
            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                const x = Math.round(item.transform[4]);
                if (!rows[y]) rows[y] = [];
                rows[y].push({ str: item.str.trim(), x });
            });

            const sortedRows = Object.keys(rows)
                .sort((a, b) => b - a)
                .map(y => ({ y, items: rows[y].sort((a, b) => a.x - b.x) }));

            for (const row of sortedRows) {
                const rowText = row.items.map(item => item.str).join(' ');
                if (rowText.trim().length === 0) continue;

                if (!headerFound && rowText.includes('Tran Date') && rowText.includes('Value Date')) {
                    headerFound = true;
                    continue;
                }
                if (!headerFound) continue;

                const dateItem = row.items.find(item => IS_DATE(item.str));

                if (dateItem) {
                    const tx = {
                        tranDate: '', valueDate: '', refNo: '',
                        withdrawn: '0.00', deposits: '0.00', balance: '',
                        details: ''
                    };

                    let detailParts = [];
                    let tempRefNo = [];

                    row.items.forEach(item => {
                        const x = item.x;
                        if (x < 60) {
                            if (IS_DATE(item.str)) tx.tranDate = item.str;
                        }
                        else if (x >= 60 && x < 120) {
                            if (IS_DATE(item.str)) tx.valueDate = item.str;
                        }
                        else if (x >= 120 && x < 200 && !IS_DATE(item.str) && !IS_CURRENCY_LIKE(item.str)) { tempRefNo.push(item.str); }
                        else if (x >= 200 && x < 300) { 
                            const val = parseCurrency(item.str);
                            if (val !== '0.00') tx.withdrawn = val; 
                        }
                        else if (x >= 300 && x < 380) { 
                            const val = parseCurrency(item.str);
                            if (val !== '0.00') tx.deposits = val; 
                        }
                        else if (x >= 380 && x < 450) { 
                            const val = parseCurrency(item.str);
                            if (val !== '0.00') tx.balance = val; 
                        }
                        else if (x >= 450) { detailParts.push(item.str); }
                    });
                    
                    tx.refNo = tempRefNo.join(' ').trim();
                    tx.details = detailParts.join(' ').trim();
                    transactions.push(tx);

                } else if (transactions.length > 0) {
                    const lastTx = transactions[transactions.length - 1];
                    const continuationText = row.items
                        .filter(item => item.x >= 450)
                        .map(item => item.str)
                        .join(' ').trim();
                    
                    if (continuationText) {
                        lastTx.details += ' ' + continuationText;
                    }
                }
            }
        }
        
        const processed = transactions.map(tx => ({
            ...tx,
            refNo: tx.refNo.trim(),
            details: tx.details.replace(/\s+/g, ' ').trim(),
            withdrawn: tx.withdrawn.replace('Cr', '').replace('Dr', '').trim(),
            deposits: tx.deposits.replace('Cr', '').replace('Dr', '').trim(),
            balance: tx.balance.replace('Cr', '').replace('Dr', '').trim()
        }));

        res.json({
            success: true,
            transactions: processed,
            count: processed.length
        });

    } catch (error) {
        console.error('PDF parsing error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to parse PDF. Please ensure it\'s a valid I&M bank statement.'
        });
    }
});

export default router;