var PADDING = 10;
var ARTIFACT_WIDTH = 300;

/* FIXME: so now we're letting the browser tell us how tall the artifacts are
 * which means that we should go back to handling the load event so that when we
 * get it we can go through and look up everybody's rendered size. We should 
 * think about whether we want to do something similar for window resize events
 * as well. 
 *
 * Diagram the event flow and the resizing and reloacating.
 */

var module = angular.module('cotswoldApp', [])
  .directive('timeline', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("timeline");

        scope.$on('resize', function(event) {
          resizeHandler(element, false, "bottom");
        });

        /*
        scope.$on('resize', function(event) {
          console.log(element[0].className+" handling resize");
          positionChildrenAndResize(scope, element, attrs, attrs.timepoints, false, "bottom");
        });
        */
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

        /*
        bindLocationAndSize(scope, element, attrs);
        scope.$on('resize', function(event) {
          console.log(element[0].className+" handling resize");
          positionChildrenAndResize(scope, element, attrs, attrs.artifacts, true, "center");
        });
        */
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
            console.log(element[0].className+" scope watch setting element width to " + val+", firing resize");
            element.css({ width: val+"px" });
            scope.$emit("resize");
          }
        });
        scope.$watch(attrs.height, function(val) {
          if (val != null) {
            console.log(element[0].className+" scope watch setting element height to " + val+", firing resize");
            element.css({ height: val+"px" });
            scope.$emit("resize");
          }
        });

        // on window load fire resize (handles case where browser determines size)
        angular.element(window).bind('load', function() {
            console.log(element[0].className+" window load firing resize ");
            scope.$emit("resize");
        });

        /*
        bindLocationAndSize(scope, element, attrs);
        console.log(element[0].className+" emitting resize from link function ");
        scope.$emit("resize");
        */
      }
    };
  });

// directive helpers
function tempResizeHandler(element) {
  console.log(element[0].className+" handling resize");
  $.each(element[0].children, function(index, child) {
    $child = $(child);
    console.log("child width: "+$child.width());
    console.log("child height: "+$child.height());
    var parentWidth = $child.width()+(2*PADDING);
    var parentHeight = $child.height()+(2*PADDING);
    element.css({ width: parentWidth+"px" });
    element.css({ height: parentHeight+"px" });
  });
}

function resizeHandler(element, vertical, align) {
  console.log(element[0].className+" handling resize");
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
      // FIXME: consider jquery's offset method instead, or different css() style
      $child.css({ top: offset+"px" });
      //child.top = offset;
      offset += $child.height() + PADDING
      if (topOrLeft) {
        // align left
        $child.css({ left: PADDING+"px" });
        //child.left = PADDING;
      } else if (bottomOrRight) {
        // align right
        $child.css({ left: ((parentWidth - $child.width()) + PADDING)+"px"});
        //child.left = (parentWidth - $child.width()) + PADDING;
      } else {
        // align center
        $child.css({ left: (((parentWidth - $child.width())/2) + PADDING) + "px"});
        //child.left = ((parentWidth - $child.width())/2) + PADDING;
      }
    } else {
      $child.css({ left: offset+"px" });
      //child.left = offset;
      offset += $child.width() + PADDING;
      if (topOrLeft) {
        // align top
        $child.css({ top: PADDING +"px"});
        //child.top = PADDING;
      } else if (bottomOrRight) {
        // align bottom
        $child.css({ top: ((parentHeight - $child.height()) + PADDING)+"px"});
        //child.top = (parentHeight - $child.height()) + PADDING;
      } else {
        // align center
        $child.css({ top: (((parentHeight - $child.height())/2) + PADDING)+"px"});
        //child.top = ((parentHeight - $child.height())/2) + PADDING;
      }
    }
  });

  parentWidth += 2 * PADDING;
  parentHeight += 2 * PADDING;

  // set own width, height
  console.log(element[0].className+" setting own (as parent) element width to " + parentWidth);
  console.log(element[0].className+" setting own (as parent) element height to " + parentHeight);
  element.css({ width: parentWidth+"px" });
  element.css({ height: parentHeight+"px" });
}

function bindLocationAndSize(scope, element, attrs) {
  // watch model and update element
  scope.$watch(attrs.width, function(val) {
    if (val != null) {
      console.log(element[0].className+" scope watch setting element width to " + val);
      element.css({ width: val+"px" });
      scope.$emit("resize");
    }
  });
  scope.$watch(attrs.height, function(val) {
    if (val != null) {
      console.log(element[0].className+" scope watch setting element height to " + val);
      element.css({ height: val+"px" });
      scope.$emit("resize");
    }
  });
  scope.$watch(attrs.left, function(val) {
    if (val != null) {
      console.log(element[0].className+" scope watch setting element left to " + val);
      element.css({ left: val+"px" });
      scope.$emit("resize");
    }
  });
  scope.$watch(attrs.top, function(val) {
    if (val != null) {
      console.log(element[0].className+" scope watch setting element top to " + val);
      element.css({ top: val+"px" });
      scope.$emit("resize");
    }
  });

  angular.element(window).bind('load', function() {
    var emitResizeEvent = false;
    var $element = $(element);
    var position = $element.position();

    if (scope.$eval(attrs.width) != $element.width()) {
      console.log($element[0].className+" setting scope width to " + $element.width());
      scope.$eval(attrs.width+"="+$element.width());
      emitResizeEvent = true;
    }
    if (scope.$eval(attrs.height) != $element.height()) {
      console.log($element[0].className+" setting scope height to " + $element.height());
      scope.$eval(attrs.height+"="+$element.height());
      emitResizeEvent = true;
    }
    if (scope.$eval(attrs.left) != position.left) {
      console.log($element[0].className+" setting scope left to " + position.top);
      scope.$eval(attrs.left+"="+position.left);
      emitResizeEvent = true;
    }
    if (scope.$eval(attrs.top) != position.top) {
      console.log($element[0].className+" setting scope top to " + position.top);
      scope.$eval(attrs.top+"="+position.top);
      emitResizeEvent = true;
    }
    
    if (emitResizeEvent) {
      console.log($element[0].className+" emitting resize");
      scope.$emit("resize");
    }
  });
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
      left: null,
      top: null,
      width: null,
      height: null,
      artifacts: [
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          left: null,
          top: null,
          width: ARTIFACT_WIDTH,
          height: null
        },
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          left: null,
          top: null,
          width: ARTIFACT_WIDTH,
          height: null
        },
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          left: null,
          top: null,
          width: ARTIFACT_WIDTH,
          height: null 
        },
      ]
    },
    { 
      name: "timepoint 2",
      left: null,
      top: null,
      width: null,
      height: null,
      artifacts: [
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          left: null,
          top: null,
          width: ARTIFACT_WIDTH,
          height: null
        },
      ]
    },
    { 
      name: "timepoint 3",
      left: null,
      top: null,
      width: null,
      height: null,
      artifacts: [
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          left: null,
          top: null,
          width: ARTIFACT_WIDTH,
          height: null 
        },
        { 
          name: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          left: null,
          top: null,
          width: ARTIFACT_WIDTH,
          height: null
        },
      ]
    }
  ];
}
