"use strict";

var hardCodedExpanded = false;
var hardCodedConnections = [
  [ "range1", "range12", ],
  [ "range2", "range17"],
  [ "range1", "range14"],
  [ "box1", "range14"],
];
var hardCodedTimepoints = [
  { 
    id: "1",
    name: "Tuesday Class",
    artifacts: [
      { 
        id: "aa",
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
        id: "ab",
        imageDisplay: "none",
        contentDisplay: "block",
        content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ranges: [
          { start: 0, end: 11, id: "range11", style: "red", selected: false },
          { start: 18, end: 21, id: "range12", style: "blue", selected: false },
        ],
        width: ARTIFACT_WIDTH_NORMAL,
        maxHeight: ARTIFACT_MAX_HEIGHT_NORMAL,
      },
      { 
        id: "ac",
        imageSrc: "img/baa.jpeg",
        ranges: [
          { id: "box1", left: 150, top: 135, width: 40, height: 40, selected: false},
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
        id: "ba",
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
        id: "ca",
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
        id: "cb",
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
