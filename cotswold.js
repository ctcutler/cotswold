var module = angular.module('cotswoldApp', [])
  .directive('timeline', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        var PADDING = 10;
        // broadcast a timelineresize event whenever the load event
        // occurs on the window to tell children that they need to update the
        // model with their new sizes
        angular.element(window).bind('load', function() {
          scope.$broadcast("timelineresize");
        });

        scope.$on('timepointresize', function(event) {
          var width = PADDING;
          var height = 0;
          var timepoints = scope.$eval(attrs.timepoints);

          $.each(timepoints, function(index, timepoint) {
            timepoint.left = width;
            timepoint.top = PADDING;
            width += timepoint.width + PADDING;
            height = Math.max(timepoint.height, height);
          });

          height += PADDING * 2;

          // set own width, height
          element.css({ width: width+"px" });
          element.css({ height: height+"px" });

          scope.$digest();
        });
      }
    };
  }).directive('timepoint', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

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

        // watch element and update model
        scope.$on('timelineresize', function(event) {
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
            scope.$emit("timepointresize");
          }
        });
      }
    };
  });

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
        { name: "artifact 1.1" },
        { name: "artifact 1.2" },
        { name: "artifact 1.3" },
        { name: "artifact 1.4" },
      ]
    },
    { 
      name: "timepoint 2",
      left: null,
      top: null,
      width: null,
      height: null,
      artifacts: [
        { name: "artifact 2.1" },
        { name: "artifact 2.2" },
        { name: "artifact 2.3" },
      ]
    },
    { 
      name: "timepoint 3",
      left: null,
      top: null,
      width: null,
      height: null,
      artifacts: [
        { name: "artifact 3.1" },
        { name: "artifact 3.2" },
        { name: "artifact 3.3" },
        { name: "artifact 3.4" },
        { name: "artifact 3.5" },
      ]
    }
  ];
}
