// ==UserScript==
// @name        七海メッセログビューワー
// @namespace   Sobayu
// @description メッセージのやりとりを同じページ上に表示します。
// @include     http://www.sssloxia.jp/result/c/*.html
// @version     1
// @grant       none
// ==/UserScript==

//定期更新ゲーム「SevenSeas」の、メッセージのやり取りをさかのぼるためのスクリプトです。

//「○○さん、どんなメッセージ送ったんだろう！、全部見たい！」
//「このやりとり楽しそう、追いたい」
//「メッセージ書くけど、前どんなメッセージ送ったっけ…」
//なんて時に、リンク１つで前のメッセージを開くやつです。
//交互に送りあってる場合のみ対応。

//　★　導　入　方　法　★
//FirefoxならGreasemonkeyというアドオン、
//Chrome/OperaならTampermonkeyというアドオンをインストールします。
//インストールしたら、ブラウザを再起動します。

//ブラウザで、このスクリプトを開きます。
//githubの画面の場合は、「Raw」というボタンを押せば、このスクリプトをインストールできますよ！
//そのあと、各七海のページを見てみましょう！


//アルファ版です
//テスター募れるほどの人望がなかった　

(function($){

  //日付を取得
  var today = getToday();

  //自分のPNoを取得
  var MyPNo = getPNoFromURL(location.href);

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
    //alert( ankerTag.html() );
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
    return url.match( /(\d+).html/ )[1];
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

      //メッセージ送信元の結果を取得
      var url = "http://www.sssloxia.jp/result/"+urlKey+"/"+pnoFrom+".html"
      $.get( url, function(data,status){
        if (status == "success"){
          //一つ前の日
          var nextDay = day-1
          var nextURLKey = "";
          if ( urlKey == "c" ){
            nextURLKey = "b";
          }else{
            nextURLKey = "b" + nextDay;
          }

          //該当メッセージを探し出す
          //複数該当する場合は複数持ってくる
          var foundFlg = false;
          $(data).find("div.MessagePost").each(function(){
            var ankerTag = $(this).prev("a");
            ankerTag.children("br").remove();
            var senderPNo = getPNoFromURL(ankerTag.attr("href"));
            if (senderPNo == pnoTo){
              ankerTag.attr("href", "http://www.sssloxia.jp/result/"+urlKey+"/"+senderPNo+".html")
              //loadingSelector.after( "<br/>" );
              var nextInsertAfterElement = loadingSelector;
              var nextDiv = $(this).next("div");
              while(1){
                //div.Wordsを続く限り取得
                if ( nextDiv.attr("class") == "Words" || nextDiv.attr("name") == "BR" ){
                  //alert(nextDiv.html());
                  nextDivTmp = nextDiv.next("div");
                  nextInsertAfterElement.after(nextDiv);
                  nextInsertAfterElement = nextDiv;
                  nextDiv = nextDivTmp;
                }else{
                  //alert(nextDiv.html());
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
            //更に前のメッセージのリンクを挿入する
            //day判定
            //TO FROMを逆転させて次へのリンクを用意
            insertResLink(loadingSelector,pnoTo,pnoFrom,nextURLKey,nextDay);

            loadingSelector.remove();
          }else{
            loadingSelector.before("<a href="+url+">[PNo"+pnoFrom+" DAY"+day+"]</a> ");
            loadingSelector.text("[これ以上前のメッセージはありません]");
          }
          //ログ取得成功時の処理ここまで
        }else{
          alert("ページの読み込みに失敗しました");
        }
      });

    });
  }

}
)(jQuery);