const PDFDocument = require('pdfkit');

const generatePaymentReceiptPDF = (payment, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Header
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('SOL CEMENT', 50, 50)
    .fontSize(10)
    .text('AMINU YAKUBU ENTERPRISE', 50, 75)
    .text('Construction Materials & Supplies', 50, 90)
    .moveDown();

  // Receipt Title
  doc
    .fontSize(16)
    .text('PAYMENT RECEIPT', 0, 50, { align: 'right' })
    .fontSize(10)
    .text(`Receipt #: ${payment.receiptNumber}`, 0, 75, { align: 'right' })
    .text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 0, 90, { align: 'right' })
    .moveDown();

  doc.moveTo(50, 115).lineTo(550, 115).stroke();

  // Bill To
  const customer = payment.customer;
  doc
    .fontSize(12)
    .text('BILL TO:', 50, 130)
    .fontSize(10)
    .text(customer.name, 50, 145)
    .text(customer.phone, 50, 160)
    if (customer.email) doc.text(customer.email, 50, 175);
    if (customer.address) {
      doc.text(customer.address.street || '', 50, 190);
      doc.text(`${customer.address.city || ''} ${customer.address.state || ''}`, 50, 205);
    }

  // Payment Details
  doc
    .fontSize(12)
    .text('PAYMENT DETAILS:', 300, 130)
    .fontSize(10)
    .text(`Amount Paid: GHC ${payment.amount.toLocaleString()}`, 300, 145)
    .text(`Payment Method: ${payment.paymentMethod.replace('_', ' ').toUpperCase()}`, 300, 160)
    .text(`Reference: ${payment.referenceNumber || 'N/A'}`, 300, 175)
    .moveDown();

  doc.moveTo(50, 230).lineTo(550, 230).stroke();

  // Table Header
  const tableTop = 250;
  doc
    .fontSize(10)
    .text('Invoice #', 50, tableTop)
    .text('Total Amount', 150, tableTop)
    .text('Amount Applied', 300, tableTop, { align: 'right' })
    .text('Remaining Balance', 450, tableTop, { align: 'right' });

  doc.moveTo(50, 265).lineTo(550, 265).stroke();

  // Table Content
  let currentY = 275;
  payment.appliedToSales.forEach((applied) => {
    const sale = applied.sale;
    doc
      .text(sale.invoiceNumber, 50, currentY)
      .text(`GHC ${sale.total.toLocaleString()}`, 150, currentY)
      .text(`GHC ${applied.amountApplied.toLocaleString()}`, 300, currentY, { align: 'right' })
      .text(`GHC ${(sale.total - sale.amountPaid).toLocaleString()}`, 450, currentY, { align: 'right' });

    currentY += 20;
  });

  // Footer
  const footerY = 700;
  doc
    .fontSize(10)
    .text('Thank you for your business!', 50, footerY, { align: 'center', width: 500 })
    .fontSize(8)
    .text('This is a computer generated receipt.', 50, footerY + 20, { align: 'center', width: 500 });

  doc.end();
};

module.exports = { generatePaymentReceiptPDF };
