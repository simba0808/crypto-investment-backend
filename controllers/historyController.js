import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import History from '../models/historyModel.js';
import { getProgress } from './treeController.js';

const depositHistory = asyncHandler(async (req, res) =>{
    const historys = await History.find({method: 'deposit'}).sort({ createdAt: -1 });
    let depositHis = [];
    
    if (historys) {
     await Promise.all(
     historys.map(async(history) => {
        const user = await User.findOne({email : history.email});
        if(user) {
            const deposit = {
                username : user.username,
                email : user.email,
                avatar : user.avatar,
                balance : history.amount,
                date : history.createdAt.toISOString().substring(0, 10),
            };
            depositHis.push(deposit);
        }
     })
     );

      res.json({
        depositHis,
      });
    } else {
      res.status(404);
      throw new Error('History not found');
    }
});

const withdrawHistory = asyncHandler(async (req, res) =>{
    const historys = await History.find({method: 'withdraw', approved:true}).sort({ createdAt: -1 });
    let withdrawHis = [];
    
    if (historys) {
     await Promise.all(
     historys.map(async(history) => {
        const user = await User.findOne({email : history.email});
        if(user) {
            const withdraw = {
                username : user.username,
                email : user.email,
                avatar : user.avatar,
                balance : history.amount,
                date : history.createdAt.toISOString().substring(0, 10),
            };
            withdrawHis.push(withdraw);
        }
     })
     );

      res.json({
        withdrawHis,
      });
    } else {
      res.status(404);
      throw new Error('History not found');
    }
});

const showProgress = asyncHandler(async (req, res) => {

    const users = await User.find({ state: 2 }).select('-password').sort({ createdAt: 1 });
    let progressShow = [];

    if(users) {
        await Promise.all(
        users.map(async(user) => {
            const progress =await getProgress(user.email, user.cycle);
            if(user) {
                const progressElement = {
                    username : user.username,
                    email : user.email,
                    avatar : user.avatar,
                    progress : progress,
                };
                progressShow.push(progressElement);
            }
        })
        );
    
        if (progressShow) {
          res.json({
            progressShow,
          });
        } else {
          res.status(401);
          throw new Error('Database Error');
        }
    }

});

const showBalance = asyncHandler(async (req, res) => {

    const users = await User.find().select('-password');
    let balanceHis = [];

    if(users) {
        await Promise.all(
        users.map(async(user) => {
            if(user) {
                const requests = await History.find({ email : user.email, approved : false, method : 'withdraw'});
                if(requests) {
                    requests.map((request)=>{
                        const balanceElement = {
                            _id : request._id,
                            username : user.username,
                            email : user.email,
                            avatar : user.avatar,
                            balance : user.balance,
                            request : request.amount,
                        };
                        balanceHis.push(balanceElement);
                    });
                }
            }
        })
        );
    
        if (balanceHis) {
          res.json({
            balanceHis,
          });
        } else {
          res.status(401);
          throw new Error('Database Error');
        }
    }
});

export {
  depositHistory, withdrawHistory, showProgress, showBalance
};
