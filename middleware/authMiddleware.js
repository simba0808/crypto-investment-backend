import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import axios from 'axios';

const protect = asyncHandler(async (req, res, next) => {

  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select('-password');

      next();
      console.log("Token verified!", req.user.role);

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

const adminProtect = asyncHandler(async (req, res, next) => {

  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if(decoded.role!='admin'){
        res.status(401);
        throw new Error('Not Admin Authorized, Token failed!');
      } else {
          next();
          console.log("Token verified!", decoded.role);
      }

    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not Admin Authorized, Token failed!');
    }
  } else {
    res.status(401);
    throw new Error('Not Admin Authorized, No token!');
  }
});

const getPayAuthToken = asyncHandler(async (req, res, next) => {
    const authInfo = {
      email: process.env.NOWPAY_EMAIL,
      password: process.env.NOWPAY_PASSWORD
    };
    console.log(process.env.NOWPAY_SERVER+"/auth");
    try{
      const response = await axios.post(process.env.NOWPAY_SERVER+"/auth", authInfo);
      const token = response.data.token;
      res.locals.token = token;
      req.token = token;
      next();
    } catch (err) {
      res.status(401);
      console.log(err)
      throw new Error('Payment auth Error.');
    }
});

export { protect, adminProtect, getPayAuthToken };
