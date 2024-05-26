import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Tree from '../models/userTree.js';
import History from '../models/historyModel.js';
import Invoice from '../models/invoiceModel.js';
import { showBalance } from './historyController.js';
import axios from 'axios';
import speakeasy from 'speakeasy';

const depositBalance = asyncHandler(async (req, res) => {
  const paymentId = req.body.payment_id;
  const user = await Invoice.findOne({payment_id: paymentId});

  if (user) {
    const history = await History.create(
      {
        email: email,
        amount: dAmount,
        method: 'deposit',
      }
    );

    if (history) console.log('Deposit history added');

    user.balance = user.balance + parseInt(dAmount);

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
    res.status(400).json({ message: "Factal Error! Please try again." });
  }
});

const withdrawBalance = asyncHandler(async (req, res) => {
  const { email, wAmount, address } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    // user.balance = user.balance - parseInt(wAmount);
    const reqHis = await History.find({ email: email, method: "withdraw", approved: false });
    console.log(reqHis);
    let sum = 0;

    for (let i = 0; i < reqHis.length; i++) {
      sum += reqHis[i].amount;
    }
    console.log("sum", sum);
    if (user.balance < (parseInt(wAmount) + sum)) {
      if (user.balance < (parseInt(wAmount))) {
        res.status(400).json({ message: "Insufficiant Balance!" });
      } else res.status(400).json({ message: "Your balance is in request!" });
    } else {
      try {
        const token = await getPayAuthToken();
        const sub2main_result = await withdraw_payment(token, user.sub_partner_id, wAmount);
        console.log(sub2main_result);
        const sub2main_wAmount = sub2main_result.result.amount;
        const payout_result = await generatePayout(address, sub2main_wAmount, token);
        console.log(payout_result);

        const verifyCode = speakeasy.totp({
          secret: process.env.PAYOUT_SECRET,
          encoding: 'base32',
        });

        const isVerified = await verifyPayout(payout_result.withdrawals.batch_withdrawal_id, verifyCode);

        if (!isVerified) throw new Error('Verification failed');
      } catch (error) {
        console.log(error);
        throw new Error(error.message);
      }
      
      const history = await History.create(
        {
          email: email,
          amount: wAmount,
          method: 'withdraw',
        }
      );
      if (history) console.log('Withdraw history added');

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
        state: user.state,
        sub_partner_id: user.sub_partner_id,
      });
    }

  } else {
    res.status(400).json({ message: "Factal Error! Please try again." });
  }
});

const approveBalance = asyncHandler(async (req, res) => {
  const { _id, email } = req.body;
  const history = await History.findById(_id);
  if (!history.approved) {
    history.approved = true;
    const updatedHistory = await history.save();
    if (updatedHistory) console.log('Balance Approved triggered!', updatedHistory.amount);
    const user = await User.findOne({ email: email });
    if (user) {
      user.balance = user.balance - updatedHistory.amount;
      const updatedUser = await user.save();
      if (updatedUser) {
        showBalance(req, res);
        console.log('Balance approved', updatedUser.balance);
      }
    } else {
      res.status(400).json({ message: "System Error! Can't find user." });
    }
  } else {
    res.status(400).json({ message: "Fund is already approved." });
  }

});

const getStarted = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    if (user.state != 2) {

      user.balance = user.balance - 100;
      user.state = 2;

      if (user.balance < 0) {
        res.status(400).json({ message: "Insufficiant Balance!" });
      } else {
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
        });

        // Add me as parent's node
        const inviter = await User.findOne({ mylink: user.referral_link });
        if (inviter) {
          const main = inviter.email;
          const me = user.email;
          const cycle = inviter.cycle;

          const node = await Tree.create({
            email: main,
            cycle: cycle,
            node: me,
          });
          if (node) console.log("Added successfully!");
        }
      }
    } else {
      res.status(400).json({ message: "You already started this cycle." });
    }

  } else {
    res.status(400).json({ message: "Factal Error! Please try again." });
  }

});

