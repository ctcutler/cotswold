"use strict";

describe("The EditorController", function() {
  // how to test both the range selection functions and 
  // the return all selected ranges function when they are
  // circular
  var scope;
  var controller;
  var storage;

  beforeEach(function() {
      scope = {};
      storage = {
        expanded: false,
        connections: [
        ],
        timepoints: [
          {
            id: "1",
            name: "Tuesday Class",
            artifacts: [
              { 
                id: "1.1",
                imageDisplay: "none",
                contentDisplay: "block",
                content: "Foo bar baz buz quux",
                ranges: [
                  { start: 1, end: 4, id: "range1", style: "red", selected: false },
                ],
                width: 300,
                maxHeight: 300,
              },
              { 
                id: "1.2",
                imageDisplay: "none",
                contentDisplay: "block",
                content: "Foo bar baz buz quux",
                ranges: [
                  { start: 1, end: 4, id: "range2", style: "red", selected: false },
                ],
                width: 300,
                maxHeight: 300,
              },
              { 
                id: "1.3",
                imageDisplay: "none",
                contentDisplay: "block",
                content: "Foo bar baz buz quux",
                ranges: [
                  { start: 1, end: 4, id: "range3", style: "red", selected: false },
                ],
                width: 300,
                maxHeight: 300,
              },
            ]
          },
        ],
      };

      for (var k in storage) {
        if (storage.hasOwnProperty(k)) {
          storage[k] = JSON.stringify(storage[k]);
        }
      }

      controller = new EditorController(scope, storage);
  });

  it("should select a single range and clear the others", function() {
    scope.updateSelection("range1", false);
    expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(true);
    expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(false);
    expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(false);

    scope.updateSelection("range2", false);
    expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(false);
    expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(true);
    expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(false);

    scope.updateSelection("range3", false);
    expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(false);
    expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(false);
    expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(true);
  });

  it("should clear all selections", function() {
    // clear one selection
    scope.updateSelection("range1", false);
    scope.clearAllSelections();
    var ranges = scope.getSelectedRanges();
    expect(ranges.length).toBe(0);

    // clear two selections
    scope.updateSelection("range1", false);
    scope.updateSelection("range2", true);
    scope.clearAllSelections();
    ranges = scope.getSelectedRanges();
    expect(ranges.length).toBe(0);
  });
  
  it("should select at most two ranges", function() {
    scope.updateSelection("range1", true);
    expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(true);
    expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(false);
    expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(false);

    scope.updateSelection("range2", true);
    expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(true);
    expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(true);
    expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(false);

    scope.updateSelection("range3", true);
    expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(false);
    expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(true);
    expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(true);
  });

  it("should return all selected ranges", function() {
    scope.updateSelection("range1", false);
    var ranges = scope.getSelectedRanges();
    expect(ranges.length).toBe(1);
    expect(ranges).toContain(scope.timepoints[0].artifacts[0].ranges[0]);

    scope.updateSelection("range2", true);
    ranges = scope.getSelectedRanges();
    expect(ranges.length).toBe(2);
    expect(ranges).toContain(scope.timepoints[0].artifacts[0].ranges[0]);
    expect(ranges).toContain(scope.timepoints[0].artifacts[1].ranges[0]);
  });

  it("should connect the two selected ranges.", function() {
    scope.updateSelection("range1", false);
    scope.updateSelection("range2", true);
    scope.makeConnection();
    expect(scope.connections.length).toBe(1);
    expect(scope.connections[0]).toContain("range1");
    expect(scope.connections[0]).toContain("range2");

    // confirm that it won't create duplicate
    scope.makeConnection();
    expect(scope.connections.length).toBe(1);
    expect(scope.connections[0]).toContain("range1");
    expect(scope.connections[0]).toContain("range2");
  });

  it("should select remove a connection", function() {
    // two connected ranges are selected, the connection is removed
    scope.updateSelection("range1", false);
    scope.updateSelection("range2", true);
    scope.makeConnection();
    expect(scope.connections.length).toBe(1);

    scope.removeConnection();
    expect(scope.connections.length).toBe(0);
    scope.clearAllSelections();

    // one unconnected range is selected, nothing happens
    scope.updateSelection("range1", false);
    scope.removeConnection();
    expect(scope.connections.length).toBe(0);
    scope.clearAllSelections();

    // two unconnected ranges are selected, nothing happens
    scope.updateSelection("range1", false);
    scope.updateSelection("range2", true);
    scope.removeConnection();
    expect(scope.connections.length).toBe(0);
    scope.clearAllSelections();

    // one connected range is selected, nothing happens
    scope.updateSelection("range1", false);
    scope.updateSelection("range2", true);
    scope.makeConnection();
    expect(scope.connections.length).toBe(1);

    scope.updateSelection("range1", false);
    scope.removeConnection();
    expect(scope.connections.length).toBe(1);
    scope.clearAllSelections();

    // a second connected range (not connected to the first) is 
    // also selected, nothing happens
    scope.updateSelection("range2", false);
    scope.updateSelection("range3", true);
    scope.makeConnection();
    scope.clearAllSelections();

    scope.updateSelection("range1", false);
    scope.updateSelection("range3", true);

    expect(scope.connections.length).toBe(2);
    scope.removeConnection();
    expect(scope.connections.length).toBe(2);
  });

  it("should create a range", function() {
    // FIXME: refactor makeRange method to make it testable here
    // (inject rangy object?. . . or just separate rangy interaction
    // from model manipulation)
  });

  it("should select remove a range", function() {
    scope.updateSelection("range1", false);
    scope.removeRange();
    expect(scope.timepoints[0].artifacts[0].ranges.length).toBe(0);

    scope.updateSelection("range2", false);
    scope.updateSelection("range3", true);
    scope.removeRange();
    expect(scope.timepoints[0].artifacts[1].ranges.length).toBe(1);
    expect(scope.timepoints[0].artifacts[2].ranges.length).toBe(1);
  });

  it("should get artifacts by id", function() {
    var artifact = scope.getArtifactById("1.1");
    expect(artifact).not.toBe(null);

    artifact = scope.getArtifactById("2.1");
    expect(artifact).toBe(null);
  });

  it("should get ranges by id", function() {
    var range = scope.getRangeById("range1");
    expect(range).not.toBe(null);

    range = scope.getRangeById("range0");
    expect(range).toBe(null);
  });


  // FIXME:
  // * reload artifact nodes
  // * reload all nodes
  // * reload connections
  // * add/remove connection/artifact actually updates nodes
  // * what happens when we remove a connected range?
});
