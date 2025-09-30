var posts=["_post/flash档案馆-软件推荐/","_post/keyboard/","_post/minecraft-pe/","_post/localsend-软件推荐/","_post/powershell安装appx/","_post/一篇没用的文章/","_post/意大利面拌42号混凝土/","_post/截图软件-软件推荐/","_post/手残联盟十周年/","_post/瞬译-软件推荐/","_post/赛博超能力/","_post/部分游戏的伪局域网联机/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };