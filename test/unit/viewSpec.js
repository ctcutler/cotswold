"use strict";

describe("The view code", function() {
  describe("connection logic", function() {
    it("should correctly identify the right side midpoint of a box", function() {
      expect(rightSide({x: 9, y: 10, width: 11, height: 12})).toEqual({x: 20, y: 16});
      expect(rightSide({x: 9, y: 10, width: 11, height: 13})).toEqual({x: 20, y: 16.5});
    });
    it("should correctly identify the left side midpoint of a box", function() {
      expect(leftSide({x: 9, y: 10, width: 11, height: 12})).toEqual({x: 9, y: 16});
      expect(leftSide({x: 9, y: 10, width: 11, height: 13})).toEqual({x: 9, y: 16.5});
    });
    it("should correctly identify the top side midpoint of a box", function() {
      expect(topSide({x: 9, y: 10, width: 11, height: 12})).toEqual({x: 14.5, y: 10});
      expect(topSide({x: 9, y: 10, width: 12, height: 12})).toEqual({x: 15, y: 10});
    });
    it("should correctly identify the bottom side midpoint of a box", function() {
      expect(bottomSide({x: 9, y: 10, width: 11, height: 12})).toEqual({x: 14.5, y: 22});
      expect(bottomSide({x: 9, y: 10, width: 12, height: 12})).toEqual({x: 15, y: 22});
    });

    it("should find the right perimeter distance given two coordinate pairs", function() {
      expect(getPerimeter({x:1, y:2}, {x:3, y:4})).toBe(8);
      expect(getPerimeter({x:3, y:4}, {x:1, y:2})).toBe(8);
      expect(getPerimeter({x:6, y:6}, {x:6, y:6})).toBe(0);
    });

    it("should find the right connection when the boxes are side by side", function() {
      var box1 = {x: 9, y: 9, width: 9, height: 9};
      var box2 = {x: 45, y: 9, width: 9, height: 9};
      expect(getBestConnection(box1, box2)).toEqual([rightSide(box1), leftSide(box2)]);
      expect(getBestConnection(box2, box1)).toEqual([leftSide(box2), rightSide(box1)]);
    });
   
    it("should find the right connection when the boxes are nearly side by side", function() {
      var box1 = {x: 9, y: 9, width: 9, height: 9};
      var box2 = {x: 45, y: 13, width: 9, height: 9};
      expect(getBestConnection(box1, box2)).toEqual([rightSide(box1), leftSide(box2)]);
      expect(getBestConnection(box2, box1)).toEqual([leftSide(box2), rightSide(box1)]);
    });
    it("should find the right connection when the boxes are above and below each other", function() {
      var box1 = {x: 9, y: 9, width: 9, height: 9};
      var box2 = {x: 9, y: 45, width: 9, height: 9};
      expect(getBestConnection(box1, box2)).toEqual([bottomSide(box1), topSide(box2)]);
      expect(getBestConnection(box2, box1)).toEqual([topSide(box2), bottomSide(box1)]);
    });
    it("should find the right connection when the boxes are above and below each other", function() {
      var box1 = {x: 9, y: 9, width: 9, height: 9};
      var box2 = {x: 13, y: 45, width: 9, height: 9};
      expect(getBestConnection(box1, box2)).toEqual([bottomSide(box1), topSide(box2)]);
      expect(getBestConnection(box2, box1)).toEqual([topSide(box2), bottomSide(box1)]);
    });
  });

  /*
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

    it("should create a range", function() {
      // FIXME: refactor makeRange method to make it testable here
      // (inject rangy object?. . . or just separate rangy interaction
      // from model manipulation)
    });

    it("should remove a range", function() {
      scope.updateSelection("range1", false);
      scope.removeRange();
      expect(scope.timepoints[0].artifacts[0].ranges.length).toBe(0);

      // removing two selected ranges shouldn't work
      scope.updateSelection("range2", false);
      scope.updateSelection("range3", true);
      scope.removeRange();
      expect(scope.timepoints[0].artifacts[1].ranges.length).toBe(1);
      expect(scope.timepoints[0].artifacts[2].ranges.length).toBe(1);

      // removing a connected range shouldn't work
      scope.updateSelection("range2", false);
      scope.updateSelection("range3", true);
      scope.makeConnection();
      scope.updateSelection("range2", false);
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

    it("should remove a connection", function() {
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
  });

  describe("node logic", function() {
    it("should reload an artifact's nodes", function() {
      var nodesBefore = stringify(scope.timepoints[0].artifacts[0].nodes);
      scope.updateSelection("range1", false);
      scope.removeRange();
      var nodesAfter = stringify(scope.timepoints[0].artifacts[0].nodes);
      expect(nodesBefore).not.toBe(nodesAfter);
      expect(nodesBefore.length).toBeGreaterThan(nodesAfter.length);
    });
  });
  */
});
