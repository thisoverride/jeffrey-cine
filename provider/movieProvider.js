const getMoviesListing = async (pPage) => {
  
    await pPage.waitForSelector(".gd-col-left");
    let contentPage = await pPage.$$('.gd-col-left >ul >li[class="hred"]');
  
    let jsonify = '';
    for (const [index,item] of contentPage.entries()) {
      let containerTitle = await item.$(".meta-title-link");
      let movieTitle = await containerTitle.evaluate((el) => el.textContent);
      jsonify += `"${movieTitle}",` 
    }
  
    return jsonify
  };

  module.exports = getMoviesListing;