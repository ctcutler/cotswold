from storm.locals import *
from Draft import Draft
from Work import Work

class Change(object):
  __storm_table__ = "changes"
  id = Int(primary=True)
  old_draft_id = Int()
  old_draft = Reference(old_draft_id, Draft.id)
  old_draft_offset1 = Int()
  old_draft_offset2 = Int()
  new_draft_id = Int()
  new_draft = Reference(new_draft_id, Draft.id)
  new_draft_offset1 = Int()
  new_draft_offset2 = Int()
  type = Unicode()

  def __init__(self, old_draft, old_draft_offset1, old_draft_offset2, new_draft,new_draft_offset1, new_draft_offset2, type):
    self.old_draft = old_draft
    self.old_draft_offset1 = old_draft_offset1
    self.old_draft_offset2 = old_draft_offset2
    self.new_draft = new_draft
    self.new_draft_offset1 = new_draft_offset1
    self.new_draft_offset2 = new_draft_offset2
    self.type = unicode(type)

  def __repr__(self):
    return "<Change id=%r old=%r new=%r type=%r>" % (self.id, self.old_draft, self.new_draft, self.type)

  @staticmethod
  def getChangesForWork(store, workId):
    return store.find(Change, 
      Draft.id == Change.old_draft_id or Draft.id == Change.new_draft_id,
      Work.id == Draft.work_id, 
      Work.id == workId)

  @staticmethod
  def storeChanges(store, changes):
    for change in changes:
      store.add(change)
    store.commit()
