var posts=["2024/09/20/部分游戏的伪局域网联机/","2024/04/20/一篇没用的文章/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };