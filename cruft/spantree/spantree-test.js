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
    addTest("basic ranges", [[0, 3, "red", false], [4, 7, "blue", false]], "RRR BBB");
    addTest("nested", [[0, 6, "red", false], [2, 4, "blue", false]], "RRBBRR");
    addTest("nested three layers", [[0, 6, "red", false], [1, 5, "blue", false], [2, 4, "green", false]], "RBGGBR");
    addTest("nested two chunks", [[0, 6, "red", false], [1, 2, "blue", false], [4, 5, "green", false]], "RBRRGR");
    addTest("nested matching start, shorter first", [[0, 4, "red", false], [0, 6, "blue", false]], "RRRRBB");
    addTest("nested matching start, longer first", [[0, 6, "red", false], [0, 4, "blue", false]], "BBBBRR");
    addTest("nested matching end, shorter first", [[2, 6, "red", false], [0, 6, "blue", false]], "BBRRRR");
    addTest("nested matching end, longer first", [[0, 6, "red", false], [2, 6, "blue", false]], "RRBBBB");
    addTest("overlapping", [[0, 4, "red", false], [2, 6, "blue", false], [4, 8, "green", false]], "RRRRBBGG");
    addTest("overlapping reversed", [[4, 8, "red", false], [2, 6, "blue", false], [0, 4, "green", false]], "GGBBRRRR");
    addTest("adjacent", [[0, 2, "red", false], [2, 4, "blue", false]], "RRBB");
    addTest("selected", [[0, 2, "red", true]], "RR");

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
        selected: range[3],
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
        if (key == "$$hashKey") {
          return undefined;
        }
        if (typeof val == "object") {
          if (seen.indexOf(val) >= 0)
            return undefined;
          seen.push(val)
        }
        return val
      }
    );
  }
}]);
