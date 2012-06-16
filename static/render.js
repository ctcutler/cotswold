function makeRange(div, start, end) {
  // adapted from http://stackoverflow.com/questions/5595956/replace-innerhtml-in-contenteditable-div/5596688#5596688
  var charIndex = 0, range = rangy.createRange(); 
  var foundStart = false, stop = {};
  range.collapseToPoint(div, 0);

  function traverseTextNodes(node) {
    if (node.nodeType == 3) {
      var nextCharIndex = charIndex + node.length;
      if (!foundStart && start >= charIndex && start <= nextCharIndex) {
        range.setStart(node, start - charIndex);
        foundStart = true;
      }
      if (foundStart && end >= charIndex && end <= nextCharIndex) {
        range.setEnd(node, end - charIndex);
        throw stop;
      }
      charIndex = nextCharIndex;
    } else {
      for (var i = 0, len = node.childNodes.length; i < len; ++i) {
        traverseTextNodes(node.childNodes[i]);
      }
    }
  }

  try {
    traverseTextNodes(div);
  } catch (ex) {
    if (ex == stop) {
      return range;
    } else {
      throw ex;
    }
  }
}

// from: http://stackoverflow.com/questions/7647812/jquery-multiplying-alphanumeric-string
String.prototype.repeat = function(num) {
    return new Array( num + 1 ).join( this );
}

function renderBlocks() {
  var addStyleApplier = rangy.createCssClassApplier("add");
  var updateStyleApplier = rangy.createCssClassApplier("update");
  var removeStyleApplier = rangy.createCssClassApplier("remove");
  $.each(blocks, function() {
    var parts = this.text.split(/\n/);
    /*
     * How to convert various numbers of newlines into HTML (&nbsp;'s 
     * compensate for missing newlines in text offset values):
     * 
     * one newline -> &nbsp;<br/> (next part appends to this p)
     * two newlines -> &nbsp;&nbsp;</p> 
     * three newlines -> &nbsp;&nbsp;</p><p>&nbsp;</p> 
     * four newlines -> &nbsp;&nbsp;</p><p>&nbsp;<br/>&nbsp;</p> 
     * five newlines -> &nbsp;&nbsp;</p><p>&nbsp;<br/>&nbsp;<br/>&nbsp;</p> 
     * 
     * and so on...
     */

    var p = null;
    for (var i=0; i < parts.length; i++) {
      // if the previous line ended with a <br/> add this
      // line to the existing p, otherwise create a new p
      if (p != null) {
        // p.text(p.text()+parts[i]) overwrites previous <br/>
        // p.append(parts[i]) is XSS vulnerable
        p.append(document.createTextNode(parts[i]));
      } else {
        p = $('<p/>', {text: parts[i]})
        p.appendTo('#'+this.element);
      }

      // count newlines after this line (the first one
      // was removed when we split the string)
      var newlineCount = 1;
      while (i+1 < parts.length && parts[i+1] == "") {
        newlineCount++;
        i++;
      }

      switch (newlineCount) {
        case 1:
          p.html(p.html()+"&nbsp;<br/>");
          break;
        case 2:
          p.html(p.html()+"&nbsp;&nbsp;");
          break;
        default:
          var newBrs = "<br/>&nbsp;".repeat(newlineCount-3);
          p.html(p.html()+"&nbsp;&nbsp;<p>&nbsp;"+newBrs+"</p>");
          break;
      }

      if (newlineCount != 1) {
        // null out p so that we don't use it on the next iteration
        p = null;
      }
    }

    var div = document.getElementById(this.element);
    if (div.childNodes.length > 0 && div.childNodes[0].nodeType == 3) {
      // for some reason this node is showing up with a text node
      // in it which throws off the character offsets
      div.removeChild(div.childNodes[0]);
    }
    
    $.each(this.rangeDefs, function() {
      var range = makeRange(div, this.offset1, this.offset2);
      var styleApplier;
      var className;

      if (this.type == "ADDITION") {
        styleApplier = addStyleApplier;
        className = "add";
      } else if (this.type == "UPDATE") {
        styleApplier = updateStyleApplier;
        className = "update";
      } else if (this.type == "DELETION") {
        styleApplier = removeStyleApplier;
        className = "remove";
      }

      if (range.startOffset == range.endOffset 
          && range.startContainer == range.endContainer) { 
        var span = $(document.createElement("span")).attr("class", className)[0];
        range.surroundContents(span);
      } else {
        styleApplier.applyToRange(range);
        // should be the newly added span element
        var styleSpan = range.commonAncestorContainer.parentElement
        $(styleSpan).click(
          {rangeId: this.id},
          rangeClicked
        );
      }
      ranges[this.id] = range;
    });
  });
}

function rangeClicked(event) {
  $.each(
    connections,
    function () {
      if (this.left == event.data.rangeId 
          || this.right == event.data.rangeId) {
        this.highlight = true;
      } else {
        this.highlight = false;
      }
    }
  );
  renderConnections();
}

function getNthSpanInRange(n, range) {
  var nodes = range.getNodes(false, function(node) {
      return node.nodeName == "SPAN";
  });
  if (nodes.length == 0) {
    // if there are no sub spans then get the
    // startContainer's parent and return it
    // if it is a span
    var start = range.startContainer.parentNode;
    if (start.nodeName == "SPAN") {
      return start;
    } else {
      return null;
    }
  } else if (n == -1 || nodes.length >= (n)) {
    return nodes[nodes.length-1];
  } else {
    return nodes[n];
  }
}

function renderConnections() {
  // prepare the surface
  var lineSurface = $('#lineSurface');
  var svg;
  if (!hasSvgChild(lineSurface)) {
    lineSurface.svg();
    svg = lineSurface.svg('get');
    svg.configure(
      {width: $(document).width(), height: $(document).height()}, 
      true
    );
  } else {
    svg = lineSurface.svg('get');
  }
  svg.clear();
  $.each(connections, function() {
    var leftSpan = getNthSpanInRange(-1, ranges[this.left]);
    var rightSpan = getNthSpanInRange(0, ranges[this.right]);
    drawLine(svg, leftSpan, rightSpan, this.color, this.highlight);
  });
}

function load() {
  renderBlocks();
  renderConnections();
}

