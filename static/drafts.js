var selectedChange = null;

function getSelectionObject() { 
  if (window.getSelection) { 
    return window.getSelection(); 
  } else if (document.getSelection) { 
    return document.getSelection(); 
  } else if (document.selection) { 
    return document.selection.createRange().text; 
  } 
} 

function getTextNodes(parent) {
  var rv = [];
  for (var i=0; i < parent.childNodes.length; i++) {
    var child = parent.childNodes[i];
    if (child.nodeName == "#text") {
      rv.push(child);
    } else if (child.childNodes.length > 0) {
      rv = rv.concat(getTextNodes(child));
    }
  }
  return rv;
}

function selectChange(event) {
  selectedChange = event.data.selectedId;
  redraw(null);
}

function selectFeedback(event) {
  var selectedFeedbackId = event.data.selectedId;
  var selection = getSelectionObject();
  var range = selection.getRangeAt(0);
  if (range.collapsed) {
    feedbackSelectionStart = -1;
    feedbackSelectionEnd = -1;
    return;
  }
  var textNodes = getTextNodes(this);
  var startOffset = 0;
  for (var i=0; i<textNodes.length; i++) {
    var textNode = textNodes[i];
    if (textNode == range.startContainer) {
      startOffset += range.startOffset;
      break;
    } else {
      startOffset += textNode.data.length;
    }
  }

  feedBackSelectionStart = startOffset;
  feedBackSelectionEnd = startOffset + selection.toString().length;

  if (selectedChange) {
    // make async backend call associating selected text with 
    // selected change. . . if it succeeds, reload
    $.ajax({
      type: "POST",
      url: "/feedbackedChanges", 
      data: {
        changeId: getChangeIdFromSpanId(selectedChange),
        feedbackStart: feedBackSelectionStart,
        feedbackEnd: feedBackSelectionEnd,
        feedbackId: selectedFeedbackId,
      },
      success: function(data) { alert(data); location.reload(); }
    });
  }
}

function getChangeIdFromSpanId(spanId) {
  // span id format: block-%(block_name)s-chunk-%(chunk_name)s
  // chunk name format: %(draft_id)i.%(change_id)i
  return spanId.split("-")[3].split(".")[1];
}

function cornersToStr(c) {
  return "ur: "+c.ur.x+" "+c.ur.y
    +", ul: "+c.ul.x+" "+c.ul.y
    +", lr: "+c.lr.x+" "+c.lr.y
    +", ll: "+c.ll.x+" "+c.ll.y;
}

function getClosest(corners1, corners2) {
  var rv = {
    corner1: corners1.ur,
    corner2: corners2.ul
  };
  var minXDelta = Math.abs(rv.corner1.x - rv.corner2.x);
  var minYDelta = Math.abs(rv.corner1.y - rv.corner2.y);
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

function makeSpanStartId(spanId) {
  return spanId + "-start";
}

function makeSpanEndId(spanId) {
  return spanId + "-start";
}

function getCorners(spanId) {
  var wholeSpan = $("#"+spanId);
  var spanStart = $("#"+makeSpanStartId(spanId));
  var spanEnd = $("#"+makeSpanEndId(spanId));
  var wholeSpanPos = wholeSpan.offset();
  var spanStartPos = spanStart.offset();
  var spanEndPos = spanEnd.offset();
  return {
    ul: {x: spanStartPos.left, y: spanStartPos.top},
    ll: {x: wholeSpanPos.left, y: wholeSpanPos.top+wholeSpan.height()},
    ur: {x: wholeSpanPos.left+wholeSpan.width(), y: wholeSpanPos.top},
    lr: {x: spanEndPos.left+spanEnd.width(), y: spanEndPos.top+spanEnd.height()},
  };

  return rv;
}

function getLineCoords(id1, id2) {
  return getClosest(getCorners(id1), getCorners(id2));
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

function drawLine(svg, id1, id2, color, highlighted) {
  var lineCoords = getLineCoords(id1, id2);
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
      strokeWidth: highlighted ? 3 : 1
    }
  );

  // TEST CODE ONLY
  //drawRect(svg, getCorners(id1));
  //drawRect(svg, getCorners(id2));
}

function redraw(event) {
  // prepare the surface
  var lineSurface = $('#lineSurface');
  var svg;
  if (!hasSvgChild(lineSurface)) {
    lineSurface.svg();
    svg = lineSurface.svg('get');
    svg.configure(
      {width: $(document).width(), height: $(document).height()}, 
      true
    );
  } else {
    svg = lineSurface.svg('get');
  }
  svg.clear();

  $.each(
    lines, 
    function() {
      drawLine(
        svg, 
        this.id1, 
        this.id2, 
        this.color, 
        this.id1 == selectedChange || this.id2 == selectedChange
      )
    }
  );
}

lines = [];

$(window).resize(redraw);
$(document).ready(redraw);
