(function($) {
  var APP_ID = 'vUbVDkqX7D3l5nlGrMB2YNga-gzGzoHsz';
  var APP_KEY = 'hSeyI7bPX7rENUHyCzNDuyK8';

  var current_day = moment().add(-1, 'd').format('YYYYMMDD');
  var m = /day=(\d+)/.exec(window.location.search);
  if(m) {
    current_day = m[1];
  }
  AV.init({
    appId: APP_ID,
    appKey: APP_KEY,
  });

  today = moment(current_day);
  yesterday = moment(current_day).add(-1, 'd');
  tommorrow = moment(current_day).add(1, 'd');
  let yesterday_str =  yesterday.format('YYYYMMDD');
  let tommorrow_str =  tommorrow.format('YYYYMMDD');
  let q = new AV.Query('v2ex');
  q.greaterThanOrEqualTo('created', today.unix());
  q.lessThan('created', tommorrow.unix());
  q.descending('replies');

  const KEY_LEFT = 37;
  const KEY_UP = 38;
  const KEY_RIGHT = 39;
  const KEY_DOWN = 40;
  const KEY_J = 106;
  const KEY_K = 107;
  window.onload = () => {
    let current_day_e = document.getElementById("current_day");
    current_day_e.innerHTML = current_day;
    current_day_e.onclick = function(e) {
      let which_day = prompt("Which day to go?", yesterday_str);
      window.location = `${path}?day=${which_day}`;
    }
    let table = $('#content');
    q.find().then(function(results) {
      let posts = results;
      if (posts.length < 1) {
        alert(`${current_day}数据没有采集，请换一天浏览。`);
      } else {
        for (let p of posts) {
          p = p.attributes;
          table.append(`<tr><td>${p['replies']}</td><td><a href='${p.url}'>${p['title']}</a></td></tr`);
        }
      }

    }, function(error) {
      alert(JSON.stringify(error));
    });

    let path = window.location.pathname;
    $("#prev").attr('href', `${path}?day=${yesterday_str}`);
    $("#next").attr('href', `${path}?day=${tommorrow_str}`);

    document.addEventListener("keypress", (e) => {
	  switch (e.keyCode) {
	  case KEY_LEFT:
	  case KEY_J:
        window.location = `${path}?day=${yesterday_str}`;
	    break;
	  case KEY_RIGHT:
	  case KEY_K:
        window.location = `${path}?day=${tommorrow_str}`;
	    break;
      default:
        console.log(e);
	  }
    }, false);
  }
})(jQuery)
