function rightSide(box) {
  return { x: box.x + box.width, y: box.y + (box.height/2)};
}

function leftSide(box) {
  return { x: box.x, y: box.y + (box.height/2)};
}

function topSide(box) {
  return { x: box.x + (box.width/2), y: box.y};
}

function bottomSide(box) {
  return { x: box.x + (box.width/2), y: box.y + box.height};
}

function getPerimeter(point1, point2) {
  return (2 * Math.abs(point1.x-point2.x)) + (2 * Math.abs(point1.y-point2.y));
}


function getBestConnection(box1, box2) {
  // go through every possible permutation of midpoints looking
  // for the shortest
  var shortest = Number.MAX_VALUE;
  var shortestPair = null;
  var permutations = [
    /*
    Even when these are correct they don't look right

    [rightSide(box1), rightSide(box2)],
    [leftSide(box1), leftSide(box2)],
    [topSide(box1), topSide(box2)],
    [bottomSide(box1), bottomSide(box2)],
    */

    [rightSide(box1), leftSide(box2)],
    [leftSide(box1), rightSide(box2)],
    [rightSide(box1), topSide(box2)],
    [topSide(box1), rightSide(box2)],
    [rightSide(box1), bottomSide(box2)],
    [bottomSide(box1), rightSide(box2)],
    [leftSide(box1), topSide(box2)],
    [topSide(box1), leftSide(box2)],
    [leftSide(box1), bottomSide(box2)],
    [bottomSide(box1), leftSide(box2)],
    [topSide(box1), bottomSide(box2)],
    [bottomSide(box1), topSide(box2)],
  ];

  for (var i=0; i < permutations.length; i++) {
    var perm = permutations[i];
    var perimeter = getPerimeter(perm[0], perm[1]);
    if (perimeter > 0 && perimeter < shortest) {
      shortest = perimeter;
      shortestPair = perm;
    }
  }
  
  return shortestPair;
}

function makeSpanClass(d) { 
  if (d.id === undefined) return "";

  var klass = "allborders "+d.color;
  if (d.truncation === "left") {
    klass += " truncatedLeft";
  } else if (d.truncation === "right") {
    klass += " truncatedRight";
  } else if (d.truncation === "both") {
    klass += " truncatedBoth";
  } 
  if (d.selected) {
    klass += " selected";
  }
  return klass;
}

function addDetailBoxContents(selection, setNoteFunc, setColorFunc, setStyleFunc) {
  var note = selection.selectAll(".note")
    .data(function (d) { 
      return [d.note];
    });
  note.enter()
    .append("textarea")
    .attr("class", "note")
    .on("input", function (d) {
      setNoteFunc(getParentData(this).id, this.value);
      controllerScope.save();
    })
    .attr("rows", 4);
  note.text(function (d) { return d; });
  note.exit()
    .remove();

  var colorChooser = selection.selectAll(".colorChooser")
    .data(function (d) { 
      return [d.color];
    });
  colorChooser.enter()
    .append("div")
    .attr("class", "colorChooser");
  colorChooser.exit()
    .remove();

  var colorBox = colorChooser.selectAll(".colorBox")
    .data(COLORS);
  colorBox.enter()
    .append("div")
    .on("click", function (d) {
      setColorFunc(getGrandParentData(this).id, d);
    });
  colorBox.attr("class", function (d) { 
      var pData = getParentData(this);
      return "colorBox " + d  +
        (getGrandParentData(this).color == d ? " selectedColor" : "");
    });
  colorBox.exit()
    .remove();

  if (setStyleFunc) {
    // FIXME: try using plain old select() and datum()
    var styleChooser = selection.selectAll(".styleChooser")
      .data(function (d) {
        return [d.styles ? d.styles : []];
      });
    styleChooser.enter()
      .append("form")
      .attr("class", "styleChooser");
    styleChooser.exit()
      .remove();

    var styleOption = styleChooser.selectAll(".styleOption")
      .data(STYLES);
    styleOption.enter()
      .append("label");
    styleOption
      .attr("class", 
        function(d) {
          return "styleOption " + d.name
        })
      .attr("style", 
        function(d) {
          return d.property + ": " + d.value + ";";
        });
    styleOption.exit()
      .remove();

    var styleCheckbox = styleOption.selectAll(".styleCheckbox")
      .data(function(d) { return [d] });
    styleCheckbox.enter()
      .append("input")
      .on("click", function (d) {
        setStyleFunc(getGreatGrandParentData(this).id, d);
      });
    styleCheckbox
      .attr("class", 
        function(d) {
          return "styleCheckbox " + d.name
        })
      .attr("checked",
        function(d) {
          // null omits the attribute entirely
          var ggp = getGreatGrandParentData(this);
          if (ggp.styles) {
            for (var i=0; i<ggp.styles.length; i++) {
              if (ggp.styles[i].name === d.name) {
                // it doesn't really matter what we return here as long 
                // as it is not null. . . the checked attribute doesn't care
                return "true";
              }
            }
          }
          return null;
        })
      .attr("type", "checkbox");
    styleCheckbox.exit()
      .remove();

    var styleCheckboxLabel = styleOption.selectAll(".styleCheckboxLabel")
      .data(function(d) { return [d] });
    styleCheckboxLabel.enter()
      .insert("span");
    styleCheckboxLabel
      .attr("class", 
        function(d) {
          return "styleCheckboxLabel " + d.name
        })
      .text(function(d) { return d.name });
    styleCheckboxLabel.exit()
      .remove();
  }
}

