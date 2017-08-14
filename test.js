const axios = require('axios');
const uuid = require('uuid/v4');
const nodemailer = require ('nodemailer');
require('dotenv').config();

const transpoter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASS,
  }
});

let toAddress = '';

const headers = {
  "X-Mashape-Key": process.env.MASHAPE_API_KEY,
  "Accept": "application/json",  
}

process.on('unhandledRejection', (e) => {
  throw e;
});

axios.get('https://privatix-temp-mail-v1.p.mashape.com/request/domains/', {
  headers: headers
})
  .then((res) => {
    const domain = res.data[0];
    toAddress = uuid() + domain;
    console.log(toAddress);
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: toAddress,
      subject: 'Test mail',
      text: 'test mail',
    };
    return transpoter.sendMail(mailOptions);
  })
  .then((res) => {
    return new Promise((resolve, reject) => {
      const md5hash = require('crypto').createHash('md5');
      md5hash.update(toAddress);
      const hash = md5hash.digest('hex');

      console.log(hash);
      function loop(n) {
        if (n > 8) {
          reject('time out!!!');
        }
        console.log(n);
        setTimeout(() => {
          axios.get(`https://privatix-temp-mail-v1.p.mashape.com/request/mail/id/${hash}/`, {
            headers: headers
          })
            .then((res) => {
              console.log(res.data);
              resolve()
            })
            .catch((reason) => {
              if (reason.response.status == 404) {
                console.log(reason.response.data);
                loop(n + 1);
              } else {
                reject(reason);
              }
            });
        }, 1000 * (2 ** n));
      }

      loop(1);
    }
  )})
  .catch((reason) => {
    throw reason;
  });
