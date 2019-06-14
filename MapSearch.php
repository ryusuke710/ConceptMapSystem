<?php
require 'config.php';

$dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db['host'], $db['dbname']);

$mapid = $_POST['data'];

try {
  $pdo = new PDO($dsn, $db['user'], $db['pass'], array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

  // $stmt = $pdo->prepare("SELECT `col` FROM `json_test` WHERE `MapId` = $mapid");
  $stmt = $pdo->prepare("SELECT `col` FROM `json_test` ORDER BY RAND() LIMIT 1");

  $stmt->execute();

  $search_result = $stmt->fetchAll();
  print_r($search_result[0]['col']);

} catch (PDOException $e) {
  echo $e;
}

//PDO終了
$pdo = null;
 ?>
