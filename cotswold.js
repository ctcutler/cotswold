var ARTIFACT_WIDTH_NORMAL = 300;
var ARTIFACT_MAX_HEIGHT_NORMAL = 300;
var ARTIFACT_WIDTH_EXPANDED = 600;
var ARTIFACT_MAX_HEIGHT_EXPANDED = "none";

/*
  FIXME:
  X images
  X artifact scrolling
  X expanded view
  * movies
  * hbox and vbox implementations
    ** sizes self based on contents unless width and height attributes are set
    ** attributes for margin and padding
    ** attributes for horizontal and vertical alignment
    ** FIXME: mockup timeline with these options and confirm that they are sufficient
  * get offset of text range
  * editting
  * comments
  * tags
  x zoom in and out (all the way out to full resolution, poster size)
  * single artifact zoom
  x scrolling in artifacts
  * real connections
  * data storage
  * newline rendering
*/

(function (angular) {
    /*
     * Defines the ng:if tag. This is useful if jquery mobile does not allow
     * an ng-switch element in the dom, e.g. between ul and li.
     */
    var ngIfDirective = {
        transclude:'element',
        priority:1000,
        terminal:true,
        compile:function (element, attr, linker) {
            return function (scope, iterStartElement, attr) {
                iterStartElement[0].doNotMove = true;
                var expression = attr.ngmIf;
                var lastElement;
                var lastScope;
                scope.$watch(expression, function (newValue) {
                    if (lastElement) {
                        lastElement.remove();
                        lastElement = null;
                    }
                    lastScope && lastScope.$destroy();
                    if (newValue) {
                        lastScope = scope.$new();
                        linker(lastScope, function (clone) {
                            lastElement = clone;
                            iterStartElement.after(clone);
                        });
                    }
                    // Note: need to be parent() as jquery cannot trigger events on comments
                    // (angular creates a comment node when using transclusion, as ng-repeat does).
                    $(iterStartElement.parent()).trigger("$childrenChanged");
                });
            };
        }
    };
    var ng = angular.module('ng');
    ng.directive('ngmIf', function () {
        return ngIfDirective;
    });
})(angular);

