function rightSide(box) {
  return { x: box.left + box.width, y: box.top + (box.height/2)};
}

function leftSide(box) {
  return { x: box.left, y: box.top + (box.height/2)};
}

function topSide(box) {
  return { x: box.left + (box.width/2), y: box.top};
}

function bottomSide(box) {
  return { x: box.left + (box.width/2), y: box.top + box.height};
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


function recursiveSpans(sel, controllerScope) {
  // this wraps _everything_ in a span, including
  // content nodes that don't require it. . . to
  // work around this we would need a way to 
  // dynamically choose to append a span or a 
  // text element based on the data. . . right now
  // d3.append only takes a constant
  sel.each(function (selected) {
    if (selected.nodes) {
      d3.select(this)
        .selectAll("span")
        .data(selected.nodes)
        .enter()
        .append("span")
        .attr("class", function (d) { return d.style })
        .attr("id", function (d) { return d.id })
        .call(recursiveSpans)
        .filter(function (d) { return "id" in d; })
        .on("click", function (d) {
          // FIXME: need to refresh everything after this happens
          controllerScope.updateSelection(d.id);
          rangy.getSelection().removeAllRanges();

          // in case spans are nested, only select this one
          d3.event.stopPropagation();
        });
    } else if (selected.content) {
      d3.select(this)
        .text(selected.content)
    }
  });
}

function getWidth($node) {
  // jquery's width() seems to return 0 for svg nodes
  return $node.width() === 0 ? $node.attr("width") : $node.width(); 
}

function getHeight($node) {
  // jquery's height() seems to return 0 for svg nodes
  return $node.height() === 0 ? $node.attr("height") : $node.height(); 
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

function makeConnectionCoords(connections) {
  var connectionCoords = [];
  for (var i=0; i<connections.length; i++) {
    var $left = jQuery("#"+connections[i][0]);
    var $right = jQuery("#"+connections[i][1]);
    var leftBox = { 
      left: $left.offset().left, 
      top: $left.offset().top, 
      width: getWidth($left), 
      height: getHeight($left), 
    };
    var rightBox = { 
      left: $right.offset().left, 
      top: $right.offset().top, 
      width: getWidth($right), 
      height: getHeight($right), 
    };
    var best = getBestConnection(leftBox, rightBox);
    connectionCoords.push({
      x1: best[0].x,
      y1: best[0].y,
      x2: best[1].x,
      y2: best[1].y,
    });
  }
  return connectionCoords;
}

function render(controllerScope) {

  var htmlLayer = d3.select("#htmlLayer");

  var svg = d3.select("#mainSvg")
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
    .attr("id", function (d) { return d.id })
    .each(function (artifact) { 
      // differentiate between images and text
      if ("imageSrc" in artifact) {
        d3.select(this).append("img")
          .attr("src", artifact.imageSrc);

        var className = "imageBox"+artifact.id;
        var imageBox = svg.selectAll("."+className)
          .data(makeImageBoxes(this, artifact));
        imageBox.enter()
          .append("rect")
          .attr("id", function (d) { return d.id })
          .attr("x", function (d) { return d.left })
          .attr("y", function (d) { return d.top })
          .attr("width", function (d) { return d.width })
          .attr("height", function (d) { return d.height })
          .attr("class", className)
          .on("click", function (d) { 
            console.log("clicked");
            controllerScope.updateSelection(d.id);
            rangy.getSelection().removeAllRanges();
          });
        imageBox.exit()
          .remove();
      } else {
        d3.select(this).call(recursiveSpans, controllerScope);
      }
    });
  artifact.exit()
    .remove();

  var line = svg.selectAll(".connection")
    .data(makeConnectionCoords(controllerScope.connections));
  line.enter()
    .append("line")
    .attr("class", "connection")
    .attr("stroke", "green")
    .attr("stroke-width", "1")
    .attr("x1", function (d) { return d.x1 })
    .attr("y1", function (d) { return d.y1 })
    .attr("x2", function (d) { return d.x2 })
    .attr("y2", function (d) { return d.y2 });
  line.exit()
    .remove();


  // FIXME:
  // X draw connections
  // X render images
  // * allow for selection
  // * allow for range creation
  // * allow for connection creation
  // * allow for image area creation
}
