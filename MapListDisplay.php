<?php

  session_start();

  $_SESSION['mapid_teacher'] = $_GET['mapid'];

 ?>

<!DOCTYPE html>
<html lang="ja" dir="ltr">
  <head>
    <link rel="stylesheet" href="graph-creator.css" />
    <meta charset="utf-8">
    <title></title>
  </head>
  <body>
    <p id="Info"></p>
    <div class="conclude-list-t" id="conclude-list-t">
      <textarea id="concludeArea" class="concludeArea"></textarea>
      <!-- <label id="concludeFin" class="concludeFin">完了</label> -->
      <input id="Fin" type="button" name="" value="戻る">
    </div>
    <div class="border-line-t" id="border-line-t"></div>
    <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
    <script src="//d3js.org/d3.v3.js" charset="utf-8"></script>
    <script id="script" src="MapDisplay.js"></script>
  </body>
</html>
