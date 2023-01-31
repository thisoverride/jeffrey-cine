require('dotenv').config()
const nodemailer = require("nodemailer");
const bot = require("./botconfig.json");
const fs = require('fs')


const sender = async (pNewMovies) => {

  try {
    console.info('Préparation de l\'email..')
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GAMIL_PASSWORD,
      },
    });

    let pushAddress = "";
    //   for (let i = 0; i < targetList.length; i++) {
    //     pushAddress += targetList[i];
    //     pushAddress += i < targetList.length - 1 ? ',' : '';
    //   }
    let htmlTemplate = '';
    let emailGenerate = new Promise((resolve, reject) => {
        fs.readFile('./template/template.html', 'utf-8', (err, data) => {
            if (err) reject(err);
            let insert_pos = data.indexOf('%insert_movie%');
            let list_elements = '';
            
            for (const [index,item] of pNewMovies.entries()) {
                list_elements += `<li>${item}</li>`;
            }
            data = data.slice(0, insert_pos) + list_elements + data.slice(insert_pos + 15);
            htmlTemplate = data;
            resolve();
        });
    });
    
    emailGenerate.then(() => {
        transporter.sendMail({
          from: "jeffreyfulltasks@gmail.com",
          to: bot.botOption.receiptEmail,
          subject: "Jeffrey movie", 
          html: `${htmlTemplate}`
        });
    });
    console.info('Envoie de l\'email terminé.')

  } catch (err) {
    console.error(err);
  }
};

module.exports = sender;
