module.exports = {
  apps : [{
    name: 'TCPSERVER',
    script: './index.js',
    watch: false,
    instances: 1,
    autorestart: false,
    max_restarts:0,
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