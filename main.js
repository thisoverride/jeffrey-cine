"use strict";
const puppeteer = require("puppeteer");
const fs = require('fs');
const bot = require('./botconfig.json');
const movieCompareUpdater = require('./controller/movieListUpdater')


const getMoviesListing = async (page) => {
  
  await page.waitForSelector(".gd-col-left");
  let contentPage = await page.$$('.gd-col-left >ul >li[class="hred"]'); //getting all <li> object with class hread

  let jsonify = '';
  for (const [index,item] of contentPage.entries()) { //extract title from <a> element in <li> 
    let containerTitle = await item.$(".meta-title-link");
    let movieTitle = await containerTitle.evaluate((el) => el.textContent);
    jsonify += `"${movieTitle}",` 
  }

  return jsonify
};

(async () => {

  if(!bot.botOption.isInit) console.info('Initialisation en cours...');
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
  for (let i = 1; i <= pageMovie.length; i++) {
    console.info(`Lancement de la récupération.. page ${i} sur ${pageMovie.length}`);
    if(i !== 1){
      await page.goto(`${(bot.botOption.targetUrl)}?page=${i}`);
    }

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
          console.info('Initialisation terminé');
        });
      }
    });
    await browser.close();
  }
  await movieCompareUpdater(result);
  await browser.close();
  
})();
