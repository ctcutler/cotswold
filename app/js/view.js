function rightSide(box) {
  return { x: box.x + box.width, y: box.y + (box.height/2)};
}

function leftSide(box) {
  return { x: box.x, y: box.y + (box.height/2)};
}

function topSide(box) {
  return { x: box.x + (box.width/2), y: box.y};
}

function bottomSide(box) {
  return { x: box.x + (box.width/2), y: box.y + box.height};
}

function getPerimeter(point1, point2) {
  return (2 * Math.abs(point1.x-point2.x)) + (2 * Math.abs(point1.y-point2.y));
}


function getBestConnection(box1, box2) {
  // go through every possible permutation of midpoints looking
  // for the shortest
  var shortest = Number.MAX_VALUE;
  var shortestPair = null;
  var permutations = [
    /*
    Even when these are correct they don't look right

    [rightSide(box1), rightSide(box2)],
    [leftSide(box1), leftSide(box2)],
    [topSide(box1), topSide(box2)],
    [bottomSide(box1), bottomSide(box2)],
    */

    [rightSide(box1), leftSide(box2)],
    [leftSide(box1), rightSide(box2)],
    [rightSide(box1), topSide(box2)],
    [topSide(box1), rightSide(box2)],
    [rightSide(box1), bottomSide(box2)],
    [bottomSide(box1), rightSide(box2)],
    [leftSide(box1), topSide(box2)],
    [topSide(box1), leftSide(box2)],
    [leftSide(box1), bottomSide(box2)],
    [bottomSide(box1), leftSide(box2)],
    [topSide(box1), bottomSide(box2)],
    [bottomSide(box1), topSide(box2)],
  ];

  for (var i=0; i < permutations.length; i++) {
    var perm = permutations[i];
    var perimeter = getPerimeter(perm[0], perm[1]);
    if (perimeter > 0 && perimeter < shortest) {
      shortest = perimeter;
      shortestPair = perm;
    }
  }
  
  return shortestPair;
}

function makeSpanClass(d) { 
  if (d.id === undefined) return "";

  var klass = "allborders "+d.color;
  if (d.truncation === "left") {
    klass += " truncatedLeft";
  } else if (d.truncation === "right") {
    klass += " truncatedRight";
  } else if (d.truncation === "both") {
    klass += " truncatedBoth";
  } 
  if (d.selected) {
    klass += " selected";
  }
  return klass;
}

function addColorChooser(selection, setColorFunc) {
  var colorChooser = selection.selectAll(".colorChooser")
    .data(function (d) { 
      return [d.color];
    });
  colorChooser.enter()
    .append("div")
    .attr("class", "colorChooser");
  colorChooser.exit()
    .remove();

  var colorBox = selection.selectAll(".colorBox")
    .data(COLORS);
  colorBox.enter()
    .append("div")
    .on("click", function (d) {
      setColorFunc(getParentData(this).id, d);
    });
  colorBox.attr("class", function (d) { 
      var pData = getParentData(this);
      return "colorBox " + d  +
        (getParentData(this).color == d ? " selectedColor" : "");
    });
  colorChooser.exit()
    .remove();
}

function recursiveSpans(sel) {
  // this wraps _everything_ in a span, including
  // content nodes that don't require it. . . to
  // work around this we would need a way to 
  // dynamically choose to append a span or a 
  // text element based on the data. . . right now
  // d3.append only takes a constant
  sel.each(function (selected) {
    if (selected.nodes) {
      var selector = "#"+selected.id+" > span";

      var span = d3.select(this)
        .selectAll(selector)
        .data(selected.nodes, function (d) { 
          if (d.id != undefined) {
            return d.id;
          } else {
            return d.start + ":" + d.end;
          }
        });

      span.enter()
        .append("span");

      span
        .attr("class", makeSpanClass)
        .call(recursiveSpans)
        .filter(function (d) { return "id" in d; })
        .attr("id", function (d) { return d.id })
        .on("click", function (d) {
          controllerScope.clearAllSelectedConnections(true);
          controllerScope.updateSelection(d.id);
          rangy.getSelection().removeAllRanges();
          // in case spans are nested, only select this one
          d3.event.stopPropagation();
        });

      span.exit().remove();

      span.order();

      var spanDetailClass = "spanDetail"+selected.id;
      var spanDetail = popUpLayer
        .selectAll("."+spanDetailClass)
        .data(
          selected.nodes.filter(function (d) { return d.selected }),
          function (d) { return d.id; }
        );
      spanDetail.enter()
        .append("div")
        .attr("class", spanDetailClass);
      spanDetail
        .attr("class", function (d) { return spanDetailClass })
        .attr("style", makeSpanDetailStyle);
      spanDetail.exit()
        .remove();

      addColorChooser(spanDetail, controllerScope.setRangeColor);

    } else if (selected.content) {
      d3.select(this)
        .html(selected.content.replace(/\n/g, "<br />"));
    }
  });
}

