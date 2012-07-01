from constants import COLORS, NAME_FORMAT, FEEDBACK_NAME_FORMAT, SPAN_ID_FORMAT

def makeLine(id1, id2, t):
  return {
    "id1": id1,
    "id2": id2,
    "type": t,
  }

def makeLines(changes, feedbackChunks, leftId, rightId):
  lines = []
  for change in changes:
    associatedFeedback = None
    for fc in feedbackChunks:
      if fc["changeId"] == change.id:
        associatedFeedback = fc
        break

    if associatedFeedback:
      leftName = NAME_FORMAT % (leftId, change.id)
      rightName = associatedFeedback["name"]
      lines.append(makeLine(leftName, rightName, change.type))

      leftName = associatedFeedback["name"]
      rightName = NAME_FORMAT % (rightId, change.id)
      lines.append(makeLine(leftName, rightName, change.type))

    else:
      leftName = NAME_FORMAT % (leftId, change.id)
      rightName = NAME_FORMAT % (rightId, change.id)
      lines.append(makeLine(leftName, rightName, change.type))

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
        "changeId": feedbackedChange.change.id,
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
