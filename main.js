"use strict";
const puppeteer = require("puppeteer");
const fs = require('fs');
const bot = require('./botconfig.json');
const movieCompareUpdater = require('./controller/movieListUpdater');
const moment = require("moment/moment");
let movieLinksObj = {};
let isDisplayed = false;



const getMoviesListing = async (page) => {
  
  await page.waitForSelector(".gd-col-left");
  let contentPage = await page.$$('.gd-col-left >ul >li[class="hred"]'); //getting all <li> object with class hread

  let jsonify = '';
  for (const [index,item] of contentPage.entries()) { //extract title from <a> element in <li> 
    let containerTitle = await item.$(".meta-title-link");

    await page.waitForSelector('.buttons-holder')
    let containerLinks = await item.$(".buttons-holder");
    let link = await containerLinks.$eval('a',lnks => lnks.getAttribute('href')); // getting href link

    let movieTitle = await containerTitle.evaluate((el) => el.textContent);


    movieLinksObj[movieTitle] = link;

    jsonify += `"${movieTitle}",`;
  }

  return jsonify
};

const run  = async () => {
  let date = moment().format('DD/MM/YYYY HH:mm:ss')
  if(!isDisplayed) {
    console.info('      _       __  __                                           _               \r\n     | | ___ \/ _|\/ _|_ __ ___ _   _   _ __  _ __ ___ _ __ ___ (_) ___ _ __ ___ \r\n  _  | |\/ _ \\ |_| |_| \'__\/ _ \\ | | | | \'_ \\| \'__\/ _ \\ \'_ ` _ \\| |\/ _ \\ \'__\/ _ \\\r\n | |_| |  __\/  _|  _| | |  __\/ |_| | | |_) | | |  __\/ | | | | | |  __\/ | |  __\/\r\n  \\___\/ \\___|_| |_| |_|  \\___|\\__, | | .__\/|_|  \\___|_| |_| |_|_|\\___|_|  \\___|\r\n                              |___\/  |_|                                       ')
    isDisplayed = true;
  }

  if(!bot.botOption.isInit) console.info(`${date} - Initialisation en cours...`);
  const browser = await puppeteer.launch({ headless: bot.botOption.headless });
  const page = await browser.newPage();

  console.info("Lancement de la recherche");
  await page.goto(bot.botOption.targetUrl);

  if(!bot.botOption.headless){// remove banner cookies
    await page.waitForSelector(".jad_cmp_paywall_button-cookies");
    await page.click(".jad_cmp_paywall_button-cookies");
  }

  await page.waitForSelector(".pagination-item-holder");
  let pageLength = await page.evaluate(() => {
    return document.querySelector(".pagination-item-holder").children;
  });

  let pageMovie = Object.entries(pageLength);
  let jsonMovies ='{"movie":['

  for (let i = 1; i <= pageMovie.length; i++) { //Builling movieJson filling array title 
    console.info(`Récupération.. page ${i} sur ${pageMovie.length}`);
    if(i !== 1){await page.goto(`${(bot.botOption.targetUrl)}?page=${i}`)};
    jsonMovies += await getMoviesListing(page);
  }

  jsonMovies = jsonMovies.replace(/,+$/, "");
  jsonMovies += ']}';


  let result = bot.botOption.isInit ? JSON.parse(jsonMovies) : JSON.stringify(jsonMovies);


  if(!bot.botOption.isInit){
    //Create json file Movies.json
    fs.writeFile("movies.json", JSON.parse(result), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.info(`Récupération terminé`);
      console.info("Fichier créée");
    });

      //load botconfig.json for update init value
    fs.readFile('./botconfig.json', 'utf-8', (error, data) => {
      if (error) {
        console.error(error);
      } else {
        let botparam = JSON.parse(data);
        botparam.botOption.isInit  = true;

        // Modify JSON init value and saving
        fs.writeFile('./botconfig.json', JSON.stringify(botparam), error => {
          if (error) {
            console.error(error);
          }
          console.info(`${date} - Initialisation terminé`);
        });
      }
    });
    await browser.close();
  }
  await movieCompareUpdater(result, movieLinksObj);
  await browser.close();
  
}

module.exports = run;