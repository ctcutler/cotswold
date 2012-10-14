var ARTIFACT_WIDTH = 300;

/*
  FIXME:
  * images
  * movies
  * hbox and vbox implementations
  * get offset of text range
  * editting
  * comments
  * tags
  * zoom in and out (all the way out to full resolution, poster size)
  * single artifact zoom
  * scrolling in artifacts
  * real connections
  * data storage
*/

var module = angular.module('cotswoldApp', [])
  .directive('timeline', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("timeline");

        scope.$on('resize', function(event) {
          // handle resize by repositioning children and resizing self
          resizeHandler(element, false, "bottom", 0, 0);
          
          // connections div should always be the same size as element
          var $connections = $("#connections");
          var $element = $(element);
          setWidth($connections, $element.width());
          setHeight($connections, $element.height());
          setLeft($connections, $element.position().left);
          setTop($connections, $element.position().top);
        });
      }
    };
  }).directive('timepoint', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("timepoint");

        scope.$on('resize', function(event) {
          // handle resize by repositioning children and resizing self
          resizeHandler(element, true, "center", 5, 0);
        });
      }
    };
  }).directive('artifact', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        element.addClass("artifact");

        // Bind to model for size so that program can affect artifact size.
        // In watch function, update element size and fire resize (handles
        // cases where app changes artifact size)
        scope.$watch(attrs.loopVariable+".width", function(val) {
          if (val != null) {
            setWidth(element, val);
            scope.$emit("resize");
          }
        });
        scope.$watch(attrs.loopVariable+".height", function(val) {
          if (val != null) {
            setHeight(element, val);
            scope.$emit("resize");
          }
        });

        // on window load fire resize (handles case where browser determines size)
        angular.element(window).bind('load', function() {
            scope.$emit("resize");
        });
      }
    };
  });

// directive helpers
function resizeHandler(element, vertical, align, margin, padding) {
  var children = element[0].children;
  var topOrLeft = align == "top" || align == "left";
  var bottomOrRight = align == "bottom" || align == "right";
  var parentWidth = 0;
  var parentHeight = 0;

  $.each(children, function(index, c) {
    $child = $(c);
    if (vertical) {
      parentWidth = Math.max($child.width(), parentWidth);
      parentHeight += $child.height();
      if (index < (children.length - 1)) {
        parentHeight += padding;
      }
    } else {
      parentHeight = Math.max($child.height(), parentHeight);
      parentWidth += $child.width();
      if (index < (children.length - 1)) {
        parentWidth += padding;
      }
    }
  });

  var offset = margin;
  $.each(children, function(index, c) {
    $child = $(c);
    if (vertical) {
      setTop($child, offset);
      offset += $child.height() + padding;
      if (topOrLeft) {
        // align left
        setLeft($child, margin);
      } else if (bottomOrRight) {
        // align right
        setLeft($child, (parentWidth - $child.width()) + margin);
      } else {
        // align center
        setLeft($child, ((parentWidth - $child.width())/2) + margin);
      }
    } else {
      setLeft($child, offset);
      offset += $child.width() + padding;
      if (topOrLeft) {
        // align top
        setTop($child, margin);
      } else if (bottomOrRight) {
        // align bottom
        setTop($child, (parentHeight - $child.height()) + margin);
      } else {
        // align center
        setTop($child, ((parentHeight - $child.height())/2) + margin);
      }
    }
  });

  parentWidth += 2 * margin;
  parentHeight += 2 * margin;

  // set own width, height
  setWidth(element, parentWidth);
  setHeight(element, parentHeight);
}

function setWidth(element, val) {
  element.css({ width: val + "px" });
}

function setHeight(element, val) {
  element.css({ height: val + "px" });
}

function setTop(element, val) {
  element.css({ top: val + "px" });
}

function setLeft(element, val) {
  element.css({ left: val + "px" });
}


// function copied from: http://raphaeljs.com/graffle.html
Raphael.fn.connection = function (obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox(),
        bb2 = obj2.getBBox(),
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
        return {
            bg: bg && bg.split && this.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3}),
            line: this.path(path).attr({stroke: color, fill: "none"}),
            from: obj1,
            to: obj2
        };
    }
};

var el;
window.onload = function () {
    /*
    var dragger = function () {
        this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
        this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
        this.animate({"fill-opacity": .2}, 500);
    };
    var move = function (dx, dy) {
            var att = this.type == "rect" ? {x: this.ox + dx, y: this.oy + dy} : {cx: this.ox + dx, cy: this.oy + dy};
            this.attr(att);
            for (var i = connections.length; i--;) {
                r.connection(connections[i]);
            }
            r.safari();
        };
    var up = function () {
            this.animate({"fill-opacity": 0}, 500);
        };
    */
    var $glass = $("#connections");
    var r = Raphael("connections", $glass.width(), $glass.height());
    var connections = [];
    var shapes = [  r.rect(184, 197, 75, 17, 0),
                    r.rect(494, 390, 75, 17, 0),
                    r.rect(495, 443, 51, 17, 0),
                    r.rect(685, 324, 42, 17, 0),
                    r.rect(155, 523, 42, 40, 0),
                    r.rect(678, 445, 42, 17, 0),
                ];
    for (var i = 0, ii = shapes.length; i < ii; i++) {
        shapes[i].attr({stroke: "#f00", "fill-opacity": 0, "stroke-width": 2});
    }
    connections.push(r.connection(shapes[0], shapes[1], "#f00", "#f00|2"));
    connections.push(r.connection(shapes[2], shapes[3], "#f00", "#f00|2"));
    connections.push(r.connection(shapes[4], shapes[5], "#f00", "#f00|2"));
};

function TimelineController($scope) {
  $scope.timepoints = [
    { 
      name: "Tuesday Class",
      artifacts: [
        { 
          imageVisibility: "none",
          contentVisibility: "block",
          content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null
        },
        { 
          imageVisibility: "none",
          contentVisibility: "block",
          content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null
        },
        { 
          imageVisibility: "block",
          contentVisibility: "none",
          content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null 
        },
      ]
    },
    { 
      name: "Wednesday Feedback",
      artifacts: [
        { 
          imageVisibility: "none",
          contentVisibility: "block",
          content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null
        },
      ]
    },
    { 
      name: "Thursday Class",
      artifacts: [
        { 
          imageVisibility: "none",
          contentVisibility: "block",
          content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null 
        },
        { 
          imageVisibility: "none",
          contentVisibility: "block",
          content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null
        },
      ]
    }
  ];
}
