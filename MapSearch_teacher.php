<?php
require 'config.php';

session_start();

$dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db['host'], $db['dbname']);

$mapid = $_SESSION['mapid_teacher'];

try {
  $pdo = new PDO($dsn, $db['user'], $db['pass'], array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

  // $stmt = $pdo->prepare("SELECT `col` FROM `json_test` WHERE `MapId` = $mapid");
  $stmt = $pdo->prepare("SELECT `col` FROM `json_test` WHERE `MapId` = $mapid");

  $stmt->execute();

  $search_result = $stmt->fetchAll();
  print_r($search_result[0]['col']);

} catch (PDOException $e) {
  echo $e;
}

//PDO終了
$pdo = null;
 ?>
