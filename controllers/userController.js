import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import History from '../models/historyModel.js';
import generateToken from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer'
import emailTemplate from '../utils/emailTemplate.js';
import forgotTemplate from '../utils/forgotTemplate.js';
import { create_sub_partner } from './balanceController.js';

import Grid from 'gridfs-stream';
import { GridFSBucket, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const mongoClient = new MongoClient(process.env.MONGO_URI);

let gfs;
const conn = mongoose.connection;

conn.once('open', function () {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('photos');
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(res, user._id, user.role);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      mylink: user.mylink,
      referral_link: user.referral_link,
      balance: user.balance,
      role: user.role,
      avatar: user.avatar,
      cycle: user.cycle,
      state: user.state
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

const checkAuth = asyncHandler(async (req, res) => {
  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userInfo = await User.findById(decoded.userId).select('-password');
      if (userInfo) {

        res.json({
          _id: userInfo._id,
          username: userInfo.username,
          email: userInfo.email,
          mylink: userInfo.mylink,
          referral_link: userInfo.referral_link,
          balance: userInfo.balance,
          role: userInfo.role,
          avatar: userInfo.avatar,
          cycle: userInfo.cycle,
          state: userInfo.state
        });

      } else {
        res.status(401);
        throw new Error('Not user founded, DB Error!');
      }

    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const allUsers = asyncHandler(async (req, res) => {

  const users = await User.find({ role: { $ne: 'admin' } }).select('-password');

  if (users) {
    res.json(users);
  } else {
    res.status(401);
    throw new Error('Database Error');
  }
});

const findUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const users = await User.find({ email: email }).select('-password');

  if (users) {
    res.json(users);
  } else {
    res.status(401);
    throw new Error('Database Error');
  }
});

const registerUser = asyncHandler(async (req, res) => {

  const { username, email, code, password, referral_link, mylink } = req.body;
  const sub_partner_id = await create_sub_partner(req.token, email.split('@')[0]);
  
  const userExists = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  console.log(process.env.VERIFICATION_CODE);
  if (code == process.env.VERIFICATION_CODE) {
    if (Date.now() - process.env.GENERATED_TIME < process.env.VALID_DURATION) {
      console.log("<><>   "+sub_partner_id)
      const user = await User.create({
        username,
        email,
        password,
        mylink,
        referral_link,
        sub_partner_id,
      });
      if (user) {
        generateToken(res, user._id, user.role);
        res.status(201).json({
          _id: user._id,
          email: user.email,
          role: user.role,
          message: "Successfully Created.",
        });
      } else {
        res.status(400);
        throw new Error('Invalid user data');
      }
    } else {
      res.status(400);
      throw new Error('Verification code is expired.');
    }
  } else {
    res.status(400);
    throw new Error('Verification code is incorrect.');
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { forgot_email, forgot_code, forgot_password } = req.body;
  const email = forgot_email;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error('User does not exist');
    return;
  }

  if (forgot_code == process.env.FORGOT_CODE) {
    if ((Date.now() - process.env.GENERATED_TIME) < process.env.VALID_DURATION) {

      user.password = forgot_password
      const updatedUser = await user.save();

      if (updatedUser) {
        res.status(201).json({ message: "Password Changed Successfully!" });
      } else {
        res.status(400);
        throw new Error('Invalid user data');
      }
    } else {
      res.status(400);
      throw new Error('Reset code is expired.');
    }
  } else {
    res.status(400);
    throw new Error('Verification code is incorrect.');
  }

});

const mailHandler = async (req, res) => {
  const { email } = req.body;
  const userExists = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });


  if (userExists) {
    res.status(400).json({ message: "User already exists." })
  } else {

    const transporter = nodemailer.createTransport({

      host: 'smtp.gmail.com',
      port: 465,
      type: "SMTP",
      secure: true, // true for 465, false for other ports
      requireTLS: true,
      auth: {
        user: 'profitteamcad@gmail.com', // your email address
        pass: 'vojhaizydjtqdahe' // your email password
      },
      service: 'gmail'
    })
    console.log('Up to ready sending email');
    process.env.VERIFICATION_CODE = Math.floor(100000 + Math.random() * 900000);
    process.env.GENERATED_TIME = Date.now();

    console.log(process.env.VERIFICATION_CODE);

    const mailOptions = {
      from: 'profitteamcad@gmail.com',
      to: email,
      subject: `Your verification code is ${process.env.VERIFICATION_CODE}`,
      text: "code",
      html: emailTemplate(email),
    }

    //  await transporter.sendMail(mailOptions,(err,info)=>{
    //     if(err){
    //        console.log(err)
    //        res.status(500).json({success:false,message:"Internal Server Error"})
    //     }else{
    //        console.log('Email send sucessfully!!!!!!!', process.env.VERIFICATION_CODE);
    //        res.status(200).json({success:true,message:"Email sent successfully"})
    //     }
    //  });

    res.status(200).json({ message: 'sent' });

  }

};
const remailHandler = async (req, res) => {
  const { forgot_email } = req.body;
  const email = forgot_email;
  const userExists = await User.findOne({ email });
  console.log(forgot_email);
  if (userExists) {

    // const transporter=nodemailer.createTransport({
    //     //host: 'smtp.gmail.com',
    //     port: 587,
    //     secure: false, // true for 465, false for other ports
    //     auth: {
    //        user: 'profitteamcad@gmail.com', // your email address
    //        pass: 'vojhaizydjtqdahe' // your email password
    //     },
    //     //tls: {rejectUnauthorized: false},
    //     service:'gmail'
    //  })

    process.env.FORGOT_CODE = Math.floor(100000 + Math.random() * 900000);
    process.env.GENERATED_TIME = Date.now();
    res.status(200).json({ message: 'sent' });
    console.log(process.env.FORGOT_CODE);

    //  const mailOptions={

    //     from:'profitteamcad@gmail.com',
    //     to:email,
    //     subject:`Your verification code is ${process.env.FORGOT_CODE}`,
    //     text:"code",
    //     html:forgotTemplate(email),

    //  }
    //  await transporter.sendMail(mailOptions,(err,info)=>{
    //     if(err){
    //        console.log(err)
    //        res.status(500).json({success:false,message:"Internal Server Error"})
    //     }else{
    //        res.status(200).json({success:true,message:"Email sent successfully"})
    //     }
    //  });

  } else {
    res.status(400).json({ message: "User doesn't exist." });
  }
};
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out' });
};

