import cron from 'node-cron';

cron.schedule(
  '*/10 * * * *',
  async () => {
    console.log('Job sync scheduled but disabled - job-match-engine service not configured');
  }
);