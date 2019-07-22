<?php
  require 'config.php';

  $dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db['host'], $db['dbname']);

  try {
    $pdo = new PDO($dsn, $db['user'], $db['pass'], array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

    $stmt = $pdo->prepare("SELECT ConceptMap.UserId, User.UserName, ConceptMap.MapId, ConceptMap.MapName FROM ConceptMap INNER JOIN User ON ConceptMap.UserId = User.UserId");

    $stmt->execute();

    while($result = $stmt->fetch(PDO::FETCH_ASSOC)){
      $rows[] = $result;
    }
  } catch (PDOException $e) {
    echo $e;
  }

  $pdo = null;

  //JSON形式に変換する関数を定義
  function json_safe_encode($data){
      return json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
  }
 ?>

 <!DOCTYPE html>
 <html lang="ja">
   <head>
     <meta charset="utf-8">
     <title>top</title>
   </head>
   <body>

     <table border="1">
       <tr>
         <td>UserId</td>
         <td>UserName</td>
         <td>MapId</td>
         <td>MapName</td>
       </tr>
       <?php
       foreach($rows as $row){
         ?>
         <tr>
           <td><?php echo $row['UserId']; ?></td>
           <td><?php echo $row['UserName']; ?></td>
           <td><?php echo $row['MapId']; ?></td>
           <td><a href="MapListDisplay.php?mapid=<?php echo $row['MapId'] ?>"><?php echo $row['MapName']; ?></a></td>
         </tr>
         <?php
       }
       ?>
     </table>


   </body>
 </html>
