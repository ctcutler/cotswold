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
                imageSrc: "img/baa.jpeg",
                ranges: [
                  { id: "range3", left: 150, top: 135, width: 40, height: 40, selected: false },
                ],
                imageDisplay: "block",
                contentDisplay: "none",
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

      var reload = function () {}; // no op since this is not part of tests
      controller = new EditorController(scope, storage, reload);
  });

  describe("range logic", function() {
    it("should select a single range and clear the others", function() {
      scope.updateSelection("range1", true);
      expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(true);
      expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(false);
      expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(false);

      scope.updateSelection("range2", true);
      expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(false);
      expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(true);
      expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(false);

      scope.updateSelection("range3", true);
      expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(false);
      expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(false);
      expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(true);
    });

    it("should clear all selections", function() {
      // clear one selection
      scope.updateSelection("range1", true);
      scope.clearAllSelections();
      var ranges = scope.getSelectedRanges();
      expect(ranges.length).toBe(0);

      // clear two selections
      scope.updateSelection("range1", true);
      scope.updateSelection("range2", false);
      scope.clearAllSelections();
      ranges = scope.getSelectedRanges();
      expect(ranges.length).toBe(0);
    });
    
    it("should select at most two ranges", function() {
      scope.updateSelection("range1", false);
      expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(true);
      expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(false);
      expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(false);

      scope.updateSelection("range2", false);
      expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(true);
      expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(true);
      expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(false);

      scope.updateSelection("range3", false);
      expect(scope.timepoints[0].artifacts[0].ranges[0].selected).toBe(false);
      expect(scope.timepoints[0].artifacts[1].ranges[0].selected).toBe(true);
      expect(scope.timepoints[0].artifacts[2].ranges[0].selected).toBe(true);
    });

    it("should return all selected ranges", function() {
      scope.updateSelection("range1", true);
      var ranges = scope.getSelectedRanges();
      expect(ranges.length).toBe(1);
      expect(ranges).toContain(scope.timepoints[0].artifacts[0].ranges[0]);

      scope.updateSelection("range2", false);
      ranges = scope.getSelectedRanges();
      expect(ranges.length).toBe(2);
      expect(ranges).toContain(scope.timepoints[0].artifacts[0].ranges[0]);
      expect(ranges).toContain(scope.timepoints[0].artifacts[1].ranges[0]);
    });

    describe("connection logic", function() {
      it("should create a text range", function() {
        // FIXME: refactor makeRange method to make it testable here
        // (inject rangy object?. . . or just separate rangy interaction
        // from model manipulation)
      });
      it("should create a image range", function() {
        scope.makeImageRange("1.3", 1, 2, 3, 4);
        expect(scope.timepoints[0].artifacts[2].ranges.length).toBe(2);
        expect(scope.timepoints[0].artifacts[2].ranges[1].id).toBe("box1.32");
        expect(scope.timepoints[0].artifacts[2].ranges[1].left).toBe(1);
        expect(scope.timepoints[0].artifacts[2].ranges[1].top).toBe(2);
        expect(scope.timepoints[0].artifacts[2].ranges[1].width).toBe(3);
        expect(scope.timepoints[0].artifacts[2].ranges[1].height).toBe(4);
        expect(scope.timepoints[0].artifacts[2].ranges[1].selected).toBe(true);
      });
    });

    it("should remove a range by id", function() {
      scope.removeRange("range1");
      expect(scope.timepoints[0].artifacts[0].ranges.length).toBe(0);
    });

    it("should remove a range", function() {
      scope.updateSelection("range1", true);
      scope.removeRange();
      expect(scope.timepoints[0].artifacts[0].ranges.length).toBe(0);

      // removing two selected ranges shouldn't work
      scope.updateSelection("range2", true);
      scope.updateSelection("range3", false);
      scope.removeRange();
      expect(scope.timepoints[0].artifacts[1].ranges.length).toBe(1);
      expect(scope.timepoints[0].artifacts[2].ranges.length).toBe(1);

      // removing a connected range shouldn't work
      scope.updateSelection("range2", true);
      scope.updateSelection("range3", false);
      scope.makeConnection();
      scope.updateSelection("range2", true);
      scope.removeRange();
      expect(scope.timepoints[0].artifacts[1].ranges.length).toBe(1);
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
  });


  describe("connection logic", function() {
    it("should connect the two selected ranges.", function() {
      scope.updateSelection("range1", true);
      scope.updateSelection("range2", false);
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

    it("should remove a connection", function() {
      // two connected ranges are selected, the connection is removed
      scope.updateSelection("range1", true);
      scope.updateSelection("range2", false);
      scope.makeConnection();
      expect(scope.connections.length).toBe(1);

      scope.removeConnection();
      expect(scope.connections.length).toBe(0);
      scope.clearAllSelections();

      // one unconnected range is selected, nothing happens
      scope.updateSelection("range1", true);
      scope.removeConnection();
      expect(scope.connections.length).toBe(0);
      scope.clearAllSelections();

      // two unconnected ranges are selected, nothing happens
      scope.updateSelection("range1", true);
      scope.updateSelection("range2", false);
      scope.removeConnection();
      expect(scope.connections.length).toBe(0);
      scope.clearAllSelections();

      // one connected range is selected, nothing happens
      scope.updateSelection("range1", true);
      scope.updateSelection("range2", false);
      scope.makeConnection();
      expect(scope.connections.length).toBe(1);

      scope.updateSelection("range1", true);
      scope.removeConnection();
      expect(scope.connections.length).toBe(1);
      scope.clearAllSelections();

      // a second connected range (not connected to the first) is 
      // also selected, nothing happens
      scope.updateSelection("range2", true);
      scope.updateSelection("range3", false);
      scope.makeConnection();
      scope.clearAllSelections();

      scope.updateSelection("range1", true);
      scope.updateSelection("range3", false);

      expect(scope.connections.length).toBe(2);
      scope.removeConnection();
      expect(scope.connections.length).toBe(2);
    });
  });

  describe("node logic", function() {
    it("should reload an artifact's nodes", function() {
      var nodesBefore = stringify(scope.timepoints[0].artifacts[0].nodes);
      scope.updateSelection("range1", true);
      scope.removeRange();
      var nodesAfter = stringify(scope.timepoints[0].artifacts[0].nodes);
      expect(nodesBefore).not.toBe(nodesAfter);
      expect(nodesBefore.length).toBeGreaterThan(nodesAfter.length);
    });
  });

});
