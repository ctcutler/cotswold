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
  // Either a thing is plain text, in which case it just has a "content" field
  // or it has id, style, and nodes. No plain text is allowed at the top level.
  $scope.spanTree = [
      {
          nodes: []     
      }
    /*
    {
      style: "red", id: "range1", nodes: 
        [
            {content: "aaaaaa"},
            {style: "blue", id: "range2", nodes:[
                {content: "bbbbb"}
            ]},
            {content: "aaaaaa"},
            {style: "blue", id: "range3", nodes:[
                {content: "cccccc"}
            ]},
            {content: "aaaaaa"},

        ]
    },
    {style: "green", id: "range4", nodes: [{content: "ddddd"}]}
      */
    ];
    
    
  $scope.content = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  
  $scope.ranges = [
    // normal, no overlap, no nest
    { start: 0, end: 11, id: "range1", style: "red" },
    { start: 18, end: 21, id: "range2", style: "blue" },

    // nested

    { start: 23, end: 38, id: "range3", style: "red" },
    { start: 26, end: 34, id: "range4", style: "blue" },
    { start: 28, end: 31, id: "range5", style: "green" },

    // nested, matching start, shorter first
    { start: 40, end: 43, id: "range6", style: "blue" },
    { start: 40, end: 44, id: "range7", style: "red" },

    // nested, matching start, longer first
    { start: 50, end: 54, id: "range8", style: "red" },
    { start: 50, end: 53, id: "range9", style: "blue" },

    // nested, matching end, shorter first
    { start: 61, end: 64, id: "range6", style: "blue" },
    { start: 60, end: 64, id: "range7", style: "red" },

    // nested, matching end, longer first
    { start: 70, end: 74, id: "range6", style: "red" },
    { start: 71, end: 74, id: "range7", style: "blue" },

    // overlapping

    // adjacent
  ];
  
  $scope.makeOffsetList = function () {
    var offsets = [];
    // create offset list from ranges
    angular.forEach($scope.ranges, function(range) {
      offsets.push({
        offset: range.start, id: range.id, style: range.style, kind: "start", 
        length: range.end - range.start
      });
      offsets.push({
        offset: range.end, id: range.id, style: range.style, kind: "end", 
        length: range.end - range.start
      });
    });
    // sort offset list
    offsets.sort(function (a, b) { 
      if (a.offset == b.offset) {
        // makes nested rendering come out right
        if (a.kind == "start" && b.kind == "start") {
          return b.length-a.length;
        } else if (a.kind == "end" && b.kind == "end") {
          return a.length-b.length;
        } else {
          return 0;
        }
      } else {
        return a.offset-b.offset;
      }
    });
    return offsets;
  };

  $scope.makeStyledSpanObj = function (style, id, start, end) {
    return {
      style: style,
      id: id,
      nodes: [ 
        { content: $scope.content.substring(start, end) }
      ],
    };
  };

  $scope.makeUnStyledSpanObj = function (start, end) {
    return { content: $scope.content.substring(start, end) };
  };

  $scope.dumpSpanTree = function() {
    return JSON.stringify($scope.spanTree);
  };
  
  $scope.loadSpanTree = function () {
    var offsets = $scope.makeOffsetList();
    
    var prev = {offset: 0, id: "", style: "", kind: "end"};
    var stack = [$scope.spanTree[0]];
    angular.forEach(offsets, function(cur) {
      var stackTop = stack[stack.length-1];
      if (cur.offset != 0) {
        if (prev.kind == "start" && cur.kind == "start") {
          // begin nested or overlapping
          var outerSpanObj = $scope.makeStyledSpanObj(
            prev.style, prev.id, prev.offset, cur.offset 
          );
          stackTop.nodes.push(outerSpanObj);
          stack.push(outerSpanObj);
        } else if (prev.kind == "start" && cur.kind == "end") {
          if (prev.id == cur.id) {
            // finish uninterrupted range
            stackTop.nodes.push(
              $scope.makeStyledSpanObj(prev.style, prev.id, prev.offset, cur.offset)
            );
          } else {
            // finish overlapping unless offsets are equal (then "adjacent" case)
          }
        } else if (prev.kind == "end" && cur.kind == "start") {
          // range without any style or id
          stackTop.nodes.push($scope.makeUnStyledSpanObj(prev.offset, cur.offset));
        } else if (prev.kind == "end" && cur.kind == "end") {
          // finish nested
          stackTop.nodes.push($scope.makeUnStyledSpanObj(prev.offset, cur.offset));
          stack.pop();
        }
      }
      prev = cur;
    });
    if (prev.offset < $scope.content.length) {
      stack[stack.length-1].nodes.push({
        content: $scope.content.substring(prev.offset, $scope.content.length)
      });
    }
  };
    
}]);
