import sys
import string
sys.path.append("lib")

from bottle import get, post, put, run, view, request, redirect, template, static_file, route
from model import Work, Draft, Change, dbuser, Feedback, FeedbackedChange
from diff import findChanges
from renderdiff import makeDraftChunks, makeFeedbackChunks, makeLines

@route("/static/:filename")
def getStaticFile(filename):
  return static_file(filename, root="static");

@get("/")
@get("/works")
@dbuser
def getWorks(store):
  works = Work.listWorks(store)
  return template("getWorks", works=works)

@get("/works/:workId")
@dbuser
def getWork(store, workId):
  workId = int(workId)
  work = Work.getWork(store, workId)
  drafts = list(Draft.getDraftsForWork(store, workId))
  changes = Change.getChangesForWork(store, workId)
  feedbacks = Feedback.getFeedbacksForWork(store, workId)

  drafts.sort(lambda x,y: cmp(x.id, y.id))

  draftPairs = []
  for i in range(len(drafts)):
    if i + 1 == len(drafts):
      # no need to do anything with the last one
      continue

    left = drafts[i]
    right = drafts[i+1]
    draftPairChanges = [
      c for c in changes 
      if c.old_draft == left and c.new_draft == right 
    ]

    feedbackChunks = []
    feedback = None
    for feedback in feedbacks:
      if left.id == feedback.draft_id:
        feedbackedChanges = FeedbackedChange.getFeedbackedChanges(
          store, left.id, feedback.id
        )
        feedbackChunks = makeFeedbackChunks(feedbackedChanges)
        break

    draftPairs.append({
      "left": left,
      "right": right,
      "feedback": feedback,
      "lines": makeLines(draftPairChanges, left.id, right.id),
      "leftChunks": makeDraftChunks(draftPairChanges, left.id, True),
      "rightChunks": makeDraftChunks(draftPairChanges, right.id, False),
      "feedbackChunks": feedbackChunks
    })

  return template("getWork", work=work, draftPairs=draftPairs)

@post("/works")
@dbuser
def postWorks(store):
  name = request.forms.get("name")
  draftFiles = []
  feedbackFiles = []
  for i in range(1, 9):
    draftFileKey = "draft%d" % (i,)
    feedbackFileKey = "feedback%d" % (i,)
    if draftFileKey in request.files:
      draftFiles.append(request.files.get(draftFileKey).file)
      if feedbackFileKey in request.files:
        feedbackFiles.append(request.files.get(feedbackFileKey).file)
      else:
        feedbackFiles.append(None)
    else:
      break
  
  work = Work.createWork(store, name)

  drafts = []
  for draftFile in draftFiles:
    drafts.append(Draft.createDraft(store, work, draftFile.read()))

  for i in range(len(feedbackFiles)):
    if feedbackFiles[i] != None:
      Feedback.createFeedback(store, drafts[i], feedbackFiles[i].read())

  for i in range(len(drafts)):
    for j in range(i, len(drafts)):
      changes = findChanges(drafts[i], drafts[j])
      Change.storeChanges(store, changes)

  redirect("/works/%d" % (work.id,))

@post("/drafts")
def postDrafts():
  return "[add a new draft from form data]"

@post("/feedbacks")
def postFeedbacks():
  return "[add a new feedback from form data]"

@post("/feedbackedChanges")
@dbuser
def postFeedbackedChange(store):
  changeId = int(request.forms.get("changeId"))
  feedbackId = int(request.forms.get("feedbackId"))
  feedbackStart = int(request.forms.get("feedbackStart"))
  feedbackEnd = int(request.forms.get("feedbackEnd"))
  change = store.get(Change, changeId)
  feedback = store.get(Feedback, feedbackId)
  FeedbackedChange.createFeedbackedChange(store, change, feedback, feedbackStart, feedbackEnd)
  return "change: %d, start: %d, end: %d, feedback: %d" % (changeId, feedbackStart, feedbackEnd, feedbackId)

@post("/taggedChanges")
def postTaggedChanges():
  return "[associates a tag with a change (if tag doesn't exist, create it)]"

@put("/taggedChanges/:taggedChangeId")
def putTaggedChange(taggedChangeId):
  return "[updates the tagged change]"

@post("/feedbackLines")
def postFeedbackLines():
  # FIXME: figure out whether we should be using separate
  # HTTP verbs for merge and split operations (and if so, which
  # for which???). . . could argue that because in the split
  # operation we have only one line id specified, that should be
  # a put on that line, whereas the merge operation operates on 
  # more than one so it should be a post. . . 
  return "[merge or split feedbackLine(s)]"

@post("/draftLines")
def postDraftLines():
  # FIXME: figure out whether we should be using separate
  # HTTP verbs for merge and split operations (and if so, which
  # for which???). . . could argue that because in the split
  # operation we have only one line id specified, that should be
  # a put on that line, whereas the merge operation operates on 
  # more than one so it should be a post. . . 
  return "[merge or split feedbackLine(s)]"

run(host='localhost', port=8080)
