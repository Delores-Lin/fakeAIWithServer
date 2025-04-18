const pool = require('./db');

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 成功连接到数据库');
    connection.release();
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
  } finally {
    await pool.end();  // 关闭连接池（测试后关闭）
  }
}

testConnection();

