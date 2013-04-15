"use strict";

function EditorController($scope, storage, render) {

  var timepoints = JSON.parse(storage["timepoints"]);

  $scope.timepoints = timepoints;
  $scope.expanded = JSON.parse(storage["expanded"]);
  $scope.connections = JSON.parse(storage["connections"]);

  $scope.reloadView = function () {
    render($scope);
  };

  angular.element(window).bind('load', function() {
    $scope.reloadView();
  });


  jQuery('body').bind('keydown', function(e) {
    if (e.keyCode === 16) {
      $scope.shiftDown = true;
    }
  });

  jQuery('body').bind('keyup', function(e) {
    if (e.keyCode === 16) {
      $scope.shiftDown = false;
    }
  });

  $scope.reloadArtifactNodes = function(artifact, reloadView) {
    artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;

    // by default we reload the view
    if (reloadView || reloadView === undefined) {
      $scope.reloadView();
    }
  }

  $scope.reloadAllNodes = function(artifact) {
    for (var i=0; i<timepoints.length; i++) {
      var timepoint = timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        $scope.reloadArtifactNodes(timepoint.artifacts[j], false);
      }
    }
    $scope.reloadView();
  }

  $scope.makeImageRange = function (artifactId, x, y, width, height) {
    var artifact = $scope.getArtifactById(artifactId);
    var newRangeId = null;
    if (artifact) {
      newRangeId = "box"+artifact.id+(artifact.ranges.length+1);
      artifact.ranges.push(
        {
          left: x,
          top: y,
          width: width,
          height: height,
          id: newRangeId,
          selected: true
        }
      );
      $scope.reloadArtifactNodes(artifact);
    }

    if (newRangeId) {
      // even though new range is already selected, 
      // need to make sure everything else is unselected
      $scope.updateSelection(newRangeId, true);
    }
  }

  $scope.makeRange = function () {
    var sel = rangy.getSelection();
    var startArtifact = getArtifactAncestor(sel.anchorNode);
    var endArtifact = getArtifactAncestor(sel.focusNode);
    var startOffset = getCaretCharacterOffsetWithin(
      startArtifact.firstElementChild, true
    );
    var endOffset = getCaretCharacterOffsetWithin(
      startArtifact.firstElementChild, false
    );

    if (startArtifact.id != endArtifact.id) {
      sel.removeAllRanges();
      return;
    }

    var newRangeId = null;
    var artifact = $scope.getArtifactById(startArtifact.id);
    if (artifact) {
      newRangeId = "range"+artifact.id+(artifact.ranges.length+1);
      artifact.ranges.push(
        {
          start: startOffset, 
          end: endOffset, 
          id: newRangeId,
          style: "red",
          selected: true
        }
      );
      $scope.reloadArtifactNodes(artifact);
    }

    if (newRangeId) {
      // even though new range is already selected, 
      // need to make sure everything else is unselected
      $scope.updateSelection(newRangeId, true);
    }
  };

  $scope.removeRange = function (rangeId) {
    var selectedRange;
    if (rangeId === undefined) {
      var selectedRanges = $scope.getSelectedRanges();
      if (selectedRanges.length === 1) {
        selectedRange = selectedRanges[0];
      } else {
        console.log(selectedRanges.length + " range(s) selected: refusing to remove range.");
        return;
      }
    } else {
      selectedRange = $scope.getRangeById(rangeId);
    }
    
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.ranges) {
          for (var k=0; k<artifact.ranges.length; k++) {
            var range = artifact.ranges[k];
            if (range === selectedRange) {

              var rangeIsConnected = false;
              for (var i=0; i<$scope.connections.length; i++) {
                var connection = $scope.connections[i];
                if (connection.indexOf(range.id) != -1) {
                  rangeIsConnected = true;
                  break;
                }
              }

              if (rangeIsConnected) {
                console.log("Range is connected: refusing to remove");
              } else {
                artifact.ranges.splice(k, 1);
                $scope.reloadArtifactNodes(artifact);
              }

              break;
            }
          }
        }
      }
    }
  };

  $scope.dumpSpanTree = function() {
    return stringify($scope.timepoints);
  };

  $scope.shiftDown = false;

  $scope.previousSelection = null;
  $scope.updateSelection = function(rangeIdToSelect, clearPrevious) {
    var newlySelected = null;
    if (clearPrevious == null) clearPrevious = !$scope.shiftDown;
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.ranges) {
          for (var k=0; k<artifact.ranges.length; k++) {
            var range = artifact.ranges[k];

            if (range.id == rangeIdToSelect) {
              range.selected = true;
              newlySelected = range.id;
            } else if (clearPrevious || $scope.previousSelection != range.id) {
              range.selected = false;
            }
          }
          $scope.reloadArtifactNodes(artifact);
        }
      }
    }
    $scope.previousSelection = newlySelected;
  };

  $scope.getSelectedRanges = function() {
    var selectedRanges = [];
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.ranges) {
          for (var k=0; k<artifact.ranges.length; k++) {
            var range = artifact.ranges[k];
            if (range.selected) {
              selectedRanges.push(range);
            }
          }
        }
      }
    }
    return selectedRanges;
  };
 
  $scope.clearAllSelections = function() {
    var selectedRanges = $scope.getSelectedRanges();
    for (var i=0; i<selectedRanges.length; i++) {
      selectedRanges[i].selected = false;
    }
  };

  $scope.makeConnection = function() {
    var selectedRanges = $scope.getSelectedRanges();
    if (selectedRanges.length === 2) {
      var r1 = selectedRanges[0];
      var r2 = selectedRanges[1];
      var foundDup = false;
      for (var i=0; i<$scope.connections.length; i++) {
        var connection = $scope.connections[i];
        if (connection.indexOf(r1.id) != -1 && connection.indexOf(r2.id) != -1) {
          foundDup = true;
        }
      }
      
      if (foundDup) {
        console.log("Connection between "+r1.id+" and "+r2.id+" already exists: refusing to create connection");
      } else {
        $scope.connections.push([r1.id, r2.id]);
        $scope.reloadView();
      }
    } else {
      console.log(selectedRanges.length + " range(s) selected: refusing to create connection.");
    }
  };

  $scope.removeConnection = function () {
    var selectedRanges = $scope.getSelectedRanges();
    if (selectedRanges.length === 2) {
      for (var i=0; i<$scope.connections.length; i++) {
        var connection = $scope.connections[i];
        if (connection.indexOf(selectedRanges[0].id) !== -1 
          && connection.indexOf(selectedRanges[1].id) !== -1) {
          $scope.connections.splice(i, 1);
          $scope.reloadView();
          break;
        }
      }
    } else {
      console.log(selectedRanges.length + " range(s) selected: refusing to remove connection.");
    }
  };

  $scope.getArtifactById = function (artifactId) {
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.id == artifactId) {
          return artifact;
        }
      }
    }
    return null;
  };

  $scope.getRangeById = function (rangeId) {
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.ranges) {
          for (var k=0; k<artifact.ranges.length; k++) {
            var range = artifact.ranges[k];
            if (range.id === rangeId) {
              return range;
            }
          }
        }
      }
    }
    return null;
  };

  $scope.reloadAllNodes();
  
}


function getArtifactAncestor(node) {
  while (node && node.className != "artifact") {
    node = node.parentNode;
  }
  return node;
}

// Adapted from: http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container
// Thanks, Tim Down!
function getCaretCharacterOffsetWithin(element, start) {
    var caretOffset = 0;
    if (typeof window.getSelection != "undefined") {
        var range = window.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        if (start) {
          preCaretRange.setEnd(range.startContainer, range.startOffset);
        } else {
          preCaretRange.setEnd(range.endContainer, range.endOffset);
        }
        caretOffset = preCaretRange.toString().length;
    } else if (typeof document.selection != "undefined" && document.selection.type != "Control") {
        var textRange = document.selection.createRange();
        var preCaretTextRange = document.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
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
        seen.push(val);
      }
      return val;
    }
  );
}

