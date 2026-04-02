// PM2 프로세스 설정 — .cjs 확장자 필수 (서버 패키지에 "type": "module" 있으므로)
module.exports = {
  apps: [{
    name: 'sutda',
    script: 'packages/server/dist/index.js',
    cwd: '/home/ubuntu/sutda',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
    },
    watch: false,
    max_memory_restart: '700M',
    restart_delay: 3000,
    error_file: '/home/ubuntu/logs/sutda-error.log',
    out_file: '/home/ubuntu/logs/sutda-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
