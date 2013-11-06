"use strict";

function makeSpanTree (ranges, content) {
  if (!content || !ranges) {
    return {};
  }

  var contentNodes = [makeContentNode(0, content.length, null, content)]; 
  var tree = makeSpanNode("", false, false, "color1", "", [contentNodes[0]], null); // must not be contentNodes array

  angular.forEach(ranges, function(range) {
    var nodes = [];
    //tree.id;
    angular.forEach(contentNodes, function(node) {
      if (range.start < node.end && range.end > node.start) {
        nodes.push(node);
      }
    });

    // no nodes. . . something is wrong
    if (nodes.length == 0) {
      console.log("range from "+range.start+" to "+range.end+" didn't match any nodes");
    } else {
      // find least common ancestor of nodes
      var lca = findLCA(nodes);
      var leftEdge = nodes[0];
      var rightEdge = nodes[nodes.length-1];
      var innerChildren = nodes.slice(1, nodes.length-1);

      if (leftEdge == rightEdge) {
        // make perfect content node for range and put in innerChildren
        var innerChild = makeContentNode(range.start, range.end, leftEdge.parentNode, content);
        innerChildren.push(innerChild);
        // create right edge node
        var rightEdge = makeContentNode(range.end, leftEdge.end, leftEdge.parentNode, content);
        // update left edge node
        updateContentNode(leftEdge, leftEdge.start, range.start, content);

        // update content nodes and parent nodes
        replaceObjInArray(leftEdge.parentNode.nodes, leftEdge, [leftEdge, innerChild, rightEdge]);
        replaceObjInArray(contentNodes, leftEdge, [leftEdge, innerChild, rightEdge]);

        // ignore the tweaked leftEdge and rightEdge
        rightEdge = null;
        leftEdge = null;
      } 

      var truncatedLeft = false;
      var truncatedRight = false;
      // this means we're overlapping with something on the left side
      // and we need to move the range in to avoid overlapping the spans
      if (leftEdge && leftEdge.parentNode != lca) {
        truncatedLeft = true;
        leftEdge = null;
        for (var i=0; i<innerChildren.length; i++) {
          var innerChild = innerChildren[i];
          if (innerChild.parentNode == lca) {
            break;
          }
        }
        innerChildren = innerChildren.slice(i);
      }

      // this means we're overlapping with something on the right side
      // and we need to move the range in to avoid overlapping the spans
      if (rightEdge && rightEdge.parentNode != lca) {
        truncatedRight = true;
        rightEdge = null;
        for (var i=innerChildren.length; i>0; i--) {
          var innerChild = innerChildren[i-1];
          if (innerChild.parentNode == lca) {
            break;
          }
        }
        innerChildren = innerChildren.slice(0,i);
      }

      if (leftEdge && leftEdge.start == range.start) {
        innerChildren.unshift(leftEdge);
        leftEdge = null;
      }
      if (rightEdge && rightEdge.end == range.end) {
        innerChildren.push(rightEdge);
        rightEdge = null;
      }

      if ((leftEdge == null || leftEdge.parentNode == lca)
          && (rightEdge == null || rightEdge.parentNode == lca)) {

        // make new span node children from nodes
        var spanChildren = [];
        var newContentNodes = [];
        var lcaInnerChildren = getLCAChildren(lca, innerChildren);


        // left edge
        if (leftEdge) {
          // make new node and add to span children, trim existing left edge
          var newContentNode = makeContentNode(range.start, leftEdge.end, null, content);
          spanChildren.push(newContentNode);
          newContentNodes.push(newContentNode);
          updateContentNode(leftEdge, leftEdge.start, range.start, content);
        }

        // inner
        if (innerChildren.length > 0) {
          newContentNodes.push.apply(newContentNodes, innerChildren);
          spanChildren.push.apply(spanChildren, lcaInnerChildren);
        }

        // right edge
        if (rightEdge) {
          // make new node and add to span children, trim existing left edge
          var newContentNode = makeContentNode(rightEdge.start, range.end, null, content);
          spanChildren.push(newContentNode);
          newContentNodes.push(newContentNode);
          updateContentNode(rightEdge, range.end, rightEdge.end, content);
        }

        // make new span node
        var spanNode = makeSpanNode(
          range.id, range.dominant, range.selected, range.color, range.note,
          spanChildren, lca, truncatedLeft, truncatedRight
        );

        // update lca (tree) and contentNodes list 
        if (innerChildren.length == 0) {
          if (leftEdge) {
            lca.nodes.splice(lca.nodes.indexOf(leftEdge)+1, 0, spanNode);
            contentNodes.splice.apply(
              contentNodes, [contentNodes.indexOf(leftEdge)+1, 0].concat(newContentNodes)
            );
          } else if (rightEdge) {
            lca.nodes.splice(lca.nodes.indexOf(rightEdge), 0, spanNode);
            contentNodes.splice.apply(
              contentNodes, [contentNodes.indexOf(rightEdge), 0].concat(newContentNodes)
            );
          }
        } else {
          replaceArrayInArray(lca.nodes, lcaInnerChildren, [spanNode]);
          replaceArrayInArray(contentNodes, innerChildren, newContentNodes);
        }
      } 
    }
  });
  
  return tree;
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
        lcaIndex = Math.min(lcaIndex, idx);
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

function updateContentNode(node, start, end, content) {
  node.start = start;
  node.end = end;
  node.content = content.substring(start, end);
}

function makeContentNode(start, end, parentNode, content) {
  return {
      start: start,
      end: end,
      content: content.substring(start, end),
      parentNode: parentNode,
  };
}

function makeSpanNode(id, dominant, selected, color, note, nodes, parentNode, truncatedLeft, truncatedRight) {
  var truncation = "none";
  if (truncatedRight && truncatedLeft) {
    truncation = "both";
  } else if (truncatedLeft) {
    truncation = "left";
  } else if (truncatedRight) {
    truncation = "right";
  } 

  var spanNode = {
      selected: selected,
      dominant: dominant,
      color: color,
      note: note,
      truncation: truncation,
      nodes: nodes,
      parentNode: parentNode,
      id: id
  };
  angular.forEach(nodes, function(node) {
    node.parentNode = spanNode;
  });
  return spanNode;
}

