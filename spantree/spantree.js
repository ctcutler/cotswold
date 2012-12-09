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
    /*
      {
          nodes: []     
      }
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

    /*
    // nested (three layers)
    { start: 23, end: 38, id: "range3", style: "red" },
    { start: 26, end: 34, id: "range4", style: "blue" },
    { start: 28, end: 31, id: "range5", style: "green" },

    // nested (two chunks)
    { start: 12, end: 17, id: "nest1", style: "red" },
    { start: 13, end: 14, id: "nest2", style: "blue" },
    { start: 15, end: 16, id: "nest3", style: "green" },

    // nested, matching start, shorter first 
    { start: 40, end: 43, id: "range6", style: "blue" },
    { start: 40, end: 44, id: "range7", style: "red" },

    // nested, matching start, longer first
    { start: 50, end: 54, id: "range8", style: "red" },
    { start: 50, end: 53, id: "range9", style: "blue" },

    // nested, matching end, shorter first 
    { start: 61, end: 64, id: "range10", style: "blue" },
    { start: 60, end: 64, id: "range11", style: "red" },

    // nested, matching end, longer first
    { start: 70, end: 74, id: "range12", style: "red" },
    { start: 71, end: 74, id: "range13", style: "blue" },

    // nested, shorter first 
    { start: 76, end: 77, id: "range14", style: "blue" },
    { start: 75, end: 78, id: "range15", style: "red" },



    // overlapping
    { start: 80, end: 84, id: "range6", style: "red" },
    { start: 82, end: 86, id: "range7", style: "blue" },
    { start: 84, end: 88, id: "range7", style: "green" },

    */
    // overlapping reversed (FIXME: adding second set of ranges 
    // screws up first overlapping test)

    // adjacent
  ];
  
  $scope.makeOffsetList = function () {
    var offsets = [];
    // create offset list from ranges
    angular.forEach($scope.ranges, function(range) {
      offsets.push({
        offset: range.start, id: range.id, style: range.style, kind: "start", 
        length: range.end - range.start, start: range.start, end: range.end
      });
      offsets.push({
        offset: range.end, id: range.id, style: range.style, kind: "end", 
        length: range.end - range.start, start: range.start, end: range.end
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
    $scope.offsetsDump = stringify(offsets);
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
    return stringify($scope.spanTree);
  };

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
  
  $scope.offsetsDump = "";
  
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
          if (prev.end >= cur.end) {
            stack.push(outerSpanObj);
          }
        } else if (prev.kind == "start" && cur.kind == "end") {
          if (prev.id == cur.id) {
            // finish uninterrupted range
            stackTop.nodes.push(
              $scope.makeStyledSpanObj(prev.style, prev.id, prev.offset, cur.offset)
            );
          } else {
            // middle of overlapping unless offsets are equal (then "adjacent" case)
            stackTop.nodes.push(
              $scope.makeStyledSpanObj(prev.style, prev.id, prev.offset, cur.offset)
            );
          }
        } else if (prev.kind == "end" && cur.kind == "start") {
          // range without any style or id
          stackTop.nodes.push($scope.makeUnStyledSpanObj(prev.offset, cur.offset));
        } else if (prev.kind == "end" && cur.kind == "end") {
          // finish nested
          stackTop.nodes.push($scope.makeUnStyledSpanObj(prev.offset, cur.offset));
          if (prev.start >= cur.start) {
            stack.pop();
          }
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
    
  $scope.loadSpanTree2 = function () {
    var contentNodes = [makeContentNode(0, $scope.content.length)]; 
    var tree = makeSpanNode("", false, "", [contentNodes[0]], null); // must not be contentNodes array

    angular.forEach($scope.ranges, function(range) {
      var nodes = [];
      angular.forEach(contentNodes, function(node) {
        if (range.start < node.end && range.end > node.start) {
          nodes.push(node);
        }
      });

      // no nodes. . . something is wrong
      if (nodes.length == 0) {
        console.log("range from "+range.start+" to "+range.end+" didn't match any nodes");
      } 

      /*
      // one node so range must be nested within it
      else if (nodes.length == 1) {
        // FIXME: filter out zero length content nodes
        var contentNode = nodes[0];
        var parentNode = contentNode.parentNode;
        var leftContentNode = makeContentNode(contentNode.start, range.start, parentNode);
        var rightContentNode = makeContentNode(range.end, contentNode.end, parentNode);
        var rangeContentNode = makeContentNode(range.start, range.end);
        var spanNode = makeSpanNode(range.id, range.dominant, range.style, [rangeContentNode]);
        replaceInArray(parentNode.nodes, contentNode, [leftContentNode, spanNode, rightContentNode]);
        replaceInArray(contentNodes, contentNode, [leftContentNode, rangeContentNode, rightContentNode]);
      }
      */

      else {
        // find least common ancestor of nodes
        var lca = findLCA(nodes);
        var leftEdge = nodes[0];
        var rightEdge = nodes[nodes.length-1];
        var innerChildren = nodes.slice(1, nodes.length-1);

        if (leftEdge == rightEdge) {
          // make perfect content node for range and put in innerChildren
          var innerChild = makeContentNode(range.start, range.end, leftEdge.parentNode);
          innerChildren.push(innerChild);
          leftEdge.parentNode.nodes.push(innerChild);
          // create right edge node and add it to its parent
          var rightEdge = makeContentNode(range.end, leftEdge.end, leftEdge.parentNode);
          rightEdge.parentNode.nodes.push(rightEdge);
          // update left edge node
          updateContentNode(leftEdge, leftEdge.start, range.start);

          // update content nodes
          replaceObjInArray(contentNodes, leftEdge, [leftEdge, innerChild, rightEdge]);

          // ignore the tweaked leftEdge and rightEdge
          rightEdge = null;
          leftEdge = null;
        } 

        if (leftEdge && leftEdge.start == range.start) {
          innerChildren.unshift(leftEdge);
          leftEdge = null;
        }
        if (rightEdge && rightEdge.end == range.end) {
          innerChildren.push(rightEdge);
          rightEdge = null;
        }

        // if edges' immediate parent is that common parent or edges match range 
        // boundaries, this is the non-overlap case
        if ((leftEdge == null || leftEdge.parentNode == lca)
            && (rightEdge == null || rightEdge.parentNode == lca)) {

          // make new span node children from nodes
          var spanChildren = [];
          var newContentNodes = [];
          var lcaInnerChildren = getLCAChildren(lca, innerChildren);


          // left edge
          if (leftEdge) {
            // make new node and add to span children, trim existing left edge
            var newContentNode = makeContentNode(range.start, leftEdge.end);
            spanChildren.push(newContentNode);
            newContentNodes.push(newContentNode);
            updateContentNode(leftEdge, leftEdge.start, range.start);
          }

          // inner
          if (innerChildren.length > 0) {
            newContentNodes.push.apply(newContentNodes, innerChildren);
            spanChildren.push.apply(spanChildren, lcaInnerChildren);
          }

          // right edge
          if (rightEdge) {
            // make new node and add to span children, trim existing left edge
            var newContentNode = makeContentNode(rightEdge.start, range.end);
            spanChildren.push(newContentNode);
            newContentNodes.push(newContentNode);
            updateContentNode(rightEdge, range.end, rightEdge.end);
          }

          // make new span node
          var spanNode = makeSpanNode(range.id, range.dominant, range.style, spanChildren);

          // update lca (tree)
          replaceArrayInArray(lca.nodes, lcaInnerChildren, [spanNode]);
          // update contentNodes list (need to build list to update it with)
          replaceArrayInArray(contentNodes, innerChildren, newContentNodes);
        }
      }
  
    });
    
    $scope.spanTree.push(tree);
  };

  // My own crappy LCA algorithm, optimal only in the sense that I undestand it
  function findLCA(nodes) {
    var ancestors = []; // should make this a hash/map so lookups are efficient
    var n = nodes[0];

    // make list of ancestors of first node
    while (n.parentNode != null) {
      ancestors.push(n.parentNode);
      n = n.parentNode;
    }
    ancestors.reverse();
    var lcaIndex = ancestors.length-1;

    // for every other node 
    angular.forEach(nodes.slice(1), function (n) {
      // move root-wards checking if each parent is in the ancestor list
      while (n.parentNode != null) {
        var idx = ancestors.indexOf(n.parentNode);
        // if it is and it is higher in the ancestor list than the current LCA, update the LCA
        if (idx != -1) {
          lcaIndex = Math.max(lcaIndex, idx);
          break;
        }
        n = n.parentNode;
      }
    });

    if (lcaIndex == -1) {
      return null;
    } else {
      return ancestors[lcaIndex];
    }
  }

  // returns a list of lca's child nodes that are the ancestors of descendants
  // most likely lots of opportunities for optimization here
  function getLCAChildren(lca, descendants) {
    var children = [];
    angular.forEach(descendants, function (descendant) {
      var n = descendant;
      while (n.parentNode != null) {
        if (n.parentNode == lca) {
          children.push(n);
          break;
        }
        n = n.parentNode;
      }
    });
    return children;
  }

  function replaceObjInArray(arr, objToReplace, replacements) {
    replaceItemsInArray(arr, arr.indexOf(objToReplace), 1, replacements);
  }

  function replaceArrayInArray(arr, arrToReplace, replacements) {
    // assumes arrToReplace is a consecutive subset of arr
    replaceItemsInArray(arr, arr.indexOf(arrToReplace[0]), arrToReplace.length, replacements);
  }

  function replaceItemsInArray(arr, index, count, replacements) {
    var args = [index, count];
    args = args.concat(replacements);
    arr.splice.apply(arr, args);
  }

  function updateContentNode(node, start, end) {
    node.start = start;
    node.end = end;
    node.content = $scope.content.substring(start, end);
  }

  function makeContentNode(start, end, parentNode) {
    return {
        start: start,
        end: end,
        content: $scope.content.substring(start, end),
        parentNode: parentNode,
    };
  }

  function makeSpanNode(id, dominant, style, nodes, parentNode) {
    var spanNode = {
        dominant: dominant,
        style: style,
        nodes: nodes,
        parentNode: parentNode
    };
    angular.forEach(nodes, function(node) {
      node.parentNode = spanNode;
    });
    return spanNode;
  }

  /*
  function splitNode(node, id, start, end, dominant, style) {
    // assumes node has one child and it is content
    var content = node.nodes[0].content;
    return [
      makeSpanObj(
          node.start, start, node.dominant, node.style,
          content.substring(0, start - node.start),
      ),
      makeSpanObj(
          start, end, dominant, style,
          content.substring(start - node.start, end - node.start),
      ),
      makeSpanObj(
          end, node.end, node.dominant, node.style,
          content.substring(end - node.start, content.length),
      ),
    ];
  };
  */

}]);
