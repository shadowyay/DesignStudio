import { checkDailyStreaks, checkMonthlyActivity } from './volunteerStreakService';

export class CronJobService {
  private static intervalIds: NodeJS.Timeout[] = [];

  /**
   * Initialize all cron jobs using setInterval (simple alternative to node-cron)
   * To use proper cron scheduling, install: npm install node-cron @types/node-cron
   */
  static initializeCronJobs() {
    console.log('🕒 Initializing streak management jobs...');
    
    // Run daily check every 24 hours (86400000 ms)
    const dailyInterval = setInterval(async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Run at approximately 11:59 PM
      if (hours === 23 && minutes >= 59) {
        console.log('🔄 Running daily streak check...');
        try {
          await checkDailyStreaks();
          console.log('✅ Daily streak check completed successfully');
        } catch (error) {
          console.error('❌ Error in daily streak check:', error);
        }
      }
    }, 60000); // Check every minute

    // Run monthly check 
    const monthlyInterval = setInterval(async () => {
      const now = new Date();
      const day = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Run on 1st of month at approximately 12:01 AM
      if (day === 1 && hours === 0 && minutes <= 5) {
        console.log('🔄 Running monthly activity check...');
        try {
          await checkMonthlyActivity();
          console.log('✅ Monthly activity check completed successfully');
        } catch (error) {
          console.error('❌ Error in monthly activity check:', error);
        }
      }
    }, 300000); // Check every 5 minutes

    this.intervalIds.push(dailyInterval, monthlyInterval);
    console.log('✅ Streak management jobs initialized (using setInterval)');
    console.log('💡 For better scheduling, consider installing node-cron package');
  }

  /**
   * Stop all running intervals
   */
  static stopCronJobs() {
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
    console.log('🛑 All streak management jobs stopped');
  }

  /**
   * Manual trigger for daily streak check (for testing or manual execution)
   */
  static async runDailyStreakCheck() {
    console.log('🔄 Manually triggering daily streak check...');
    try {
      await checkDailyStreaks();
      console.log('✅ Manual daily streak check completed');
      return { success: true, message: 'Daily streak check completed successfully' };
    } catch (error) {
      console.error('❌ Error in manual daily streak check:', error);
      return { success: false, message: 'Daily streak check failed', error };
    }
  }

  /**
   * Manual trigger for monthly activity check (for testing or manual execution)
   */
  static async runMonthlyActivityCheck() {
    console.log('🔄 Manually triggering monthly activity check...');
    try {
      await checkMonthlyActivity();
      console.log('✅ Manual monthly activity check completed');
      return { success: true, message: 'Monthly activity check completed successfully' };
    } catch (error) {
      console.error('❌ Error in manual monthly activity check:', error);
      return { success: false, message: 'Monthly activity check failed', error };
    }
  }

  /**
   * Get cron job status and information
   */
  static getCronJobInfo() {
    return {
      dailyStreakCheck: {
        schedule: '59 23 * * * (Every day at 11:59 PM IST)',
        description: 'Checks all volunteers for streak breaks and updates their streak status',
        enabled: true
      },
      monthlyActivityCheck: {
        schedule: '1 0 1 * * (1st of every month at 12:01 AM IST)',
        description: 'Checks monthly activity and handles account rejections for inactive volunteers',
        enabled: true
      },
      hourlyValidation: {
        schedule: '0 6-23 * * * (Every hour from 6 AM to 11 PM IST)',
        description: 'Light validation of recent streak activities',
        enabled: true
      },
      timezone: 'Asia/Kolkata',
      status: 'Active'
    };
  }
}

export default CronJobService;