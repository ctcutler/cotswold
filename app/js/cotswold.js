"use strict";

var ARTIFACT_WIDTH_NORMAL = 300;
var ARTIFACT_MAX_HEIGHT_NORMAL = 300;
var ARTIFACT_WIDTH_EXPANDED = 600;
var ARTIFACT_MAX_HEIGHT_EXPANDED = "none";

/*
  FIXME:
  X images
  X artifact scrolling
  X expanded view
  * movies
  * hbox and vbox implementations
    ** sizes self based on contents unless width and height attributes are set
    ** attributes for margin and padding
    ** attributes for horizontal and vertical alignment
    ** FIXME: mockup timeline with these options and confirm that they are sufficient
  * get offset of text range
  * editting
  * comments
  * tags
  x zoom in and out (all the way out to full resolution, poster size)
  * single artifact zoom
  x scrolling in artifacts
  * real connections
  * data storage
  * newline rendering
*/


function EditorController($scope) {
  localStorage.clear();

  if (!localStorage["expanded"]) {
    localStorage["expanded"] = JSON.stringify(hardCodedExpanded);
    localStorage["connections"] = JSON.stringify(hardCodedConnections);
    localStorage["timepoints"] = JSON.stringify(hardCodedTimepoints);
  }

  var timepoints = JSON.parse(localStorage["timepoints"]);
  for (var i=0; i<timepoints.length; i++) {
    var timepoint = timepoints[i];
    for (var j=0; j<timepoint.artifacts.length; j++) {
      var artifact = timepoint.artifacts[j];
      artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;
    }
  }

  $scope.timepoints = timepoints;
  $scope.expanded = JSON.parse(localStorage["expanded"]);
  $scope.connections = JSON.parse(localStorage["connections"]);

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

  $scope.updateSelection = function(rangeIdToSelect) {
    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        if (artifact.ranges) {
          for (var k=0; k<artifact.ranges.length; k++) {
            var range = artifact.ranges[k];
            range.selected = (range.id == rangeIdToSelect);
          }
          artifact.nodes = makeSpanTree(artifact.ranges, artifact.content).nodes;
        }
      }
    }
  };

  $scope.toggleZoom = function () {
    var width = $scope.expanded ? ARTIFACT_WIDTH_NORMAL : ARTIFACT_WIDTH_EXPANDED;
    var maxHeight = $scope.expanded ? ARTIFACT_MAX_HEIGHT_NORMAL : ARTIFACT_MAX_HEIGHT_EXPANDED;

    $scope.expanded = !$scope.expanded;
    localStorage["expanded"] = JSON.stringify($scope.expanded);

    for (var i=0; i<$scope.timepoints.length; i++) {
      var timepoint = $scope.timepoints[i];
      for (var j=0; j<timepoint.artifacts.length; j++) {
        var artifact = timepoint.artifacts[j];
        artifact.width = width;
        artifact.maxHeight = maxHeight;
      }
    }
    localStorage["timepoints"] = JSON.stringify($scope.timepoints);

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

var hardCodedExpanded = false;
var hardCodedConnections = [
  { leftId: "range1", rightId: "range14", },
  { leftId: "range2", rightId: "range16"},
  { leftId: "box1", rightId: "range14"},
];
var hardCodedTimepoints = [
  { 
    id: "1",
    name: "Tuesday Class",
    artifacts: [
      { 
        id: "1.1",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 26, id: "range1", style: "red", selected: true },
          { start: 18, end: 21, id: "range2", style: "blue", selected: false },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
      { 
        id: "1.2",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range11", style: "red", selected: false },
          { start: 18, end: 21, id: "range12", style: "blue", selected: false },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
      { 
        id: "1.3",
        imageSrc: "img/baa.jpeg",
        imageBoxes: [
          { id: "box1", left: 150, top: 135, width: 40, height: 40 },
        ],
        imageDisplay: "block",
        contentDisplay: "none",
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL, 
      },
    ]
  },
  { 
    id: "2",
    name: "Wednesday Feedback",
    artifacts: [
      { 
        id: "2.1",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range13", style: "red", selected: false },
          { start: 18, end: 21, id: "range14", style: "blue", selected: false },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
    ]
  },
  { 
    id: "3",
    name: "Thursday Class",
    artifacts: [
      { 
        id: "3.1",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range15", style: "red", selected: false },
          { start: 18, end: 21, id: "range16", style: "blue", selected: false },
        ],
        /***
        FIXME: translate these into ranges
        contentChunks: [
          { content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut ", spanId: "span3" },
          { content: "labore", class: "highlighted", spanId: "span4"  },
          { content: " et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  ", spanId: "span5" },
          { content: "Bottom!", class: "highlighted", spanId: "span6"  },
        ],
        ***/
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL, 
      },
      { 
        id: "3.2",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 6, end: 11, id: "range17", style: "red", selected: false },
          { start: 18, end: 21, id: "range18", style: "blue", selected: false },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
    ]
  }
];
