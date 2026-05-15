import express from 'express';
import multer from 'multer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_DATE = (text) => /^\d{2}-\d{2}-(?:\d{2}|\d{4})$/.test(text.trim());
const IS_AMOUNT = (text) => /^\d{1,3}(?:,\d{3})*(?:\.\d{2})?$/.test(text.trim());
const IS_BALANCE_TYPE = (text) => /^(Cr|Dr)$/i.test(text.trim());

const cleanAmount = (value) => {
    if (!value) return '0.00';
    const numeric = value.replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const parsed = parseFloat(numeric);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
};

const normalizeText = (value) => (value || '').replace(/\s+/g, ' ').trim();

const compactNarrative = (parts) => normalizeText(parts.filter(Boolean).join(' '));

const amountAt = (items, minX, maxX = Infinity) => {
    const item = items.find(({ text, x }) => x >= minX && x < maxX && IS_AMOUNT(text));
    return item ? cleanAmount(item.text) : '0.00';
};

const textAt = (items, minX, maxX = Infinity) => (
    items
        .filter(({ text, x }) => x >= minX && x < maxX && !IS_DATE(text) && !IS_AMOUNT(text) && !IS_BALANCE_TYPE(text))
        .map(({ text }) => text)
);

const rowText = (items) => normalizeText(items.map(({ text }) => text).join(' '));

const isTableHeader = (text) => /Tran Date/i.test(text) && /Transaction Narrative/i.test(text);
const isFooterStart = (text) => /^1\.\s|^\*+|Terms & Conditions/i.test(text);
const isSummaryRow = (text) => /^(Total|Balance as of|Cleared Balance as on|Unclear Balance as on|Lien Amount as on|Effective Avail Bal as of)\b/i.test(text);
const isNarrativeOnlyRow = (items) => (
    items.length > 0 &&
    items.every(({ text, x }) => x >= 455 && !IS_DATE(text) && !IS_AMOUNT(text) && !IS_BALANCE_TYPE(text))
);

const extractRows = async (pdfDocument) => {
    const rows = [];

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const rowsMap = {};

        textContent.items.forEach((item) => {
            const text = item.str.trim();
            if (!text) return;

            const y = Math.round(item.transform[5]);
            const x = Math.round(item.transform[4]);

            if (!rowsMap[y]) rowsMap[y] = [];
            rowsMap[y].push({ text, x });
        });

        Object.keys(rowsMap)
            .sort((a, b) => b - a)
            .forEach((y) => {
                const items = rowsMap[y].sort((a, b) => a.x - b.x);
                rows.push({ pageNum, y: Number(y), items, text: rowText(items), consumed: false });
            });
    }

    return rows;
};

const extractMetadata = (rows) => {
    const summary = {
        accountName: '',
        accountNumber: '',
        accountType: '',
        accountCurrency: '',
        statementPeriod: '',
        openingBalance: '0.00',
        openingBalanceType: '',
        totalWithdrawals: '0.00',
        totalDeposits: '0.00',
        balanceAsOf: '0.00',
        balanceAsOfDate: '',
        clearedBalance: '0.00',
        clearedBalanceDate: '',
        unclearBalance: '0.00',
        unclearBalanceDate: '',
        lienAmount: '0.00',
        lienAmountDate: '',
        effectiveAvailableBalance: '0.00',
        effectiveAvailableBalanceDate: ''
    };

    rows.forEach(({ items, text }) => {
        if (/^Account Name\b/i.test(text)) {
            summary.accountName = normalizeText(items.filter(({ x }) => x >= 100 && x < 360).map(({ text }) => text).join(' '));
        }

        if (/^Account Number\b/i.test(text)) {
            summary.accountNumber = items.find(({ x }) => x >= 100)?.text || '';
        }

        if (/^Account Type\b/i.test(text)) {
            summary.accountType = items.find(({ x }) => x >= 100)?.text || '';
        }

        if (/^Account Currency\b/i.test(text)) {
            summary.accountCurrency = normalizeText(items.filter(({ x }) => x >= 100 && x < 320).map(({ text }) => text).join(' '));
            const dates = items.filter(({ text }) => IS_DATE(text)).map(({ text }) => text);
            if (dates.length >= 2) summary.statementPeriod = `${dates[0]} To ${dates[1]}`;
        }

        if (/^Total\b/i.test(text)) {
            summary.totalWithdrawals = amountAt(items, 225, 310);
            summary.totalDeposits = amountAt(items, 310, 390);
        }

        const summaryDate = items.find(({ text }) => IS_DATE(text))?.text || '';
        const summaryAmount = amountAt(items, 390, 455);

        if (/^Balance as of\b/i.test(text)) {
            summary.balanceAsOf = summaryAmount;
            summary.balanceAsOfDate = summaryDate;
        }

        if (/^Cleared Balance as on\b/i.test(text)) {
            summary.clearedBalance = summaryAmount;
            summary.clearedBalanceDate = summaryDate;
        }

        if (/^Unclear Balance as on\b/i.test(text)) {
            summary.unclearBalance = summaryAmount;
            summary.unclearBalanceDate = summaryDate;
        }

        if (/^Lien Amount as on\b/i.test(text)) {
            summary.lienAmount = summaryAmount;
            summary.lienAmountDate = summaryDate;
        }

        if (/^Effective Avail Bal as of\b/i.test(text)) {
            summary.effectiveAvailableBalance = summaryAmount;
            summary.effectiveAvailableBalanceDate = summaryDate;
        }
    });

    return summary;
};

