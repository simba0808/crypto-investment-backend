import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique : true,
    },
    email: {
      type: String,
      required: true,
      unique : true,
    },
    password: {
      type: String,
      required: true,
    },
    mylink: {
      type: String,
      required: true,
    },
    referral_link: {
      type: String,
      default: "",
    },
    balance : {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      required: true,
      default:"customer"
    },
    avatar: {
      type: String,
      default:"",
    },
    cycle: {
      type: Number,
      default: 1,
    },
    state: {
      type: Number,
      default: 1,
    }

    // googleId: {
    //   type:String,
    // },
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
