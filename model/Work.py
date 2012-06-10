from storm.locals import *

class Work(object):
  __storm_table__ = "works"
  id = Int(primary=True)
  name = Unicode()

  def __init__(self, name):
    self.name = unicode(name)

  def __repr__(self):
    return "<Work id=%r name=%r>" % (self.id, self.name)

  @staticmethod
  def listWorks(store):
    return store.find(Work)

  @staticmethod
  def getWork(store, id):
    return store.get(Work, id)

  @staticmethod
  def createWork(store, name):
    work = Work(name)
    store.add(work)
    store.commit()
    return work
