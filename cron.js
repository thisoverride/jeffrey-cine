const run = require('./main')
const cron = require('cron');

cron.CronJob('0 6/2 * * *',()=> {
    run();
})
