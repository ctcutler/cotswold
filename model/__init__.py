import sys, os

# add the lib subdirectory to the path
sys.path.append(
  os.path.join(
    os.getcwd(), 
    os.path.dirname(__file__),
    "lib"
  )
)

from storm.locals import *
from Work import Work
from Draft import Draft
from Change import Change
from Feedback import Feedback
from FeedbackedChange import FeedbackedChange
#from Tag import Tag

ChangeTypes = [u"ADDITION", u"DELETION", u"UPDATE"]

def dbuser(fn):
  def wrapped(*args, **kwargs):
    db = create_database("sqlite:db/drafts.sqlite")
    store = Store(db)

    rv = fn(store, *args, **kwargs)

    store.commit()
    store.close()
    del store

    return rv

  return wrapped
