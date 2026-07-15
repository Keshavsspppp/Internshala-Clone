const InvoiceDelivery = require("../Model/InvoiceDelivery");
const { sendInvoiceEmail } = require("./mailer");

const deliverInvoice = async (queuedInvoice) => {
  let invoice = await InvoiceDelivery.findOneAndUpdate(
    { _id: queuedInvoice._id, status: "pending" },
    {
      $set: {
        status: "sending",
        // Lease recovery prevents a process crash from leaving an invoice stuck forever.
        nextAttemptAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    },
    { new: true }
  );
  if (!invoice) return queuedInvoice.status === "sent";

  try {
    const result = await sendInvoiceEmail(invoice);
    invoice.attempts += 1;
    if (result.delivered) {
      invoice.status = "sent";
      invoice.sentAt = new Date();
      invoice.lastError = "";
    } else {
      invoice.status = "pending";
      invoice.nextAttemptAt = new Date(Date.now() + Math.min(60, 2 ** invoice.attempts) * 60 * 1000);
      invoice.lastError = "Mail provider did not confirm delivery";
    }
    await invoice.save();
    return result.delivered;
  } catch (error) {
    invoice.attempts += 1;
    invoice.status = "pending";
    invoice.nextAttemptAt = new Date(Date.now() + Math.min(60, 2 ** invoice.attempts) * 60 * 1000);
    invoice.lastError = String(error.message || error).slice(0, 1000);
    await invoice.save();
    return false;
  }
};

const queueAndDeliverInvoice = async (details) => {
  const invoice = await InvoiceDelivery.findOneAndUpdate(
    { paymentId: details.paymentId },
    { $setOnInsert: { ...details, status: "pending", nextAttemptAt: new Date() } },
    { upsert: true, new: true }
  );
  if (invoice.status === "sent") return true;
  return deliverInvoice(invoice);
};

const processPendingInvoices = async () => {
  const now = new Date();
  await InvoiceDelivery.updateMany(
    { status: "sending", nextAttemptAt: { $lte: now } },
    { $set: { status: "pending" } }
  );
  const invoices = await InvoiceDelivery.find({
    status: "pending",
    nextAttemptAt: { $lte: now },
  }).limit(20);
  for (const invoice of invoices) await deliverInvoice(invoice);
};

const startInvoiceWorker = () => {
  const timer = setInterval(() => {
    processPendingInvoices().catch((error) => console.error("Invoice retry worker failed:", error));
  }, 60 * 1000);
  timer.unref?.();
};

module.exports = { queueAndDeliverInvoice, processPendingInvoices, startInvoiceWorker };
