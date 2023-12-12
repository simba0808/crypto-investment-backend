import mongoose from "mongoose";

const invoiceSchema = mongoose.Schema(
  {
    sub_partner_id: {
      type: String,
      required: true,
      unique : true,
    },
    invoice_id: {
      type: String,
      required: true,
      unique : true,
    }
  }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;