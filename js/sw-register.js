// Service Worker 注册脚本
// 在页面加载后注册 Service Worker

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('[SW] 注册成功:', registration.scope);

                // 检查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[SW] 新版本可用');
                        }
                    });
                });
            })
            .catch(err => {
                console.log('[SW] 注册失败:', err);
            });
    });
}
