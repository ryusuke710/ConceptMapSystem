document.onload = (function(d3, saveAs, Blob, undefined){
  "use strict";

  // define graphcreator object
  var GraphCreator = function(svg, nodes, edges){
    var thisGraph = this;
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

  GraphCreator.prototype.MapUpload = function() {
    var thisGraph = this;
    $.ajax({
      type: "POST",
      url: "MapSearch_teacher.php"
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
        // this.RegistMap();
      }
    });
  };

  // GraphCreator.prototype.RegistMap = function() {
  //   var thisGraph = this;
  //   var saveEdges = [];
  //   thisGraph.edges.forEach(function(val, i){
  //     saveEdges.push({id: val.id, source: val.source.id, target: val.target.id, label: val.label});
  //   });
  //
  //   // add
  //   $.ajax({
  //     type: "POST",
  //     url: "test.php",
  //     datatype: 'json',
  //     data: {data:JSON.stringify({edges: saveEdges, nodes: thisGraph.nodes})},
  //   }).done(function( msg ) {
  //     console.log(msg);
  //   });
  // };

  GraphCreator.prototype.dragmove = function(d) {
    var thisGraph = this;
    if (thisGraph.state.shiftNodeDrag){
      thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(thisGraph.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
    } else {
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
    .attr("text", function(d){ return d["id"]});

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
    .text(function(d){ return d["label"]});

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
    .call(thisGraph.drag);

    newGs.append("circle")
    .attr("r", String(consts.nodeRadius));

    newGs.each(function(d){
      thisGraph.insertTitleLinebreaks(d3.select(this), d.title);
    });

  };

  GraphCreator.prototype.zoomed = function(){
    this.state.justScaleTransGraph = true;
    d3.select("." + this.consts.graphClass)
    .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
  };

  GraphCreator.prototype.updateWindow = function(svg){
    var thisGraph = this;
    var docEl = document.documentElement,
    bodyEl = document.getElementsByTagName('body')[0];
    var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
    var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;

    svg.attr("width", x).attr("height", y);
  };

  document.getElementById("Fin").onclick = function() {
    location.href = "MapList.php";
  }

/**** MAIN ****/

// warn the user when leaving
// window.onbeforeunload = function(){
//   return "Make sure to save your graph locally before leaving :-)";
// };

var docEl = document.documentElement,
bodyEl = document.getElementsByTagName('body')[0];

var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;

var xLoc = width / 3,
yLoc = 200;

// initial node data
var nodes = [], edges = [];

/** MAIN SVG **/
var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height)
.attr("id", "svg")
.style("position", "absolute")
.style("bottom", 100)
// .style("top", 30)
.style("border-bottom", "solid 3px black");
// .style("left", 0);


var graph = new GraphCreator(svg, nodes, edges);
graph.MapUpload();

// 表示する前にテキスト内容があるか確認(DBに接続)
$.ajax({
  type: "POST",
  url: "ConcCheck_teacher.php"
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

$.ajax({
  type: "POST",
  url: "UserInfo_teacher.php"
}).done(function( msg ) {
  var d = JSON.parse(msg);
  var Info = document.getElementById("Info");
  Info.innerHTML = d["UserName"] + " の " + d["MapName"];
});

})(window.d3, window.saveAs, window.Blob);