const updateUserProfile = asyncHandler(async (req, res) => {

  const user = await User.findById(req.user._id);
  const referral_link = req.body.referral_link;
  console.log(referral_link)
  if (referral_link !== undefined && referral_link !== '') {
    console.log("enter")
    const referral_user = await User.findOne({ mylink: referral_link });
    if (!referral_user && referral_link) {
      res.status(404);
      throw new Error('Invalid Referral Link');
    } else if (referral_user.referral_link == user.mylink && referral_link) {
      res.status(404);
      throw new Error('Can not add your child user');
    }
  }
  if (user) {
    user.username = req.body.username || user.username;
    user.avatar = req.body.avatar || user.avatar;
    user.referral_link = req.body.referral_link || user.referral_link || "";

    if (req.body.password) {
      if (await user.matchPassword(req.body.password)) {
        user.password = req.body.newPassword;
      } else {
        res.status(404);
        throw new Error('Password is incorrect.');
      }
    }

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      mylink: updatedUser.mylink,
      referral_link: updatedUser.referral_link,
      balance: updatedUser.balance,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      cycle: updatedUser.cycle,
      state: updatedUser.state,
      sub_partner_id: updatedUser.sub_partner_id,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const updateAdminUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.avatar = req.body.avatar || user.avatar;
    user.referral_link = req.body.referral_link || user.referral_link;
    if (req.body.newPassword) user.password = req.body.newPassword;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      mylink: updatedUser.mylink,
      referral_link: updatedUser.referral_link,
      balance: updatedUser.balance,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      cycle: updatedUser.cycle,
      state: updatedUser.state
    });

  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const upState = asyncHandler(async (req, res) => {

  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    user.state = 3;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      mylink: updatedUser.mylink,
      referral_link: updatedUser.referral_link,
      balance: updatedUser.balance,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      cycle: updatedUser.cycle,
      state: updatedUser.state
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const getDashboardInfo = asyncHandler(async (req, res) => {

  let deposit = 0;
  let withdraw = 0;
  let balance = 0;
  let balanceInCycle = 0;
  let usersInCycle = 0;
  let totalUsers = 0;
  let investedUsers = 0;
  let rewardedUsers = 0;

  const historyDeposit = await History.find({ method: 'deposit' });
  if (historyDeposit) {
    historyDeposit.map((historyElement) => {
      deposit += historyElement.amount;
    });
  }

  const withdrawDeposit = await History.find({ method: 'withdraw', approved: true });
  if (withdrawDeposit) {
    withdrawDeposit.map((withdrawElement) => {
      withdraw += withdrawElement.amount;
    });
  }

  balance = deposit - withdraw;

  usersInCycle = await User.countDocuments({ state: 2 });
  if (usersInCycle) balanceInCycle = usersInCycle * 100;

  totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

  investedUsers = await User.countDocuments({ $or: [{ cycle: { $gt: 1 } }, { state: { $gt: 1 } }] });
  rewardedUsers = await User.countDocuments({ $or: [{ cycle: { $gt: 1 } }, { state: { $gt: 2 } }] });

  console.log(deposit, withdraw, balance, balanceInCycle, usersInCycle);
  res.json({
    deposit: deposit,
    withdraw: withdraw,
    balance: balance,
    balanceInCycle: balanceInCycle,
    usersInCycle: usersInCycle,
    totalUsers: totalUsers,
    investedUsers: investedUsers,
    rewardedUsers: rewardedUsers,
  });

});

const deleteUser = asyncHandler(async (req, res) => {
  const _id = req.params.id;
  console.log(_id);
  try {
    const deletedUser = await User.findByIdAndDelete(_id);
    if (deletedUser) {
      const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
      if (users) {
        res.json(users);
      } else {
        res.status(401);
        throw new Error('Database Error');
      }
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (req.file === undefined) {
    return res.send('you must select a file.');
  }
  // if(req.body.currentAvatar != '' && req.body.currentAvatar != undefined) {
  //   console.log(req.body.currentAvatar)
  //   deleteAvatar(req.body.currentAvatar);
  // }
  res.send({
    message: "uploaded",
    id: req.file.id,
    name: req.file.name,
    contentType: req.file.contentType,
  })
});

const deleteAvatar = asyncHandler(async (avatarId) => {
  await mongoClient.connect();

  const database = mongoClient.db('crypto_investment');
  const imageBucket = new GridFSBucket(database, { bucketName: "photos" });
  await imageBucket.delete(new ObjectId(avatarId));
});

const getAvatar = asyncHandler(async (req, res) => {

  try {
    await mongoClient.connect();

    const database = mongoClient.db('crypto_investment');
    const imageBucket = new GridFSBucket(database, { bucketName: "photos" });

    let downloadStream = imageBucket.openDownloadStream(new ObjectId(req.params.filename));

    downloadStream.on('data', (data) => {
      let buffer = new Buffer(data).toString('base64');
      return res.status(200).write(buffer.toString());
    })
    downloadStream.on('error', (data) => {
      return res.status(404).send({ error: "Not found" })
    })
    downloadStream.on('end', () => {
      return res.end()
    });
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: "Error Something went wrong",
      err,
    })
  }
  /*const filename = req.params.filename;
  try{
    const files = await gfs.files.find().toArray();
    files.map((file) => {
      if(file._id.toString() == filename) {
        console.log(file);
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', 'inline; filename=' + file.filename);
        console.log('kl')
        const read_stream = gfs.createReadStream({_id: file._id});
        read_stream.on('error', function (err) {
          console.log('An error occurred!', err);
          throw err;
        })
        console.log(read_stream);
        read_stream.pipe(res);
      }
      
    })

    //const file = files.filter((file) => file._id === `new ObjectId("${filename}")`);
    //console.log(file)
    res.json('Not found');
  }catch (err) {
    res.json({err});
  }*/
});

export {
  checkAuth,
  authUser,
  allUsers,
  registerUser,
  changePassword,
  logoutUser,
  mailHandler,
  remailHandler,
  updateUserProfile,
  updateAdminUserProfile,
  upState,
  getDashboardInfo,
  deleteUser,
  findUser,
  uploadAvatar,
  getAvatar,
};
