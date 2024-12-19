import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', os.urandom(24).hex())
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TEMPLATES_AUTO_RELOAD = True
    PROTECT_PRODUCTION = True  # Global flag to prevent production modifications

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    ENV = 'production'
    PROTECT_PRODUCTION = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    
    # Enhanced production security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    PERMANENT_SESSION_LIFETIME = 1800  # 30 minutes
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Production-specific database settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'pool_timeout': 30,
        'pool_recycle': 300,
        'pool_pre_ping': True,
        'connect_args': {
            'sslmode': 'require',
            'connect_timeout': 10,
            'application_name': 'financial_app_prod'
        }
    }
    
    @classmethod
    def init_app(cls, app):
        """Production-specific initialization"""
        Config.init_app(app)
        
        # Prevent modifications in production
        if cls.PROTECT_PRODUCTION:
            app.config['PREVENT_MODIFICATIONS'] = True
            app.config['CHARTS_OF_ACCOUNTS_PROTECTED'] = True
    
    @classmethod
    def init_app(cls, app):
        """Production-specific initialization"""
        # Prevent modifications in production
        if cls.PROTECT_PRODUCTION:
            app.config['PREVENT_MODIFICATIONS'] = True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    ENV = 'development'
    # Use separate database URL for development
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL', os.environ.get('DATABASE_URL'))
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    
    # Protect production data in development
    PROTECT_PRODUCTION_DATA = True
    
    # Development-specific settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 2,
        'echo': True,
        'echo_pool': True,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 10
        }
    }

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL', 'sqlite:///test.db')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
