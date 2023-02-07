const run = require('./main')
const cron = require('cron');

cron.CronJob('0 0-6,7-23/2 * * *',()=> {
    run();
})