function recursiveSpans(sel) {
  // this wraps _everything_ in a span, including
  // content nodes that don't require it. . . to
  // work around this we would need a way to 
  // dynamically choose to append a span or a 
  // text element based on the data. . . right now
  // d3.append only takes a constant
  sel.each(function (selected) {
    if (selected.nodes) {
      var selector = "#"+selected.id+" > span";

      var span = d3.select(this)
        .selectAll(selector)
        .data(selected.nodes, function (d) { 
          if (d.id != undefined) {
            return d.id;
          } else {
            return d.start + ":" + d.end;
          }
        });

      span.enter()
        .append("span");

      span
        .attr("class", makeSpanClass)
        .attr("style", function(d) {
          if (d.styles) {
            var styleString = "";
            for (var i=0; i<d.styles.length; i++) {
              var s = d.styles[i];
              styleString += s.property+": "+s.value+"; "
            }
            return styleString;
          } else {
            return null
          }
        })
        .call(recursiveSpans)
        .filter(function (d) { return "id" in d; })
        .attr("id", function (d) { return d.id })
        .on("click", function (d) {
          controllerScope.clearAllSelectedTimepoints(true);
          controllerScope.clearAllSelectedConnections(true);
          controllerScope.updateSelection(d.id);
          rangy.getSelection().removeAllRanges();
          // in case spans are nested, only select this one
          d3.event.stopPropagation();
        });

      span.exit().remove();

      span.order();

      var spanDetailClass = "spanDetail"+selected.id;
      var spanDetail = popUpLayer
        .selectAll("."+spanDetailClass)
        .data(
          selected.nodes.filter(function (d) { return d.selected }),
          function (d) { return d.id; }
        );
      spanDetail.enter()
        .append("div")
        .attr("class", spanDetailClass);
      spanDetail
        .attr("class", function (d) { return spanDetailClass })
        .attr("style", makeSpanDetailStyle);
      spanDetail.exit()
        .remove();

      addDetailBoxContents(
        spanDetail, 
        controllerScope.setRangeNote, 
        controllerScope.setRangeColor, 
        controllerScope.setRangeStyle
      );

    } else if (selected.content) {
      d3.select(this)
        .html(escapeLineBreaks(selected.content));
    }
  });
}

function escapeLineBreaks(s) {
  // space before <br/> makes offsets come out right

  // first replace CRLFs
  s = s.replace(/\r\n/g, " <br />");
  // then replace remaining individual CRs and LFs
  return s.replace(/[\r\n]/g, " <br />");
}

function smallerWithMin(a, b, min) {
  return Math.max(min, Math.min(a, b));
}

function largerWithMax(a, b, max) {
  return Math.min(max, Math.max(a, b));
}

function getDragBoxX(d) {
  var curX = d3.mouse(jQuery("#svgLayer")[0])[0];
  return smallerWithMin(curX, d.originX, d.minX);
}
function getDragBoxY(d) {
  var curY = d3.mouse(jQuery("#svgLayer")[0])[1];
  return smallerWithMin(curY, d.originY, d.minY);
}
function getDragBoxWidth(d) {
  var curX = d3.mouse(jQuery("#svgLayer")[0])[0];
  return largerWithMax(curX, d.originX, d.maxX) 
    - smallerWithMin(curX, d.originX, d.minX);
}
function getDragBoxHeight(d) {
  var curY = d3.mouse(jQuery("#svgLayer")[0])[1];
  return largerWithMax(curY, d.originY, d.maxY) 
    - smallerWithMin(curY, d.originY, d.minY);
}

