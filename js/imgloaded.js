// 首页头图加载优化 - 性能优化版
/**
 * 实现图片渐进加载效果
 * 优化：先加载小图，完成后再加载大图，避免同时加载导致卡顿
 */
class ProgressiveLoad {
  constructor(smallSrc, largeSrc) {
    this.smallSrc = smallSrc;
    this.largeSrc = largeSrc;
    this.initTpl();
  }
  // 生成UI模板
  initTpl() {
    this.container = document.createElement('div');
    this.smallStage = document.createElement('div');
    this.largeStage = document.createElement('div');
    this.smallImg = new Image();
    this.largeImg = new Image();
    this.container.className = 'pl-container';
    this.smallStage.className = 'pl-img pl-blur';
    this.largeStage.className = 'pl-img';
    this.container.appendChild(this.smallStage);
    this.container.appendChild(this.largeStage);
    this.smallImg.onload = this._onSmallLoaded.bind(this);
    this.largeImg.onload = this._onLargeLoaded.bind(this);
  }
  // 开始加载图片 - 优化：先加载小图
  progressiveLoad() {
    this.smallImg.src = this.smallSrc;
    // 不再同时加载大图，改为小图加载完成后再加载
  }
  // 大图加载完成
  _onLargeLoaded() {
    // 使用 requestAnimationFrame 确保在下一帧渲染，避免卡顿
    requestAnimationFrame(() => {
      this.largeStage.classList.add('pl-visible');
      this.largeStage.style.backgroundImage = `url('${this.largeSrc}')`;
      // 大图显示后，移除小图的模糊效果
      this.smallStage.classList.remove('pl-blur');
    });
  }
  // 小图加载完成
  _onSmallLoaded() {
    requestAnimationFrame(() => {
      this.smallStage.classList.add('pl-visible');
      this.smallStage.style.backgroundImage = `url('${this.smallSrc}')`;
      // 小图加载完成后，延迟加载大图，避免同时渲染
      setTimeout(() => {
        this.largeImg.src = this.largeSrc;
      }, 100);
    });
  }
}

const executeLoad = (config, target) => {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const loader = new ProgressiveLoad(
    isMobile ? config.mobileSmallSrc : config.smallSrc,
    isMobile ? config.mobileLargeSrc : config.largeSrc
  );
  if (target.children[0]) {
    target.insertBefore(loader.container, target.children[0]);
  }
  loader.progressiveLoad();
};

const config = {
  smallSrc: 'https://b.bdstatic.com/comment/0Tp_dmFwRxVpAUBy8sln4g9f72ca3324f5ef808265fea8ebac0ed7.png',       // 小图（建议小于100k）
  largeSrc: 'https://b.bdstatic.com/comment/0Tp_dmFwRxVpAUBy8sln4g5e2830f2e8704018b947b09b108016d7.png',           // 大图
  mobileSmallSrc: 'https://b.bdstatic.com/comment/0Tp_dmFwRxVpAUBy8sln4g9f72ca3324f5ef808265fea8ebac0ed7.png',   // 手机端小图
  mobileLargeSrc: 'https://b.bdstatic.com/comment/0Tp_dmFwRxVpAUBy8sln4g5e2830f2e8704018b947b09b108016d7.png',   // 手机端大图
  enableRoutes: ['/'],
};

function initProgressiveLoad(config) {
  const target = document.getElementById('page-header');
  if (target && target.classList.contains('full_page')) {
    executeLoad(config, target);
  }
}

document.addEventListener("DOMContentLoaded", function() {
  initProgressiveLoad(config);
});
document.addEventListener("pjax:complete", function() {
  initProgressiveLoad(config);
});
