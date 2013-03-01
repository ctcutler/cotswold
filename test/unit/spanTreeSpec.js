"use strict";

function hasKeys(expectedKeys, obj) {
  for (var i=0; i < expectedKeys.length; i++) {
    if (!expectedKeys[i] in obj) {
      return false;
    }
  }
  return true;
}

describe("The makeSpanTree() method", function() {

  beforeEach(function() {
    this.addMatchers({
      toHaveTheseKeys: function(expectedKeys) {
        return hasKeys(expectedKeys, this.actual);
      },
      toBeAContentNodeWith: function(start, end, content) {
        if (!hasKeys(["content", "start", "end"], this.actual)) return false;
        if (start !== this.actual.start) return false;
        if (end !== this.actual.end) return false;
        if (content !== this.actual.content) return false;
        return true;
      },
      toBeASpanNodeWith: function(id, style, nodeCount) {
        if (!hasKeys(["nodes", "style", "id"], this.actual)) return false;
        if (id !== this.actual.id) return false;
        if (style !== this.actual.style) return false;
        if (nodeCount !== this.actual.nodes.length) return false;
        return true;
      },

      toCoverTheRange: function(start, end) {
        // FIXME: traverse the tree that is this.actual and confirm
        // that the start and end elements in all of the content nodes
        // exactly cover the entire range between start and end in order
      },

      toBeATreeThatMatchesTheContent: function(expectedContent) {
        var actualContent = "";
        // FIXME: traverse the tree that is this.actual and build up
        // actualContent from it
        return expectedContent === actualContent;
      },
    });
  });

  it("should correctly represent a single range.", function() {
    var tree = makeSpanTree(
      [
        {start: 0, end: 3, id: "range1", style: "foo", selected: false}
      ], 
      "Foo bar baz"
    );

    expect(tree).toBeASpanNodeWith("", "", 3)
    expect(tree.nodes[0]).toBeAContentNodeWith(0, 0, "");

    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "foo "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[0]).toBeAContentNodeWith(0, 3, "Foo");

    expect(tree.nodes[2]).toBeAContentNodeWith(3, 11, " bar baz");

  });

  it("should correctly represent distinct ranges.", function() {
    var tree = makeSpanTree(
      [
        {start: 0, end: 3, id: "range1", style: "foo", selected: false},
        {start: 4, end: 7, id: "range2", style: "zip", selected: false},
      ], 
      "Foo bar baz"
    );

    expect(tree).toBeASpanNodeWith("", "", 5)
    expect(tree.nodes[0]).toBeAContentNodeWith(0, 0, "");

    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "foo "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[0]).toBeAContentNodeWith(0, 3, "Foo");

    expect(tree.nodes[2]).toBeAContentNodeWith(3, 4, " ");

    expect(tree.nodes[3]).toBeASpanNodeWith("range2", "zip "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[3].nodes[0]).toBeAContentNodeWith(4, 7, "bar");

    expect(tree.nodes[4]).toBeAContentNodeWith(7, 11, " baz");
  });

  it("should correctly represent nested ranges.", function() {
    var tree = makeSpanTree(
      [
        {start: 1, end: 10, id: "range1", style: "foo", selected: false},
        {start: 4, end: 7, id: "range2", style: "zip", selected: false},
      ], 
      "Foo bar baz"
    );

    expect(tree).toBeASpanNodeWith("", "", 3)
    expect(tree.nodes[0]).toBeAContentNodeWith(0, 1, "F");

    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "foo "+ALLBORDERS_STYLE, 3);

    expect(tree.nodes[1].nodes[0]).toBeAContentNodeWith(1, 4, "oo ");

    expect(tree.nodes[1].nodes[1]).toBeASpanNodeWith("range2", "zip "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[1].nodes[0]).toBeAContentNodeWith(4, 7, "bar");

    expect(tree.nodes[1].nodes[2]).toBeAContentNodeWith(7, 10, " ba");

    expect(tree.nodes[2]).toBeAContentNodeWith(10, 11, "z");

    // FIXME: if I implement the matchers above that test the content and 
    // range of the trees, is that sufficient?  Do I just need, then, to test
    // where the span and content nodes are, without worrying about what's in them?

  });

  it("should correctly represent triple nesting.", function() {
  });

  it("should correctly represent two ranges separately nested in a third.", function() {
  });

  describe("should correctly represent nested ranges where they both have the same start", function() {

    describe("where they both have the same start", function() {

      it("and the shorter one comes first.", function() {
      });

      it("and the longer one comes first.", function() {
      });

    });

    describe("where they both have the same end", function() {

      it("and the shorter one comes first.", function() {
      });

      it("and the longer one comes first.", function() {
      });

    });

  });

  describe("should correctly represent overlapping ranges", function() {
    it("where the top range comes first", function() {
    });
    it("where the top range comes last", function() {
    });
  });

  it("should correctly represent adjacent ranges.", function() {
  });

  it("should correclty represent selected ranges.", function() {
  });

});