function makeDragBehavior(artifact, img) {
  var imgBox = makeBox(img);
  return d3.behavior.drag()
    .on("dragstart", function(d,i) {
      // add rect
      var coords = d3.mouse(jQuery("#svgLayer")[0]);
      svg.append("rect")
        .data([{
          originX: coords[0], 
          originY: coords[1],
          minX: imgBox.x,
          minY: imgBox.y,
          maxX: imgBox.x + imgBox.width,
          maxY: imgBox.y + imgBox.height,
        }])
        .attr("class", "dragBox")
        .attr("x", coords[0])
        .attr("y", coords[1]);
    }).on("drag", function(d,i) {
      // resize rect
      var dragBox = svg.select("rect.dragBox");
      dragBox
        .attr("x", getDragBoxX)
        .attr("y", getDragBoxY)
        .attr("width", getDragBoxWidth)
        .attr("height", getDragBoxHeight);
    }).on("dragend", function(d,i) {
      // remove rect
      var dragBox = svg.select("rect.dragBox");
      var bbox = dragBox[0][0].getBBox();
      controllerScope.makeImageRange(
        artifact.id,
        bbox.x - imgBox.x,
        bbox.y - imgBox.y,
        bbox.width,
        bbox.height
      );
      dragBox.remove();
    });
}

function getNodeLeft(node) {
  var $node = jQuery(node);
  var left = $node.position().left 
  var padding = parseInt($node.offsetParent().css('padding-left'));
  return left - padding;
}

function getNodeTop(node) {
  var $node = jQuery(node);
  var top = $node.position().top; 
  var padding = parseInt($node.offsetParent().css('padding-top'));
  return top - padding;
}

function updateArtifacts(artifact) {
  artifact.each(function (artifact) { 
    // differentiate between images and text
    if ("imageSrc" in artifact) {
      var img = d3.select(this)
        .selectAll("img.imageArtifact")
        .data([artifact.imageSrc]);
    
      img.enter()
        .append("img")
        .attr("class", "imageArtifact")
        .attr("src", artifact.imageSrc);

      // img[0][0] assumes there will only be one image per artifact
      img.call(makeDragBehavior(artifact, img[0][0]));

      var className = "imageBox";
      var artifactClassName = artifact.id+"ImageBox";
      var imageBox = svg.selectAll("."+className+"."+artifactClassName)
        .data(artifact.ranges, function (d) { return d.id; });
      var parentBox = makeBox(this);
      imageBox.enter()
        .append("rect")
        .attr("id", function (d) { return d.id })
        .attr("x", function (d) { 
          return d.left + parentBox.x
        })
        .attr("y", function (d) { 
          return d.top + parentBox.y
        })
        .attr("width", function (d) { return d.width })
        .attr("height", function (d) { return d.height })
        .on("click", function (d) {
          controllerScope.clearAllSelectedConnections(true);
          controllerScope.clearAllSelectedTimepoints(true);
          controllerScope.updateSelection(d.id);
          rangy.getSelection().removeAllRanges();
          d3.event.stopPropagation();
        });

      imageBox
        .attr("style", function (d) { return d.color})
        .attr("class", function (d) { 
          return className + " " + artifactClassName + " " + d.color
        });

      imageBox.exit()
        .remove();

      var imageBoxDetailClass = "imageBoxDetail"+artifact.id;
      var imageBoxDetail = popUpLayer
        .selectAll("."+imageBoxDetailClass)
        .data(
          artifact.ranges.filter(function (d) { return d.selected }), 
          function (d) { return d.id; }
        );
      imageBoxDetail.enter()
        .append("div")
        .attr("class", imageBoxDetailClass);
      imageBoxDetail
        .attr("class", function (d) { return imageBoxDetailClass })
        .attr("style", function (d) {
          return "left: "
            + (parentBox.x + d.left + d.width)
            + "px; top: "
            + (parentBox.y + d.top + d.height)
            + "px";
        });
      imageBoxDetail.exit()
        .remove();

      addDetailBoxContents(imageBoxDetail, controllerScope.setRangeNote, controllerScope.setRangeColor);
    } else {
      d3.select(this).call(recursiveSpans);
    }
  });
}

function makeBoxFromId(id) {
  var node = document.getElementById(id);
  return makeBox(node);
}
function makeBox(node) {
  var box = {};
  if (node.nodeName === "SPAN" 
    || node.nodeName === "IMG"
    || node.nodeName === "DIV") {
    var $node = jQuery(node);
    box.x = getNodeLeft(node);
    box.y = getNodeTop(node);
    box.width = $node.width();
    box.height = $node.height();
  } else if (node.nodeName === "rect" 
    || node.nodeName === "line") {
    // FIXME:  may need to correct for padding here
    box = node.getBBox();
  } else {
    console.log("unknown node type: " + node.nodeName);
  }
  return box;
}