const getRewards = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {

    if (user.state == 3) {
      const child = await User.findOne({ referral_link: user.mylink });

      if (child) {
        user.referral_link = child.mylink;
      }

      if (user.state != 1) {

        user.state = 1;
        if (user.cycle == 1) {
          user.balance = user.balance + 250;
          user.cycle = 2;
        } else if (user.cycle == 2) {
          user.balance = user.balance + 275;
          User.cycle = 3;
        } else if (user.cycle == 3) {
          user.balance = user.balance + 300;
          user.state = 4;
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
        });

      }

    } else {
      res.status(400).json({ message: "You already are rewarded in other device! Refresh this page." });
    }
  } else {
    res.status(400).json({ message: "Can not find user!" });
  }

});

const getPayAuthToken = async () => {
  const authInfo = {
    email: process.env.NOWPAY_EMAIL,
    password: process.env.NOWPAY_PASSWORD
  };

  try {
    const response = await axios.post(process.env.NOWPAY_SERVER + "/auth", authInfo);
    const token = response.data.token;
    return token;
  } catch (err) {
    res.status(401);
    console.log(err)
    throw new Error('Payment auth Error.');
  };
}

const create_sub_partner = async (token, sub_name) => {

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  //axios.defaults.headers['x-api-key'] = process.env.NOWPAY_API_KEY;
  try {
    const response = await axios.post(process.env.NOWPAY_SERVER + '/sub-partner/balance', {
      name: sub_name
    });
    const sub_id = response.data.result.id;
    return sub_id;
  } catch (err) {
    console.log(err)
    throw new Error('Payment server error. Could not create sub-partner.');
  }
};

const generateInvoice = asyncHandler(async (req, res) => {
  const { email, dAmount } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const token = await getPayAuthToken();
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.headers['x-api-key'] = process.env.NOWPAY_API_KEY;

    const pay_info = {
      "currency": "usdtbsc",
      "amount": dAmount,
      "sub_partner_id": user.sub_partner_id,
      "ipn_callback_url": `http://${process.env.DEPLOY_URL}:3000/api/balance/payment-webhook`,
    };

    try {
      const response = await axios.post(process.env.NOWPAY_SERVER + '/sub-partner/payment', pay_info);
<<<<<<< HEAD
      console.log(response.data.result);
      const invoice = await Invoice.create({
        sub_partner_id: user.sub_partner_id,
        invoice_id: response.data.result.invoice_id,
      });

=======
>>>>>>> origin/main
      res.status(200).send(response.data.result);
    } catch (err) {
      console.log(err);
      throw new Error('Payment server error. Could not deposit from sub-partner.')
    }
  }
});

const generatePayout = async (address, wAmount, token) => {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  axios.defaults.headers['x-api-key'] = process.env.NOWPAY_API_KEY;

  const payout_info = {
    "ipn_callback_url": `http://${process.env.DEPLOY_URL}:3000/api/balance/payment-webhook`,
    "withdrawals": [
      {
        "address": address,
        "currency": "usdtbsc",
        "amount": wAmount,
      }
    ]
  };

  const response = await axios.post(process.env.NOWPAY_SERVER + '/payout', payout_info);
  return response.data;
};

const withdraw_payment = async (token, sub_id, withdraw_amount) => {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  axios.defaults.headers['x-api-key'] = process.env.NOWPAY_API_KEY;

  const res = await axios.get('https://api.nowpayments.io/v1/sub-partner/balance/' + sub_id);

  const with_info = {
    "currency": "usdtbsc",
    "amount": withdraw_amount,
    "sub_partner_id": sub_id,
  };

  try {
    const response = await axios.post(process.env.NOWPAY_SERVER + '/sub-partner/write-off', with_info);
    return response.data;
  } catch (err) {
    console.log(err);
    throw new Error('Payment server error. Could not withdraw to sub-partner.')
  }
}

const verifyPayout = async (batchId, code) => {
  axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.PAYOUT_TOKEN}`;
  axios.defaults.headers.common['x-api-key'] = process.env.PAYOUT_API_KEY;

  const response = await axios.post(process.env.PAYOUT_SERVER + '/' + batchId + '/verify', {
    "verificatoin_code": code,
  });

  if (res.data == 'OK') {
    return true;
  }
  return false;
};

const notificatePaymentResult = asyncHandler(async (req, res) => {
  console.log(">>>>>>>>>>>>Received<<<<<<<<<<<<<<<")
})

export {
  getRewards,
  getStarted,
  depositBalance,
  withdrawBalance,
  approveBalance,
  create_sub_partner,
  generateInvoice,
  notificatePaymentResult
};
