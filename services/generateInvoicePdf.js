const PDFDocument = require("pdfkit");
const path = require("path");

const fontPath = path.join(__dirname, "../fonts/Ledger-Regular.ttf");

module.exports = function generateInvoicePdf({
    contact,
    delivery,
    cart,
    paymentMethod,
    total
}) {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.registerFont("Ledger", fontPath);
    doc.font("Ledger");

    doc.fontSize(20).text("Рахунок-фактура", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12);
    doc.text(`Замовник: ${contact.name || "-"}`);
    doc.text(`Телефон: ${contact.phone || "-"}`);
    doc.text(`Email: ${contact.email || "-"}`);
    doc.text(`Доставка: ${delivery.method || "-"} — ${delivery.address || "-"}`);
    doc.text(`Спосіб оплати: ${paymentMethod}`);
    doc.moveDown(2);

    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 300;
    const priceX = 370;
    const sumX = 435;
    const rowHeight = 25;
    const pageWidth = 595.28;

    const colWidths = {
        item: qtyX - itemX - 10,
        qty: priceX - qtyX - 10,
        price: sumX - priceX - 10,
        sum: pageWidth - 50 - sumX - 25
    };

    let rowHeights = [];
    let totalTableHeight = rowHeight;

    cart.forEach(item => {
        const nameHeight = doc.heightOfString(item.name, { width: colWidths.item });
        const qtyHeight = doc.heightOfString(item.quantity + "шт", { width: colWidths.qty });
        const priceHeight = doc.heightOfString(item.price.toFixed(2) + "грн", { width: colWidths.price });
        const sumHeight = doc.heightOfString(
            (item.price * item.quantity).toFixed(2) + "грн",
            { width: colWidths.sum }
        );

        const rowH = Math.max(nameHeight, qtyHeight, priceHeight, sumHeight) + 10;
        rowHeights.push(rowH);
        totalTableHeight += rowH;
    });

    const tableWidth = pageWidth - 2 * 60;
    doc.rect(itemX - 5, tableTop - 5, tableWidth, totalTableHeight + 5).stroke();

    [qtyX - 5, priceX - 5, sumX - 5].forEach(x => {
        doc.moveTo(x, tableTop - 5)
            .lineTo(x, tableTop - 5 + totalTableHeight + 5)
            .stroke();
    });

    doc.text("Товар", itemX, tableTop, { width: colWidths.item, underline: true });
    doc.text("К-сть", qtyX, tableTop, { width: colWidths.qty, align: "center", underline: true });
    doc.text("Ціна/шт.", priceX, tableTop, { width: colWidths.price, align: "center", underline: true });
    doc.text("Сума", sumX, tableTop, { width: colWidths.sum, align: "center", underline: true });

    let y = tableTop + rowHeight;
    cart.forEach((item, index) => {
        doc.text(item.name, itemX, y, { width: colWidths.item });
        doc.text(item.quantity + "шт", qtyX, y, { width: colWidths.qty, align: "center" });
        doc.text(item.price.toFixed(2) + "грн", priceX, y, { width: colWidths.price, align: "center" });
        doc.text(
            (item.price * item.quantity).toFixed(2) + "грн",
            sumX,
            y,
            { width: colWidths.sum, align: "center" }
        );

        y += rowHeights[index];

        if (index < cart.length - 1) {
            doc.moveTo(itemX - 5, y - 5)
                .lineTo(itemX - 5 + tableWidth, y - 5)
                .stroke();
        }
    });

    y += 20;
    doc.text("Разом:", priceX, y);
    doc.text(`${total.toFixed(2)}грн`, sumX, y, { align: "center" });

    return doc;
};
