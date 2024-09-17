var posts=["2024/03/06/Steamtools/","2024/04/20/一篇没用的文章/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };