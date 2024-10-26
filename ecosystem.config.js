module.exports = {
  apps : [{
    name: 'TCPPORT',
    script: './index.js',
    watch: true,
    instances: 'max',
    autorestart: true,
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      PORT: 3000
    },
    env_development: {
      DEBUG_MODE: 'true'
    }
  }]
};