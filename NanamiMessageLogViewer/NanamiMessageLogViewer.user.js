// ==UserScript==
// @name        七海千言
// @namespace   Sobayu
// @description メッセージのやりとりを同じページ上に表示します。
// @include     http://www.sssloxia.jp/result/c/*.html
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @version     1.03
// @grant       none
// ==/UserScript==

//定期更新ゲーム「SevenSeas」の、メッセージのやり取りをさかのぼるリンクを追加するスクリプトです。

//　★　導　入　方　法　★
//FirefoxならGreasemonkeyというアドオン、
//Chrome/OperaならTampermonkeyというアドオンをインストールします。
//インストールしたら、ブラウザを再起動します。

//ブラウザで、このスクリプトを開きます。
//githubの画面の場合は、「Raw」というボタンを押せば、このスクリプトをインストールできますよ！
//そのあと、各七海のページを見てみましょう！

//v1.01 サーバーの負荷対策に2秒のインターバルを追加
//v1.02 7log様の結果を参照するようにした
//v1.03 ツール名を決定

(function($){

  //日付を取得
  var today = getToday();

  //自分のPNoを取得
  var MyPNo = getPNoFromURL(location.href);

  //次回取得までのInterval(ミリ秒)
  var nextLinkInterval = 1000;

  $("div.MessagePost").each(function(){

    //貰った側、送った側を判別
    var isSend = false;
    if ( $(this).text() == "からのメッセージ：" ){
      isSend = true;
    }
    var ankerTag = $(this).prev("a");
    //レスのPNoを取得
    var ankerPNo = getPNoFromURL(ankerTag.attr("href"));

    ankerTag.children("br").remove();
    //レスリンクを挿入
    if (isSend){
      //もらったメッセージ
      insertResLink(ankerTag,ankerPNo,MyPNo,"b",today-1);
    }else{
      //おくったメッセージ
      insertResLink(ankerTag,ankerPNo,MyPNo,"c",today);
      $(this).after("<br/><br/>");
    }
  });

  function getToday(){
    var todayTD = $("td.DAY");
    return todayTD.text().match( /\-DAY(\d+)\-/ )[1];
  }

  function getPNoFromURL(url){
    matchSSS = url.match( /(\d+).html(.*?)/ );
    if (matchSSS){
      return matchSSS[1];
    }else{
      return ""
    }
  }

  //リンクを挿入
  //特定の日のPNo Fromから、PNo Toへのメッセージを挿入
  function insertResLink(selector,pnoFrom,pnoTo,urlKey,day){
    //TODO　もうちょっと見た目をわかりやすくする
    // CSSにするか！
    var resHTML = "<div class='NMLV_open'><b><u>[＜＜]</u></b></div>"
    selector.before(resHTML);

    selector.prev("div.NMLV_open").css('cursor','pointer');
    selector.prev("div.NMLV_open").hover(
      function () {	$(this).css("color", "#F93");	},
	    function () {	$(this).css("color", "");	}
    )
    //レスクリック時
    selector.prev("div.NMLV_open").click(function(){
      //取得中のやつ
      $(this).before("<div class='NMLV_contents'>[取得中…]</div>");
      var loadingSelector = $(this).prev("div.NMLV_contents");

      //印を消す
      $(this).remove();

      //一つ前の日
      var nextDay = day-1
      var nextURLKey = "";
      if ( urlKey == "c" ){
        nextURLKey = "b";
      }else{
        nextURLKey = "b" + nextDay;
      }

      //メッセージ送信元の結果を取得
      var url = "http://www.sssloxia.jp/result/"+urlKey+"/"+pnoFrom+".html"
      if (urlKey != "c" && urlKey != "b" ){
        //前々回より前は7log様の結果を使わせてもらう
        url = "http://kuri.negi.biz/7log/result"+("0"+day).slice(-2)+"/result/c/"+pnoFrom+".html"
      }
      $.get( url, function(data,status){
        if (status == "success"){
          //該当メッセージを探し出す
          //複数該当する場合は複数持ってくる
          var foundFlg = false;
          $(data).find("div.MessagePost").each(function(){
            var ankerTag = $(this).prev("a");
            ankerTag.children("br").remove();
            var senderPNo = getPNoFromURL(ankerTag.attr("href"));
            if (senderPNo == pnoTo){
              ankerTag.attr("href", "http://www.sssloxia.jp/result/"+urlKey+"/"+senderPNo+".html");
              //loadingSelector.after( "<br/>" );
              var nextInsertAfterElement = loadingSelector;
              var nextDiv = $(this).next("div");
              for(var i = 0; i < 100; i++) {
                //div.Wordsを続く限り取得(Limitあり)
                //if ( nextDiv.attr("class") == "Words" || nextDiv.attr("name") == "BR" ){
                if ( nextDiv && nextDiv.attr("class") != "MessagePost"){
                  nextDivTmp = nextDiv.next("div");
                  nextInsertAfterElement.after(nextDiv);
                  nextInsertAfterElement = nextDiv;
                  nextDiv = nextDivTmp;
                }else{
                  break;
                }
              }
              loadingSelector.after( $(this) );
              loadingSelector.after( ankerTag );
              //loadingSelector.after( $(this).next("div.Words").html()  );
              ankerTag.before("<a href="+url+">[PNo"+pnoFrom+" DAY"+day+"]</a> ");
              foundFlg = true;
              return true;//eachのcontinue
            }
          });
          
          if (foundFlg == true){
            loadingSelector.text("[取得完了]");
            setTimeout(insertNextLink, nextLinkInterval);
          }else{
            loadingSelector.before("<a href="+url+">[PNo"+pnoFrom+" DAY"+day+"]</a> ");
            loadingSelector.text("[これ以上前のメッセージはありません]");
          }
          //ログ取得成功時の処理ここまで
        }else{
          loadingSelector.text("[取得に失敗しました]");
        }
      });

      function insertNextLink(){
        //更に前のメッセージのリンクを挿入する
        //TO FROMを逆転させて次へのリンクを用意
        insertResLink(loadingSelector,pnoTo,pnoFrom,nextURLKey,nextDay);
        loadingSelector.remove();
      }
    });
  }

}
)(jQuery);

