module.exports = {
  apps: [
    {
      name: 'HTTP7008',
      script: 'npm.cmd',
      args: 'run start',
      watch: true,
      ignore_watch: ['node_modules'],
    },
  ],
};