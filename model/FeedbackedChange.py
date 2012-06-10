from storm.locals import *
from Change import Change
from Feedback import Feedback
from Draft import Draft

class FeedbackedChange(object):
  __storm_table__ = "feedbacked_changes"
  id = Int(primary=True)
  change_id = Int()
  change = Reference(change_id, Change.id)
  feedback_id = Int()
  feedback = Reference(feedback_id, Feedback.id)
  feedback_offset1 = Int()
  feedback_offset2 = Int()

  def __init__(self, change, feedback, feedback_offset1, feedback_offset2):
    self.change = change
    self.feedback = feedback
    self.feedback_offset1 = feedback_offset1
    self.feedback_offset2 = feedback_offset2

  @staticmethod
  def getFeedbackedChanges(store, leftDraftId, feedbackId):
    return store.find(FeedbackedChange, 
        leftDraftId == Draft.id,
        Draft.id == Change.old_draft_id,
        Change.id == FeedbackedChange.change_id,
        FeedbackedChange.feedback_id == feedbackId)

  @staticmethod
  def createFeedbackedChange(store, change, feedback, feedback_offset1, feedback_offset2):
    feedbackedChange = FeedbackedChange(change, feedback, feedback_offset1, feedback_offset2)
    store.add(feedbackedChange)
    store.commit()
    return feedbackedChange
