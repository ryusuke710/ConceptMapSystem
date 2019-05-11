<?php
session_start();

$db['host'] = "localhost";  // DBサーバのURL
$db['user'] = "root";  // ユーザー名
$db['pass'] = "hogehoge";  // ユーザー名のパスワード
$db['dbname'] = "test_db";  // データベース名

$userid = $_SESSION["ID"];

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
        <h2>マップ一覧</h2>
        <?php
          $dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db['host'], $db['dbname']);
          $test="a";
          try {
            $pdo = new PDO($dsn, $db['user'], $db['pass'], array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

            $stmt = $pdo->prepare('SELECT * FROM ConceptMap INNER JOIN User ON ConceptMap.UserId = ?');
            $stmt->execute(array($userid));

            if ($result = $stmt->fetch(PDO::FETCH_ASSOC)) {
              // code...
              while ($result = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // code...
                $rows .= $result
              }
            } else {
              $test = "c";
            }
          } catch (PDOException $e) {
            $test = "b";
          }

        ?>
        <p><?php echo $row["MapName"]; ?></p>
        <p><?php echo htmlspecialchars($userid, ENT_QUOTES); ?></p>
        <ul>
            <li><a href="Logout.php">ログアウト</a></li>
        </ul>
    </body>
</html>