//クロスドメイン通信をごまかすために使うやつ
//jquery.xdomainajax.jsから引用
//https://github.com/padolsey-archive/jquery.fn/tree/master/cross-domain-ajax
jQuery.ajax = (function(_ajax){
    
    var protocol = location.protocol,
        hostname = location.hostname,
        exRegex = RegExp(protocol + '//' + hostname),
        YQL = 'http' + (/^https/.test(protocol)?'s':'') + '://query.yahooapis.com/v1/public/yql?callback=?',
        query = 'select * from html where url="{URL}" and xpath="*"';
    
    function isExternal(url) {
        return !exRegex.test(url) && /:\/\//.test(url);
    }
    
    return function(o) {
        
        var url = o.url;
        
        if ( /get/i.test(o.type) && !/json/i.test(o.dataType) && isExternal(url) ) {
            
            // Manipulate options so that JSONP-x request is made to YQL
            
            o.url = YQL;
            o.dataType = 'json';
            
            o.data = {
                q: query.replace(
                    '{URL}',
                    url + (o.data ?
                        (/\?/.test(url) ? '&' : '?') + jQuery.param(o.data)
                    : '')
                ),
                format: 'xml'
            };
            
            // Since it's a JSONP request
            // complete === success
            if (!o.success && o.complete) {
                o.success = o.complete;
                delete o.complete;
            }
            
            o.success = (function(_success){
                return function(data) {
                    
                    if (_success) {
                        // Fake XHR callback.
                        // (この部分だけ改造した)
                        _success.call(this,  (data.results[0] || '')
                                // YQL screws with <script>s
                                // Get rid of them
                                .replace(/<script[^>]+?\/>|<script(.|\s)*?\/script>/gi, '')
                        , 'success');
                    }
                    
                };
            })(o.success);
            
        }
        
        return _ajax.apply(this, arguments);
        
    };
    
})(jQuery.ajax);