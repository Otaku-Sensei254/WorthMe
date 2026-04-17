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

// Corrected IS_DATE regex
const IS_DATE = (text) => /^\d{2}-\d{2}-\d{2}$/.test(text.trim());
// Regex to identify currency-like strings (e.g., 1,234.56, 500.00)
const IS_CURRENCY = (text) => /^\d{1,3}(,\d{3})*(\.\d{2})?$/.test(text.trim());

// Helper to clean currency strings
const parseCurrency = (str) => {
    if (!str) return '0.00';
    const clean = str.replace(/,/g, '').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? '0.00' : num.toFixed(2);
};

router.post('/im', upload.single('statement'), async (req, res) => {
    try {
        const buffer = new Uint8Array(req.file.buffer);
        const { password } = req.body;

        const pdf = await pdfjsLib.getDocument({
            data: buffer,
            standardFontDataUrl: path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/'),
            password: password || ''
        }).promise;

        let transactions = [];
        let currentTx = null;
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

                const dateItems = row.items.filter(item => IS_DATE(item.str));
                const currencyItems = row.items.filter(item => IS_CURRENCY(item.str));

                if (dateItems.length > 0) {
                    if (currentTx) {
                        transactions.push(currentTx);
                    }

                    currentTx = {
                        tranDate: dateItems[0]?.str || '',
                        valueDate: dateItems[1]?.str || dateItems[0]?.str || '',
                        refNo: '',
                        withdrawn: '0.00',
                        deposits: '0.00',
                        balance: '0.00',
                        details: ''
                    };

                    if (currencyItems.length > 0) {
                        // The right-most currency is the balance
                        currentTx.balance = parseCurrency(currencyItems[currencyItems.length - 1].str);
                        
                        const otherAmounts = currencyItems.slice(0, -1);
                        if (otherAmounts.length > 0) {
                            // Based on the statement, withdrawals appear before deposits
                            const withdrawalItem = otherAmounts[0];
                            if (withdrawalItem) {
                                // A bit of a guess: withdrawals are usually in a column before deposits
                                const depositOrWithdrawalX = withdrawalItem.x;
                                if (depositOrWithdrawalX < 400) { // Withdrawals column is to the left
                                     currentTx.withdrawn = parseCurrency(withdrawalItem.str);
                                     if(otherAmounts.length > 1){
                                         currentTx.deposits = parseCurrency(otherAmounts[1].str)
                                     }
                                } else { // Deposits column
                                    currentTx.deposits = parseCurrency(withdrawalItem.str);
                                }
                            }
                        }
                    }

                    const nonMonetaryItems = row.items.filter(item => !IS_DATE(item.str) && !IS_CURRENCY(item.str) && item.str !== 'Cr' && item.str !== 'Dr');
                    currentTx.details = nonMonetaryItems.map(item => item.str).join(' ');

                } else if (currentTx) {
                    // This is a continuation row
                    const continuationText = row.items
                        .filter(item => !IS_CURRENCY(item.str)) // Ignore any stray numbers
                        .map(item => item.str)
                        .join(' ')
                        .trim();
                    
                    if (continuationText) {
                        currentTx.details += ' ' + continuationText;
                    }
                }
            }
        }

        if (currentTx) {
            transactions.push(currentTx);
        }
        
        // Final cleanup
        transactions = transactions.map(tx => ({
            ...tx,
            refNo: tx.details.split(' ')[0], // Best guess for Ref No
            details: tx.details.replace(/\s+/g, ' ').trim()
        }));


        res.json({
            success: true,
            transactions,
            count: transactions.length
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