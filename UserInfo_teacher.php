<?php
  ini_set('display_errors', 1);
  // DB接続に必要な情報
  require 'config.php';

  // セッション開始
  session_start();

  //mapidをセッションから格納
  $mapid = $_SESSION['mapid_teacher'];

  $dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db['host'], $db['dbname']);

  try {
    $pdo = new PDO($dsn, $db['user'], $db['pass'], array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

    //sql準備
    // 現在のMapIdのconcludeに入力した結論のテキスト内容を挿入
    $stmt = $pdo->prepare("SELECT User.UserName, ConceptMap.MapName FROM ConceptMap INNER JOIN User ON ConceptMap.UserId = User.UserId WHERE ConceptMap.MapId = $mapid");

    //渡すパラメータは配列じゃないとダメらしい
    $stmt->execute();

    $search_result = $stmt->fetch();

    // print_r($search_result["UserName"], $search_result["MapName"]);
    echo json_encode($search_result);

  } catch (PDOException $e) {
    echo $e;
  }

  // 接続終了
  $pdo = null;
 ?>