function addConnectionCoords(connections) {
  for (var i=0; i<connections.length; i++) {
    var connection = connections[i];
    var leftBox = makeBoxFromId(connection.rangeIds[0]);
    var rightBox = makeBoxFromId(connection.rangeIds[1]);
    var best = getBestConnection(leftBox, rightBox);
    connection["coords"] = {
      x1: best[0].x,
      y1: best[0].y,
      x2: best[1].x,
      y2: best[1].y,
    };
  }
  return connections;
}

function getMidpoint(a, b) {
  if (a > b) {
    return ((a - b)/2)+b;
  } else {
    return ((b - a)/2)+a;
  }
}

function makeSpanDetailStyle(d) {
  var box = makeBoxFromId(d.id);
  return "left: "
    + (box.x + box.width)
    + "px; top: "
    + (box.y + box.height)
    + "px";
}

function makeImageBoxDetailStyle(d) {
  return "left: "
    + (d.left + d.width)
    + "px; top: "
    + (d.top + d.height)
    + "px";
}

function makeConnectionDetailStyle(d) {
  var coords = d.coords;
  return "left: "
    + getMidpoint(coords.x1, coords.x2)
    + "px; top: "
    + getMidpoint(coords.y1, coords.y2)
    + "px";
}

function getParentData(node) {
  return d3.select(node.parentNode).datum();
}

function getGrandParentData(node) {
  return d3.select(node.parentNode.parentNode).datum();
}

function getGreatGrandParentData(node) {
  return d3.select(node.parentNode.parentNode.parentNode).datum();
}

function addDeleteButton(selection, cssClass, deleteFunc) {
  selection
    .on("mouseover", function (d) {
      d3.select("#"+cssClass+"-"+d.id).style("visibility", "visible");
    })
    .on("mouseout", function (d) {
      d3.select("#"+cssClass+"-"+d.id).style("visibility", "hidden");
    })
    .append("img")
    .attr("class", cssClass)
    .on("click", function (d) {
      deleteFunc(d.id);
    })
    .attr("id", function (d) {
      return cssClass+"-"+d.id
    })
    .style("visibility", "hidden")
    .attr("src", "img/x.svg");
}

// fancy way to clear file input from: 
// http://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery
// FIXME: duplicates functionality of initFileInput in controller.js (this one is better)
function clearFileInput(fileInputId) {
  var $f = $(fileInputId);
  $f.wrap("<form>").closest('form').get(0).reset();
  $f.unwrap();
}

var controllerScope;
var svg;
var htmlLayer;
var popUpLayer;
var frostedGlass;

