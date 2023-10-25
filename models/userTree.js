import mongoose from 'mongoose';

const userTree = mongoose.Schema(
  {
    email: {
      type: String,
      default: "",
    },
    cycle : {
      type: Number,
      default: 0,
    },
    node : {
      type: String,
      default: "",
    },
    num : {
      type : Number,
      default : 0,
    },
    active : {
      type : Boolean,
      default : false,
    },
  },
  {
    timestamps: true,
  }
);


const Tree = mongoose.model('Tree', userTree);

export default Tree;