function smallerWithMin(a, b, min) {
  return Math.max(min, Math.min(a, b));
}

function largerWithMax(a, b, max) {
  return Math.min(max, Math.max(a, b));
}

function getDragBoxX(d) {
  var curX = d3.mouse(jQuery("#svgLayer")[0])[0];
  return smallerWithMin(curX, d.originX, d.minX);
}
function getDragBoxY(d) {
  var curY = d3.mouse(jQuery("#svgLayer")[0])[1];
  return smallerWithMin(curY, d.originY, d.minY);
}
function getDragBoxWidth(d) {
  var curX = d3.mouse(jQuery("#svgLayer")[0])[0];
  return largerWithMax(curX, d.originX, d.maxX) 
    - smallerWithMin(curX, d.originX, d.minX);
}
function getDragBoxHeight(d) {
  var curY = d3.mouse(jQuery("#svgLayer")[0])[1];
  return largerWithMax(curY, d.originY, d.maxY) 
    - smallerWithMin(curY, d.originY, d.minY);
}

function makeDragBehavior(artifact, img) {
  var $img = jQuery(img);
  return d3.behavior.drag()
    .on("dragstart", function(d,i) {
      // add rect
      var coords = d3.mouse(jQuery("#svgLayer")[0]);
      svg.append("rect")
        .data([{
          originX: coords[0], 
          originY: coords[1],
          minX: $img.offset().left,
          minY: $img.offset().top,
          maxX: $img.offset().left + $img.width(),
          maxY: $img.offset().top + $img.height(),
        }])
        .attr("class", "dragBox")
        .attr("x", coords[0])
        .attr("y", coords[1]);
    }).on("drag", function(d,i) {
      // resize rect
      var dragBox = svg.select("rect.dragBox");
      dragBox
        .attr("x", getDragBoxX)
        .attr("y", getDragBoxY)
        .attr("width", getDragBoxWidth)
        .attr("height", getDragBoxHeight);
    }).on("dragend", function(d,i) {
      // remove rect
      var dragBox = svg.select("rect.dragBox");
      var bbox = dragBox[0][0].getBBox();
      controllerScope.makeImageRange(
        artifact.id,
        bbox.x - $img.offset().left,
        bbox.y - $img.offset().top,
        bbox.width,
        bbox.height
      );
      dragBox.remove();
    });
}

function updateArtifacts(artifact) {
  artifact.each(function (artifact) { 
    // differentiate between images and text
    if ("imageSrc" in artifact) {
      var img = d3.select(this)
        .selectAll("img")
        .data([artifact.imageSrc]);
    
      img.enter()
        .append("img")
        .attr("src", artifact.imageSrc);

      // img[0] assumes there will only be one image per artifact
      img.call(makeDragBehavior(artifact, img[0]));

      var className = "imageBox";
      var artifactClassName = artifact.id+"ImageBox";
      var imageBox = svg.selectAll("."+className+"."+artifactClassName)
        .data(artifact.ranges, function (d) { return d.id; });
      var boxParentLeft = jQuery(this).offset().left;
      var boxParentTop = jQuery(this).offset().top;
      imageBox.enter()
        .append("rect")
        .attr("id", function (d) { return d.id })
        .attr("x", function (d) { 
          return d.left + boxParentLeft
        })
        .attr("y", function (d) { 
          return d.top + boxParentTop
        })
        .attr("width", function (d) { return d.width })
        .attr("height", function (d) { return d.height })
        .on("click", function (d) {
          controllerScope.clearAllSelectedConnections(true);
          controllerScope.updateSelection(d.id);
          rangy.getSelection().removeAllRanges();
          d3.event.stopPropagation();
        });

      imageBox
        .attr("style", function (d) { return d.color})
        .attr("class", function (d) { 
          return className + " " + artifactClassName + " " + d.color
        });

      imageBox.exit()
        .remove();

      var imageBoxDetailClass = "imageBoxDetail"+artifact.id;
      var imageBoxDetail = popUpLayer
        .selectAll("."+imageBoxDetailClass)
        .data(
          artifact.ranges.filter(function (d) { return d.selected }), 
          function (d) { return d.id; }
        );
      imageBoxDetail.enter()
        .append("div")
        .attr("class", imageBoxDetailClass);
      imageBoxDetail
        .attr("class", function (d) { return imageBoxDetailClass })
        .attr("style", function (d) {
          return "left: "
            + (boxParentLeft + d.left + d.width)
            + "px; top: "
            + (boxParentTop + d.top + d.height)
            + "px";
        });
      imageBoxDetail.exit()
        .remove();

      addColorChooser(imageBoxDetail, controllerScope.setRangeColor);
    } else {
      d3.select(this).call(recursiveSpans);
    }
  });
}

