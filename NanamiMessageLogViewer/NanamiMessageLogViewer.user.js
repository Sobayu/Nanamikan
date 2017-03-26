// ==UserScript==
// @name        七海千言
// @namespace   Sobayu
// @description メッセージのやりとりを同じページ上に表示します。
// @include     http://www.sssloxia.jp/result/c/*.html
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @version     1.1
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
//v1.1
//・ドロップダウンリストを追加したので、当日以外のメッセージも直接閲覧可能になりました　→過去から順番に閲覧することも可能
//・自分・相手両方のメッセージを取得するようにした　→互いにメッセージを送り合っている場合にも対応

(function($){

  //日付を取得
  var today = getToday();

  //自分のPNoを取得
  var MyPNo = getPNoFromURL(location.href);

  //次回取得までのInterval(ミリ秒)
  const nextLinkInterval = 1000;

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
      insertResLinkBar(ankerTag,ankerPNo,MyPNo,today-1,false);
    }else{
      //おくったメッセージ
      insertResLinkBar(ankerTag,ankerPNo,MyPNo,today,false);
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

  function getURL(day,pno){
    return day == today ? ("http://www.sssloxia.jp/result/c/"+pno+".html") : 
             ( (day == today-1) ? ("http://www.sssloxia.jp/result/b/"+pno+".html") :
              ("http://kuri.negi.biz/7log/result"+("0"+day).slice(-2)+"/result/c/"+pno+".html") );
  }

  //ResLinkの集合体
  function insertResLinkBar(selector,pnoFrom,pnoTo,day){

    selector.before("<div class='NMLV_openBar'></div>");
    var openBar = selector.prev("div.NMLV_openBar")

    var resHTML = "<span class='NMLV_open'><b><u>[＜＜]</u></b></span>"
    insertResLink(openBar,resHTML,pnoFrom,pnoTo,day);
    
    var selHTML = "　<select class='NMLV_daySelect'><option value=0>---</option>"
    var selectedText="";
    for (var iDay=1;iDay<=today;iDay++){
      if (iDay == day){
        selectedText = " selected";
      }else{
        selectedText = "";
      }
      selHTML += "<option value="+iDay+selectedText+">DAY"+iDay+"</option>";
    }
    selHTML+="</select>"

    openBar.append(selHTML);
  }


  //リンクを挿入
  //特定の日のPNo Fromから、PNo Toへのメッセージを挿入
  function insertResLink(openBar,htmlText,pnoFrom,pnoTo,day,bUpstream){
    openBar.append(htmlText);
    var resLink = openBar.children("span.NMLV_open:last");
    resLink.css('cursor','pointer');
    resLink.hover(
      function () {	$(this).css("color", "#F93");	},
      function () {	$(this).css("color", "");	}
    )
    //レスクリック時
    resLink.click(function(){
      //Selectで選択された日を取得
      var selectedDay = $(this).next("select.NMLV_daySelect").val();
      if ( selectedDay == "0"){
        retrun;
      }

      //取得中のやつ
      $(this).parent().before("<div class='NMLV_contents'>[取得中…]</div>");
      var loadingSelector = $(this).parent().prev("div.NMLV_contents");

      //印を消す
      $(this).parent().remove();

      //一つ前の日
      var nextDay = Number(selectedDay)-1;
      //次の日を見たいとき
      var bUpstreamNext = bUpstream;
      if ( Number(selectedDay) > day){
        bUpstreamNext = true;
      }
      if ( Number(selectedDay) < day){
        bUpstreamNext = false;
      }
      if (bUpstreamNext){
        nextDay = Number(selectedDay)+1;
      }

      day = Number(selectedDay);

      //メッセージ送信元の結果を取得
      var url = getURL(day, pnoFrom);
      $.get( url, function(data,status){
        if (status == "success"){
          //該当メッセージを探し出す
          //複数該当する場合は複数持ってくる
          var foundFlg = false;
          $(data).find("div.MessagePost").each(function(){
            var sendingText = $(this).text();
            if ( sendingText.includes("にメッセージを送った。")  ){
              return true;//eachのcontinue
            }
            var ankerTag = $(this).prev("a");
            ankerTag.children("br").remove();
            var senderPNo = getPNoFromURL(ankerTag.attr("href"));
            if (senderPNo == pnoTo){
              ankerTag.attr("href", getURL(day,senderPNo) );
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
              
              foundFlg = true;
              return true;//eachのcontinue
            }
          });

          //FromとToが異なるならば、逆側も取得する。
          if (pnoFrom != pnoTo){
            //関数化がセオリーだが微妙に違って面倒なので同じ処理を二回書きます（たいてい後で後悔するパターンです　良い子はマネしないように）
            var url2 = getURL(day, pnoTo);
            $.get( url2, function(data,status){
              if (status == "success"){
                //該当メッセージを探し出す
                //複数該当する場合は複数持ってくる
                $(data).find("div.MessagePost").each(function(){
                  var sendingText = $(this).text();
                  if ( sendingText.includes("にメッセージを送った。")  ){
                    return true;//eachのcontinue
                  }
                  var ankerTag = $(this).prev("a");
                  ankerTag.children("br").remove();
                  var senderPNo = getPNoFromURL(ankerTag.attr("href"));
                  if (senderPNo == pnoFrom){
                    ankerTag.attr("href", getURL(day,senderPNo) );
                    var nextInsertAfterElement = loadingSelector;
                    var nextDiv = $(this).next("div");
                    for(var i = 0; i < 100; i++) {
                      //div.Wordsを続く限り取得(Limitあり)
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
                    foundFlg = true;
                    return true;//eachのcontinue
                  }
                });
                
                if (foundFlg == true){
                  loadingSelector.text("[取得完了]");
                  loadingSelector.after("<a href="+url+">[PNo"+pnoFrom+" DAY"+day+"]</a> ");
                  setTimeout(insertNextLink, nextLinkInterval);
                }else{
                  loadingSelector.text("[DAY"+day+"のメッセージはありませんでした]");
                  loadingSelector.after("<a href="+url+">[PNo"+pnoFrom+" DAY"+day+"]</a> メッセージなし<br/>");
                  setTimeout(insertNextLink, nextLinkInterval);
                }
                //ログ取得成功時の処理ここまで
              }else{
                loadingSelector.text("[一部取得に失敗しました]");
                setTimeout(insertNextLink, nextLinkInterval);
              }
            });
          }else{
            if (foundFlg == true){
              loadingSelector.text("[取得完了]");
              loadingSelector.after("<a href="+url+">[PNo"+pnoFrom+" DAY"+day+"]</a> ");
              setTimeout(insertNextLink, nextLinkInterval);
            }else{
              loadingSelector.after("<a href="+url+">[PNo"+pnoFrom+" DAY"+day+"]</a> メッセージなし<br/>");
              loadingSelector.text("[DAY"+day+"のメッセージはありませんでした]");
              setTimeout(insertNextLink, nextLinkInterval);
            }
          }
          
          
          //ログ取得成功時の処理ここまで
        }else{
          loadingSelector.text("[取得に失敗しました]");
          setTimeout(insertNextLink, nextLinkInterval);
        }
      });

      function insertNextLink(){
        //更に前のメッセージのリンクを挿入する
        //TO FROMを逆転させて次へのリンクを用意
        insertResLinkBar(loadingSelector,pnoTo,pnoFrom,nextDay,bUpstreamNext);
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