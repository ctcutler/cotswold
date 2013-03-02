"use strict";

function gatherContent(node) {
  if ("content" in node) {
    return node.content;
  } else {
    var rv = "";
    for (var i=0; i < node.nodes.length; i++) {
      rv += gatherContent(node.nodes[i]);
    }
    return rv;
  }
}

function gatherOffsets(node) {
  if ("start" in node && "end" in node) {
    return [node.start, node.end];
  } else {
    var rv = [];
    for (var i=0; i < node.nodes.length; i++) {
      rv = rv.concat(gatherOffsets(node.nodes[i]));
    }
    return rv;
  }
}

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
        var notText = this.isNot ? " not" : "";
        this.message = function () {
          return "Expected " + stringify(this.actual) + notText + " to have these keys: " + expected;
        }
        return hasKeys(expectedKeys, this.actual);
      },
      toBeAContentNode: function() {
        var notText = this.isNot ? " not" : "";
        this.message = function () {
          return "Expected " + stringify(this.actual) + notText + " to be a content node";
        }
        return hasKeys(["content", "start", "end"], this.actual);
      },
      toBeAContentNodeWith: function(start, end, content) {
        var notText = this.isNot ? " not" : "";
        this.message = function () {
          return "Expected " + stringify(this.actual) + notText 
            + " to be a content node with start: "
            + start
            + " end: "
            + end
            + " and content: "
            + content;
        }
        if (!hasKeys(["content", "start", "end"], this.actual)) return false;
        if (start !== this.actual.start) return false;
        if (end !== this.actual.end) return false;
        if (content !== this.actual.content) return false;
        return true;
      },
      toBeASpanNodeWith: function(id, style, nodeCount) {
        var notText = this.isNot ? " not" : "";
        this.message = function () {
          return "Expected " + stringify(this.actual) + notText 
            + " to be a span node with id: "
            + id
            + " style: "
            + style
            + " and node count: "
            + nodeCount;
        }
        if (!hasKeys(["nodes", "style", "id"], this.actual)) return false;
        if (id !== this.actual.id) return false;
        if (style !== this.actual.style) return false;
        if (nodeCount !== this.actual.nodes.length) return false;
        return true;
      },

      toCoverTheRange: function(start, end) {
        var offsets = gatherOffsets(this.actual);
        var notText = this.isNot ? " not" : "";
        this.message = function () {
          return "Expected " + stringify(this.actual) + notText 
            + " to cover the range from : "
            + start
            + " to: "
            + end;
        }
        if (offsets[0] !== start) return false;
        if (offsets[offsets.length-1] !== end) return false;

        // we've alreayd checked the first and last so now
        // we look at the ones in between
        for (var i=1; i < offsets.length-1; i+=2) {
          // the list of offsets is really a series of start/end
          // pairs where every end should equal the following start. 
          if (offsets[i] !== offsets[i+1]) return false;
        }
        return true;
      },

      toCoverTheContent: function(expectedContent) {
        var notText = this.isNot ? " not" : "";
        this.message = function () {
          return "Expected " + stringify(this.actual) + notText 
            + " to cover the content: "
            + expectedContent;
        }
        return expectedContent === gatherContent(this.actual);
      },
    });
  });

  it("should correctly represent a single range.", function() {
    var content = "Foo bar baz";
    var tree = makeSpanTree(
      [
        {start: 0, end: 3, id: "range1", style: "style1", selected: false}
      ], 
      content
    );

    expect(tree).toCoverTheContent(content);
    expect(tree).toCoverTheRange(0, content.length);

    expect(tree).toBeASpanNodeWith("", "", 3)
    expect(tree.nodes[0]).toBeAContentNodeWith(0, 0, "");

    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[0]).toBeAContentNodeWith(0, 3, "Foo");

    expect(tree.nodes[2]).toBeAContentNodeWith(3, 11, " bar baz");
  });

  it("should correctly represent distinct ranges.", function() {
    var content = "Foo bar baz";
    var tree = makeSpanTree(
      [
        {start: 0, end: 3, id: "range1", style: "style1", selected: false},
        {start: 4, end: 7, id: "range2", style: "style2", selected: false},
      ], 
      content
    );

    expect(tree).toCoverTheContent(content);
    expect(tree).toCoverTheRange(0, content.length);

    expect(tree).toBeASpanNodeWith("", "", 5)
    expect(tree.nodes[0]).toBeAContentNodeWith(0, 0, "");

    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[0]).toBeAContentNodeWith(0, 3, "Foo");

    expect(tree.nodes[2]).toBeAContentNodeWith(3, 4, " ");

    expect(tree.nodes[3]).toBeASpanNodeWith("range2", "style2 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[3].nodes[0]).toBeAContentNodeWith(4, 7, "bar");

    expect(tree.nodes[4]).toBeAContentNodeWith(7, 11, " baz");
  });

  it("should correctly represent nested ranges.", function() {
    var content = "Foo bar baz";
    var tree = makeSpanTree(
      [
        {start: 1, end: 10, id: "range1", style: "style1", selected: false},
        {start: 4, end: 7, id: "range2", style: "style2", selected: false},
      ], 
      content
    );

    expect(tree).toCoverTheContent(content);
    expect(tree).toCoverTheRange(0, content.length);

    expect(tree).toBeASpanNodeWith("", "", 3)
    expect(tree.nodes[0]).toBeAContentNodeWith(0, 1, "F");

    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 3);

    expect(tree.nodes[1].nodes[0]).toBeAContentNodeWith(1, 4, "oo ");

    expect(tree.nodes[1].nodes[1]).toBeASpanNodeWith("range2", "style2 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[1].nodes[0]).toBeAContentNodeWith(4, 7, "bar");

    expect(tree.nodes[1].nodes[2]).toBeAContentNodeWith(7, 10, " ba");

    expect(tree.nodes[2]).toBeAContentNodeWith(10, 11, "z");
  });

  it("should correctly represent triple nesting.", function() {
    var content = "Foo bar baz";
    var tree = makeSpanTree(
      [
        {start: 1, end: 10, id: "range1", style: "style1", selected: false},
        {start: 3, end: 8, id: "range2", style: "style2", selected: false},
        {start: 5, end: 6, id: "range3", style: "style3", selected: false},
      ], 
      content
    );

    expect(tree).toCoverTheContent(content);
    expect(tree).toCoverTheRange(0, content.length);

    expect(tree).toBeASpanNodeWith("", "", 3)
    expect(tree.nodes[0]).toBeAContentNode();
    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 3);
    expect(tree.nodes[1].nodes[0]).toBeAContentNode();
    expect(tree.nodes[1].nodes[1]).toBeASpanNodeWith("range2", "style2 "+ALLBORDERS_STYLE, 3);
    expect(tree.nodes[1].nodes[1].nodes[0]).toBeAContentNode();
    expect(tree.nodes[1].nodes[1].nodes[1]).toBeASpanNodeWith("range3", "style3 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[1].nodes[1].nodes[0]).toBeAContentNode();
    expect(tree.nodes[1].nodes[1].nodes[2]).toBeAContentNode();
    expect(tree.nodes[1].nodes[2]).toBeAContentNode();
    expect(tree.nodes[2]).toBeAContentNode();
  });

  it("should correctly represent two ranges separately nested in a third.", function() {
    var content = "Foo bar baz";
    var tree = makeSpanTree(
      [
        {start: 1, end: 10, id: "range1", style: "style1", selected: false},
        {start: 3, end: 5, id: "range2", style: "style2", selected: false},
        {start: 7, end: 9, id: "range3", style: "style3", selected: false},
      ], 
      content
    );

    expect(tree).toCoverTheContent(content);
    expect(tree).toCoverTheRange(0, content.length);

    expect(tree).toBeASpanNodeWith("", "", 3)
    expect(tree.nodes[0]).toBeAContentNode();
    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 5);

    expect(tree.nodes[1].nodes[0]).toBeAContentNode();

    expect(tree.nodes[1].nodes[1]).toBeASpanNodeWith("range2", "style2 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[1].nodes[0]).toBeAContentNode();

    expect(tree.nodes[1].nodes[2]).toBeAContentNode();

    expect(tree.nodes[1].nodes[3]).toBeASpanNodeWith("range3", "style3 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[3].nodes[0]).toBeAContentNode();

    expect(tree.nodes[1].nodes[4]).toBeAContentNode();

    expect(tree.nodes[2]).toBeAContentNode();
  });

  describe("should correctly represent nested ranges", function() {
    var content = "Foo bar baz";

    describe("where they both have the same start", function() {

      it("and the shorter one comes first.", function() {
        var tree = makeSpanTree(
          [
            {start: 1, end: 4, id: "range1", style: "style1", selected: false},
            {start: 1, end: 7, id: "range2", style: "style2", selected: false},
          ], 
          content
        );

        expect(tree).toCoverTheContent(content);
        expect(tree).toCoverTheRange(0, content.length);

        // FIXME: this expects the code to treat these ranges as overlapping
        // but really we'd prefer nested spans like the "and the longer one
        // comes first" case below
        expect(tree).toBeASpanNodeWith("", "", 4)
        expect(tree.nodes[0]).toBeAContentNode();

        expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 1);
        expect(tree.nodes[1].nodes[0]).toBeAContentNode();

        expect(tree.nodes[2]).toBeASpanNodeWith("range2", "style2 "+TRUNC_LEFT_STYLE, 1);
        expect(tree.nodes[2].nodes[0]).toBeAContentNode();

        expect(tree.nodes[3]).toBeAContentNode();
      });

      it("and the longer one comes first.", function() {
        var tree = makeSpanTree(
          [
            {start: 1, end: 7, id: "range1", style: "style1", selected: false},
            {start: 1, end: 4, id: "range2", style: "style2", selected: false},
          ], 
          content
        );

        expect(tree).toCoverTheContent(content);
        expect(tree).toCoverTheRange(0, content.length);

        expect(tree).toBeASpanNodeWith("", "", 3)
        expect(tree.nodes[0]).toBeAContentNode();

        expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 3);

        // FIXME: this expects an empty, unnecessary content node: not optimal
        expect(tree.nodes[1].nodes[0]).toBeAContentNode();

        expect(tree.nodes[1].nodes[1]).toBeASpanNodeWith("range2", "style2 "+ALLBORDERS_STYLE, 1);
        expect(tree.nodes[1].nodes[1].nodes[0]).toBeAContentNode();
        expect(tree.nodes[1].nodes[2]).toBeAContentNode();

        expect(tree.nodes[2]).toBeAContentNode();
      });

    });

    describe("where they both have the same end", function() {

      it("and the shorter one comes first.", function() {
        var tree = makeSpanTree(
          [
            {start: 4, end: 7, id: "range1", style: "style1", selected: false},
            {start: 1, end: 7, id: "range2", style: "style2", selected: false},
          ], 
          content
        );

        expect(tree).toCoverTheContent(content);
        expect(tree).toCoverTheRange(0, content.length);

        // FIXME: this expects the code to treat these ranges as overlapping
        // but really we'd prefer nested spans like the "and the longer one
        // comes first" case below
        expect(tree).toBeASpanNodeWith("", "", 4)
        expect(tree.nodes[0]).toBeAContentNode();

        expect(tree.nodes[1]).toBeASpanNodeWith("range2", "style2 "+TRUNC_RIGHT_STYLE, 1);
        expect(tree.nodes[1].nodes[0]).toBeAContentNode();

        expect(tree.nodes[2]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 1);
        expect(tree.nodes[2].nodes[0]).toBeAContentNode();

        expect(tree.nodes[3]).toBeAContentNode();
      });

      it("and the longer one comes first.", function() {
        var tree = makeSpanTree(
          [
            {start: 1, end: 7, id: "range1", style: "style1", selected: false},
            {start: 4, end: 7, id: "range2", style: "style2", selected: false},
          ], 
          content
        );

        expect(tree).toCoverTheContent(content);
        expect(tree).toCoverTheRange(0, content.length);

        expect(tree).toBeASpanNodeWith("", "", 3)
        expect(tree.nodes[0]).toBeAContentNode();

        expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 3);

        // FIXME: this expects an empty, unnecessary content node: not optimal
        expect(tree.nodes[1].nodes[0]).toBeAContentNode();

        expect(tree.nodes[1].nodes[1]).toBeASpanNodeWith("range2", "style2 "+ALLBORDERS_STYLE, 1);
        expect(tree.nodes[1].nodes[1].nodes[0]).toBeAContentNode();
        expect(tree.nodes[1].nodes[2]).toBeAContentNode();

        expect(tree.nodes[2]).toBeAContentNode();
      });

    });

  });

  describe("should correctly represent overlapping ranges", function() {
    var content = "Foo bar baz";
    it("where the top range comes first", function() {
      var tree = makeSpanTree(
        [
          {start: 1, end: 6, id: "range1", style: "style1", selected: false},
          {start: 3, end: 9, id: "range2", style: "style2", selected: false},
        ], 
        content
      );
      expect(tree).toCoverTheContent(content);
      expect(tree).toCoverTheRange(0, content.length);

      expect(tree).toBeASpanNodeWith("", "", 4)
      expect(tree.nodes[0]).toBeAContentNodeWith(0, 1, "F");

      expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 1);
      expect(tree.nodes[1].nodes[0]).toBeAContentNodeWith(1, 6, "oo ba");

      expect(tree.nodes[2]).toBeASpanNodeWith("range2", "style2 "+TRUNC_LEFT_STYLE, 1);
      expect(tree.nodes[2].nodes[0]).toBeAContentNodeWith(6, 9, "r b");

      expect(tree.nodes[3]).toBeAContentNodeWith(9, 11, "az");
    });
    it("where the top range comes last", function() {
      var tree = makeSpanTree(
        [
          {start: 3, end: 9, id: "range2", style: "style2", selected: false},
          {start: 1, end: 6, id: "range1", style: "style1", selected: false},
        ], 
        content
      );
      expect(tree).toCoverTheContent(content);
      expect(tree).toCoverTheRange(0, content.length);

      expect(tree).toBeASpanNodeWith("", "", 4)
      expect(tree.nodes[0]).toBeAContentNodeWith(0, 1, "F");

      expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+TRUNC_RIGHT_STYLE, 1);
      expect(tree.nodes[1].nodes[0]).toBeAContentNodeWith(1, 3, "oo");

      expect(tree.nodes[2]).toBeASpanNodeWith("range2", "style2 "+ALLBORDERS_STYLE, 1);
      expect(tree.nodes[2].nodes[0]).toBeAContentNodeWith(3, 9, " bar b");

      expect(tree.nodes[3]).toBeAContentNodeWith(9, 11, "az");
    });
  });

  it("should correctly represent adjacent ranges.", function() {
    var content = "Foo bar baz";
    var tree = makeSpanTree(
      [
        {start: 1, end: 4, id: "range1", style: "style1", selected: false},
        {start: 4, end: 7, id: "range2", style: "style2", selected: false},
      ], 
      content
    );

    expect(tree).toCoverTheContent(content);
    expect(tree).toCoverTheRange(0, content.length);

    expect(tree).toBeASpanNodeWith("", "", 5)
    expect(tree.nodes[0]).toBeAContentNode();

    expect(tree.nodes[1]).toBeASpanNodeWith("range1", "style1 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[0]).toBeAContentNode();

    // FIXME: this expects an empty, unnecessary content node: not optimal
    expect(tree.nodes[2]).toBeAContentNode();

    expect(tree.nodes[3]).toBeASpanNodeWith("range2", "style2 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[3].nodes[0]).toBeAContentNode();

    expect(tree.nodes[4]).toBeAContentNode();
  });

  it("should correctly represent selected ranges.", function() {
    var content = "Foo bar baz";
    var tree = makeSpanTree(
      [
        {start: 0, end: 3, id: "range1", style: "style1", selected: true}
      ], 
      content
    );

    expect(tree).toCoverTheContent(content);
    expect(tree).toCoverTheRange(0, content.length);

    expect(tree).toBeASpanNodeWith("", "", 3)
    expect(tree.nodes[0]).toBeAContentNode();

    expect(tree.nodes[1]).toBeASpanNodeWith("range1", SELECTED_STYLE+" style1 "+ALLBORDERS_STYLE, 1);
    expect(tree.nodes[1].nodes[0]).toBeAContentNode();

    expect(tree.nodes[2]).toBeAContentNode();
  });

});
