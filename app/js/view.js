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

  var klass = "allborders green";
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
          if (d.id != undefined)
            return d.id;
          else {
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
          createPopUp(d);
          controllerScope.updateSelection(d.id);
          rangy.getSelection().removeAllRanges();
          // in case spans are nested, only select this one
          d3.event.stopPropagation();
        });

      span.exit().remove();

      span.order();

    } else if (selected.content) {
      d3.select(this)
        .text(selected.content)
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

function getPopUpLeft(d) {
  var node = document.getElementById(d.id);
  var boundingBox = makeBox(d.id);

  return node.nodeName === "line" 
    ? (boundingBox.x + (boundingBox.width/2))+"px"
    : boundingBox.x + boundingBox.width+"px";
}

function getPopUpTop(d) {
  var node = document.getElementById(d.id);
  var boundingBox = makeBox(d.id);
  var rv = (boundingBox.y + (boundingBox.height/2))+"px"

  return node.nodeName === "line" 
    ? (boundingBox.y + (boundingBox.height/2))+"px"
    : boundingBox.y+"px"
}

function createPopUp(d) {
  var menuLabels = ["Foo", "Bar"];
  removePopUp();

  /*
  FIXME: add logic (perhaps list of divs that gets passed in here?)
  to provide contents of the popup, not "Foo", "Bar"

  if (controllerScope.rangeIsConnectable(d.id)) {
    menuLabels.push(connectLabel);
  }
  if (!controllerScope.rangeIsConnected(d.id)) {
    menuLabels.push(removeLabel);
  }
  */

  htmlLayer.append("div")
    .attr("class", "popUp")
    .style("left", getPopUpLeft(d))
    .style("top", getPopUpTop(d))
    .selectAll("div")
    .data(menuLabels)
    .enter()
    .append("div")
    .text(function (d) { return d });

  // in case spans are nested, only add button to this one
  d3.event.stopPropagation();
}

function removePopUp() {
  htmlLayer.selectAll(".popUp").remove();
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
      var imageBox = svg.selectAll("."+className)
        .data(makeImageBoxes(this, artifact), function (d) { return d.id; });
      imageBox.enter()
        .append("rect")
        .attr("id", function (d) { return d.id })
        .attr("x", function (d) { return d.left })
        .attr("y", function (d) { return d.top })
        .attr("width", function (d) { return d.width })
        .attr("height", function (d) { return d.height })
        .on("click", function (d) {
          createPopUp(d);
          controllerScope.updateSelection(d.id);
          rangy.getSelection().removeAllRanges();
          d3.event.stopPropagation();
        });

      imageBox
        .attr("class", function (d) { 
          return d.selected ? className + " imageBoxSelected" : className
        });

      imageBox.exit()
        .remove();
    } else {
      d3.select(this).call(recursiveSpans);
    }
  });
}

function makeImageBoxes(node, artifact) {
  var artifactOffset = jQuery(node).offset();
  var imageBoxes = [];
  for (var i=0; i < artifact.ranges.length; i++) {
    var range = artifact.ranges[i];
    range.left += artifactOffset.left;
    range.top += artifactOffset.top;
    imageBoxes.push(range);
  }
  return imageBoxes;
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

var controllerScope;
var svg;
var htmlLayer;

function render(scope) {
  if (scope) {
    controllerScope = scope;
  }

  htmlLayer = d3.select("#htmlLayer")
    .on("click", function(d) {
      removePopUp();
      controllerScope.clearAllSelections();
    });

  svg = d3.select("#mainSvg")
    .attr("width", htmlLayer.style("width"))
    .attr("height", htmlLayer.style("height"));

  var timepoints = htmlLayer.selectAll(".timepoint")
    .data(controllerScope.timepoints);
  timepoints.enter()
    .append("div")
    .attr("class", "timepoint");
  timepoints.exit()
    .remove();


  var artifact = timepoints.selectAll(".artifact")
    .data(function (d) { 
      return d.artifacts 
    });
  artifact.enter()
    .append("div")
    .attr("class", "artifact")
    .attr("id", function (d) { return d.id });
  updateArtifacts(artifact);
  artifact.exit()
    .remove();

  var line = svg.selectAll(".connection")
    .data(
      addConnectionCoords(controllerScope.connections), 
      function(d) {
        return d.id;
      }
    );
  line.enter()
    .append("line")
    .attr("class", "connection")
    .attr("stroke-width", 3)
    .attr("id", function (d) { return d.id })
    .on("click", function (d) {
      createPopUp(d);
      controllerScope.selectConnection(d.id);
    })
    .attr("x1", function (d) { return d.coords.x1 })
    .attr("y1", function (d) { return d.coords.y1 })
    .attr("x2", function (d) { return d.coords.x1 })
    .attr("y2", function (d) { return d.coords.y1 });
  line.transition()
    .duration(500)
    .attr("x1", function (d) { return d.coords.x1 })
    .attr("y1", function (d) { return d.coords.y1 })
    .attr("x2", function (d) { return d.coords.x2 })
    .attr("y2", function (d) { return d.coords.y2 })
    .attr("stroke", function (d) { return d.selected ? "orange": "green"});
  line.exit()
    .remove();
}
