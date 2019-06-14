<?php
ini_set('display_errors', 1);
require 'config.php'; //DB情報

session_start();

$dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db['host'], $db['dbname']);

$data = json_decode($_POST['data'], true);
// var_dump($data["nodes"]["0"]["title"]);
echo $_POST['data'];
$json_data = $_POST['data'];
// var_dump($data);

//mapidをセッションから格納
$mapid = $_SESSION['mapid'];

echo $mapid;

try {
  $pdo = new PDO($dsn, $db['user'], $db['pass'], array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

  //sql準備 MapIdが重複していたらJSONのみをUPDATE
  $stmt = $pdo->prepare("INSERT INTO `json_test` (`MapId`, `col`) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE `col` = VALUES(`col`)");

  //$mapid->コンセプトマップID，$json_data->マップ情報
  //渡すパラメータ1つ（配列）
  $stmt->execute(array($mapid, $json_data));

} catch (PDOException $e) {
  echo $e;
}

$pdo = null;
?>
