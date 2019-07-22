document.onload = (function(d3, saveAs, Blob, undefined){
  "use strict";

  // define graphcreator object
  var GraphCreator = function(svg, nodes, edges){
    var thisGraph = this;
    console.log(this);
    thisGraph.idct = 0;
    thisGraph.labelidct = 0;

    thisGraph.nodes = nodes || [];
    thisGraph.edges = edges || [];

    thisGraph.state = {
      selectedNode: null,
      selectedEdge: null,
      mouseDownNode: null,
      mouseDownLink: null,
      justDragged: false,
      justScaleTransGraph: false,
      lastKeyDown: -1,
      shiftNodeDrag: false,
      selectedText: null,
      activeComparing: false,
      activeConcluding: false,
      firstzoom: false,
      addnewEdge: false
    };

    // define arrow markers for graph links
    var defs = svg.append('svg:defs');
    defs.append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', "32")
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5'); //矢印の先の設定？

    // define arrow markers for leading arrow
    defs.append('svg:marker')
    .attr('id', 'mark-end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 7)
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5'); //矢印の設定ぽい

    thisGraph.svg = svg;
    //thisGraph.consts.graphClassというクラスを"svgG"に設定
    thisGraph.svgG = svg.append("g")
    .classed(thisGraph.consts.graphClass, true);
    var svgG = thisGraph.svgG;

    // displayed when dragging between nodes
    thisGraph.dragLine = svgG.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0')
    .style('marker-end', 'url(#mark-end-arrow)');

    // svg nodes and edges
    thisGraph.paths = svgG.append("g").selectAll("g");
    thisGraph.circles = svgG.append("g").selectAll("g");
    thisGraph.labels = svgG.append("g").selectAll('.labels');

    thisGraph.drag = d3.behavior.drag()
    .origin(function(d){
      return {x: d.x, y: d.y};
    })
    .on("drag", function(args){
      thisGraph.state.justDragged = true;
      thisGraph.dragmove.call(thisGraph, args);
    })
    .on("dragend", function() {
      // todo check if edge-mode is selected
    });

    // listen for key events
    //keyが押された時svgKeyDown呼ぶ
    d3.select(window).on("keydown", function(){
      thisGraph.svgKeyDown.call(thisGraph);
    })
    .on("keyup", function(){
      thisGraph.svgKeyUp.call(thisGraph);
    });
    //mouseが押された時メソッドの呼び出し
    svg.on("mousedown", function(d){thisGraph.svgMouseDown.call(thisGraph, d);});
    svg.on("mouseup", function(d){thisGraph.svgMouseUp.call(thisGraph, d);});

    // listen for dragging
    var dragSvg = d3.behavior.zoom()
    .on("zoom", function(){
      if (d3.event.sourceEvent.shiftKey){
        // TODO  the internal d3 state is still changing
        return false;
      } else {
        // 初めてのズームなら初期位置を設定する
        if (thisGraph.state.firstzoom) {
          dragSvg.translate([0, 0]);
          dragSvg.scale(0.5);
          thisGraph.state.firstzoom = false;
        } else {
          thisGraph.zoomed.call(thisGraph);
        }
      }
      return true;
    })
    .on("zoomstart", function(){
      var ael = d3.select("#" + thisGraph.consts.activeEditId).node();
      if (ael){
        ael.blur();
      }
      if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
    })
    .on("zoomend", function(){
      d3.select('body').style("cursor", "auto");
    });

    svg.call(dragSvg).on("dblclick.zoom", null);

    // listen for resize
    window.onresize = function(){thisGraph.updateWindow(svg);};

    // handle download data
    d3.select("#download-input").on("click", function(){
      thisGraph.RegistMap();

      /* MapEdit.php からMapIdを取得 */
      //JQuery使って属性を取得する、JSON.parseで扱える形に変換
      var $script = $('#script');
      var result = JSON.parse($script.attr('data-param'));
      //確認
      console.log(result);
    });


    // handle uploaded data
    d3.select("#upload-input").on("click", function(){

      // add
      $.ajax({
        type: "POST",
        url: "MapSearch.php",
        data: {data: 1}
      }).done(function( msg ) {
        // var jsonObj = JSON.parse(msg);

        thisGraph.mapupload(msg);
        // thisGraph.deleteGraph(true);
      });

    });

    // handle delete graph
    d3.select("#delete-graph").on("click", function(){
      thisGraph.deleteGraph(false);
    });
  };

  var GraphCreator2 = function(svg, nodes, edges){
    var thisGraph = this;
    thisGraph.idct = 0;

    thisGraph.nodes = nodes || [];
    thisGraph.edges = edges || [];

    thisGraph.state = {
      selectedNode: null,
      selectedEdge: null,
      mouseDownNode: null,
      mouseDownLink: null,
      justDragged: false,
      justScaleTransGraph: false,
      lastKeyDown: -1,
      shiftNodeDrag: false,
      selectedText: null,
      firstzoom: false
    };

    // define arrow markers for graph links
    var defs = svg.append('svg:defs');
    defs.append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', "32")
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5'); //矢印の先の設定？

    // define arrow markers for leading arrow
    defs.append('svg:marker')
    .attr('id', 'mark-end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 7)
    .attr('markerWidth', 3.5)
    .attr('markerHeight', 3.5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5'); //矢印の設定ぽい

    thisGraph.svg = svg;
    //thisGraph.consts.graphClassというクラスを"svgG"に設定
    thisGraph.svgG = svg.append("g")
    .classed("graph2", true);

    var svgG = thisGraph.svgG;

    // displayed when dragging between nodes
    thisGraph.dragLine = svgG.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0')
    .style('marker-end', 'url(#mark-end-arrow)');

    // svg nodes and edges
    thisGraph.paths = svgG.append("g").selectAll("g");
    thisGraph.circles = svgG.append("g").selectAll("g");
    thisGraph.labels = svgG.append("g").selectAll('.labels');

    // listen for dragging
    var dragSvg = d3.behavior.zoom()
    .on("zoom", function(){
      // 初めてのズームなら初期位置を指定（比較時にサイズ変更するため）
      if (thisGraph.state.firstzoom) {
        dragSvg.translate([0,0]);
        dragSvg.scale(0.5);
        thisGraph.state.firstzoom = false;
      } else {
        thisGraph.zoomed.call(thisGraph);
      }
      return true;
    })
    .on("zoomstart", function(){
      d3.select('body').style("cursor", "move");
    })
    .on("zoomend", function(){
      d3.select('body').style("cursor", "auto");
    });
    //
    svg.call(dragSvg).on("dblclick.zoom", null);

    // listen for resize
    // window.onresize = function(){thisGraph.updateWindow(svg);};

  };

  GraphCreator.prototype.setIdCt = function(idct){
    this.idct = idct;
    this.labelidct = idct - 1;
  };

  GraphCreator.prototype.consts =  {
    selectedClass: "selected",
    connectClass: "connect-node",
    circleGClass: "conceptG",
    graphClass: "graph",
    activeEditId: "active-editing",
    addedClass: "added",
    markedClass: "marked",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 50
  };

  // 比較ボタン
  d3.select('#compare-map').on("click", function() {
    //比較モードON
    graph.state.activeComparing = true;
    // 自身のマップのサイズを初めのみ変更するためのフラグ
    graph.state.firstzoom = true;
    //自身のグラフのSVGを縮小
    graph.updateWindow(svg);
    //比較対象のグラフのSVGを有効化
    svg2.style("visibility", "visible");

    d3.select(".graph")
    .attr("transform", "translate(" + [0, (svgH/4)] + ") scale(" + 0.5 + ")");

    // 比較対象のグラフの内容を非同期通信で取得
    CompareMapUpload();

    //終了ラベルの取得
    var endBtn = document.getElementById("Compare-list");
    //中央線の取得
    var border = document.getElementById("border-line");
    var OthersLabel = document.getElementById("Others");
    var MyMapLabel = document.getElementById("MyMap");
    // var MainFunc = document.getElementById("MainFunc");

    //各要素の有効化
    endBtn.style.visibility = "visible";
    border.style.visibility = "visible";
    OthersLabel.style.visibility = "visible";
    MyMapLabel.style.visibility = "visible";

    // MainFunc.style.visibility = "hidden";

  });

  // 比較終了ボタン（仮）
  d3.select('#end').on("click", function() {

    //比較モードOFF
    graph.state.activeComparing = false;
    //ウィンドウサイズを最大にする
    graph.updateWindow(svg);

    // 各要素取得
    var endBtn = document.getElementById("Compare-list");
    var border = document.getElementById("border-line");
    var OthersLabel = document.getElementById("Others");
    var MyMapLabel = document.getElementById("MyMap");

    // グラフ内容を削除
    graph2.deleteGraph(true);
    // 比較対象のグラフのSVGを無効化
    svg2.style("visibility", "hidden");

    // 各要素の無効化
    endBtn.style.visibility = "hidden";
    border.style.visibility = "hidden";
    OthersLabel.style.visibility = "hidden";
    MyMapLabel.style.visibility = "hidden";
  });

  // 比較時次へボタン
  document.getElementById("NextMap").onclick = function() {
    CompareMapUpload();
  }

  // 結論ボタン
  d3.select('#conclude').on("click", function() {
    // 結論モード有効化
    graph.state.activeConcluding = true;

    // 記述欄と完了ボタンを表示
    document.getElementById("conclude-list").style.visibility = "visible";

    // 表示する前にテキスト内容があるか確認(DBに接続)
    $.ajax({
      type: "POST",
      url: "ConcCheck.php"
    }).done(function( msg ) {
      //既に結論内容が格納されている場合
      if (msg != null) {
        // 結論記述欄のテキストエリア情報を取得
        var concArea = document.getElementById("concludeArea");
        // 記述欄のテキストエリアにDBから持ってきた情報を格納
        concArea.value = msg;
        // 実際にテキスト化する
        document.getElementById("concludeArea").textContent = concArea.value;
      }
    });
  });

  // 結論完了ボタン
  d3.select('#concludeFin').on("click", function() {
    // 結論モード終了
    graph.state.activeConcluding = false;

    // 結論内容を記述するテキストエリアのテキスト内容を格納
    var conctext = document.getElementById("concludeArea").value;

    // テキスト内容を"ConcRegister.php"に渡し，DBに登録
    $.ajax({
      type: "POST",
      url: "ConcRegister.php",
      data: {data: conctext}
    }).done(function( msg ) {
      console.log(msg);
    });

    // 記述欄と完了ボタンを表示
    document.getElementById("conclude-list").style.visibility = "hidden";
  });

  /* PROTOTYPE FUNCTIONS */

  //add FUNCTIONS
  var CompareMapUpload = function() {
    // 比較対象のグラフの内容を非同期通信で取得
    $.ajax({
      type: "POST",
      url: "MapSearch.php"
    }).done(function( msg ) {
      graph2.mapupload(msg);
    });

    // 比較対象のマップがアップされたらサイズ変更維持のためフラグをセット
    graph2.state.firstzoom = true;
    // 比較対象のマップのサイズ変更（このサイズを維持したい）
    d3.select(".graph2")
    .attr("transform", "translate(" + [0, (svgH/4)] + ") scale(" + 0.5 + ")");

  };

  GraphCreator.prototype.MapUpload = function() {
    var thisGraph = this;
    $.ajax({
      type: "POST",
      url: "FirstMapSearch.php"
    }).done(function( msg ) {
      if (msg) {
        try {
          var MapContents = JSON.parse(msg);
          thisGraph.deleteGraph(true);
          thisGraph.nodes = MapContents.nodes;
          // console.log(thisGraph.nodes);
          thisGraph.setIdCt(MapContents.nodes.length + 1);
          var newEdges = MapContents.edges;
          newEdges.forEach(function(e, i){
            newEdges[i] = {
              id: e.id,
              label: e.label,
              source: thisGraph.nodes.filter(function(n){return n.id == e.source;})[0],
              target: thisGraph.nodes.filter(function(n){return n.id == e.target;})[0],
            };
          });
          thisGraph.edges = newEdges;
          thisGraph.updateGraph();
        } catch (err) {
          window.alert("Error parsing uploaded file\nerror message: " + err.message);
          return;
        }
      } else {
        window.alert("Hello");
        // マップ情報がない場合新規登録
        thisGraph.RegistMap();
      }
    });
  };

  GraphCreator.prototype.RegistMap = function() {
    var thisGraph = this;
    var saveEdges = [];
    thisGraph.edges.forEach(function(val, i){
      saveEdges.push({id: val.id, source: val.source.id, target: val.target.id, label: val.label});
    });

    // add
    $.ajax({
      type: "POST",
      url: "test.php",
      datatype: 'json',
      data: {data:JSON.stringify({edges: saveEdges, nodes: thisGraph.nodes})},
    }).done(function( msg ) {
      console.log(msg);
    });
  };

  GraphCreator.prototype.dragmove = function(d) {
    var thisGraph = this;
    if (thisGraph.state.shiftNodeDrag){
      thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(thisGraph.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
    } else {
      //画面外の処理 要修正
      // if (d.x < 50) {
      //   d.x += 10;
      //   return;
      // } else if (d.y < 55) {
      //   d.y += 10;
      //   return;
      // }
      d.x += d3.event.dx;
      d.y +=  d3.event.dy;
      thisGraph.updateGraph();
    }
  };

  GraphCreator.prototype.deleteGraph = function(skipPrompt){
    var thisGraph = this,
    doDelete = true;
    if (!skipPrompt){
      doDelete = window.confirm("Press OK to delete this graph");
    }
    if(doDelete){
      thisGraph.nodes = [];
      thisGraph.edges = [];
      thisGraph.updateGraph();
    }
  };

  /* select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element */
  GraphCreator.prototype.selectElementContents = function(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  /* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
  GraphCreator.prototype.insertTitleLinebreaks = function (gEl, title) {
    var words = title.split(/\s+/g),
    nwords = words.length;
    var el = gEl.append("text")
    .attr("text-anchor","middle")
    .attr("dy", "-" + (nwords-1)*7.5);

    for (var i = 0; i < words.length; i++) {
      var tspan = el.append('tspan').text(words[i]);
      if (i > 0)
      tspan.attr('x', 0).attr('dy', '15');
    }
  };

  // remove edges associated with a node
  GraphCreator.prototype.spliceLinksForNode = function(node) {
    var thisGraph = this,
    // ノードの削除
    toSplice = thisGraph.edges.filter(function(l) {
      return (l.source === node || l.target === node);
    });
    toSplice.map(function(l) {
      thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
    });
  };

  GraphCreator.prototype.replaceSelectEdge = function(d3Path, edgeData){
    var thisGraph = this;
    d3Path.classed(thisGraph.consts.selectedClass, true);
    if (thisGraph.state.selectedEdge){
      thisGraph.removeSelectFromEdge();
    }
    thisGraph.state.selectedEdge = edgeData;
  };

  // ノード選択
  GraphCreator.prototype.replaceSelectNode = function(d3Node, nodeData){
    var thisGraph = this;
    d3Node.classed(this.consts.selectedClass, true);

    if (thisGraph.state.selectedNode){
      thisGraph.removeSelectFromNode();
    }
    thisGraph.state.selectedNode = nodeData;
  };

  GraphCreator.prototype.removeSelectFromNode = function(){
    var thisGraph = this;
    thisGraph.circles.filter(function(cd){
      return cd.id === thisGraph.state.selectedNode.id;
    }).classed(thisGraph.consts.selectedClass, false);

    thisGraph.state.selectedNode = null;
  };

  GraphCreator.prototype.removeSelectFromEdge = function(){
    var thisGraph = this;
    thisGraph.paths.filter(function(cd){
      return cd === thisGraph.state.selectedEdge;
    }).classed(thisGraph.consts.selectedClass, false);
    thisGraph.state.selectedEdge = null;
  };

  // 結論機能時，枠線の色変更の為，選択しているノードにクラスを追加・解除するメソッド
  GraphCreator.prototype.checkMarkNode = function(d3Node) {
    if (!d3Node.classed("marked")) {
      d3Node.classed(this.consts.markedClass, true);
      d3Node.filter(function(cd) {
        cd.conc = true;
      });
    } else {
      d3Node.classed(this.consts.markedClass, false);
      d3Node.filter(function(cd) {
        cd.conc = false;
      });
    }
  };

  GraphCreator.prototype.pathMouseDown = function(d3path, d){
    var thisGraph = this,
    state = thisGraph.state;
    d3.event.stopPropagation();
    state.mouseDownLink = d;

    if (state.selectedNode){
      thisGraph.removeSelectFromNode();
    }

    var prevEdge = state.selectedEdge;
    if (!prevEdge || prevEdge !== d){
      thisGraph.replaceSelectEdge(d3path, d);
    } else{
      thisGraph.removeSelectFromEdge();
    }
  };

  // mousedown on node
  GraphCreator.prototype.circleMouseDown = function(d3node, d){
    var thisGraph = this,
    state = thisGraph.state;
    d3.event.stopPropagation();
    state.mouseDownNode = d;
    if (d3.event.shiftKey){
      state.shiftNodeDrag = d3.event.shiftKey;
      // reposition dragged directed edge
      thisGraph.dragLine.classed('hidden', false)
      .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
      return;
    }
  };

  /* place editable text on node in place of svg text */
  GraphCreator.prototype.changeTextOfNode = function(d3node, d){
    var thisGraph= this,
    consts = thisGraph.consts,
    htmlEl = d3node.node();
    d3node.selectAll("text").remove();
    var nodeBCR = htmlEl.getBoundingClientRect(),
    curScale = nodeBCR.width/consts.nodeRadius,
    placePad  =  5*curScale,
    useHW = curScale > 1 ? nodeBCR.width*0.71 : consts.nodeRadius*1.42;
    // replace with editableconent text
    var d3txt = thisGraph.svg.selectAll("foreignObject")
    .data([d])
    .enter()
    .append("foreignObject")
    .attr("x", nodeBCR.left + placePad + 5)
    .attr("y", nodeBCR.top + placePad - 100)
    .attr("height", 2*useHW)
    .attr("width", useHW)
    .append("xhtml:p")
    .attr("id", consts.activeEditId)
    .attr("contentEditable", "true")
    .text(d.title)
    .on("mousedown", function(d){
      d3.event.stopPropagation();
    })
    .on("keydown", function(d){
      d3.event.stopPropagation();
      if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey){
        this.blur();
      }
    })
    .on("blur", function(d){
      d.title = this.textContent;
      thisGraph.insertTitleLinebreaks(d3node, d.title);
      d3.select(this.parentElement).remove();
    });
    return d3txt;
  };

  // mouseup on nodes
  GraphCreator.prototype.circleMouseUp = function(d3node, d){
    var thisGraph = this,
    state = thisGraph.state,
    consts = thisGraph.consts;
    // reset the states
    state.shiftNodeDrag = false;
    d3node.classed(consts.connectClass, false);
    var mouseDownNode = state.mouseDownNode;

    if (!mouseDownNode) return;

    thisGraph.dragLine.classed("hidden", true);

    if (mouseDownNode !== d){
      // we're in a different node: create new edge for mousedown edge and add to graph
      var newEdge = {id: thisGraph.labelidct++, source: mouseDownNode, target: d, label: "new label"};
      var filtRes = thisGraph.paths.filter(function(d){
        if (d.source === newEdge.target && d.target === newEdge.source){
          thisGraph.edges.splice(thisGraph.edges.indexOf(d), 1);
        }
        return d.source === newEdge.source && d.target === newEdge.target;
      });
      thisGraph.state.addnewEdge = true;
      if (!filtRes[0].length){
        thisGraph.edges.push(newEdge);
        thisGraph.updateGraph();
      }
    } else {
      // we're in the same node
      if (state.justDragged) {
        // dragged, not clicked
        state.justDragged = false;
      } else{
        // clicked, not dragged
        if (d3.event.shiftKey){
          // shift-clicked node: edit text content
          var d3txt = thisGraph.changeTextOfNode(d3node, d);
          var txtNode = d3txt.node();
          thisGraph.selectElementContents(txtNode);
          txtNode.focus();
        } else{
          if (state.selectedEdge){
            thisGraph.removeSelectFromEdge();
          }
          // 現在選択しているノード
          var prevNode = state.selectedNode;

          // 結論機能時，枠線の色変更の処理
          // 通常時はノードの選択，解除 それ以外の場合は結論機能時の重要なノード選択のメソッド(checkMarkNode())
          if (!thisGraph.state.activeConcluding) {
            // 今選択しているノードがないor前回と異なるノードを選択
            if (!prevNode || prevNode.id !== d.id){
              // ノード選択に関する関数
              thisGraph.replaceSelectNode(d3node, d);
            } else{
              // 同じノードを2回選択
              thisGraph.removeSelectFromNode();
            }
          } else {
            thisGraph.checkMarkNode(d3node);
          }
        }
      }
    }
    state.mouseDownNode = null;
    return;

  }; // end of circles mouseup

  // mousedown on main svg
  GraphCreator.prototype.svgMouseDown = function(){
    this.state.graphMouseDown = true;
  };

  // mouseup on main svg
  GraphCreator.prototype.svgMouseUp = function(){
    var thisGraph = this,
    state = thisGraph.state;
    if (state.justScaleTransGraph) {
      // dragged not clicked
      state.justScaleTransGraph = false;
    } else if (state.graphMouseDown && d3.event.shiftKey){
      // clicked not dragged from svg
      var xycoords = d3.mouse(thisGraph.svgG.node()),
      d = {id: thisGraph.idct++, title: "new concept", x: xycoords[0], y: xycoords[1], add: false, conc: false};
      thisGraph.nodes.push(d);
      thisGraph.updateGraph();
      // make title of text immediently editable
      var d3txt = thisGraph.changeTextOfNode(thisGraph.circles.filter(function(dval){
        return dval.id === d.id;
      }), d),
      txtNode = d3txt.node();
      thisGraph.selectElementContents(txtNode);
      txtNode.focus();
    } else if (state.shiftNodeDrag){
      // dragged from node
      state.shiftNodeDrag = false;
      thisGraph.dragLine.classed("hidden", true);
    }
    state.graphMouseDown = false;
  };

  // keydown on main svg
  GraphCreator.prototype.svgKeyDown = function() {
    var thisGraph = this,
    state = thisGraph.state,
    consts = thisGraph.consts;
    // make sure repeated key presses don't register for each keydown
    if(state.lastKeyDown !== -1) return;

    state.lastKeyDown = d3.event.keyCode;
    var selectedNode = state.selectedNode,
    selectedEdge = state.selectedEdge;

    if (!this.state.activeConcluding) {
      switch(d3.event.keyCode) {
        case consts.BACKSPACE_KEY:
        case consts.DELETE_KEY:
        d3.event.preventDefault();
        if (selectedNode){
          thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);
          thisGraph.spliceLinksForNode(selectedNode);
          state.selectedNode = null;
          thisGraph.updateGraph();
          // delete link
        } else if (selectedEdge){
          thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
          // const labels = thisGraph.labels.find(selectedEdge["id"] === thisGraph.labels["id"]);
          // thisGraph.labels.splice(thisGraph.labels.indexOf(labels), 1);
          state.selectedEdge = null;
          thisGraph.updateGraph();
        }
        break;
      }
    }
  };

  GraphCreator.prototype.svgKeyUp = function() {
    this.state.lastKeyDown = -1;
  };

  // 比較対象のノードを自身のマップに追加
  GraphCreator.prototype.addnode = function(d3AddNode) {
    var thisGraph = this;

    // d3AddNode.classed(this.consts.addedClass, true);

    var d = {id: thisGraph.idct++, title: d3AddNode.title, x: d3AddNode.x, y: d3AddNode.y, add: true, conc: false};
    thisGraph.nodes.push(d);
    // console.log(thisGraph.nodes[d.id]);
    thisGraph.updateGraph();

    // 追加されたノードを示すクラスを追加(addedClass)
    thisGraph.circles.filter(function(cd){
      return cd.id === d.id;
    }).classed(thisGraph.consts.addedClass, true);
  };

  GraphCreator.prototype.changeTextOfLink = function(linklabel, d) {
    var thisGraph= this,
    consts = thisGraph.consts;

    linklabel.selectAll("text").remove();
    var htmlEl = linklabel.node();
    var nodeBCR = htmlEl.getBoundingClientRect();

    var d3txt = thisGraph.svg.selectAll("foreignObject")
    .data([d])
    .enter()
    .append("foreignObject")
    .attr("x", nodeBCR.left * 0.95)
    .attr("y", nodeBCR.top * 0.82)
    .attr("height", 100)
    .attr("width", 100)
    .append("xhtml:p")
    .attr("id", consts.activeEditId)
    .attr("contentEditable", "true")
    .text(d.label)
    .on("mousedown", function(d){
      d3.event.stopPropagation();
    })
    .on("keydown", function(d){
      d3.event.stopPropagation();
      if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey){
        this.blur();
      }
    })
    .on("blur", function(d){
      d.label = this.textContent;
      linklabel.text(d.label);
      d3.select(this.parentElement).remove();
    });
    return d3txt;
  };

  GraphCreator.prototype.linklabelMouseUp = function(linklabel, d) {
    if (!d3.event.shiftKey) {
      var thisGraph = this;
      var d3txt = thisGraph.changeTextOfLink(linklabel, d);
      var txtNode = d3txt.node();
      thisGraph.selectElementContents(txtNode);
      txtNode.focus();
    }
  };

  // call to propagate changes to graph
  GraphCreator.prototype.updateGraph = function(){
    var thisGraph = this,
    consts = thisGraph.consts,
    state = thisGraph.state;

    // thisGraph.labels = thisGraph.labels.data(thisGraph.edges);
    thisGraph.labels = thisGraph.labels.data(thisGraph.edges, function(d) {
      return String(d.source.id) + "+" + String(d.target.id);
    });
    thisGraph.paths = thisGraph.paths.data(thisGraph.edges, function(d){
      return String(d.source.id) + "+" + String(d.target.id);
    });
    // thisGraph.paths = thisGraph.paths.data(thisGraph.edges);

    var paths = thisGraph.paths;
    // update existing paths
    paths.style('marker-end', 'url(#end-arrow)')
    .classed(consts.selectedClass, function(d){
      return d === state.selectedEdge;
    })
    .attr("d", function(d){
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
    });

    // add new paths
    paths.enter()
    .append("path")
    .style('marker-end','url(#end-arrow)')
    .classed("link", true)
    .attr("id", function(d){ return "id" + d["id"]})
    .attr("d", function(d){
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
    })
    .attr("text", function(d){ return d["id"]})
    .on("mousedown", function(d){
      thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
    })
    .on("mouseup", function(d){
      state.mouseDownLink = null;
    });

    // remove old links
    // 更新されなかった つまり存在していないリンクを消去
    paths.exit().remove();

    var labels = thisGraph.labels;

    // add link label
    labels.enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", 0)
    .attr("dy", 16)
    // .attr("opacity", function(d,i){return  (i>1)?"1":"0"})
    .append("textPath")
    .attr("startOffset", "50%")
    // pathのIDと連携 d->labels.dataで与えたデータ(thisGraph.edges)
    .attr("xlink:href", function(d){ return "#id" + d["id"]})
    .text(function(d){ return d["label"]})
    .on("mouseup", function(d) {
      thisGraph.linklabelMouseUp.call(thisGraph, d3.select(this), d);
    });

    // link label 回転
    labels.attr('transform', function(d) {
      if (d.target.x < d.source.x) {
        var bbox = this.getBBox();

        var rx = bbox.x + bbox.width / 2;
        var ry = bbox.y + bbox.height / 2;
        return 'rotate(180 ' + (rx) + ' ' + (ry) + ')';
      } else {
        return 'rotate(0)';
      }
    });

    labels.exit().remove();

    // update existing nodes
    thisGraph.circles = thisGraph.circles.data(thisGraph.nodes, function(d){ return d.id;});
    thisGraph.circles.attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";});

    // add new nodes
    var newGs= thisGraph.circles.enter()
    .append("g");

    // 追加，結論時に設定したノードデータから描画の設定をする
    newGs.filter(function(cd){
      return cd.add === true;
    }).classed(thisGraph.consts.addedClass, true);
    newGs.filter(function(cd){
      return cd.conc === true;
    }).classed(thisGraph.consts.markedClass, true);

    newGs.classed(consts.circleGClass, true)
    .attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";})
    .on("mouseover", function(d){
      if (state.shiftNodeDrag){
        d3.select(this).classed(consts.connectClass, true);
      }
    })
    .on("mouseout", function(d){
      d3.select(this).classed(consts.connectClass, false);
    })
    .on("mousedown", function(d){
      thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
    })
    .on("mouseup", function(d){
      thisGraph.circleMouseUp.call(thisGraph, d3.select(this), d);
    })
    .call(thisGraph.drag);

    newGs.append("circle")
    .attr("r", String(consts.nodeRadius));

    newGs.each(function(d){
      thisGraph.insertTitleLinebreaks(d3.select(this), d.title);
    });

    // remove old nodes
    thisGraph.circles.exit().remove();
  };

  GraphCreator2.prototype.setIdCt = function(idct){
    this.idct = idct;
  };

  GraphCreator2.prototype.consts =  {
    selectedClass: "selected",
    connectClass: "connect-node",
    circleGClass: "conceptG",
    graphClass: "graph",
    activeEditId: "active-editing",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 50
  };

  GraphCreator2.prototype.deleteGraph = function(skipPrompt){
    var thisGraph = this,
    doDelete = true;
    if (!skipPrompt){
      doDelete = window.confirm("Press OK to delete this graph");
    }
    if(doDelete){
      thisGraph.nodes = [];
      thisGraph.edges = [];
      thisGraph.updateGraph();
    }
  };

  GraphCreator2.prototype.mapupload = function(jsonObj) {
    var thisGraph = this;

    try {
      var MapContents = JSON.parse(jsonObj);
      thisGraph.deleteGraph(true);
      thisGraph.nodes = MapContents.nodes;
      // console.log(thisGraph.nodes);
      thisGraph.setIdCt(MapContents.nodes.length + 1);
      var newEdges = MapContents.edges;
      newEdges.forEach(function(e, i){
        newEdges[i] = {
          id: e.id,
          label: e.label,
          source: thisGraph.nodes.filter(function(n){return n.id == e.source;})[0],
          target: thisGraph.nodes.filter(function(n){return n.id == e.target;})[0],
        };
      });
      thisGraph.edges = newEdges;
      thisGraph.updateGraph();
    } catch (err) {
      window.alert("Error parsing uploaded file\nerror message: " + err.message);
      return;
    }
  };

  // ノード選択
  GraphCreator2.prototype.replaceSelectNode = function(d3Node, nodeData){
    var thisGraph = this;
    d3Node.classed(this.consts.selectedClass, true);
    if (thisGraph.state.selectedNode){
      thisGraph.removeSelectFromNode();
    }
    thisGraph.state.selectedNode = nodeData;
    // graph.addnode(nodeData);
  };

  GraphCreator2.prototype.removeSelectFromNode = function(){
    var thisGraph = this;
    thisGraph.circles.filter(function(cd){
      return cd.id === thisGraph.state.selectedNode.id;
    }).classed(thisGraph.consts.selectedClass, false);
    // graph.addnode(thisGraph.state.selectedNode);
    thisGraph.state.selectedNode = null;
  };

  // mousedown on node
  GraphCreator2.prototype.circleMouseDown = function(d3node, d){
    var thisGraph = this,
    state = thisGraph.state;
    d3.event.stopPropagation();
    state.mouseDownNode = d;
    if (d3.event.shiftKey){
      state.shiftNodeDrag = d3.event.shiftKey;
      // reposition dragged directed edge
      thisGraph.dragLine.classed('hidden', false)
      .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
      return;
    }
  };

  // mouseup on nodes
  GraphCreator2.prototype.circleMouseUp = function(d3node, d){
    var thisGraph = this,
    state = thisGraph.state,
    consts = thisGraph.consts;
    // reset the states
    state.shiftNodeDrag = false;
    d3node.classed(consts.connectClass, false);

    var mouseDownNode = state.mouseDownNode;

    if (!mouseDownNode) return;

    thisGraph.dragLine.classed("hidden", true);

    // 現在選択しているノード
    var prevNode = state.selectedNode;

    // 今選択しているノードがないor前回と異なるノードを選択
    if (!prevNode || prevNode.id !== d.id){
      // ノード選択に関する関数
      thisGraph.replaceSelectNode(d3node, d);
    } else {
      // 同じノードを2回選択
      // 2回選択されたらそのノードを自身のマップに追加する
      graph.addnode(prevNode);
      thisGraph.removeSelectFromNode();
    }
  }; // end of circles mouseup

  GraphCreator2.prototype.insertTitleLinebreaks = function (gEl, title) {
    var words = title.split(/\s+/g),
    nwords = words.length;
    var el = gEl.append("text")
    .attr("text-anchor","middle")
    .attr("dy", "-" + (nwords-1)*7.5);

    for (var i = 0; i < words.length; i++) {
      var tspan = el.append('tspan').text(words[i]);
      if (i > 0)
      tspan.attr('x', 0).attr('dy', '15');
    }
  };

  GraphCreator2.prototype.updateGraph = function(){

    var thisGraph = this,
    consts = thisGraph.consts,
    state = thisGraph.state;

    thisGraph.labels = thisGraph.labels.data(thisGraph.edges, function(d) {
      return String(d.source.id) + "+" + String(d.target.id);
    });
    thisGraph.paths = thisGraph.paths.data(thisGraph.edges, function(d){
      return String(d.source.id) + "+" + String(d.target.id);
    });
    var paths = thisGraph.paths;
    // update existing paths
    paths.style('marker-end', 'url(#end-arrow)')
    .classed(consts.selectedClass, function(d){
      return d === state.selectedEdge;
    })
    .attr("d", function(d){
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
    });

    // add new paths
    paths.enter()
    .append("path")
    .style('marker-end','url(#end-arrow)')
    .classed("link", true)
    // graph1とIDが被る cmpidにする
    .attr("id", function(d){ return "cmpid" + d["id"]})
    .attr("d", function(d){
      return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
    })
    .on("mousedown", function(d){
      thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
    }
  )
    .on("mouseup", function(d){
      state.mouseDownLink = null;
    });

    // remove old links
    paths.exit().remove();

    var labels = thisGraph.labels;

    // add link label
    labels.enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", 0)
    .attr("dy", 16)
    // .attr("opacity", function(d,i){return  (i>1)?"1":"0"})
    .append("textPath")
    .attr("startOffset", "50%")
    //pathのIDを入れて連携
    .attr("xlink:href", function(d){ return "#cmpid" + d["id"]})
    .text(function(d){ return d["label"]})
    .on("mouseup", function(d) {
      // thisGraph.linklabelMouseUp.call(thisGraph, d3.select(this), d);
    });


    // link label 回転
    labels.attr('transform', function(d) {
      if (d.target.x < d.source.x) {
        var bbox = this.getBBox();

        var rx = bbox.x + bbox.width / 2;
        var ry = bbox.y + bbox.height / 2;
        return 'rotate(180 ' + (rx) + ' ' + (ry) + ')';
      } else {
        return 'rotate(0)';
      }
    });

    labels.exit().remove();

    // update existing nodes
    thisGraph.circles = thisGraph.circles.data(thisGraph.nodes, function(d){ return d.id;});
    thisGraph.circles.attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";});

    // add new nodes
    var newGs= thisGraph.circles.enter()
    .append("g");

    newGs.classed(consts.circleGClass, true)
    .attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";})
    .on("mouseover", function(d){
      if (state.shiftNodeDrag){
        d3.select(this).classed(consts.connectClass, true);
      }
    })
    .on("mouseout", function(d){
      d3.select(this).classed(consts.connectClass, false);
    })
    .on("mousedown", function(d){
      thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
    })
    .on("mouseup", function(d){
      thisGraph.circleMouseUp.call(thisGraph, d3.select(this), d);
    });
    // .call(thisGraph.drag);

    newGs.append("circle")
    .attr("r", String(consts.nodeRadius));

    newGs.each(function(d){
      thisGraph.insertTitleLinebreaks(d3.select(this), d.title);
    });

    // remove old nodes
    thisGraph.circles.exit().remove();
    };

    GraphCreator.prototype.zoomed = function(){
      this.state.justScaleTransGraph = true;
      d3.select("." + this.consts.graphClass)
      .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    };

    GraphCreator2.prototype.zoomed = function(){
      this.state.justScaleTransGraph = true;
      d3.select(".graph2")
      .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    };

    GraphCreator.prototype.updateWindow = function(svg){
      var thisGraph = this;
      var docEl = document.documentElement,
      bodyEl = document.getElementsByTagName('body')[0];
      var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
      var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;

      if (this.state.activeComparing) {
        svg.attr("width", x / 2).attr("height", y);
      } else {
        svg.attr("width", x).attr("height", y);
      }
    };

    var MapUpload = function() {
      $.ajax({
        type: "POST",
        url: "MapSearch.php"
      }).done(function( msg ) {
        var MapContents = JSON.parse(msg);
        nodes = MapContents["nodes"];
        edges = MapContents["edges"];
        edges.forEach(function(e, i){
          edges[i] = {
            id: e.id,
            label: e.label,
            source: nodes.filter(function(n){return n.id == e.source;})[0],
            target: nodes.filter(function(n){return n.id == e.target;})[0],
          };
        });
      });
    };

/**** MAIN ****/

// warn the user when leaving
window.onbeforeunload = function(){
  return "Make sure to save your graph locally before leaving :-)";
};

var docEl = document.documentElement,
bodyEl = document.getElementsByTagName('body')[0];

var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;

var xLoc = width / 3,
yLoc = 200;

// initial node data
// var nodes = [{id: 0, title: "new concept", x: xLoc, y: yLoc},
//               {id: 1, title:"new concept", x: xLoc, y: yLoc + 200},
//               {id: 2, title:"new concept", x: xLoc+200, y: yLoc + 400}];
// var edges = [{id: 0, source: nodes[1], target: nodes[0], label: "label1"},
//               {id: 1, source: nodes[2], target: nodes[0], label: "label2"}];
var nodes = [], edges = [];

var nodes2 = [{id: 0, title: "new concept1", x: xLoc - 200, y: yLoc},
{id: 1, title:"new concept", x: xLoc, y: yLoc + 200}];
var edges2 = [{id: 0, source: nodes2[1], target: nodes2[0], label: "new label"}];


/** MAIN SVG **/
var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height)
.attr("id", "svg")
.style("position", "relative")
.style("top", 100);
// .style("left", 0);


var graph = new GraphCreator(svg, nodes, edges);
graph.MapUpload();
// graph.RegistMap();

var svg2 = d3.select("body").append("svg")
.attr("width", width / 2)
.attr("height", height)
.attr("id", "svg2")
.style("position", "relative")
.style("top", 100)
// .style("right", 0)
.style("background-color", "white");
// .style("visibility", "hidden");

//比較用のマップを出力するSVGの高さを整数型で取得(translateで使用できるようにするため)
var svgH = parseInt(svg2.style("height"));

//比較対象のグラフ作成
var graph2 = new GraphCreator2(svg2, nodes2, edges2);
graph2.setIdCt(2);
graph2.updateGraph();
})(window.d3, window.saveAs, window.Blob);
