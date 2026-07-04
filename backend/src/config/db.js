require('dotenv').config();

module.exports = {

  "development": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT || 5432, 
    "dialect": "postgres",
    "dialectOptions": process.env.DB_SSL === 'true' ? {                    
      "ssl": {
        "require": true,
        "rejectUnauthorized": process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      }
    } : {},
    logging: false,
    pool: {
      max: 15,
      min: 5,
      acquire: 5000,
      idle: 10000
    }
  },

  "production": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT || 5432,  
    "dialect": "postgres",
    "dialectOptions": process.env.DB_SSL === 'true' ? {                    
      "ssl": {
        "require": true,
        "rejectUnauthorized": process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      }
    } : {},
    logging: false,
    pool: {
      max: 30,
      min: 5,
      acquire: 5000,
      idle: 10000
    }
  },

  "test": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT || 5432, 
    "dialect": "postgres",
    "dialectOptions": process.env.DB_SSL === 'true' ? {                    
      "ssl": {
        "require": true,
        "rejectUnauthorized": process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      }
    } : {},
    logging: false,
    pool: {
      max: 15,
      min: 5,
      acquire: 5000,
      idle: 10000
    }
  }

}