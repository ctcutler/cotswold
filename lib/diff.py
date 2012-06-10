import difflib
from model import Change

def getOffsets(char, line, start):
  """
  Get start and end offsets for first group of char
  characters in line at or after start.
  """
  offset1 = offset2 = line.find(char, start)
  if offset1 == -1:
    return offset1, offset2
  while line[offset2] == char:
    offset2 += 1

  return offset1, offset2

def getOffsetsWithDelta(char, line, start, delta):
  """
  Get start and end offsets for first group of char
  characters in line at or after start.  Also return
  1) a third offset that is the start offset minus
  delta and 2) a new delta value that is the current
  delta plus the length of the sequence of char characters.
  """
  offset1, offset2 = getOffsets(char, line, start)
  if offset1 == -1:
    return offset1, offset2, -1, -1
  return offset1, offset2, offset1-delta, delta + (offset2-offset1)

def getLineChanges(oldDraft, newDraft, globalOldOff, globalNewOff, oldLine, oldLineMarkers, newLine, newLineMarkers):
  changes = []

  # handle updates
  if oldLineMarkers and newLineMarkers:
    oldOffset2 = newOffset2 = 0
    while True:
      (oldOffset1, oldOffset2) = getOffsets("^", oldLineMarkers, oldOffset2)
      (newOffset1, newOffset2) = getOffsets("^", newLineMarkers, newOffset2)

      if oldOffset1 == -1 and newOffset1 == -1:
        break
      if oldOffset1 == -1 or newOffset1 == -1:
        raise Exception(
          "unequal number of changes in: %r and %r, (%r, %r)" % \
          (oldLineMarkers, newLineMarkers, oldLine, newLine)
        )

      changes.append(
        Change(
          oldDraft,
          globalOldOff+oldOffset1, globalOldOff+oldOffset2, 
          newDraft,
          globalNewOff+newOffset1, globalNewOff+newOffset2, 
          "UPDATE"
        )
      )

  # handle additions
  if newLineMarkers and "+" in newLineMarkers:
    newOffset2 = delta = 0
    while True:
      (newOffset1, newOffset2, oldOffset, delta) = getOffsetsWithDelta(
        "+", newLineMarkers, newOffset2, delta
      )

      if newOffset1 == -1:
        break

      changes.append(
        Change(
          oldDraft,
          globalOldOff+oldOffset, globalOldOff+oldOffset, 
          newDraft,
          globalNewOff+newOffset1, globalNewOff+newOffset2, 
          "ADDITION"
        )
      )

  # handle deletions
  if oldLineMarkers and "-" in oldLineMarkers:
    delta = oldOffset2 = 0
    while True:
      (oldOffset1, oldOffset2, newOffset, delta) = getOffsetsWithDelta(
        "-", oldLineMarkers, oldOffset2, delta
      )

      if oldOffset1 == -1:
        break
      changes.append(
        Change(
          oldDraft,
          globalOldOff+oldOffset1, globalOldOff+oldOffset2, 
          newDraft,
          globalNewOff+newOffset, globalNewOff+newOffset, 
          "DELETION"
        )
      )

  # go through all the additions and for every one figure out how
  # many deletions occured before its marker in the old text and
  # bump the marker's offset up by that much
  changes.sort(lambda x, y: cmp(x.old_draft_offset1, y.old_draft_offset1))
  deletionChanges = [x for x in changes if x.type == "DELETION"]
  additionChanges = [x for x in changes if x.type == "ADDITION"]
  for addition in additionChanges:
    offset = 0
    for deletion in deletionChanges:
      # subtract offset to account for the length of previous
      # deletions
      if (deletion.old_draft_offset1 - offset) > addition.old_draft_offset1:
        break
      offset += deletion.old_draft_offset2 - deletion.old_draft_offset1
    addition.old_draft_offset1 += offset
    addition.old_draft_offset2 += offset

  # go through all the deletions and for every one figure out how
  # many additions occured before its marker in the new text and
  # bump the marker's offset up by that much
  changes.sort(lambda x, y: cmp(x.new_draft_offset1, y.new_draft_offset1))
  deletionChanges = [x for x in changes if x.type == "DELETION"]
  additionChanges = [x for x in changes if x.type == "ADDITION"]
  for deletion in deletionChanges:
    offset = 0
    for addition in additionChanges:
      # subtract offset to account for the length of previous
      # additions
      if (addition.new_draft_offset1 - offset) > deletion.new_draft_offset1:
        break
      offset += addition.new_draft_offset2 - addition.new_draft_offset1
    deletion.new_draft_offset1 += offset
    deletion.new_draft_offset2 += offset

  globalOldOff += len(oldLine)
  globalNewOff += len(newLine)
  return changes, globalOldOff, globalNewOff

