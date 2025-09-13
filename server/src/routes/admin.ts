import express from 'express';
import { CronJobService } from '../services/cronJobService';

const router = express.Router();

// Manual trigger for daily streak check
router.post('/daily-check', async (req, res) => {
  try {
    const result = await CronJobService.runDailyStreakCheck();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run daily streak check', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual trigger for monthly activity check
router.post('/monthly-check', async (req, res) => {
  try {
    const result = await CronJobService.runMonthlyActivityCheck();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run monthly activity check', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get cron job information
router.get('/info', (req, res) => {
  try {
    const info = CronJobService.getCronJobInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get cron job info', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;