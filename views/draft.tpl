%from view_helper import replace_newlines

% COLORS = { "ADDITION": "green", "UPDATE": "yellow", "DELETION": "red" }

%def beginSpan(span):
%  return '<span id="%(id)s" style="background-color:%(color)s">' % span
%end
%def beginSpanStart(span):
%  return '<span id="%(id)sStart">' % span
%end
%def beginSpanEnd(span):
%  return '<span id="%(id)sEnd">' % span
%end

%prevOffset = 0
%for span in spans:
{{!replace_newlines(text[prevOffset:span["offset1"]])}}{{!beginSpan(span)}}\\
%  if (span["offset2"] - span["offset1"]) > 1:
{{!beginSpanStart(span)}}{{text[span["offset1"]:span["offset1"]+1]}}</span>{{!replace_newlines(text[span["offset1"]+1:span["offset2"]-1])}}{{!beginSpanEnd(span)}}{{text[span["offset2"]-1:span["offset2"]]}}</span>\\
%  elif (span["offset2"] - span["offset1"]) == 1:
{{!beginSpanStart(span)}}{{!beginSpanEnd(span)}}{{text[span["offset1"]:span["offset2"]]}}</span></span>\\
%  else:
{{!beginSpanStart(span)}}{{!beginSpanEnd(span)}}&nbsp;</span></span>\\
%  end
</span>\\
%  prevOffset = span["offset2"]
%end
{{!replace_newlines(text[prevOffset:])}}
