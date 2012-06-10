function cornersToStr(c) {
  return "ur: "+c.ur.x+" "+c.ur.y
    +", ul: "+c.ul.x+" "+c.ul.y
    +", lr: "+c.lr.x+" "+c.lr.y
    +", ll: "+c.ll.x+" "+c.ll.y;
}

function testRowHeight() {
  var heightTest = document.getElementById("heightTest");
  return heightTest.clientHeight;
}

function getClosest(corners1, corners2) {
  var rv = {
    corner1: corners1.ur,
    corner2: corners2.ul
  };
  var minXDelta = Math.abs(rv.corner1.x - rv.corner2.x);
  var minYDelta = Math.abs(rv.corner1.y - rv.corner2.y);
  var rowHeight = testRowHeight();
  // if there is wrapping across multiple rows, tweak the corners 
  if (corners1.ll - corners1.ul != rowHeight) {
    corners1.ul.y += rowHeight;
    corners1.lr.y -= rowHeight;
  }
  if (corners2.ll - corners2.ul != rowHeight) {
    corners2.ul.y += rowHeight;
    corners2.lr.y -= rowHeight;
  }
  var perms = [
    { name: "ur ur", corner1: corners1.ur, corner2: corners2.ur},
    { name: "ur ul", corner1: corners1.ur, corner2: corners2.ul},
    { name: "ur lr", corner1: corners1.ur, corner2: corners2.lr},
    { name: "ur ll", corner1: corners1.ur, corner2: corners2.ll},
    { name: "ul ur", corner1: corners1.ul, corner2: corners2.ur},
    { name: "ul ul", corner1: corners1.ul, corner2: corners2.ul},
    { name: "ul lr", corner1: corners1.ul, corner2: corners2.lr},
    { name: "ul ll", corner1: corners1.ul, corner2: corners2.ll},
    { name: "lr ur", corner1: corners1.lr, corner2: corners2.ur},
    { name: "lr ul", corner1: corners1.lr, corner2: corners2.ul},
    { name: "lr lr", corner1: corners1.lr, corner2: corners2.lr},
    { name: "lr ll", corner1: corners1.lr, corner2: corners2.ll},
    { name: "ll ur", corner1: corners1.ll, corner2: corners2.ur},
    { name: "ll ul", corner1: corners1.ll, corner2: corners2.ul},
    { name: "ll lr", corner1: corners1.ll, corner2: corners2.lr},
    { name: "ll ll", corner1: corners1.ll, corner2: corners2.ll},
  ];
  $.each(
    perms,
    function () {
      var xDelta = Math.abs(this.corner1.x - this.corner2.x);
      var yDelta = Math.abs(this.corner1.y - this.corner2.y);
      if (xDelta <= minXDelta && yDelta <= minYDelta) {
        rv = this;
        minXDelta = xDelta;
        minYDelta = yDelta;
      }
    }
  ); 
  
  return rv;
}

function getCorners(spanNode) {
  var span = $(spanNode);
  var spanPos = span.offset();
  return {
    ul: {x: spanPos.left, y: spanPos.top},
    ll: {x: spanPos.left, y: spanPos.top+span.height()},
    ur: {x: spanPos.left+span.width(), y: spanPos.top},
    lr: {x: spanPos.left+span.width(), y: spanPos.top+span.height()},
  };

  return rv;
}

function getLineCoords(span1, span2) {
  return getClosest(getCorners(span1), getCorners(span2));
}

function hasSvgChild(elem) {
  elem.children().each(
    function() {
      if ($.svg.isSVGElem(this)) {
        return true;
      }
    }
  );
  return false;
}

function drawRect(svg, corners) {
  svg.rect(
    corners.ul.x, 
    corners.ul.y, 
    corners.lr.x-corners.ul.x, 
    corners.lr.y-corners.ul.y, 
    {fill: 'none', stroke: 'red', strokeWidth: 1}
  );
}

function drawLine(svg, span1, span2, color, highlight) {
  var lineCoords = getLineCoords(span1, span2);
  var factor = lineCoords.corner2.y-lineCoords.corner1.y;
  var path = svg.createPath();

  svg.path(
    path.move(
      lineCoords.corner1.x,
      lineCoords.corner1.y
    ).curveC(
      lineCoords.corner1.x,
      lineCoords.corner1.y+factor,
      lineCoords.corner2.x,
      lineCoords.corner2.y-factor,
      lineCoords.corner2.x,
      lineCoords.corner2.y
    ), 
    {
      fill: "none", 
      stroke: color,
      strokeWidth: highlight ? 3 : 1
    }
  );

  // TEST CODE ONLY
  //drawRect(svg, getCorners(id1));
  //drawRect(svg, getCorners(id2));
}
