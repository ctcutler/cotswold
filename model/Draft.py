from storm.locals import *
from Work import Work

class Draft(object):
  __storm_table__ = "drafts"
  id = Int(primary=True)
  work_id = Int()
  work = Reference(work_id, Work.id)
  text = Unicode()

  def __init__(self, work, text):
    self.work = work
    self.text = unicode(text)

  def __repr__(self):
    return "<Draft id=%r work=%r charCount=%d>" % (
      self.id, self.work, len(self.text)
    )

  def readLines(self):
    "The goal is to emulate file.readlines()'s output"
    t = self.text
    if t.endswith("\n"):
      t = t.rstrip("\n")
    return [x+"\n" for x in t.split("\n")]

  @staticmethod
  def getDraftsForWork(store, workId):
    return store.find(Draft, Work.id == Draft.work_id, Work.id == workId)

  @staticmethod
  def createDraft(store, work, text):
    draft = Draft(work, text)
    store.add(draft)
    store.commit()
    return draft
