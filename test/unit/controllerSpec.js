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
    scope.connectSelected();
    expect(scope.connections.length).toBe(1);
    expect(scope.connections[0]).toContain("range1");
    expect(scope.connections[0]).toContain("range2");

    // confirm that it won't create duplicate
    scope.connectSelected();
    expect(scope.connections.length).toBe(1);
    expect(scope.connections[0]).toContain("range1");
    expect(scope.connections[0]).toContain("range2");
  });
});
