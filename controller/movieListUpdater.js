const fs = require("fs");
const util = require('util');
const sender = require('../sender');


const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const movieCompareUpdater = async (pResult) => {

  try {
    const data = await readFile("./movies.json", "utf-8");
    let dataMovie = JSON.parse(data);

    const oldMovieSet = new Set(dataMovie.movie); // old movie getting in jsonMovies
    const newMovieSet = new Set(pResult.movie); // new movie scrapped on the website

    const movieToAdd = [...newMovieSet].filter(x => !oldMovieSet.has(x));
    const movieToRemove = [...oldMovieSet].filter(x => !newMovieSet.has(x));


    movieToAdd.forEach(tempMovie => dataMovie.movie.push(tempMovie));
    movieToRemove.forEach(movie => {
      const index = dataMovie.movie.indexOf(movie);
      dataMovie.movie.splice(index, 1);
    });

    await writeFile('./movies.json', JSON.stringify(dataMovie)); //Update movie to jsonMovies
    if(!movieToAdd.length){console.info('Aucune mise à jour a effectuer'); return} 
    await sender(movieToAdd);
  } catch (error) {
    console.error(error);
  }

 
};

module.exports = movieCompareUpdater;
