(function (angular) {
    /*
     * Defines the ng:if tag. This is useful if jquery mobile does not allow
     * an ng-switch element in the dom, e.g. between ul and li.
     */
    var ngIfDirective = {
        transclude:'element',
        priority:1000,
        terminal:true,
        compile:function (element, attr, linker) {
            return function (scope, iterStartElement, attr) {
                iterStartElement[0].doNotMove = true;
                var expression = attr.ngmIf;
                var lastElement;
                var lastScope;
                scope.$watch(expression, function (newValue) {
                    if (lastElement) {
                        lastElement.remove();
                        lastElement = null;
                    }
                    lastScope && lastScope.$destroy();
                    if (newValue) {
                        lastScope = scope.$new();
                        linker(lastScope, function (clone) {
                            lastElement = clone;
                            iterStartElement.after(clone);
                        });
                    }
                    // Note: need to be parent() as jquery cannot trigger events on comments
                    // (angular creates a comment node when using transclusion, as ng-repeat does).
                    $(iterStartElement.parent()).trigger("$childrenChanged");
                });
            };
        }
    };
    var ng = angular.module('ng');
    ng.directive('ngmIf', function () {
        return ngIfDirective;
    });
})(angular);

var module = angular.module('cotswoldApp', []);

module.directive('editor', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {

      element.addClass("editor");

      scope.$on('resize', function(event) {
        // handle resize by repositioning children and resizing self
        resizeHandler(
          element, 
          attrs.direction, 
          attrs.childAlign, 
          parseInt(attrs.margin), 
          parseInt(attrs.padding),
          ""
        );
      });


      jQuery('body').bind('keydown', function(e) {
        if (e.keyCode === 16) {
          scope.shiftDown = true;
        }
      });
      jQuery('body').bind('keyup', function(e) {
        if (e.keyCode === 16) {
          scope.shiftDown = false;
        }
      });

      $(element).on({
        keydown: function (e) {
          scope.shiftDown = e.shiftKey;
        },
      });
    }
  };
});

module.directive('timeline', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {

      element.addClass("timeline");

      scope.$on('resize', function(event) {
        // handle resize by repositioning children and resizing self
        resizeHandler(
          element, 
          attrs.direction, 
          attrs.childAlign, 
          parseInt(attrs.margin), 
          parseInt(attrs.padding),
          ""
        );
        
        // connections div should always be the same size as element
        var $connections = $("#connections");
        var $element = $(element);
        setWidth($connections, $element.width());
        setHeight($connections, $element.height());
        setLeft($connections, $element.position().left);
        setTop($connections, $element.position().top);

        redraw(scope.connections);
      });

      scope.$watch("connections.length", function(val) {
        redraw(scope.connections);
      });
    }
  };
});

module.directive('timepoint', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {

      element.addClass("timepoint");

      scope.$on('resize', function(event) {
        // handle resize by repositioning children and resizing self
        resizeHandler(
          element, 
          attrs.direction, 
          attrs.childAlign, 
          parseInt(attrs.margin), 
          parseInt(attrs.padding),
          "timepoint-background"
        );

        // timepoint-background div should always be the same size as element
        var $element = $(element);
        var $background = $element.children(".timepoint-background");
        setWidth($background, $element.width());
        setHeight($background, $element.height());
        setLeft($background, $element.position().left);
        setTop($background, $element.position().top);

        var $element = $(element);
        var children = $element.find("img:visible");
        $.each(children, function(index, c) {
          var $child = $(c);
          imageAreas[$child.attr("src")] = {
            width: $child.width(),
            height: $child.height(),
            top: $child.offset().top,
            left: $child.offset().left,
          };
        });
      });
    }
  };
});

module.directive('artifact', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {
      element.addClass("artifact");
      
      $(element).scroll(function () {
        redraw(scope.connections);
      });

      // Bind to model for size so that program can affect artifact size.
      // In watch function, update element size and fire resize (handles
      // cases where app changes artifact size)
      scope.$watch(attrs.loopVariable+".width", function(val) {
        if (val != null) {
          setWidth(element, val);
          scope.$emit("resize");
        }
      });
      scope.$watch(attrs.loopVariable+".maxHeight", function(val) {
        if (val != null) {
          setMaxHeight(element, val);
          scope.$emit("resize");
        }
      });

      // on window load fire resize (handles case where browser determines size)
      angular.element(window).bind('load', function() {
          scope.$emit("resize");
      });
    }
  };
});

// make storage mechanism injectable so that we can 
// fake it for testing, etc.
module.factory('storage', function() {
  localStorage.clear();

  if (!localStorage["expanded"]) {
    localStorage["expanded"] = JSON.stringify(hardCodedExpanded);
    localStorage["connections"] = JSON.stringify(hardCodedConnections);
    localStorage["timepoints"] = JSON.stringify(hardCodedTimepoints);
  }
  return localStorage;
});

// directive helpers
function resizeHandler(element, direction, align, margin, padding, ignore) {
  var children = element[0].children;
  var topOrLeft = align == "top" || align == "left";
  var bottomOrRight = align == "bottom" || align == "right";
  var vertical = direction == true || direction == "vertical";
  var parentWidth = 0;
  var parentHeight = 0;

  $.each(children, function(index, c) {
    var $child = $(c);
    if ($child[0].className == ignore) {
      return;
    }
    if (vertical) {
      parentWidth = Math.max($child.width(), parentWidth);
      parentHeight += $child.height();
      if (index < (children.length - 1)) {
        parentHeight += padding;
      }
    } else {
      parentHeight = Math.max($child.height(), parentHeight);
      parentWidth += $child.width();
      if (index < (children.length - 1)) {
        parentWidth += padding;
      }
    }
  });

  var offset = margin;
  $.each(children, function(index, c) {
    var $child = $(c);
    if ($child[0].className == ignore) {
      return;
    }
    if (vertical) {
      setTop($child, offset);
      offset += $child.height() + padding;
      if (topOrLeft) {
        // align left
        setLeft($child, margin);
      } else if (bottomOrRight) {
        // align right
        setLeft($child, (parentWidth - $child.width()) + margin);
      } else {
        // align center
        setLeft($child, ((parentWidth - $child.width())/2) + margin);
      }
    } else {
      setLeft($child, offset);
      offset += $child.width() + padding;
      if (topOrLeft) {
        // align top
        setTop($child, margin);
      } else if (bottomOrRight) {
        // align bottom
        setTop($child, (parentHeight - $child.height()) + margin);
      } else {
        // align center
        setTop($child, ((parentHeight - $child.height())/2) + margin);
      }
    }
  });

  parentWidth += 2 * margin;
  parentHeight += 2 * margin;

  // set own width, height
  setWidth(element, parentWidth);
  setHeight(element, parentHeight);
}

function setWidth(element, val) {
  element.css({ width: val + "px" });
}

function setHeight(element, val) {
  element.css({ height: val + "px" });
}

function setMaxWidth(element, val) {
  if (val == "none") {
    element.css({ "max-width": val });
  } else {
    element.css({ "max-width": val + "px" });
  }
}

function setMaxHeight(element, val) {
  if (val == "none") {
    element.css({ "max-height": val });
  } else {
    element.css({ "max-height": val + "px" });
  }
}

function setTop(element, val) {
  element.css({ top: val + "px" });
}

function setLeft(element, val) {
  element.css({ left: val + "px" });
}
