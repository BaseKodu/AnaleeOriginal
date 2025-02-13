"""
Error monitoring and status dashboard routes
Handles display and tracking of system errors and AI service status
"""

import logging
from datetime import datetime, timedelta
from flask import render_template, current_app
from flask_login import login_required
from . import errors
from models import db
from ai_insights import FinancialInsightsGenerator

# Configure logging
logger = logging.getLogger(__name__)

@errors.route('/dashboard')
@login_required
def error_dashboard():
    """Display error monitoring dashboard with AI service status"""
    try:
        # Get AI service status
        ai_service = FinancialInsightsGenerator()
        ai_status = {
            'consecutive_failures': getattr(ai_service.service_status, 'consecutive_failures', 0),
            'error_count': getattr(ai_service.service_status, 'error_count', 0),
            'last_success': (ai_service.service_status.last_success.strftime('%Y-%m-%d %H:%M:%S') 
                           if hasattr(ai_service.service_status, 'last_success') and 
                           ai_service.service_status.last_success else None),
            'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        # Get recent errors from logs
        recent_errors = []
        try:
            if hasattr(ai_service.service_status, 'last_error'):
                error_data = ai_service.service_status.last_error
                if isinstance(error_data, dict):
                    recent_errors.append({
                        'timestamp': error_data.get('timestamp', datetime.now()).strftime('%Y-%m-%d %H:%M:%S'),
                        'type': error_data.get('error_type', 'Unknown Error'),
                        'message': error_data.get('message', 'No error message available')
                    })

            # Add OpenAI client initialization error if present
            if hasattr(ai_service, 'client_error'):
                recent_errors.append({
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'type': 'AI Service Initialization Error',
                    'message': str(ai_service.client_error)
                })
        except Exception as e:
            logger.error(f"Error retrieving error history: {str(e)}")
            recent_errors.append({
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'type': 'Error Log Access Error',
                'message': 'Unable to retrieve complete error history'
            })

        # Generate recommendations based on status
        recommendations = []
        failure_count = getattr(ai_service.service_status, 'consecutive_failures', 0)

        if failure_count > 3:
            recommendations.extend([
                "AI service experiencing multiple failures - verify API configuration",
                "Check system logs for detailed error messages",
                "Consider refreshing API credentials if issues persist"
            ])
        elif failure_count > 0:
            recommendations.append("Monitor AI service performance for continued issues")

        # Add OpenAI specific recommendations
        if any('OpenAI' in err.get('message', '') for err in recent_errors):
            recommendations.append("Verify OpenAI API configuration and credentials")

        # Calculate service health metrics
        total_ops = max(1, ai_status['error_count'] + (1 if ai_status['last_success'] else 0))
        success_rate = ((total_ops - ai_status['error_count']) / total_ops) * 100
        uptime = f"{success_rate:.1f}% success rate"

        return render_template('error_dashboard.html',
                             ai_status=ai_status,
                             recent_errors=recent_errors,
                             recommendations=recommendations,
                             uptime=uptime)

    except Exception as e:
        logger.error(f"Error loading error dashboard: {str(e)}")
        # Provide graceful fallback with basic error information
        return render_template('error_dashboard.html', 
                             error="Error loading dashboard data",
                             ai_status={'error_count': 0, 'consecutive_failures': 0},
                             recent_errors=[{
                                 'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                 'type': 'Dashboard Error',
                                 'message': str(e)
                             }],
                             recommendations=["System encountered an error, please try again later"],
                             uptime="Unknown")