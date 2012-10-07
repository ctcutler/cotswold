var module = angular.module('cotswoldApp', [])
  .directive('timeline', function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        // broadcast a timelineresize event whenever there is a load or resize
        // event on the window
        angular.element(window).bind('resize', function() {
          scope.$broadcast("timelineresize");
        });
        angular.element(window).bind('load', function() {
          scope.$broadcast("timelineresize");
        });
      }
    };
  }).directive('bindWidth', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        // watch model and update element
        scope.$watch(attrs.bindWidth, function(val) {
          if (val != null) {
            element.css({ width: val+"px" });
          }
        });

        // watch element and update model
        scope.$on('timelineresize', function(event) {
          if (scope.$eval(attrs.bindWidth) != $(element).width()) {
            scope.$eval(attrs.bindWidth+"="+$(element).width());
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
