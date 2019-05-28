<?php
session_start();

require 'config.php'; //DB情報

$dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db['host'], $db['dbname']);

$userid = $_SESSION["ID"];

$errorMessage = "";

// ログイン状態チェック
if (!isset($_SESSION["NAME"])) {
  header("Location: Logout.php");
  exit;
}
?>

<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>メイン</title>
</head>
<body>
  <h1>メイン画面</h1>
  <!-- ユーザーIDにHTMLタグが含まれても良いようにエスケープする -->
  <p>ようこそ<u><?php echo htmlspecialchars($_SESSION["NAME"], ENT_QUOTES); ?></u>さん</p>  <!-- ユーザー名をechoで表示 -->
  <p>新規登録</p>
  <form id="MapRegist" name="MapRegist" action="" method="post">
    <label for="mapname">マップ名</label>
    <input type="text" id="mapname" name="mapname" placeholder="マップ名を入力" value="<?php if (!empty($_POST["mapname"])) {echo htmlspecialchars($_POST["mapname"], ENT_QUOTES);} ?>">
    <br>
    <input type="submit" id="regist" name="regist" value="登録">
  </form>
  <?php
  if (isset($_POST["regist"])) {
    if (!empty($_POST["mapname"])) {
      // code...
      $mapname = $_POST["mapname"];

      try {
        $pdo = new PDO($dsn, $db['user'], $db['pass'], array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

        $stmt = $pdo->prepare("INSERT INTO ConceptMap(UserId, MapName) VALUES (?, ?)");
        $stmt->execute(array($userid, $mapname));

        //lastinsertid->最後に格納されたID
        $mapid = $pdo->lastinsertid();
      } catch (PDOException $e) {
        $errorMessage = "DBerror";
      }

    }
  } else {
    $errorMessage = 'a';
  }

  ?>
  <?php
  $test="a";
  try {
    $pdo = new PDO($dsn, $db['user'], $db['pass'], array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

    $stmt = $pdo->prepare('SELECT * FROM ConceptMap INNER JOIN User ON ConceptMap.UserId = User.UserId WHERE ConceptMap.UserId = ?');
    $stmt->execute(array($userid));

    if ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC)) {

    } else {
      $test = "c";
    }
  } catch (PDOException $e) {
    $test = "b";
  }

  ?>
  <h2>あなたのマップ</h2>
  <!-- マップ一覧表示 -->
  <?php foreach ($rows as $value) : ?>
    <!-- GETで選択したマップのmapidをMapEdit.phpに渡す -->
    <a href="MapEdit.php?mapid=<?php echo $value["MapId"] ?>"><?php echo $value["MapName"].'<br>'; ?></a>
  <?php endforeach; ?>
  <p><?php echo $errorMessage; ?></p>
  <p><?php echo $mapname; ?></p>
  <ul>
    <li><a href="Logout.php">ログアウト</a></li>
  </ul>
</body>
</html>
