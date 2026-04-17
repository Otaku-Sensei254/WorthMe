import express from 'express';
import multer from 'multer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const IS_RECEIPT_NO = (text) => /^[A-Z]{2,3}[A-Z0-9]{7,10}$/.test(text.trim());
const IS_NUMERIC = (text) => /^[–-]?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(text.trim());

const cleanNumeric = (value) => (value || "").replace(/[–]/g, '-').replace(/[^\d.-]/g, '').trim() || "0.00";

router.post('/mpesa', upload.single('statement'), async (req, res) => {
    try {
        const { password } = req.body;
        const buffer = new Uint8Array(req.file.buffer);
        const loadingTask = pdfjsLib.getDocument({ data: buffer, password });
        const pdfDocument = await loadingTask.promise;

        let transactions = [];
        let currentTx = null;
        let summary = {
            paidInByType: [],
            paidOutByType: [],
            totalPaidIn: "0.00",
            totalPaidOut: "0.00",
            netMovement: "0.00",
            currentBalance: "0.00",
            customerName: "",
            mobileNumber: "",
            emailAddress: "",
            statementPeriod: "",
            requestDate: ""
        };
        let inSummarySection = false;

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
                const firstItem = rowItems[0].text;

                if (/^SUMMARY$/i.test(rowText)) {
                    inSummarySection = true;
                    return;
                }

                if (inSummarySection) {
                    if (/^DETAILED STATEMENT$/i.test(rowText)) {
                        inSummarySection = false;
                        return;
                    }

                    if (/TRANSACTION TYPE/i.test(rowText) || /PAID IN/i.test(rowText) || /PAID OUT/i.test(rowText)) {
                        return;
                    }

                    if (/Customer Name:/i.test(rowText)) {
                        summary.customerName = rowText.split('Customer Name:').pop().trim();
                        return;
                    }

                    if (/Mobile Number:/i.test(rowText)) {
                        summary.mobileNumber = rowText.split('Mobile Number:').pop().trim();
                        return;
                    }

                    if (/Email Address:/i.test(rowText)) {
                        summary.emailAddress = rowText.split('Email Address:').pop().trim();
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

                    const numericItems = rowItems.filter(item => IS_NUMERIC(item.text));
                    const label = rowText.replace(/\s*\d[\d,.-]*\s*/g, ' ').trim();

                    if (numericItems.length >= 2) {
                        const paidIn = cleanNumeric(numericItems[0].text);
                        const paidOut = cleanNumeric(numericItems[1].text);

                        if (/^TOTAL:/i.test(label)) {
                            summary.totalPaidIn = paidIn;
                            summary.totalPaidOut = paidOut;
                            return;
                        }

                        summary.paidInByType.push({
                            type: label.replace(/:\s*$/,'').trim(),
                            paidIn,
                            paidOut
                        });
                    }

                    return;
                }

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

        if (transactions.length > 0) {
            summary.currentBalance = cleanNumeric(transactions[0].balance);
            summary.netMovement = (parseFloat(summary.totalPaidIn) - parseFloat(summary.totalPaidOut)).toFixed(2);
        }

        // FINAL CLEANUP
        const processed = transactions.map(tx => {
            return {
                ...tx,
                receiptNo: tx.receiptNo.trim(),
                completionTime: tx.completionTime.trim(),
                // Remove redundant 'Completed' text that leaks into Details bucket
                details: tx.details.replace(/completed/gi, '').replace(/\s+/g, ' ').trim(),
                paidIn: cleanNumeric(tx.paidIn),
                withdrawn: cleanNumeric(tx.withdrawn).replace('-', ''), // Frontend adds the minus
                balance: cleanNumeric(tx.balance)
            };
        });

        res.json({ success: true, summary, transactions: processed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
