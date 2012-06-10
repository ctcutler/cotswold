from storm.locals import *
from Draft import Draft
from Work import Work

class Feedback(object):
  __storm_table__ = "feedbacks"
  id = Int(primary=True)
  draft_id = Int()
  draft = Reference(draft_id, Draft.id)
  text = Unicode()

  def __init__(self, draft, text):
    self.draft = draft
    self.text = unicode(text, "utf8")

  def __repr__(self):
    return "<Feedback id=%r charCount=%d draft=%r>" % (self.id, len(self.text), self.draft)

  def readLines(self):
    "The goal is to emulate file.readlines()'s output"
    t = self.text
    if t.endswith("\n"):
      t = t.rstrip("\n")
    return [x+"\n" for x in t.split("\n")]
  
  @staticmethod
  def getFeedbacksForWork(store, workId):
    return store.find(Feedback,
      Draft.id == Feedback.draft_id,
      Work.id == Draft.work_id,
      Work.id == workId)

  @staticmethod
  def createFeedback(store, draft, text):
    feedback = Feedback(draft, text)
    store.add(feedback)
    store.commit()
    return feedback

