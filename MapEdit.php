<?php
session_start();

// Main.phpからGETで受け取ったmapidをセッション変数に格納
$_SESSION['mapid'] = $_GET['mapid'];

$param = $_SESSION['mapid'];

//JSON形式に変換する関数を定義
function json_safe_encode($data){
    return json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
}
?>

<!DOCTYPE HTML>
<html>
<head>
  <link rel="stylesheet" href="graph-creator.css" />
</head>

<body>
  <header>
    <nav class="header-list">
      <ul class="MainFunc" id="MainFunc">
        <li><a href="#" id="download-input">保存</a></li>
        <li><a href="#" id="compare-map">比較</a></li>
        <li><a href="#" id="delete-graph">削除</a></li>
        <li><a href="#" id="test">いいね一覧</a></li>
        <li><a href="#" id="conclude">結論</a></li>
      </ul>
      <div id="border-line" class="border-line"></div>
      <ul class="Compare-list" id="Compare-list" style="visibility: hidden;">
        <li><a href="#" id="NextMap" class="NextMap">次のマップ</a></li>
        <li><a href="#" id="end" class="end">終了</a></li>
      </ul>
    </nav>
  </header>

  <div class="conclude-list" id="conclude-list">
    <textarea id="concludeArea" class="concludeArea" rows="8" cols="80"></textarea>
    <!-- <label id="concludeFin" class="concludeFin">完了</label> -->
    <input id="concludeFin" type="button" name="" value="完了">
  </div>

  <!-- <div id="toolbox">
    <input type="file" id="hidden-file-upload"><input type="image" title="upload graph" src="upload-icon.png" alt="upload graph"> <input type="image" id="" title="download graph" src="download-icon.png" alt="download graph"> <input type="image" id="delete-graph" title="delete graph" src="trash-icon.png" alt="delete graph">
  </div> -->
  <label id="MyMap" class="MyMap">あなたのマップ</label>
  <label id="Others" class="Others">ともだちのマップ</label>

  <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
  <script src="//d3js.org/d3.v3.js" charset="utf-8"></script>
  <script src="//cdn.jsdelivr.net/filesaver.js/0.1/FileSaver.min.js"></script>
  <script id="script" src="graph-creator.js" data-param='<?php echo json_safe_encode($param); ?>'></script>
</body>

</html>
