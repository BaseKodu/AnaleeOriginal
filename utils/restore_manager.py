import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from .backup_manager import DatabaseBackupManager
from tests.rollback_verification import RollbackVerificationTest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def execute_verified_restore(app, days: int = 6, target_minute: int = 59, target_hour: int = 23) -> Dict[str, Any]:
    """
    Execute a verified restoration to N days ago with comprehensive testing
    
    Returns:
        Dictionary containing restoration results and verification status
    """
    try:
        # Initialize backup manager
        backup_manager = DatabaseBackupManager(app.config['SQLALCHEMY_DATABASE_URI'])
        
        # Calculate target timestamp
        target_date = datetime.now() - timedelta(days=days)
        target_timestamp = target_date.replace(
            hour=target_hour,
            minute=target_minute,
            second=59,
            microsecond=999999
        )
        
        logger.info(f"Starting verified restoration to {target_timestamp}")
        
        # Initialize verification suite
        verification = RollbackVerificationTest(app)
        
        # Execute restoration
        restore_success = backup_manager.restore_to_days_ago(days, target_minute, target_hour)
        if not restore_success:
            return {
                'status': 'error',
                'message': 'Restoration failed',
                'timestamp': datetime.now()
            }
            
        # Run verification suite
        verification_results = verification.run_all_verifications(target_timestamp)
        
        # Aggregate results
        success = all(result['success'] for result in verification_results.values())
        
        return {
            'status': 'success' if success else 'warning',
            'message': 'Restoration completed successfully' if success else 'Restoration completed with warnings',
            'timestamp': datetime.now(),
            'target_timestamp': target_timestamp,
            'verification_results': verification_results
        }
        
    except Exception as e:
        logger.error(f"Error during verified restoration: {str(e)}")
        return {
            'status': 'error',
            'message': f"Error during restoration: {str(e)}",
            'timestamp': datetime.now()
        }
