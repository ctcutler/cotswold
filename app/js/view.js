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
    [rightSide(box1), rightSide(box2)],
    [leftSide(box1), leftSide(box2)],
    [topSide(box1), topSide(box2)],
    [bottomSide(box1), bottomSide(box2)],
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
 
  var connectionEnds = [];
  for (var i=0; i<connections.length; i++) {
    connectionEnds.push(connections[i][0]);
    connectionEnds.push(connections[i][1]);
  }

  // FIXME: too much more of this positioning code and we'll go straight
  // to jquery for the values
  svg.selectAll("rect")
    .data(connectionEnds)
    .enter()
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("x", function (d) { return artifacts.select("#"+d).property("offsetLeft")})
    .attr("y", function (d) { return artifacts.select("#"+d).property("offsetTop")})
    .attr("width", function (d) { return artifacts.select("#"+d).property("offsetWidth")})
    .attr("height", function (d) { return artifacts.select("#"+d).property("offsetHeight")});

  // FIXME:
  // * render images
  // * draw connections
  // * allow for selection
  // * allow for range creation
  // * allow for connection creation
  // * allow for image area creation
}
