import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Tree from '../models/userTree.js';

const depositBalance = asyncHandler(async (req, res) =>{
  const { email, dAmount } = req.body;
  const user = await User.findOne({ email });
  console.log("Pay: "+email+" : "+dAmount);
  if (user) {
    user.balance = user.balance + parseInt(dAmount);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username : updatedUser.username,
      email: updatedUser.email,
      mylink : updatedUser.mylink,
      balance : updatedUser.balance,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      cycle : updatedUser.cycle,
      state : updatedUser.state,
    });

  } else {
    res.status(400).json({message:"Factal Error! Please try again."});
  }

});

const withdrawBalance = asyncHandler(async (req, res) =>{
  const { email, wAmount } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    user.balance = user.balance - parseInt(wAmount);

    if(user.balance<0) {
      res.status(400).json({message:"Insufficiant Balance!"});
    } else {
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username : updatedUser.username,
      email: updatedUser.email,
      mylink : updatedUser.mylink,
      balance : updatedUser.balance,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      cycle : updatedUser.cycle,
      state : updatedUser.state,
    });
  }
  } else {
    res.status(400).json({message:"Factal Error! Please try again."});
  }
});

const getStarted = asyncHandler(async (req, res) =>{
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (user) {
    user.balance = user.balance - 100;
    user.state = 2;

    if(user.balance<0) {
      res.status(400).json({message:"Insufficiant Balance!"});
    } else {
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username : updatedUser.username,
      email: updatedUser.email,
      mylink : updatedUser.mylink,
      balance : updatedUser.balance,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      cycle : updatedUser.cycle,
      state : updatedUser.state,
    });

    // Add me as parent's node
    const inviter = await User.findOne({mylink : user.referral_link});
    if(inviter) {
        const main = inviter.email;
        const me = user.email;
        const cycle = inviter.cycle;
    
        const node = await Tree.create({
          email : main,
          cycle : cycle,
          node : me,
        });
        if(node) console.log("Added successfully!");
    }
  }

  } else {
    res.status(400).json({message:"Factal Error! Please try again."});
  }

});

const getRewards = asyncHandler(async (req, res) =>{
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    if(user.cycle==1) user.balance = user.balance + 250;
    if(user.cycle==2) user.balance = user.balance + 275;
    
    user.state=1;
    user.cycle++;

    if(user.cycle==4) {
      user.balance = user.balance + 300;
      user.state = 4;
      user.cycle = 3;
    }

   if(user.balance<0) {
      res.status(400).json({message:"Insufficiant Balance!"});
    } else {
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username : updatedUser.username,
      email: updatedUser.email,
      mylink : updatedUser.mylink,
      balance : updatedUser.balance,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      cycle : updatedUser.cycle,
      state : updatedUser.state,
    });
  }

  } else {
    res.status(400).json({message:"Factal Error! Please try again."});
  }

});

export {
  getRewards,
  getStarted,
  depositBalance,
  withdrawBalance,
};
