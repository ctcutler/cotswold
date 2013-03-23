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


function recursiveSpans(sel) {
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
        .call(recursiveSpans);
    } else if (selected.content) {
      d3.select(this)
        .text(selected.content)
    }
  });
}

function makeConnectionCoords(connections) {
  var connectionCoords = [];
  for (var i=0; i<connections.length; i++) {
    var $left = jQuery("#"+connections[i][0]);
    var $right = jQuery("#"+connections[i][1]);
    var leftBox = { 
      left: $left.offset().left, top: $left.offset().top, 
      width: $left.width(), height: $left.height(), 
    };
    var rightBox = { 
      left: $right.offset().left, top: $right.offset().top, 
      width: $right.width(), height: $right.height(), 
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

function reload(timeline, connections) {

  var htmlLayer = d3.select("#htmlLayer");

  var timepoints = htmlLayer.selectAll("div")
    .data(timeline)
    .enter()
    .append("div")
    .attr("class", "timepoint");

  var artifacts = timepoints.selectAll("div")
    .data(function (d) { return d.artifacts })
    .enter()
    .append("div")
    .call(recursiveSpans); // spans

  var svgLayer = d3.select("#svgLayer")
  var svg = svgLayer.append("svg")
    .attr("width", htmlLayer.style("width"))
    .attr("height", htmlLayer.style("height"));

  svg.selectAll("line")
    .data(makeConnectionCoords(connections))
    .enter()
    .append("line")
    .attr("stroke", "green")
    .attr("stroke-width", "1")
    .attr("x1", function (d) { return d.x1 })
    .attr("y1", function (d) { return d.y1 })
    .attr("x2", function (d) { return d.x2 })
    .attr("y2", function (d) { return d.y2 });

  // FIXME:
  // X draw connections
  // * render images
  // * allow for selection
  // * allow for range creation
  // * allow for connection creation
  // * allow for image area creation
}