function render(scope) {
  if (scope) {
    controllerScope = scope;
  }

  htmlLayer = d3.select("#htmlLayer");

  svg = d3.select("#mainSvg")
    .style("height", htmlLayer.style("height"));

  popUpLayer = d3.select("#popUpLayer")
    .style("height", htmlLayer.style("height"));

  frostedGlass = d3.select("#frostedGlass")
    .style({
      "height": htmlLayer.style("height"),
      "opacity": scope.dialogVisible ? "0.7" : "0",
      "pointer-events": scope.dialogVisible ? "auto" : "none",
    });

  d3.select("#dialog")
    .style("visibility", scope.dialogVisible ? "visible" : "hidden");

  htmlLayer
    .on("click", function (d) {
      controllerScope.clearAllSelectedElements(true);
    });

  // Lesson learned below: If I want to append a single child
  // to a selection, just call append a second time.  If I want
  // to append multiple different children, put the enter
  // selection in a variable and call it multiple times. 
  var timepoints = htmlLayer.selectAll(".timepoint")
    .data(controllerScope.timepoints);
  timepointsEnter = timepoints.enter()
    .append("div")
    .attr("class", "timepoint");
  timepointsEnter
    .append("div")
    .attr("class", "timepointTitle");

  var unselectedTimepointTitles = timepoints.selectAll(".timepointTitle")
    .filter(function (d) { return !d.selected; })
    .text(function(d) { return d.name; })
    .on("click", function (d) {
      if (!d.selected) {
        controllerScope.clearAllSelectedElements(true);
        controllerScope.selectTimepoint(d.id);
      }
      d3.event.stopPropagation();
    });

  unselectedTimepointTitles
    .append("input")
    .attr("type", "checkbox")
    .on("click", function (d) {
      d.checkedForComparison = this.checked;
      d3.event.stopPropagation();
    });
  unselectedTimepointTitles
    .append("span")
    .attr("class", "compareLabel")
    .text("(compare)");

  addDeleteButton(unselectedTimepointTitles, "deleteTimepoint", controllerScope.deleteTimepoint);

  var selectedTimepointTitles = timepoints.selectAll(".timepointTitle")
    .filter(function (d) { return d.selected; })
    .html(function(d) { return "<input value=\""+d.name+"\"><p/>"; });

  selectedTimepointTitles.selectAll("input")
    .on("input", function (d) {
      controllerScope.setTimepointTitle(getParentData(this).id, this.value);
      controllerScope.save();
    });

  timepoints.exit()
    .remove();

  var artifact = timepoints.selectAll(".artifact")
    .data(function (d) { 
      return d.artifacts 
    }, 
    function (d) { 
      return d.id 
    });
  var artifactEnter = artifact.enter()
    .insert("div", ".addArtifactButton")
    .attr("class", "artifact")
    .attr("id", function (d) { 
      return d.id 
    });
  addDeleteButton(artifactEnter, "deleteArtifact", controllerScope.deleteArtifact);

  updateArtifacts(artifact);
  artifact.exit()
    .remove();

  timepointsEnter
    .on("mouseover", function (d) {
      d3.select("#addArtifactButton-"+d.id).style("visibility", "visible");
    })
    .on("mouseout", function (d) {
      d3.select("#addArtifactButton-"+d.id).style("visibility", "hidden");
    })
    .append("img")
    .attr("class", "addArtifactButton")
    .attr("id", function(d) {
      return "addArtifactButton-"+d.id;
    })
    .on("click", function (d) {
      d3.select("#addArtifactButton-"+d.id).style("visibility", "hidden");
      d3.select("#artifactFiles-"+d.id).style("visibility", "visible");
    })
    .style("visibility", "hidden")
    .attr("src", "img/plus.svg");
  timepointsEnter 
    .append("form")
    .append("input")
    .attr("type", "file")
    .attr("id", function (d) { return "artifactFiles-"+d.id; })
    .attr("name", "files[]")
    .style("visibility", "hidden")
    .on("change", function (d) {
      controllerScope.handleLoadArtifactFromFile(d3.event, d.id);
      d3.select("#artifactFiles-"+d.id).style("visibility", "hidden");
      clearFileInput("#artifactFiles-"+d.id);
    })
    .attr("multiple", "");

  var connections = addConnectionCoords(controllerScope.connections);
  var line = svg.selectAll(".connection")
    .data(connections, function(d) { return d.id; });
  line.enter()
    .append("line")
    .attr("class", "connection")
    .attr("stroke-width", 3)
    .attr("id", function (d) { return d.id })
    .on("click", function (d) {
      controllerScope.clearAllSelectedRanges(true);
      controllerScope.clearAllSelectedTimepoints(true);
      controllerScope.selectConnection(d.id);
    })
    .attr("x1", function (d) { return d.coords.x1 })
    .attr("y1", function (d) { return d.coords.y1 })
    .attr("x2", function (d) { return d.coords.x1 })
    .attr("y2", function (d) { return d.coords.y1 });
  line
    .attr("x1", function (d) { return d.coords.x1 })
    .attr("y1", function (d) { return d.coords.y1 })
    .attr("x2", function (d) { return d.coords.x2 })
    .attr("y2", function (d) { return d.coords.y2 })
    .attr("class", function (d) { return "connection "+d.color });
  line.exit()
    .remove();

  var connectionDetail = popUpLayer.selectAll(".connectionDetail")
    .data(
      connections.filter(function (d) { return d.selected }), 
      function(d) { return d.id; }
    );
  connectionDetail.enter()
    .append("div")
    .attr("class", "connectionDetail");
  connectionDetail.attr("class", function (d) { return "connectionDetail" })
    .attr("style", makeConnectionDetailStyle);
  connectionDetail.exit()
    .remove();

  addDetailBoxContents(
    connectionDetail, 
    controllerScope.setConnectionNote, 
    controllerScope.setConnectionColor
  );


  /* Not so efficient to re-create this every time but since there's 
   * no data associated with it I'm not sure what else to do (would 
   * it be less hack-ish to have a fake data point?). */
  htmlLayer.select("#addTimepointDiv").remove();
  htmlLayer
    .append("div")
    .attr("id", "addTimepointDiv")
    .on("mouseover", function (d) {
      d3.select("#addTimepointButton").style("visibility", "visible");
    })
    .on("mouseout", function (d) {
      d3.select("#addTimepointButton").style("visibility", "hidden");
    })
    .append("img")
    .attr("id", "addTimepointButton")
    .on("click", function (d) {
      controllerScope.makeTimepoint();
    })
    .style("visibility", "hidden")
    .attr("src", "img/plus.svg");

}
