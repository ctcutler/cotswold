"use strict";

function EditorController($scope, storage) {
  var timepoints = JSON.parse(storage["timepoints"]);
  for (var i=0; i<timepoints.length; i++) {
    var timepoint = timepoints[i];
    for (var j=0; j<timepoint.artifacts.length; j++) {
      var artifact = timepoint.artifacts[j];
      artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;
    }
  }

  $scope.timepoints = timepoints;
  $scope.expanded = JSON.parse(storage["expanded"]);
  $scope.connections = JSON.parse(storage["connections"]);

  $scope.connectSelected = function () {
  }

  $scope.makeConnection = function (left, right) {
    $scope.connections.push({leftId: left, rightId: right});
  };

  $scope.makeRange = function () {
    var sel = rangy.getSelection();
    var startArtifact = getArtifactAncestor(sel.anchorNode);
    var endArtifact = getArtifactAncestor(sel.focusNode);
    // FIXME: this could be neater
    var startOffset = getCaretCharacterOffsetWithin(
      startArtifact.firstElementChild.firstElementChild, true
    );
    var endOffset = getCaretCharacterOffsetWithin(
      startArtifact.firstElementChild.firstElementChild, false
    );

    if (startArtifact.id != endArtifact.id) {
      sel.removeAllRanges();
      return;
    }

    var foundArtifact = false;
    var newRangeId = null;
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.id == startArtifact.id) {
          newRangeId = "range-"+artifact.id+"."+(artifact.ranges.length+1);
          artifact.ranges.push(
            {
              start: startOffset, 
              end: endOffset, 
              id: newRangeId,
              style: "red",
              selected: true
            }
          );
          artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;
          foundArtifact = true;
          break;
        }
      }
      if (foundArtifact) break;
    }

    if (newRangeId) {
      // even though new range is already selected, 
      // need to make sure everything else is unselected
      $scope.updateSelection(newRangeId);
    }
  };

  $scope.dumpSpanTree = function() {
    return stringify($scope.timepoints);
  };

  $scope.clickHandler = function (clickEvent) {
    // look at event target and its ancestors 
    var node = clickEvent.target;
    while (node && node.nodeName == "SPAN" && !node.id) {
      node = node.parentNode;
    }
    
    if (!node.id) {
      return;
    }

    $scope.updateSelection(node.id);
  };

  $scope.previousSelection = null;
  $scope.updateSelection = function(rangeIdToSelect, keepPrevious) {
    var newlySelected = null;
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
            } else if (!(keepPrevious && $scope.previousSelection == range.id)) {
              range.selected = false;
            }
          }
          artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;
        }
      }
    }
    $scope.previousSelection = newlySelected;
  };

  $scope.toggleZoom = function () {
    var width = $scope.expanded ? ARTIFACT_WIDTH_NORMAL : ARTIFACT_WIDTH_EXPANDED;
    var maxHeight = $scope.expanded ? ARTIFACT_MAX_HEIGHT_NORMAL : ARTIFACT_MAX_HEIGHT_EXPANDED;

    $scope.expanded = !$scope.expanded;
    storage["expanded"] = JSON.stringify($scope.expanded);

    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        artifact.width = width;
        artifact.maxHeight = maxHeight;
      }
    }
    storage["timepoints"] = JSON.stringify($scope.timepoints);

    redraw($scope.connections);
  };
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

