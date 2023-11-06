import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Tree from '../models/userTree.js';
import History from '../models/historyModel.js'
import { showBalance } from './historyController.js';

const depositBalance = asyncHandler(async (req, res) =>{
  const { email, dAmount } = req.body;
  const user = await User.findOne({ email });

  if (user) {

    const history = await History.create(
      {
       email : email, 
       amount: dAmount,
       method: 'deposit',
      }
    );
    if(history) console.log('Deposit history added');

    user.balance = user.balance + parseInt(dAmount);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username : updatedUser.username,
      email: updatedUser.email,
      mylink : updatedUser.mylink,
      referral_link : updatedUser.referral_link,
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
    // user.balance = user.balance - parseInt(wAmount);
    const reqHis = await History.find({email:email, method:"withdraw", approved: false});
    console.log(reqHis);
    let sum = 0;

    for (let i = 0; i < reqHis.length; i++) {
      sum += reqHis[i].amount;
    }
    console.log("sum",sum);
    if(user.balance<(parseInt(wAmount)+sum)) {
      if(user.balance<(parseInt(wAmount))) {
      res.status(400).json({message:"Insufficiant Balance!"});
    } else res.status(400).json({message:"Your balance is in request!"});
    } else {

    const history = await History.create(
      {
        email : email, 
        amount: wAmount,
        method: 'withdraw',
      }
    );
    if(history) console.log('Withdraw history added');

    res.json({
      _id: user._id,
      username : user.username,
      email: user.email,
      mylink : user.mylink,
      referral_link : user.referral_link,
      balance : user.balance,
      role: user.role,
      avatar: user.avatar,
      cycle : user.cycle,
      state : user.state,
    });
  }
  } else {
    res.status(400).json({message:"Factal Error! Please try again."});
  }
});

const approveBalance = asyncHandler(async (req, res) =>{
  const { _id, email } = req.body;
  const history = await History.findById(_id);
  if(!history.approved) {
    history.approved = true;
    const updatedHistory = await history.save();
    if(updatedHistory) console.log('Balance Approved triggered!', updatedHistory.amount);
    const user = await User.findOne({email : email});
    if(user) {
      user.balance = user.balance - updatedHistory.amount;
      const updatedUser = await user.save();
      if(updatedUser) {
        showBalance(req, res);
        console.log('Balance approved', updatedUser.balance);    
      }
    } else {
      res.status(400).json({message:"System Error! Can't find user."});
    }
  } else {
     res.status(400).json({message:"Fund is already approved."});
  }

});

const getStarted = asyncHandler(async (req, res) =>{
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (user) {
    if(user.state!=2){
      
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
        referral_link : updatedUser.referral_link,
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
    }  else {
      res.status(400).json({message:"You already started this cycle."});
    }

  } else {
    res.status(400).json({message:"Factal Error! Please try again."});
  }

});

const getRewards = asyncHandler(async (req, res) =>{
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {

    if(user.state==3) {
    const child = await User.findOne({referral_link : user.mylink});

    if(child) {
      user.referral_link = child.mylink;
    }

    if(user.state!=1) {
      
          user.state = 1;
          if(user.cycle==1){
            user.balance = user.balance + 250;
            user.cycle = 2;
          } else if(user.cycle==2) {
            user.balance = user.balance + 275;
            User.cycle = 3;
          } else if(user.cycle==3) {
            user.balance = user.balance + 300;
            user.state = 4;
          }
      
          const updatedUser = await user.save();
      
          res.json({
            _id: updatedUser._id,
            username : updatedUser.username,
            email: updatedUser.email,
            mylink : updatedUser.mylink,
            referral_link : updatedUser.referral_link,
            balance : updatedUser.balance,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
            cycle : updatedUser.cycle,
            state : updatedUser.state,
          });

    }      

  }  else {
    res.status(400).json({message:"You already are rewarded in other device! Refresh this page."});
  }
 } else {
    res.status(400).json({message:"Can not find user!"});
  }

});

export {
  getRewards,
  getStarted,
  depositBalance,
  withdrawBalance,
  approveBalance,
};
