from bottle import html_escape
from constants import COLORS, SPAN_ID_FORMAT, SPAN_START_ID_FORMAT, SPAN_END_ID_FORMAT
import string

class Tag(object):
  textOffset = -1
  length = 0
  def __init__(self, textOffset, length):
    self.textOffset = textOffset
    self.length = length

  def __repr__(self):
    return "(%d, %d)" % (self.textOffset, self.length)

def replace_newlines(s):
  """replace all newlines with </p>\n<p>"""
  rv = ""
  last = 0
  for i in range(len(s)):
    if s[i] == "\n":
      rv += html_escape(s[last:i])+"</p>\n<p>"
      last = i+1

  if last < len(s):
    rv += html_escape(s[last:])

  return rv

def getAdjustedOffset(textOffset, tags):
  adjustment = 0

  for tag in tags:
    if tag.textOffset > textOffset:
      endOfList = False
      break
    adjustment += tag.length

  return textOffset+adjustment

def addAdjustedOffset(textOffset, tagLength, tags):
  endOfList = True

  for i in range(len(tags)):
    tag = tags[i]
    if tag.textOffset > textOffset:
      tags.insert(i, Tag(textOffset, tagLength))
      endOfList = False
      break

  if endOfList:
    tags.append(Tag(textOffset, tagLength))

def addTags(html, offset1, offset2, tag1, tag2, tags):
  adjustedOffset1 = getAdjustedOffset(offset1, tags)
  adjustedOffset2 = getAdjustedOffset(offset2, tags)
  html = html[:adjustedOffset1] \
    + tag1 \
    + html[adjustedOffset1:adjustedOffset2] \
    + tag2 \
    + html[adjustedOffset2:]
  addAdjustedOffset(offset1, len(tag1), tags)
  addAdjustedOffset(offset2, len(tag2), tags)

  return html

def addSpan(spanId, offset1, offset2, changeType, tags, html):
  if changeType:
    color = COLORS[changeType]
    spanStart = '<span id="%s" style="background-color:%s">' % (spanId, color)
  else:
    spanStart = '<span id="%s">' % spanId

  if offset1 == offset2 and changeType:
    # if this is an visible placeholder chunk, (and not a start/end chunk)
    # add an nbsp
    spanEnd = "&nbsp;</span>"
  else:
    spanEnd = "</span>"

  return addTags(html, offset1, offset2, spanStart, spanEnd, tags)

def render_block(name, text, chunks):
    """
    Need to iterate through chunks, inserting a span into text 
    for every chunk, html escaping everything else while fixing
    the newlines.  
    * make a copy of text
    * for every chunk:
    *   calculate adjusted offsets based on inserted tags
    *   add span
    *   update previous changes
    * for every newline:
    *   replace with </p>\n<p>
    *   update inserted tags
    * html escape unchanged text (i.e. the stuff that's not inserted html)
    
    previous changes is an list of (offset, length) tuples with each tuple
    representing the location and size of an inserted HTML tag
    """
    tags = []
    html = text

    # make spans
    for chunk in chunks:
      # full span
      spanId = SPAN_ID_FORMAT % (name, chunk["name"])
      html = addSpan(spanId, chunk["offset1"], chunk["offset2"], chunk["changeType"], tags, html)

      # start span
      spanId = SPAN_START_ID_FORMAT % (name, chunk["name"])
      html = addSpan(spanId, chunk["offset1"], chunk["offset1"], None, tags, html)

      # end span
      spanId = SPAN_END_ID_FORMAT % (name, chunk["name"])
      html = addSpan(spanId, chunk["offset2"], chunk["offset2"], None, tags, html)

    # add paragraphs
    offset = 0
    while True:
      offset = text.find("\n", offset)
      if offset == -1:
        break
      firstTag = "</p>"
      secondTag = "<p>"
      html = addTags(html, offset, offset+1, firstTag, secondTag, tags)
      offset += len(firstTag) + len(secondTag)

    # html escape all untagged content
    i = 0
    newHtml = ""
    addlChars = 0
    for tag in tags:
      start = tag.textOffset + addlChars
      end = start + tag.length
      newHtml += html_escape(html[i:start]) + html[start:end]
      addlChars += tag.length
      i = end

    newHtml += html_escape(html[i:])

    return html

def escJS(s):
  # Let encodeForJavascript convert everything except newlines
  # to hex codes.  The newlines we escape ourselves after the
  # fact so that they are rendered as "\n" in the javascript code
  # and convert to actual newlines only when the javascript is run.
  return encodeForJavascript(s, ["\n"]).replace("\n", "\\n")

def encodeForJavascript(s, immune=None):
  """Loosely adapted from http://code.google.com/p/owasp-esapi-java/source/browse/trunk/src/main/java/org/owasp/esapi/codecs/JavaScriptCodec.java (as of 2012-06-09)"""
  alnum = string.ascii_letters + string.digits
  rv = ""

  for c in s:
    # check for immune characters
    if immune and c in immune:
      rv += c

    # check for alphanumeric characters
    elif c in alnum:
      rv += c

    # encode up to 256 with \\xHH
    elif ord(c) < 256:
      #hex = c.encode("hex")
      hex = "%x" % (ord(c),)
      if len(hex) == 1:
        hex = "0"+hex
      rv += "\\x" + hex
    # otherwise, \\uHHHH
    else:
      rv += unichr(ord(c))

  return rv

