const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.yeah.net',
  port: 465, // 必须使用 SSL 端口
  secure: true, // 强制 TLS
  auth: {
    user: process.env.YEAH_EMAIL, // yeah.net 完整邮箱
    pass: process.env.YEAH_PASSWORD // 密码或授权码
  },
  tls: {
    rejectUnauthorized: false // 解决自签名证书问题（测试环境用）
  }
});
transporter.verify((error) => {
  if (error) {
    console.error('SMTP连接失败:', error);
  } else {
    console.log('SMTP连接成功');
  }
});

module.exports = transporter;