function makeBox(id) {
  var box = {};
  var node = document.getElementById(id);
  if (node.nodeName === "SPAN") {
    var $node = jQuery(node);
    box.x = $node.offset().left;
    box.y = $node.offset().top;
    box.width = $node.width();
    box.height = $node.height();
  } else if (node.nodeName === "rect" 
    || node.nodeName === "line") {
    box = node.getBBox();
  } else {
    console.log("unknown node type: " + node.nodeName);
  }
  return box;
}

function addConnectionCoords(connections) {
  for (var i=0; i<connections.length; i++) {
    var connection = connections[i];
    var leftBox = makeBox(connection.rangeIds[0]);
    var rightBox = makeBox(connection.rangeIds[1]);
    var best = getBestConnection(leftBox, rightBox);
    connection["coords"] = {
      x1: best[0].x,
      y1: best[0].y,
      x2: best[1].x,
      y2: best[1].y,
    };
  }
  return connections;
}

function getMidpoint(a, b) {
  if (a > b) {
    return ((a - b)/2)+b;
  } else {
    return ((b - a)/2)+a;
  }
}

function makeSpanDetailStyle(d) {
  var box = makeBox(d.id);
  return "left: "
    + (box.x + box.width)
    + "px; top: "
    + (box.y + box.height)
    + "px";
}

function makeImageBoxDetailStyle(d) {
  return "left: "
    + (d.left + d.width)
    + "px; top: "
    + (d.top + d.height)
    + "px";
}

function makeConnectionDetailStyle(d) {
  var coords = d.coords;
  return "left: "
    + getMidpoint(coords.x1, coords.x2)
    + "px; top: "
    + getMidpoint(coords.y1, coords.y2)
    + "px";
}

function getParentData(node) {
  return d3.select(node.parentNode).datum();
}

var controllerScope;
var svg;
var htmlLayer;
var popUpLayer;

function render(scope) {
  if (scope) {
    controllerScope = scope;
  }

  htmlLayer = d3.select("#htmlLayer");

  svg = d3.select("#mainSvg")
    .attr("width", htmlLayer.style("width"))
    .attr("height", htmlLayer.style("height"));

  popUpLayer = d3.select("#popUpLayer")
    .attr("style", "width: "
      + htmlLayer.style("width")
      + "; height: "
      + htmlLayer.style("height")
      + ";");

  var timepoints = htmlLayer.selectAll(".timepoint")
    .data(controllerScope.timepoints);
  timepoints.enter()
    .append("div")
    .html(function(d) {
        return "<b>"+d.name+"</b><p/>";
      })
    .attr("class", "timepoint");
  timepoints.exit()
    .remove();

  var artifact = timepoints.selectAll(".artifact")
    .data(function (d) { 
      return d.artifacts 
    }, 
    function (d) { 
      return d.id 
    });
  artifact.enter()
    .append("div")
    .attr("class", "artifact")
    .attr("id", function (d) { 
      return d.id 
    });
  updateArtifacts(artifact);
  artifact.exit()
    .remove();

  var connections = addConnectionCoords(controllerScope.connections);
  var line = svg.selectAll(".connection")
    .data(connections, function(d) { return d.id; });
  line.enter()
    .append("line")
    .attr("class", "connection")
    .attr("stroke-width", 3)
    .attr("id", function (d) { return d.id })
    .on("click", function (d) {
      controllerScope.clearAllSelectedRanges(true);
      controllerScope.selectConnection(d.id);
    })
    .attr("x1", function (d) { return d.coords.x1 })
    .attr("y1", function (d) { return d.coords.y1 })
    .attr("x2", function (d) { return d.coords.x1 })
    .attr("y2", function (d) { return d.coords.y1 });
  line
    .attr("x1", function (d) { return d.coords.x1 })
    .attr("y1", function (d) { return d.coords.y1 })
    .attr("x2", function (d) { return d.coords.x2 })
    .attr("y2", function (d) { return d.coords.y2 })
    .attr("class", function (d) { return "connection "+d.color });
  line.exit()
    .remove();

  var connectionDetail = popUpLayer.selectAll(".connectionDetail")
    .data(
      connections.filter(function (d) { return d.selected }), 
      function(d) { return d.id; }
    );
  connectionDetail.enter()
    .append("div")
    .attr("class", "connectionDetail");
  connectionDetail.attr("class", function (d) { return "connectionDetail" })
    .attr("style", makeConnectionDetailStyle);
  connectionDetail.exit()
    .remove();

  var connectionNote = connectionDetail.selectAll(".connectionNote")
    .data(function (d) { 
      return [d.note];
    });
  connectionNote.enter()
    .append("textarea")
    .attr("class", "connectionNote")
    .on("input", function (d) {
      getParentData(this).note = this.value;
      controllerScope.save();
    })
    .attr("rows", 4);
  connectionNote.text(function (d) { return d; });
  connectionNote.exit()
    .remove();

  addColorChooser(connectionDetail, controllerScope.setConnectionColor);

 }
