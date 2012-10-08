var module = angular.module('cotswoldApp', [])
  .directive('timeline', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("timeline");

        scope.$on('resize', function(event) {
          positionChildrenAndResize(scope, element, attrs, attrs.timepoints, false);
        });
      }
    };
  }).directive('timepoint', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        element.addClass("timepoint");
        bindLocationAndSize(scope, element, attrs);
        scope.$on('resize', function(event) {
          positionChildrenAndResize(scope, element, attrs, attrs.artifacts, true);
        });
      }
    };
  }).directive('artifact', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        element.addClass("artifact");
        bindLocationAndSize(scope, element, attrs);
        scope.$emit("resize");
      }
    };
  });

// directive helpers
var PADDING = 10;
function positionChildrenAndResize(scope, element, attrs, children, vertical) {
  var width = vertical ? 0 : PADDING;
  var height = vertical ? PADDING : 0;
  var children = scope.$eval(children);

  $.each(children, function(index, child) {
    child.left = vertical ? PADDING : width;
    child.top = vertical ? height : PADDING;
    if (vertical) {
      width = Math.max(child.width, width);
      height += child.height + PADDING;
    } else {
      width += child.width + PADDING;
      height = Math.max(child.height, height);
    }
  });

  if (vertical) {
    width += PADDING * 2;
  } else {
    height += PADDING * 2;
  }

  // set own width, height
  element.css({ width: width+"px" });
  element.css({ height: height+"px" });

  // tell the watchers to update
  if (!scope.$$phase) scope.$digest();
}

function bindLocationAndSize(scope, element, attrs) {
  // watch model and update element
  scope.$watch(attrs.width, function(val) {
    if (val != null) {
      element.css({ width: val+"px" });
    }
  });
  scope.$watch(attrs.height, function(val) {
    if (val != null) {
      element.css({ height: val+"px" });
    }
  });
  scope.$watch(attrs.left, function(val) {
    if (val != null) {
      element.css({ left: val+"px" });
    }
  });
  scope.$watch(attrs.top, function(val) {
    if (val != null) {
      element.css({ top: val+"px" });
    }
  });

  angular.element(window).bind('load', function() {
    scope.$broadcast("timelineresize");
    var emitResizeEvent = false;
    var $element = $(element);
    var position = $element.position();

    if (scope.$eval(attrs.width) != $element.width()) {
      scope.$eval(attrs.width+"="+$element.width());
      emitResizeEvent = true;
    }
    if (scope.$eval(attrs.height) != $element.height()) {
      scope.$eval(attrs.height+"="+$element.height());
      emitResizeEvent = true;
    }
    if (scope.$eval(attrs.left) != position.left) {
      scope.$eval(attrs.left+"="+position.left);
      emitResizeEvent = true;
    }
    if (scope.$eval(attrs.top) != position.top) {
      scope.$eval(attrs.top+"="+position.top);
      emitResizeEvent = true;
    }
    
    if (emitResizeEvent) {
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
          name: "artifact 1.1",
          left: null,
          top: null,
          width: 175,
          height: 15
        },
        { 
          name: "artifact 1.2",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
        { 
          name: "artifact 1.3",
          left: null,
          top: null,
          width: 75,
          height: 25
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
          name: "artifact 2.1",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
        { 
          name: "artifact 2.2",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
        { 
          name: "artifact 2.3",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
        { 
          name: "artifact 2.4",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
        { 
          name: "artifact 2.5",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
        { 
          name: "artifact 2.6",
          left: null,
          top: null,
          width: 75,
          height: 25
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
          name: "artifact 3.1",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
        { 
          name: "artifact 3.2",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
        { 
          name: "artifact 3.3",
          left: null,
          top: null,
          width: 75,
          height: 25
        },
      ]
    }
  ];
}