def getUpdate(changes, oldDraft, newDraft, oldOff, newOff, l1, l2, l3, l4=None):
  # Do we have -?+?
  if l4 != None\
    and l1.startswith("-") \
    and l2.startswith("?") \
    and l3.startswith("+") \
    and l4.startswith("?"):
    c, oldOff, newOff = getLineChanges(
      oldDraft, newDraft, oldOff, newOff, l1[2:], l2[2:], l3[2:], l4[2:]
    )
    changes.extend(c)
    return 4, oldOff, newOff

  # Do we have -+?
  if l1.startswith("-") \
    and l2.startswith("+") \
    and l3.startswith("?"):
    c, oldOff, newOff = getLineChanges(
      oldDraft, newDraft, oldOff, newOff, l1[2:], None, l2[2:], l3[2:]
    )
    changes.extend(c)
    return 3, oldOff, newOff
  # Do we have -?+
  elif l1.startswith("-") \
    and l2.startswith("?") \
    and l3.startswith("+"):
    c, oldOff, newOff = getLineChanges(
      oldDraft, newDraft, oldOff, newOff, l1[2:], l2[2:], l3[2:], None
    )
    changes.extend(c)
    return 3, oldOff, newOff

  # must be a plain old - line
  else:
    return 1, oldOff, newOff

def findChanges(oldDraft, newDraft):
  
  d = difflib.Differ()

  result = list(d.compare(oldDraft.readLines(), newDraft.readLines()))

  #for r in result:
  #  print r,

  resultLen = len(result)
  changes = []
  i = 0
  oldOffset = 0
  newOffset = 0
  while i < resultLen:
    if result[i].startswith("+"):
      # subtract 2 to account for "+ " prepended
      lineLen = len(result[i]) - 2
      changes.append(
        Change(
          oldDraft,
          oldOffset, oldOffset,
          newDraft,
          newOffset, newOffset+lineLen,
          "ADDITION"
        )
      )
      newOffset += lineLen
      i += 1

    elif result[i].startswith("-"):
      if resultLen - i > 3:
        skipAhead, oldOffset, newOffset = getUpdate(
          changes, oldDraft, newDraft, oldOffset, newOffset, *result[i:i+4]
        )
      elif resultLen - i == 3:
        skipAhead, oldOffset, newOffset = getUpdate(
          changes, oldDraft, newDraft, oldOffset, newOffset, *result[i:i+3]
        )
      else:
        skipAhead = 1

      # covers getUpdate() and non-getUpdate() cases
      if skipAhead == 1:
        # subtract 2 to account for "- " prepended
        lineLen = len(result[i]) - 2
        changes.append(
          Change(
            oldDraft,
            oldOffset, oldOffset+lineLen,
            newDraft,
            newOffset, newOffset,
            "DELETION"
          )
        )
        oldOffset += lineLen

      i += skipAhead

    elif result[i].startswith("?"):
      # this one's an error
      raise Exception("got a top level ? line")

    else:
      # ignore space
      oldOffset += len(result[i]) - 2
      newOffset += len(result[i]) - 2
      i += 1

  #for change in changes:
  #  print change
  return changes
