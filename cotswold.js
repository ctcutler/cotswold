var PADDING = 10;
var ARTIFACT_WIDTH = 300;

var module = angular.module('cotswoldApp', [])
  .directive('timeline', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("timeline");

        scope.$on('resize', function(event) {
          resizeHandler(element, false, "bottom");
        });
      }
    };
  }).directive('timepoint', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("timepoint");

        scope.$on('resize', function(event) {
          resizeHandler(element, true, "center");
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
        scope.$watch(attrs.width, function(val) {
          if (val != null) {
            setWidth(element, val);
            scope.$emit("resize");
          }
        });
        scope.$watch(attrs.height, function(val) {
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
function resizeHandler(element, vertical, align) {
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
        parentHeight += PADDING;
      }
    } else {
      parentHeight = Math.max($child.height(), parentHeight);
      parentWidth += $child.width();
      if (index < (children.length - 1)) {
        parentWidth += PADDING;
      }
    }
  });

  var offset = PADDING;
  $.each(children, function(index, c) {
    $child = $(c);
    if (vertical) {
      setTop($child, offset);
      offset += $child.height() + PADDING
      if (topOrLeft) {
        // align left
        setLeft($child, PADDING);
      } else if (bottomOrRight) {
        // align right
        setLeft($child, (parentWidth - $child.width()) + PADDING);
      } else {
        // align center
        setLeft($child, ((parentWidth - $child.width())/2) + PADDING);
      }
    } else {
      setLeft($child, offset);
      offset += $child.width() + PADDING;
      if (topOrLeft) {
        // align top
        setTop($child, PADDING);
      } else if (bottomOrRight) {
        // align bottom
        setTop($child, (parentHeight - $child.height()) + PADDING);
      } else {
        // align center
        setTop($child, ((parentHeight - $child.height())/2) + PADDING);
      }
    }
  });

  parentWidth += 2 * PADDING;
  parentHeight += 2 * PADDING;

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

function TimelineController($scope) {
  $scope.test = function() {
    // Creates canvas 320 × 200 at 10, 50
    var paper = Raphael(10, 50, 320, 200);

    // Creates circle at x = 50, y = 40, with radius 10
    var circle = paper.circle(50, 40, 10);
    // Sets the fill attribute of the circle to red (#f00)
    circle.attr("fill", "#f00");

    // Sets the stroke attribute of the circle to white
    circle.attr("stroke", "#fff");
  };
  $scope.timepoints = [
    { 
      name: "timepoint 1",
      artifacts: [
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null
        },
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null
        },
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null 
        },
      ]
    },
    { 
      name: "timepoint 2",
      artifacts: [
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null
        },
      ]
    },
    { 
      name: "timepoint 3",
      artifacts: [
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null 
        },
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          width: ARTIFACT_WIDTH,
          height: null
        },
      ]
    }
  ];
}
