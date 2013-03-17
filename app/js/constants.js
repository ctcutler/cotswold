var ARTIFACT_WIDTH_NORMAL = 300;
var ARTIFACT_MAX_HEIGHT_NORMAL = 300;
var ARTIFACT_WIDTH_EXPANDED = 600;
var ARTIFACT_MAX_HEIGHT_EXPANDED = "none";

// the left and top values reported by jquery's offset()
// are off by this quantity. . . I can't explain why
// but it makes me a little nervous
// FIXME: check to see if the paper is offset by this much
// FIXME: clear the default padding, border, etc. in the style
//        sheet and this should go away (I hope)
var MAGIC_OFFSET_CONSTANT = 5;

