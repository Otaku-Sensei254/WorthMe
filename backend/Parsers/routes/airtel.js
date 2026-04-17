import express from 'express';
import multer from 'multer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Airtel Transaction ID pattern: exactly 11 alphanumeric characters
const IS_TRANSACTION_ID = (text) => /^[A-Z0-9]{11}$/.test(text.trim());

// Detects Kenyan Shilling amounts: numbers with commas and optional decimal
// Exclude 11-digit numbers that could be Transaction IDs
const IS_AMOUNT = (text) => {
    const t = text.trim();
    // If it's exactly 11 digits, it might be a Transaction ID - exclude it
    if (/^\d{11}$/.test(t)) return false;
    return /^Ksh\s*[\d,]+(\.\d{2})?$/.test(t) || /^[\d,]+(\.\d{2})?$/.test(t);
};

// Detects date format: DD-MM-YY HH:MM AM/PM
const IS_DATE_TIME = (text) => /\d{2}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(AM|PM)/i.test(text.trim());

// Extract numeric value from amount string
const EXTRACT_AMOUNT = (text) => {
    const match = text.replace(/Ksh\s*/i, '').replace(/,/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]).toFixed(2) : '0.00';
};

const isBundlePurchase = (text) => /bundle purchase/i.test(text);

const parseSummaryValue = (rowItems) => {
    const amountItem = rowItems.find(item => IS_AMOUNT(item.text));
    return amountItem ? EXTRACT_AMOUNT(amountItem.text) : '0.00';
};

