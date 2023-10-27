import mongoose from 'mongoose';

const historyModel = mongoose.Schema(
  {
    email: {
      type: String,
      default: "",
    },
    amount : {
      type: Number,
      default: 0,
    },
    method : {
      type: String,
      default: "",
    },
    date : {
      type : String,
      default : "",
    },
  },
  {
    timestamps: true,
  }
);


const History = mongoose.model('History', historyModel);

export default History;