var module = angular.module('cotswoldApp', [])
  .directive('editor', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("editor");

        scope.$on('resize', function(event) {
          // handle resize by repositioning children and resizing self
          resizeHandler(
            element, 
            attrs.direction, 
            attrs.childAlign, 
            parseInt(attrs.margin), 
            parseInt(attrs.padding),
            ""
          );
        });
      }
    };
  }).directive('timeline', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("timeline");

        scope.$on('resize', function(event) {
          // handle resize by repositioning children and resizing self
          resizeHandler(
            element, 
            attrs.direction, 
            attrs.childAlign, 
            parseInt(attrs.margin), 
            parseInt(attrs.padding),
            ""
          );
          
          // connections div should always be the same size as element
          var $connections = $("#connections");
          var $element = $(element);
          setWidth($connections, $element.width());
          setHeight($connections, $element.height());
          setLeft($connections, $element.position().left);
          setTop($connections, $element.position().top);

          redraw(scope.connections);
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
          resizeHandler(
            element, 
            attrs.direction, 
            attrs.childAlign, 
            parseInt(attrs.margin), 
            parseInt(attrs.padding),
            "timepoint-background"
          );

          // timepoint-background div should always be the same size as element
          var $element = $(element);
          var $background = $element.children(".timepoint-background");
          setWidth($background, $element.width());
          setHeight($background, $element.height());
          setLeft($background, $element.position().left);
          setTop($background, $element.position().top);
        });
      }
    };
  }).directive('artifact', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        element.addClass("artifact");
        
        $(element).scroll(function () {
          redraw(scope.connections);
        });

        // Bind to model for size so that program can affect artifact size.
        // In watch function, update element size and fire resize (handles
        // cases where app changes artifact size)
        scope.$watch(attrs.loopVariable+".width", function(val) {
          if (val != null) {
            setWidth(element, val);
            scope.$emit("resize");
          }
        });
        scope.$watch(attrs.loopVariable+".maxHeight", function(val) {
          if (val != null) {
            setMaxHeight(element, val);
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
function resizeHandler(element, direction, align, margin, padding, ignore) {
  var children = element[0].children;
  var topOrLeft = align == "top" || align == "left";
  var bottomOrRight = align == "bottom" || align == "right";
  var vertical = direction == true || direction == "vertical";
  var parentWidth = 0;
  var parentHeight = 0;

  $.each(children, function(index, c) {
    var $child = $(c);
    if ($child[0].className == ignore) {
      return;
    }
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
    var $child = $(c);
    if ($child[0].className == ignore) {
      return;
    }
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

function setMaxWidth(element, val) {
  if (val == "none") {
    element.css({ "max-width": val });
  } else {
    element.css({ "max-width": val + "px" });
  }
}

function setMaxHeight(element, val) {
  if (val == "none") {
    element.css({ "max-height": val });
  } else {
    element.css({ "max-height": val + "px" });
  }
}

function setTop(element, val) {
  element.css({ top: val + "px" });
}

function setLeft(element, val) {
  element.css({ left: val + "px" });
}

function getBBox(obj) {
  // don't know why we need to subtract WEIRD_CONSTANT here, 
  // but this makes the connection lines line up right. . . 
  // this makes me nervous
  var WEIRD_CONSTANT = 4
  var left = obj.offset().left-WEIRD_CONSTANT;
  var top = obj.offset().top-WEIRD_CONSTANT;
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

var paper;

function redraw (connectionPairs) {
  var $glass = $("#connections");

  if (!paper) {
    paper = Raphael("connections", $glass.width(), $glass.height());
  } else {
    paper.setSize($glass.width(), $glass.height());
  }
  paper.clear();

  var connections = [];
  for (var i=0; i < connectionPairs.length; i++) {
    var left = $("#"+connectionPairs[i].leftId);
    var right = $("#"+connectionPairs[i].rightId);
    if (left.offset() && right.offset()) {
      connections.push(paper.connection(left, right, "#0f0", "#0f0|2"));
    }
  }
}

function getArtifactParent(node) {
  while (node && node.nodeName != "ARTIFACT") {
    node = node.parentNode;
  }
  return node;
}


// Adapted from: http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container
// Thanks, Tim Down!
function getCaretCharacterOffsetWithin(element, start) {
    var caretOffset = 0;
    if (typeof window.getSelection != "undefined") {
        var range = window.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        if (start) {
          preCaretRange.setEnd(range.startContainer, range.startOffset);
        } else {
          preCaretRange.setEnd(range.endContainer, range.endOffset);
        }
        caretOffset = preCaretRange.toString().length;
    } else if (typeof document.selection != "undefined" && document.selection.type != "Control") {
        var textRange = document.selection.createRange();
        var preCaretTextRange = document.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
}

function EditorController($scope) {
  localStorage.clear();

  if (!localStorage["expanded"]) {
    localStorage["expanded"] = JSON.stringify(hardCodedExpanded);
    localStorage["connections"] = JSON.stringify(hardCodedConnections);
    localStorage["timepoints"] = JSON.stringify(hardCodedTimepoints);
  }

  var timepoints = JSON.parse(localStorage["timepoints"]);
  for (var i=0; i<timepoints.length; i++) {
    var timepoint = timepoints[i];
    for (var j=0; j<timepoint.artifacts.length; j++) {
      var artifact = timepoint.artifacts[j];
      artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;
    }
  }

  $scope.timepoints = timepoints;
  $scope.expanded = JSON.parse(localStorage["expanded"]);
  $scope.connections = JSON.parse(localStorage["connections"]);

  $scope.makeRange = function () {
    var sel = rangy.getSelection();
    var startParent = getArtifactParent(sel.anchorNode);
    var endParent = getArtifactParent(sel.focusNode);
    // FIXME: this could be neater
    var startOffset = getCaretCharacterOffsetWithin(startParent.firstElementChild.firstElementChild, true);
    var endOffset = getCaretCharacterOffsetWithin(startParent.firstElementChild.firstElementChild, false);

    if (startParent.id != endParent.id) {
      sel.removeAllRanges();
      return;
    }

    var foundArtifact = false;
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.id == startParent.id) {
          artifact.ranges.push(
            {
              start: startOffset, end: endOffset, 
              id: "range-"+artifact.id+"."+(artifact.ranges.length+1),
              style: "red"
            }
          );
          artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;
          foundArtifact = true;
          break;
        }
      }
      if (foundArtifact) break;
    }
  };

  $scope.toggleZoom = function () {
    var width = $scope.expanded ? ARTIFACT_WIDTH_NORMAL : ARTIFACT_WIDTH_EXPANDED;
    var maxHeight = $scope.expanded ? ARTIFACT_MAX_HEIGHT_NORMAL : ARTIFACT_MAX_HEIGHT_EXPANDED;

    $scope.expanded = !$scope.expanded;
    localStorage["expanded"] = JSON.stringify($scope.expanded);

    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        artifact.width = width;
        artifact.maxHeight = maxHeight;
      }
    }
    localStorage["timepoints"] = JSON.stringify($scope.timepoints);

    redraw($scope.connections);
  };
}

var hardCodedExpanded = false;
var hardCodedConnections = [
  { leftId: "range1", rightId: "range14", },
  { leftId: "range2", rightId: "range16"},
  { leftId: "box1", rightId: "range14"},
];
var hardCodedTimepoints = [
  { 
    id: "1",
    name: "Tuesday Class",
    artifacts: [
      { 
        id: "1.1",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range1", style: "red" },
          { start: 18, end: 21, id: "range2", style: "blue" },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
      { 
        id: "1.2",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range11", style: "red" },
          { start: 18, end: 21, id: "range12", style: "blue" },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
      { 
        id: "1.3",
        imageSrc: "baa.jpeg",
        imageBoxes: [
          { id: "box1", left: 150, top: 135, width: 40, height: 40 },
        ],
        imageDisplay: "block",
        contentDisplay: "none",
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL, 
      },
    ]
  },
  { 
    id: "2",
    name: "Wednesday Feedback",
    artifacts: [
      { 
        id: "2.1",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range13", style: "red" },
          { start: 18, end: 21, id: "range14", style: "blue" },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
    ]
  },
  { 
    id: "3",
    name: "Thursday Class",
    artifacts: [
      { 
        id: "3.1",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range15", style: "red" },
          { start: 18, end: 21, id: "range16", style: "blue" },
        ],
        /*
        FIXME: translate these into ranges
        contentChunks: [
          { content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut ", spanId: "span3" },
          { content: "labore", class: "highlighted", spanId: "span4"  },
          { content: " et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  ", spanId: "span5" },
          { content: "Bottom!", class: "highlighted", spanId: "span6"  },
        ],
        */
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL, 
      },
      { 
        id: "3.2",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range17", style: "red" },
          { start: 18, end: 21, id: "range18", style: "blue" },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
    ]
  }
];
