"use strict";

// FIXME: put dimensions of invisible boxes in here, then draw them
var imageAreas = {};

var paper;

function getPaper() {
  var $glass = $("#connections");
  if (!paper) {
    paper = Raphael("connections", $glass.width(), $glass.height());
  } else {
    paper.setSize($glass.width(), $glass.height());
  }
  return paper
}


// function copied from: http://raphaeljs.com/graffle.html
Raphael.fn.connection = function (obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = getAdjustedBBox(obj1),
        bb2 = getAdjustedBBox(obj2),
        p = [{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
        {x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
        {x: bb1.x - 1, y: bb1.y + bb1.height / 2},
        {x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
        {x: bb2.x + bb2.width / 2, y: bb2.y - 1},
        {x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
        {x: bb2.x - 1, y: bb2.y + bb2.height / 2},
        {x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}],
        d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x),
                dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x,
        y1 = p[res[0]].y,
        x4 = p[res[1]].x,
        y4 = p[res[1]].y;
    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
    if (line && line.line) {
        line.bg && line.bg.attr({path: path});
        line.line.attr({path: path});
    } else {
        var color = typeof line == "string" ? line : "#000";
        var rv = {
            bg: bg && bg.split && this.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3}),
            line: this.path(path).attr({stroke: color, fill: "none"}),
            from: obj1,
            to: obj2
        };
        rv.line.toFront();
        return rv;
    }
};

function getBBox(obj) {
  var left = obj.offset().left - MAGIC_OFFSET_CONSTANT;
  var top = obj.offset().top - MAGIC_OFFSET_CONSTANT;
  var width = obj.width();
  var height = obj.height();
  return {
    x: left,
    y: top,
    x2: left + width,
    y2: top + height,
    width: width,
    height: height,
  };
}

function adjust(v, min, max) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}


function getAdjustedBBox(obj) {
  var offsetParent = obj.offsetParent();
  var objBBox = getBBox(obj);
  var parentBBox = getBBox(offsetParent);

  objBBox.x = adjust(objBBox.x, parentBBox.x, parentBBox.x2);
  objBBox.x2 = adjust(objBBox.x2, parentBBox.x, parentBBox.x2);

  objBBox.y = adjust(objBBox.y, parentBBox.y, parentBBox.y2);
  objBBox.y2 = adjust(objBBox.y2, parentBBox.y, parentBBox.y2);

  objBBox.width = Math.max(objBBox.x2 - objBBox.x, 0); 
  objBBox.height = Math.max(objBBox.y2 - objBBox.y, 0); 

  return objBBox;
}

function redraw (connectionPairs) {
  var paper = getPaper();
  paper.clear();

  var connections = [];
  for (var i=0; i < connectionPairs.length; i++) {
    var left = $("#"+connectionPairs[i][0]);
    var right = $("#"+connectionPairs[i][1]);
    if (left.offset() && right.offset()) {
      connections.push(paper.connection(left, right, "#0f0", "#0f0|2"));
    }
  }

  // FIXME: draw everything in imageAreas
  for (var image in imageAreas) {
    if (imageAreas.hasOwnProperty(image)) {

      // FIXME: make this invisible, made it react to drags by drawing a
      // selection rectangle
      paper.rect(
        imageAreas[image].left - MAGIC_OFFSET_CONSTANT,
        imageAreas[image].top - MAGIC_OFFSET_CONSTANT,
        imageAreas[image].width,
        imageAreas[image].height
      ).attr({
        fill: "hsb(.8, 1, 1)",
        stroke: "none",
        opacity: .5,
        cursor: "move"
      });
    }
  }
}



