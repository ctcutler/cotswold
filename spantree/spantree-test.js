// FIXME:
// * add advanced test cases based on diagrams in my journal
// * add dominance support
// * integrate library with main app and convert main app to using ranges

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

angular.module("myApp", []).
controller("TestController", ['$scope', function($scope) {
  $scope.spanTree = [];
  $scope.content = "";
  $scope.ranges = [];

  $scope.dumpSpanTree = function() {
    return stringify($scope.spanTree);
  };

  $scope.test = function () {
    addTest("basic ranges", [[0, 3, "red"], [4, 7, "blue"]], "RRR BBB");
    addTest("nested", [[0, 6, "red"], [2, 4, "blue"]], "RRBBRR");
    addTest("nested three layers", [[0, 6, "red"], [1, 5, "blue"], [2, 4, "green"]], "RBGGBR");
    addTest("nested two chunks", [[0, 6, "red"], [1, 2, "blue"], [4, 5, "green"]], "RBRRGR");
    addTest("nested matching start, shorter first", [[0, 4, "red"], [0, 6, "blue"]], "RRRRBB");
    addTest("nested matching start, longer first", [[0, 6, "red"], [0, 4, "blue"]], "BBBBRR");
    addTest("nested matching end, shorter first", [[2, 6, "red"], [0, 6, "blue"]], "BBRRRR");
    addTest("nested matching end, longer first", [[0, 6, "red"], [2, 6, "blue"]], "RRBBBB");
    addTest("overlapping", [[0, 4, "red"], [2, 6, "blue"], [4, 8, "green"]], "RRRRBBGG");
    addTest("overlapping reversed", [[4, 8, "red"], [2, 6, "blue"], [0, 4, "green"]], "GGBBRRRR");
    addTest("adjacent", [[0, 2, "red"], [2, 4, "blue"]], "RRBB");

    $scope.spanTree.push(makeSpanTree($scope.ranges, $scope.content));
  };

  var contentOffset = 0;
  var rangeCount = 0;
  function addTest(title, ranges, content) {
    title += ": ";
    contentOffset += title.length;
    $scope.content += title + content + " / ";
    angular.forEach(ranges, function (range) {
      rangeCount++;
      $scope.ranges.push({
        start: range[0]+contentOffset, 
        end: range[1]+contentOffset, 
        id: "range"+rangeCount,
        style: range[2],
      });
    });
    contentOffset += content.length + 3;
  }

  function stringify(obj) {
    // http://stackoverflow.com/questions/9382167/serializing-object-that-contains-cyclic-object-value
    var seen = []
    return JSON.stringify(
      obj,
      function(key, val) {
         if (typeof val == "object") {
              if (seen.indexOf(val) >= 0)
                  return undefined
              seen.push(val)
          }
          return val
      }
    );
  }
}]);
