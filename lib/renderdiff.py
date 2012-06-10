from constants import COLORS, NAME_FORMAT, FEEDBACK_NAME_FORMAT, SPAN_ID_FORMAT

def makeLines(changes, leftId, rightId):
  lines = []
  for change in changes:
    leftName = NAME_FORMAT % (leftId, change.id)
    rightName = NAME_FORMAT % (rightId, change.id)
    lines.append({
      "id1": leftName,
      "id2": rightName,
      "color": COLORS[change.type]
    })
  return lines

def makeFeedbackChunks(feedbackedChanges):
  chunks = []
  for feedbackedChange in feedbackedChanges:
    offset1 = feedbackedChange.feedback_offset1
    offset2 = feedbackedChange.feedback_offset2
    chunks.append(
      {
        "offset1": feedbackedChange.feedback_offset1,
        "offset2": feedbackedChange.feedback_offset2,
        "name": FEEDBACK_NAME_FORMAT % (feedbackedChange.feedback.id, feedbackedChange.id),
        "changeType": feedbackedChange.change.type,
      }
    )
  chunks.sort(lambda x, y: cmp(x["offset1"], y["offset1"]))
  return chunks

def makeDraftChunks(changes, draftId, isLeft):
  chunks = []
  for change in changes:
    if isLeft:
      offset1 = change.old_draft_offset1
      offset2 = change.old_draft_offset2
    else:
      offset1 = change.new_draft_offset1
      offset2 = change.new_draft_offset2

    if (change.type == "ADDITION" and isLeft) or\
       (change.type == "DELETION" and not isLeft):
      chunks.append(
        {
          "offset1": offset1,
          "offset2": offset1, # zero length chunk where the add/delete happened
          "name": NAME_FORMAT % (draftId, change.id),
          "changeType": change.type,
        }
      )
    else:
      chunks.append(
        {
          "offset1": offset1,
          "offset2": offset2,
          "name": NAME_FORMAT % (draftId, change.id),
          "changeType": change.type,
        }
      )

  chunks.sort(lambda x, y: cmp(x["offset1"], y["offset1"]))
  
  return chunks