const collectPreviousNarrative = (rows, index, currentRow) => {
    const parts = [];

    for (let prev = index - 1; prev >= 0; prev--) {
        const candidate = rows[prev];
        if (candidate.consumed || candidate.pageNum !== currentRow.pageNum) break;
        if (currentRow.y - candidate.y > 14) break;
        if (!isNarrativeOnlyRow(candidate.items)) break;

        candidate.consumed = true;
        parts.unshift(rowText(candidate.items));
    }

    return parts;
};

const collectNextNarrative = (rows, index, currentRow) => {
    const parts = [];

    for (let next = index + 1; next < rows.length; next++) {
        const candidate = rows[next];
        if (candidate.consumed || candidate.pageNum !== currentRow.pageNum) break;
        if (currentRow.y - candidate.y > 18) break;
        if (!isNarrativeOnlyRow(candidate.items)) break;

        candidate.consumed = true;
        parts.push(rowText(candidate.items));
    }

    return parts;
};

const parseTransactions = (rows, summary) => {
    const transactions = [];
    let inTransactions = false;

    rows.forEach((row, index) => {
        if (row.consumed) return;

        if (isTableHeader(row.text)) {
            inTransactions = true;
            return;
        }

        if (!inTransactions || isFooterStart(row.text)) return;
        if (isSummaryRow(row.text)) return;

        const dates = row.items.filter(({ text }) => IS_DATE(text));
        if (dates.length === 0) return;

        const sameLineNarrative = textAt(row.items, 455);
        const narrative = compactNarrative([
            ...collectPreviousNarrative(rows, index, row),
            ...sameLineNarrative,
            ...collectNextNarrative(rows, index, row)
        ]);
        const balanceType = row.items.find(({ x, text }) => x >= 435 && x < 455 && IS_BALANCE_TYPE(text))?.text || '';

        const transaction = {
            tranDate: dates[0]?.text || '',
            valueDate: dates[1]?.text || '',
            refNo: normalizeText(textAt(row.items, 150, 225).join(' ')),
            withdrawals: amountAt(row.items, 225, 310),
            deposits: amountAt(row.items, 310, 390),
            balance: amountAt(row.items, 390, 435),
            balanceType,
            transactionNarrative: narrative
        };

        if (/^B\/F$/i.test(transaction.transactionNarrative)) {
            summary.openingBalance = transaction.balance;
            summary.openingBalanceType = transaction.balanceType;
        }

        transactions.push(transaction);
    });

    return transactions;
};

router.post('/im', upload.single('statement'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an I&M PDF statement.'
            });
        }

        const buffer = new Uint8Array(req.file.buffer);
        const { password } = req.body;
        const pdfDocument = await pdfjsLib.getDocument({
            data: buffer,
            password: password || '',
            standardFontDataUrl: path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/')
        }).promise;

        const rows = await extractRows(pdfDocument);
        const summary = extractMetadata(rows);
        const transactions = parseTransactions(rows, summary);

        res.json({
            success: true,
            bank: 'I&M Bank',
            summary,
            transactions,
            count: transactions.length
        });
    } catch (error) {
        console.error('I&M PDF parsing error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to parse PDF. Please ensure it is a valid I&M bank statement and the password is correct.'
        });
    }
});

export default router;