router.post('/airtel', upload.single('statement'), async (req, res) => {
    try {
        const buffer = new Uint8Array(req.file.buffer);
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdfDocument = await loadingTask.promise;

        let transactions = [];
        let currentTx = null;
        let summary = {
            openingBalance: '0.00',
            closingBalance: '0.00',
            totalCredit: '0.00',
            totalDebit: '0.00',
            statementPeriod: '',
            customerName: '',
            mobileNumber: '',
            requestDate: ''
        };
        let summaryCaptured = false;

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

                const rowText = rowItems.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim();

                if (!summaryCaptured) {
                    if (/Customer Name:/i.test(rowText)) {
                        summary.customerName = rowText.split('Customer Name:').pop().trim();
                        return;
                    }
                    if (/Mobile Number:/i.test(rowText)) {
                        summary.mobileNumber = rowText.split('Mobile Number:').pop().trim();
                        return;
                    }
                    if (/Statement Period:/i.test(rowText)) {
                        summary.statementPeriod = rowText.split('Statement Period:').pop().trim();
                        return;
                    }
                    if (/Request Date:/i.test(rowText)) {
                        summary.requestDate = rowText.split('Request Date:').pop().trim();
                        return;
                    }
                    if (/Opening Balance:/i.test(rowText)) {
                        summary.openingBalance = parseSummaryValue(rowItems);
                        return;
                    }
                    if (/Closing Balance:/i.test(rowText)) {
                        summary.closingBalance = parseSummaryValue(rowItems);
                        return;
                    }
                    if (/Total Credit:/i.test(rowText)) {
                        summary.totalCredit = parseSummaryValue(rowItems);
                        return;
                    }
                    if (/Total Debit:/i.test(rowText)) {
                        summary.totalDebit = parseSummaryValue(rowItems);
                        return;
                    }
                    if (/DETAILED STATEMENT/i.test(rowText)) {
                        summaryCaptured = true;
                        return;
                    }
                }

                const firstItem = rowItems[0];
                const firstText = firstItem.text;
                const firstX = firstItem.x;

                // Check if this row starts with a Transaction ID in the first column (x < 80)
                if (firstX < 80 && IS_TRANSACTION_ID(firstText)) {
                    if (currentTx) transactions.push(currentTx);

                    currentTx = {
                        transactionId: "",
                        transactionDate: "",
                        description: "",
                        status: "",
                        credit: "0.00",
                        debit: "0.00",
                        balance: "0.00"
                    };

                    // Separate text items and numeric/amount items
                    const amountItems = [];
                    const textItems = [];

                    rowItems.forEach(item => {
                        if (IS_AMOUNT(item.text)) {
                            amountItems.push(item);
                        } else {
                            textItems.push(item);
                        }
                    });

                    // Process amounts: Credit, Debit, Balance
                    // Based on the table structure: Credit (4th), Debit (5th), Balance (6th)
                    if (amountItems.length >= 1) {
                        const rowText = rowItems.map(item => item.text).join(' ');

                        // Rightmost is always balance
                        currentTx.balance = EXTRACT_AMOUNT(amountItems[amountItems.length - 1].text);

                        // If 2 amounts: one is balance, check if credit or debit
                        if (amountItems.length >= 2) {
                            const secondLast = amountItems[amountItems.length - 2];

                            if (isBundlePurchase(rowText)) {
                                currentTx.debit = EXTRACT_AMOUNT(secondLast.text);
                            } else {
                                // Check position to determine if credit or debit
                                // Credit column around x=580, Debit around x=680, Balance around x=760
                                if (secondLast.x < 630) {
                                    currentTx.credit = EXTRACT_AMOUNT(secondLast.text);
                                } else {
                                    currentTx.debit = EXTRACT_AMOUNT(secondLast.text);
                                }
                            }
                        }
                        
                        // If 3 amounts: credit, debit, balance
                        if (amountItems.length >= 3) {
                            if (isBundlePurchase(rowText)) {
                                currentTx.credit = "0.00";
                                currentTx.debit = EXTRACT_AMOUNT(amountItems[amountItems.length - 2].text);
                            } else {
                                currentTx.credit = EXTRACT_AMOUNT(amountItems[amountItems.length - 3].text);
                                currentTx.debit = EXTRACT_AMOUNT(amountItems[amountItems.length - 2].text);
                            }
                        }
                    }

                    // Process text items by x-position
                    // Set Transaction ID from first column
                    currentTx.transactionId = firstText;

                    textItems.forEach(item => {
                        const x = item.x;
                        const text = item.text;

                        if (x < 80) {
                            // Already captured above, skip
                            return;
                        } else if (x >= 80 && x < 180) {
                            // Date column
                            currentTx.transactionDate += " " + text;
                        } else if (x >= 180 && x < 450) {
                            // Description column
                            currentTx.description += " " + text;
                        } else if (x >= 450 && x < 730) {
                            // Status column
                            currentTx.status = text;
                        }
                    });

                } else if (currentTx && !(firstX < 80 && IS_TRANSACTION_ID(firstText))) {
                    // Handle multi-line descriptions and dates
                    rowItems.forEach(item => {
                        const x = item.x;
                        const text = item.text;

                        if (x >= 80 && x < 180 && (IS_DATE_TIME(text) || !IS_AMOUNT(text))) {
                            // Date continuation
                            currentTx.transactionDate += " " + text;
                        } else if (x >= 180 && x < 450 && !IS_AMOUNT(text)) {
                            // Description continuation
                            currentTx.description += " " + text;
                        } else if (x >= 450 && x < 730 && !IS_AMOUNT(text)) {
                            // Status (if not already set)
                            if (!currentTx.status || currentTx.status === "Transaction Successful") {
                                currentTx.status = text;
                            }
                        }
                    });
                }
            });
        }

        if (currentTx) transactions.push(currentTx);

        // Clean up transactions
        const processed = transactions.map(tx => ({
            transactionId: tx.transactionId.trim(),
            transactionDate: tx.transactionDate.trim().replace(/\s+/g, ' '),
            description: tx.description.replace(/\s+/g, ' ').trim(),
            status: tx.status.trim() || 'Transaction Successful',
            credit: tx.credit,
            debit: tx.debit,
            balance: tx.balance
        }));

        res.json({ success: true, summary, transactions: processed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
