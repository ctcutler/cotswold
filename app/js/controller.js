"use strict";

function EditorController($scope, storage, render) {

  /* event handlers */
  angular.element(window).bind('load', function() {
    $scope.reloadView();
  });

  jQuery('#files').bind('change', function(e) {
    var files = e.target.files; // FileList object

    for (var i = 0, f; f = files[i]; i++) {
      var reader = new FileReader();
      var isImage = isImageFile(f.name);

      reader.onload = (function(theFile) {
        return function(e) {
          var artifact;
          if (isImage) {
            artifact = $scope.makeImageArtifact(e.target.result);
          } else {
            artifact = $scope.makeTextArtifact(e.target.result);
          }
          $scope.timepoints[$scope.timepoints.length-1].artifacts.push(artifact);
          $scope.reloadAllNodes();
        };
      })(f);

      if (isImage) {
        reader.readAsDataURL(f);
      } else {
        reader.readAsText(f);
      }
    }
  });

  jQuery('body').bind('keydown', function(e) {
    if (e.keyCode === 16) {
      $scope.shiftDown = true;
    } else if (e.keyCode === 84) { // 't'
      $scope.makeTimepoint();
    } else if (e.keyCode === 82) { // 'r'
      $scope.makeRange();
    } else if (e.keyCode === 67) { // 'c'
      $scope.makeConnection();
    } else if (e.keyCode === 88) { // 'x'
      $scope.removeSelected();
    }
  });

  jQuery('body').bind('keyup', function(e) {
    if (e.keyCode === 16) {
      $scope.shiftDown = false;
    }
  });

  /* scope methods */
  var timepoints = JSON.parse(storage["timepoints"]);

  $scope.timepoints = timepoints;
  $scope.expanded = JSON.parse(storage["expanded"]);
  $scope.connections = JSON.parse(storage["connections"]);

  $scope.save = function () {
    storage["timepoints"] = stringifyWhenSaving($scope.timepoints);
    storage["expanded"] = stringifyWhenSaving($scope.expanded);
    storage["connections"] = stringifyWhenSaving($scope.connections);
  }

  $scope.reloadView = function () {
    render($scope);
    // save whenever we reload on the theory that if we're showing the 
    // change to the user we should probably remember it
    $scope.save();
  };


  $scope.reloadArtifactNodes = function(artifact, reloadView) {
    artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;

    // by default we reload the view
    if (reloadView || reloadView === undefined) {
      $scope.reloadView();
    }
  }

  $scope.reloadAllNodes = function(artifact) {
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
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

  $scope.makeTimepoint = function () {
    // for now, just append a new timepoint to the end
    var nextId = $scope.getNextTimepointId();
    $scope.timepoints.push({
      id: nextId, name: "Timepoint "+nextId, artifacts: []
    });

    $scope.reloadAllNodes();
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

  $scope.removeSelected = function () {
    var selectedConnection = $scope.getSelectedConnection();
    if (selectedConnection) {
      $scope.removeConnection(selectedConnection.id);
    } else {
      $scope.removeRange();
    }
  }

  $scope.removeRange = function () {
    var selectedRange;
    var selectedRanges = $scope.getSelectedRanges();
    if (selectedRanges.length === 1) {
      selectedRange = selectedRanges[0];
    } else {
      console.log(selectedRanges.length + " range(s) selected: refusing to remove range.");
      return;
    }
    
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.ranges) {
          for (var k=0; k<artifact.ranges.length; k++) {
            var range = artifact.ranges[k];
            if (range === selectedRange) {
              if ($scope.rangeIsConnected(range.id)) {
                console.log("Range "+range.id+" is connected: refusing to remove")
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

  $scope.rangeIsConnected = function(rangeId) {
    for (var l=0; l<$scope.connections.length; l++) {
      var connection = $scope.connections[l];
      if (connection.rangeIds.indexOf(rangeId) != -1) {
        return true;
      }
    }
    return false;
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

  $scope.setConnectionColor = function(connectionId, color) {
    for (var i=0; i<$scope.connections.length; i++) {
      if ($scope.connections[i].id == connectionId) {
        $scope.connections[i].color = color;
        $scope.reloadView();
        break;
      }
    }
  }

  $scope.getSelectedConnection = function() {
    for (var i=0; i<$scope.connections.length; i++) {
      if ($scope.connections[i].selected) 
        return $scope.connections[i];
    }
    return null;
  }

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
 
  $scope.rangeIsSelected = function(rangeId) {
    var selectedRanges = $scope.getSelectedRanges();
    for (var i=0; i<selectedRanges; i++) {
      var selectedRange = selectedRanges[i];
      if (selectedRange.id === rangeId) {
        return true;
      }
    }
    return false;
  };
  $scope.clearAllSelectedConnections = function(reload) {
    for (var i=0; i<$scope.connections.length; i++) {
      var connection = $scope.connections[i];
      connection.selected = false;
    }
    if (reload)
      $scope.reloadAllNodes();
  };

  $scope.clearAllSelectedRanges = function(reload) {
    var selectedRanges = $scope.getSelectedRanges();
    for (var i=0; i<selectedRanges.length; i++) {
      selectedRanges[i].selected = false;
    }
    if (reload)
      $scope.reloadAllNodes();
  };

  $scope.clearAllSelections = function() {
    $scope.clearAllSelectedRanges(false);
    $scope.clearAllSelectedConnections(false);
    $scope.reloadAllNodes();
  };

  $scope.rangeIsConnectable = function(rangeId) {
    var selectedRanges = $scope.getSelectedRanges();
    var thisSelectedRange = null;
    var otherSelectedRange = null;

    // there must be one or two ranges selected
    if (selectedRanges.length > 2 
      || selectedRanges.length === 0) {
      return false;
    }

    // if there are two selected, one must match rangeId
    // and they must not be connected
    if (selectedRanges.length === 2
      && ((selectedRanges[0].id !== rangeId && selectedRanges[1].id !== rangeId)
        || $scope.rangesAreConnected(selectedRanges[0].id, selectedRanges[1].id))) {
      return false;
    }
 
    // if there is one selected, it must not match rangeId
    if (selectedRanges.length === 1
      && (selectedRanges[0].id === rangeId
        || $scope.rangesAreConnected(selectedRanges[0].id, rangeId))) {
      return false;
    }

    return true;
  }

  $scope.rangesAreConnected = function (rangeId1, rangeId2) {
    for (var i=0; i<$scope.connections.length; i++) {
      var connection = $scope.connections[i];
      if (connection.rangeIds.indexOf(rangeId1) != -1 && connection.rangeIds.indexOf(rangeId2) != -1) {
        return true;
      }
    }
    return false;
  }

  $scope.makeConnection = function() {
    var selectedRanges = $scope.getSelectedRanges();
    if (selectedRanges.length === 2) {
      var r1 = selectedRanges[0];
      var r2 = selectedRanges[1];
      
      if ($scope.rangesAreConnected(r1.id, r2.id)) {
        console.log("Connection between "+r1.id+" and "+r2.id+" already exists: refusing to create connection");
      } else {
        $scope.connections.push({ rangeIds: [r1.id, r2.id], selected: false, id: r1.id+"-"+r2.id, note:"", color: "color1"});
        $scope.reloadView();
      }
    } else {
      console.log(selectedRanges.length + " range(s) selected: refusing to create connection.");
    }
  };

  $scope.removeConnection = function (connectionId) {
    var selectedRanges = $scope.getSelectedRanges();
    if (selectedRanges.length === 2 || connectionId) {
      for (var i=0; i<$scope.connections.length; i++) {
        var connection = $scope.connections[i];
        if (connectionId) {
          // if connectionId set, don't delete connection
          // between selected ranges even if it exists
          if (connectionId === connection.id) {
            $scope.connections.splice(i, 1);
            $scope.reloadView();
            break;
          }
        } else if (connection.rangeIds.indexOf(selectedRanges[0].id) !== -1 
          && connection.rangeIds.indexOf(selectedRanges[1].id) !== -1) {
          $scope.connections.splice(i, 1);
          $scope.reloadView();
          break;
        }
      }
    } else {
      console.log(selectedRanges.length + " range(s) selected: refusing to remove connection.");
    }
  };

  $scope.selectConnection = function (connectionId) {
    for (var i=0; i<$scope.connections.length; i++) {
      var connection = $scope.connections[i];
      connection.selected = (connection.id === connectionId);
    }
    $scope.reloadView();
  }

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

  $scope.getNextArtifactId = function () {
    var nextId = 1;
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var aId = parseInt(timepoint.artifacts[j].id.slice(1), 10);
        if (nextId < aId) {
          nextId = aId;
        }
      }
    }
    return "a"+(nextId+1);
  };

  $scope.getNextTimepointId = function () {
    var nextId = 1;
    for (var i=0; i<$scope.timepoints.length; i++) {
      var tId = parseInt($scope.timepoints[i].id.slice(1), 10);
      if (nextId < tId) {
        nextId = tId;
      }
    }
    return "t"+(nextId+1);
  };

  $scope.makeTextArtifact = function (text) {
    return { 
      id: $scope.getNextArtifactId(),
      imageDisplay: "none",
      contentDisplay: "block",
      content: text,
      ranges: [],
      width: ARTIFACT_WIDTH_NORMAL,
      maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
    };
  };

  $scope.makeImageArtifact = function (imageSrc) {
    return { 
      id: $scope.getNextArtifactId(),
      imageDisplay: "block",
      contentDisplay: "none",
      imageSrc: imageSrc,
      ranges: [],
      width: ARTIFACT_WIDTH_NORMAL,
      maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
    };
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

// ignores keys called "nodes" since these contain cycles and are 
// ephemeral anyway (used for hierarchical text range handling)
function stringifyWhenSaving(obj) {
  return JSON.stringify(
    obj,
    function(key, val) {
      if (key == "nodes") {
        return undefined;
      } else {
        return val;
      }
    }
  );
}


function isImageFile(fileName) {
  var lcName = fileName.toLowerCase();
  return endsWith(lcName, ".png") ||
    endsWith(lcName, ".gif") ||
    endsWith(lcName, ".jpg") ||
    endsWith(lcName, ".jpeg");
}

function endsWith(s, suffix) {
    return s.indexOf(suffix, s.length - suffix.length) !== -1;
}

