        window.addEventListener('DOMContentLoaded', async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                showResult('error', '无效的验证链接');
                return;
            }

            try {
                const response = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`);
                const data = await response.json();

                if (data.success) {
                    showResult('success', '邮箱验证成功');
                    startRedirectTimer(3, '/');
                } else {
                    handleError(data.reason);
                }
            } catch (error) {
                showResult('error', '网络连接失败');
            }
        });

        function showResult(type, message) {
            document.body.innerHTML = `
                <div class="result ${type}">
                    <h2>${message}</h2>
                    <div id="countdown"></div>
                </div>
            `;
        }

        function startRedirectTimer(seconds, url) {
            let count = seconds;
            const timerEl = document.getElementById('countdown');
            
            const timer = setInterval(() => {
                timerEl.textContent = `${count}秒后自动跳转...`;
                if (count-- <= 0) {
                    clearInterval(timer);
                    window.location.href = url;
                }
            }, 1000);
        }

        function handleError(reason) {
            let message = '验证失败';
            switch(reason) {
                case 'invalid_token':
                    message = '验证链接无效';
                    break;
                case 'expired_token':
                    message = '链接已过期，请重新注册';
                    break;
                case 'already_verified':
                    message = '该邮箱已完成验证';
                    break;
            }
            showResult('error', message);
        }
